"""
Vyral core - scarica le statistiche degli ultimi video dei canali con yt-dlp.

Usato da:
  - GitHub Actions  ->  python fetcher/vyral_core.py data
  - programma per PC (desktop/vyral_desktop.py) che lo importa
"""
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

HISTORY_MAX = 72  # punti di storico views per video

import threading as _th
_DBG = _th.local()


def dbg(msg):
    """Registro dei tentativi (salvato in stats.json per capire cosa blocca TikTok)."""
    lst = getattr(_DBG, "log", None)
    if lst is not None and len(lst) < 40:
        lst.append(str(msg)[:220])

DEFAULT_SETTINGS = {"videos_per_channel": 3}

# File cookie dell'accesso TikTok (impostato solo dal programma per PC, mai su GitHub)
TIKTOK_COOKIES = None


class LoginNeeded(RuntimeError):
    pass


LOGIN_MSG = ("TikTok mostra questi video solo a chi ha fatto l'accesso: "
             "collega il tuo account TikTok in Vyral.exe (Impostazioni → Social).")


def _cookie_copy(url):
    """Copia temporanea del file cookie (yt-dlp lo riscrive: una copia per thread evita conflitti)."""
    if TIKTOK_COOKIES and "tiktok" in url and os.path.exists(TIKTOK_COOKIES):
        import shutil
        import tempfile
        fd, tmp = tempfile.mkstemp(suffix=".txt")
        os.close(fd)
        shutil.copy(TIKTOK_COOKIES, tmp)
        return tmp
    return None


def _cookie_header():
    if not (TIKTOK_COOKIES and os.path.exists(TIKTOK_COOKIES)):
        return None
    pairs = []
    with open(TIKTOK_COOKIES, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) == 7 and "tiktok" in parts[0]:
                pairs.append(f"{parts[5]}={parts[6]}")
    return "; ".join(pairs) or None

# URL della lista video per ogni piattaforma
LIST_URL = {
    "tiktok": "https://www.tiktok.com/{h}",
    "twitch": "https://www.twitch.tv/{h}/videos?filter=archives&sort=time",
    "kick": "https://kick.com/{h}/videos",
}


class _QuietLogger:
    def debug(self, msg): pass
    def info(self, msg): pass
    def warning(self, msg): pass
    def error(self, msg): pass


def clean_error(e):
    msg = re.sub(r"\x1b\[[0-9;]*m", "", str(e)).replace("ERROR: ", "")
    msg = msg.split("; please report")[0].split(" (caused by")[0]
    low = msg.lower()
    if "sign in to confirm" in low or "not a bot" in low:
        return "YouTube ha bloccato il server (anti-bot). Aggiorna dal programma per PC."
    if "proxy" in low or "unable to connect" in low or "timed out" in low or "getaddrinfo" in low:
        return "Connessione non riuscita."
    if "does not exist" in low or "404" in low or "not found" in low:
        return "Canale non trovato: controlla il nome o il link."
    if "secondary user id" in low or "secuid" in low or "captcha" in low:
        return "TikTok ha bloccato la richiesta: riprova più tardi o aggiorna dal PC."
    return msg[:280]


def _ydl(opts):
    import yt_dlp
    base = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "ignore_no_formats_error": True,
        "logger": _QuietLogger(),
        "socket_timeout": 20,
    }
    base.update(opts)
    return yt_dlp.YoutubeDL(base)


def _run(url, opts):
    tmp = _cookie_copy(url)
    if tmp:
        opts = {**opts, "cookiefile": tmp}
    try:
        with _ydl(opts) as y:
            return y.extract_info(url, download=False) or {}
    finally:
        if tmp:
            try:
                os.remove(tmp)
            except OSError:
                pass


def list_entries(url, n):
    return _run(url, {"extract_flat": "in_playlist", "playlistend": n})


def video_info(url):
    return _run(url, {})


def _ts(info):
    if info.get("timestamp"):
        return int(info["timestamp"])
    d = info.get("upload_date")
    if d:
        try:
            return int(datetime.strptime(d, "%Y%m%d").replace(tzinfo=timezone.utc).timestamp())
        except ValueError:
            pass
    return None


def normalize_video(info, platform, is_short=False):
    title = (info.get("title") or "").strip()
    if platform == "tiktok":
        title = (info.get("description") or title).strip()
        is_short = True
    return {
        "id": str(info.get("id")),
        "title": title[:200] or "(senza titolo)",
        "url": info.get("webpage_url") or info.get("original_url"),
        "thumbnail": info.get("thumbnail"),
        "timestamp": _ts(info),
        "duration": info.get("duration"),
        "views": info.get("view_count"),
        "likes": info.get("like_count"),
        "comments": info.get("comment_count"),
        "shares": info.get("repost_count"),
        "saves": info.get("save_count"),
        "is_short": bool(is_short),
    }


def _avatar(info):
    for key in ("avatar_uncropped", "avatar"):
        for t in info.get("thumbnails") or []:
            if key in str(t.get("id", "")):
                return t.get("url")
    return None


def _entry_url(e, fallback_base=None):
    u = e.get("url") or e.get("webpage_url")
    if not u and e.get("id") and fallback_base:
        u = f"{fallback_base}/video/{e['id']}"
    return u


def _full(urls, platform, n, pool):
    lg = getattr(_DBG, "log", None)
    login_flag = []

    def one(item):
        url, short = item
        try:
            return video_info(url), short
        except Exception as e:  # noqa: BLE001
            raw = re.sub(r'\x1b\[[0-9;]*m', '', str(e))
            if any(k in raw for k in ("requiring login", "status code 10231", "Log in for access", "Log into an account")):
                login_flag.append(1)
            if lg is not None and len(lg) < 40:
                lg.append(f"yt-dlp video {url.rsplit('/', 1)[-1]}: {raw[:200]}")
            return None, short
    results = list(pool.map(one, urls))
    res = [(i, s) for i, s in results if i]
    vids = [normalize_video(i, platform, s) for i, s in res]
    if platform == "tiktok":
        failed = [u for (u, _), (i, _) in zip(urls, results) if not i]
        dbg(f"video letti con yt-dlp: {len(res)}/{len(urls)}")
        for it in pool.map(tiktok_item, failed):
            dbg("pagina video: " + ("ok" if it and it.get("views") is not None else "niente"))
            if it and it.get("views") is not None:
                it.pop("_author", None)
                vids.append(it)
    seen, uniq = set(), []
    for v in vids:
        if v["id"] not in seen:
            seen.add(v["id"]); uniq.append(v)
    uniq.sort(key=lambda v: v["timestamp"] or 0, reverse=True)
    if login_flag and not uniq:
        _DBG.login = True
    return uniq[:n], [i for i, _ in res]


def fetch_youtube(ch, n, pool):
    tabs = {"videos": ["videos"], "shorts": ["shorts"]}.get(ch.get("yt_tab"), ["videos", "shorts"])
    urls, meta, errors = [], {}, []
    for tab in tabs:
        try:
            info = list_entries(f"{ch['url']}/{tab}", n)
        except Exception as e:
            errors.append(e)
            continue
        meta = meta or info
        for e in info.get("entries") or []:
            u = e.get("url") or (f"https://www.youtube.com/watch?v={e['id']}" if e.get("id") else None)
            if u:
                urls.append((u, tab == "shorts"))
    if not urls:
        if errors:
            raise errors[0]
        raise RuntimeError("Nessun video trovato su questo canale.")
    vids, infos = _full(urls, "youtube", n, pool)
    first = infos[0] if infos else {}
    return {
        "name": meta.get("channel") or meta.get("uploader") or first.get("channel") or ch["handle"],
        "followers": meta.get("channel_follower_count") or first.get("channel_follower_count"),
        "avatar": _avatar(meta),
        "url": meta.get("channel_url") or ch["url"],
    }, vids


UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def _get_html(url):
    import urllib.request
    headers = {"User-Agent": UA, "Accept-Language": "it-IT,it;q=0.9,en;q=0.8"}
    ck = _cookie_header() if "tiktok" in url else None
    if ck:
        headers["Cookie"] = ck
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")


def tiktok_profile(handle):
    """Foto profilo, nome, follower, like totali e numero di video dalla pagina pubblica del profilo."""
    h = handle.lstrip("@")
    out = {}
    try:
        html = _get_html(f"https://www.tiktok.com/@{h}")
    except Exception:  # noqa: BLE001
        return out
    m = re.search(r'<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.S)
    if m:
        try:
            ui = json.loads(m.group(1))["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"]
            u, st = ui.get("user", {}), ui.get("statsV2") or ui.get("stats") or {}
            out = {"avatar": u.get("avatarLarger") or u.get("avatarMedium"), "name": u.get("nickname"),
                   "followers": int(st["followerCount"]) if st.get("followerCount") is not None else None,
                   "likes": int(st["heartCount"]) if st.get("heartCount") is not None else None,
                   "video_count": int(st["videoCount"]) if st.get("videoCount") is not None else None}
        except Exception:  # noqa: BLE001
            out = {}
    if not out.get("avatar"):
        a = re.search(r'"avatarLarger"\s*:\s*"([^"]+)"', html)
        if a:
            out["avatar"] = a.group(1).encode().decode("unicode_escape")
    if out.get("followers") is None:
        f = re.search(r'"followerCount"\s*:\s*"?(\d+)', html)
        if f:
            out["followers"] = int(f.group(1))
    if out.get("avatar"):
        out["avatar"] = out["avatar"].replace("\\u002F", "/")
    return {k: v for k, v in out.items() if v not in (None, "")}


def tiktok_item(url):
    """Piano B per un singolo post TikTok (anche caroselli di foto): legge la pagina del video."""
    try:
        html = _get_html(url)
    except Exception:  # noqa: BLE001
        return None
    m = re.search(r'<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    try:
        it = json.loads(m.group(1))["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"]["itemStruct"]
    except Exception:  # noqa: BLE001
        return None
    st = it.get("statsV2") or it.get("stats") or {}
    num = lambda k: int(st[k]) if st.get(k) not in (None, "") else None  # noqa: E731
    vid = it.get("video") or {}
    cover = vid.get("cover") or vid.get("originCover") or ((it.get("imagePost") or {}).get("cover") or {}).get("imageURL", {}).get("urlList", [None])[0]
    author = it.get("author") or {}
    return {
        "id": str(it.get("id")), "title": (it.get("desc") or "").strip()[:200] or "(senza titolo)",
        "url": url, "thumbnail": cover, "timestamp": int(it["createTime"]) if it.get("createTime") else None,
        "duration": vid.get("duration") or None, "views": num("playCount"), "likes": num("diggCount"),
        "comments": num("commentCount"), "shares": num("shareCount"), "saves": num("collectCount"), "is_short": True,
        "_author": {"name": author.get("nickname"), "avatar": author.get("avatarLarger") or author.get("avatarMedium")},
    }


_TIKWM_LOCK = __import__("threading").Lock()
_TIKWM_LAST = [0.0]


def tikwm_posts(handle, n):
    """Ultima strada per TikTok: il servizio pubblico TikWM (usato solo se TikTok risponde vuoto)."""
    import urllib.parse
    import urllib.request
    h = handle.lstrip("@")
    with _TIKWM_LOCK:  # massimo 1 richiesta al secondo
        wait = 1.2 - (time.time() - _TIKWM_LAST[0])
        if wait > 0:
            time.sleep(wait)
        _TIKWM_LAST[0] = time.time()
        try:
            req = urllib.request.Request("https://www.tikwm.com/api/user/posts?" + urllib.parse.urlencode(
                {"unique_id": h, "count": max(n + 3, 10), "cursor": 0}), headers={"User-Agent": UA})
            j = json.loads(urllib.request.urlopen(req, timeout=25).read())
        except Exception as e:  # noqa: BLE001
            dbg(f"TikWM: ERRORE {e}")
            return []
    dbg(f"TikWM: code={(j or {}).get('code')} msg={(j or {}).get('msg')} video={len(((j or {}).get('data') or {}).get('videos') or [])}")
    vids = []
    for v in ((j or {}).get("data") or {}).get("videos") or []:
        vid = str(v.get("video_id") or v.get("aweme_id") or "")
        if not vid:
            continue
        cover = v.get("cover") or v.get("origin_cover") or v.get("ai_dynamic_cover")
        if cover and cover.startswith("/"):
            cover = "https://www.tikwm.com" + cover
        vids.append({
            "id": vid, "title": (v.get("title") or "").strip()[:200] or "(senza titolo)",
            "url": f"https://www.tiktok.com/@{h}/video/{vid}", "thumbnail": cover,
            "timestamp": int(v["create_time"]) if v.get("create_time") else None,
            "duration": v.get("duration") or None, "views": v.get("play_count"), "likes": v.get("digg_count"),
            "comments": v.get("comment_count"), "shares": v.get("share_count"), "saves": v.get("collect_count"),
            "is_short": True,
        })
    vids.sort(key=lambda x: x["timestamp"] or 0, reverse=True)
    return vids


def _tiktok_embed_urls(handle):
    """Piano B per TikTok: il widget pubblico del profilo elenca gli ultimi video."""
    h = handle.lstrip("@")
    ids = []
    for url in (f"https://www.tiktok.com/embed/@{h}", f"https://www.tiktok.com/@{h}"):
        try:
            html = _get_html(url)
        except Exception:  # noqa: BLE001
            continue
        found = re.findall(r'/(?:video|photo)/(\d{18,20})', html) + re.findall(r'"(?:videoId|itemId|aweme_id|awemeId)"\s*:\s*"(\d{18,20})"', html)
        for i in found:
            if i not in ids:
                ids.append(i)
        if ids:
            break
    return [f"https://www.tiktok.com/@{h}/video/{i}" for i in ids[:15]]


def fetch_generic(ch, n, pool):
    platform = ch["platform"]
    base = ch["url"].rstrip("/")
    handle = ch["handle"].lstrip("@")
    list_url = ch.get("list_url") or (LIST_URL[platform].format(h=handle) if platform in LIST_URL else base)
    if platform == "tiktok":
        list_url = base
    # TikTok: i video fissati in alto non sono i più recenti -> ne prendo di più
    extra = 3 if platform == "tiktok" else 0
    # TikTok a volte risponde con una lista vuota ai server: riprovo qualche volta
    tries = 4 if platform == "tiktok" else 1
    urls, info, last_err = [], {}, None
    for attempt in range(tries):
        try:
            info = list_entries(list_url, n + extra)
            urls = [(u, platform == "tiktok") for u in (_entry_url(e, base) for e in info.get("entries") or []) if u]
            dbg(f"yt-dlp lista tentativo {attempt + 1}: {len(urls)} video")
        except Exception as e:  # noqa: BLE001
            last_err = e
            dbg(f"yt-dlp lista tentativo {attempt + 1}: ERRORE {re.sub(r'\x1b\[[0-9;]*m', '', str(e))[:200]}")
        if urls:
            break
        time.sleep(4 * (attempt + 1))
    if not urls and platform == "tiktok":
        urls = [(u, True) for u in _tiktok_embed_urls(ch["handle"])]
        dbg(f"widget profilo: {len(urls)} video")
    if not urls and platform == "tiktok" and ch.get("_known_ids"):
        h = ch["handle"].lstrip("@")
        urls = [(f"https://www.tiktok.com/@{h}/video/{i}", True) for i in ch["_known_ids"][:12]]
        dbg(f"uso {len(urls)} video trovati in un aggiornamento precedente")
    if not urls and platform == "tiktok":
        tw = tikwm_posts(ch["handle"], n)
        if tw:
            meta = {"name": ch["handle"], "url": ch["url"], **tiktok_profile(ch["handle"])}
            return meta, tw[:n]
    if not urls:
        if last_err and platform != "tiktok":
            raise last_err
        if platform == "tiktok":
            raise RuntimeError("TikTok non ha restituito video (succede ogni tanto con i server di GitHub). "
                               "Riprova più tardi o premi Aggiorna dal programma per PC.")
        raise RuntimeError("Nessun video trovato (profilo privato o richiesta bloccata).")
    vids, infos = _full(urls, platform, n, pool)
    if not vids and platform == "tiktok":
        # ultima possibilità: gli ID dal widget del profilo
        extra_urls = [(u, True) for u in _tiktok_embed_urls(ch["handle"]) if u not in [x for x, _ in urls]]
        if extra_urls:
            vids, infos = _full(extra_urls, platform, n, pool)
    if not vids and platform == "tiktok":
        vids = tikwm_posts(ch["handle"], n)[:n]
    if not vids and platform == "tiktok":
        _DBG.ids = [u.rstrip("/").rsplit("/", 1)[-1] for u, _ in urls]
    if not vids and getattr(_DBG, "login", False):
        raise LoginNeeded(LOGIN_MSG)
    if not vids:
        raise RuntimeError("Ho trovato i video ma TikTok non ha permesso di leggerli. Riprova più tardi o premi Aggiorna dal programma per PC."
                           if platform == "tiktok" else "Nessun video leggibile su questo canale.")
    first = infos[0] if infos else {}
    meta = {
        "name": first.get("channel") or first.get("uploader") or info.get("uploader") or info.get("title") or ch["handle"],
        "followers": first.get("channel_follower_count") or info.get("channel_follower_count"),
        "avatar": _avatar(info),
        "url": ch["url"],
    }
    if platform == "tiktok":
        prof = tiktok_profile(ch["handle"])
        for k, v in prof.items():
            if v is not None and (k != "name" or not meta.get("name") or meta["name"] == ch["handle"]):
                meta[k] = v
        meta["_ids"] = [u.rstrip("/").rsplit("/", 1)[-1] for u, _ in urls]
    return meta, vids


def fetch_channel(ch, n, pool):
    if ch["platform"] == "youtube":
        return fetch_youtube(ch, n, pool)
    return fetch_generic(ch, n, pool)


def _merge_history(videos, prev_entry, now):
    old = {v["id"]: v for v in (prev_entry or {}).get("videos", [])}
    for v in videos:
        hist = list(old.get(v["id"], {}).get("history") or [])
        if v.get("views") is not None:
            if not hist or hist[-1][1] != v["views"] or now - hist[-1][0] > 6 * 3600:
                hist.append([now, v["views"]])
        v["history"] = hist[-HISTORY_MAX:]


def build_stats(channels, settings=None, prev_stats=None, source="github", log=print):
    import yt_dlp  # noqa: F401  (errore chiaro se manca)
    settings = {**DEFAULT_SETTINGS, **(settings or {})}
    n = max(1, min(int(settings.get("videos_per_channel", 3)), 10))
    prev = (prev_stats or {}).get("channels", {})
    now = int(time.time())
    out = {}
    inner = ThreadPoolExecutor(max_workers=6)

    def work(ch):
        t0 = time.time()
        if source == "pc" and ch["platform"] == "tiktok" and not TIKTOK_COOKIES and prev.get(ch["id"]):
            log(f"  skip {ch['id']}  (TikTok non collegato su questo PC: tengo i dati di GitHub)")
            return ch["id"], prev[ch["id"]]
        _DBG.log = [] if ch["platform"] == "tiktok" else None
        _DBG.ids = None
        _DBG.login = False
        old_entry = prev.get(ch["id"]) or {}
        if ch["platform"] == "tiktok":
            ch = {**ch, "_known_ids": old_entry.get("known_ids") or [v["id"] for v in old_entry.get("videos") or []]}
        try:
            channel, videos = fetch_channel(ch, n, inner)
            known = channel.pop("_ids", None)
            _merge_history(videos, prev.get(ch["id"]), now)
            log(f"  ok   {ch['id']}  ({len(videos)} video, {time.time() - t0:.1f}s)")
            entry = {"channel": channel, "videos": videos, "fetched_at": now}
            if known:
                entry["known_ids"] = known[:15]
            if _DBG.log:
                entry["debug"] = _DBG.log
            return ch["id"], entry
        except Exception as e:
            msg = LOGIN_MSG if isinstance(e, LoginNeeded) else clean_error(e)
            log(f"  err  {ch['id']}  {msg}")
            old = prev.get(ch["id"])
            if isinstance(e, LoginNeeded) and old and old.get("videos"):
                # i dati letti dal PC con l'accesso TikTok restano validi: niente errore
                keep = {k: v for k, v in old.items() if k not in ("error", "error_at", "debug")}
                return ch["id"], {**keep, "needs_login": True,
                                  "known_ids": (_DBG.ids or old.get("known_ids") or [v["id"] for v in old["videos"]])[:15]}
            if old and old.get("videos"):
                return ch["id"], {**old, "error": msg, "error_at": now, "debug": _DBG.log or None,
                                  "known_ids": (_DBG.ids or old.get("known_ids") or [v["id"] for v in old["videos"]])[:15]}
            entry = {"error": msg, "error_at": now, "fetched_at": None}
            if isinstance(e, LoginNeeded):
                entry["needs_login"] = True
            ids = _DBG.ids or old_entry.get("known_ids")
            if ids:
                entry["known_ids"] = ids[:15]
            if _DBG.log:
                entry["debug"] = _DBG.log
            if ch["platform"] == "tiktok":
                prof = tiktok_profile(ch["handle"])
                if prof:
                    entry["channel"] = {"name": prof.get("name") or ch["handle"], "url": ch["url"], **prof}
            return ch["id"], entry

    with ThreadPoolExecutor(max_workers=3) as outer:
        for cid, entry in outer.map(work, channels):
            out[cid] = entry
    inner.shutdown()
    import yt_dlp as _y
    try:
        import curl_cffi  # noqa: F401
        imp = True
    except ImportError:
        imp = False
    return {"updated_at": now, "source": source, "channels": out, "yt_dlp": _y.version.__version__, "impersonate": imp}


# ----------------------------------------------------------------- CLI
def _read(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    channels = _read(os.path.join(data_dir, "channels.json"), {}).get("channels", [])
    settings = _read(os.path.join(data_dir, "settings.json"), {})
    prev = _read(os.path.join(data_dir, "stats.json"), {})
    print(f"Vyral: aggiorno {len(channels)} canali…")
    stats = build_stats(channels, settings, prev, source=os.environ.get("VYRAL_SOURCE", "github"))
    with open(os.path.join(data_dir, "stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, separators=(",", ":"))
    print("Fatto.")


if __name__ == "__main__":
    main()
