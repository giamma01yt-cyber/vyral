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

DEFAULT_SETTINGS = {"videos_per_channel": 3}

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


def list_entries(url, n):
    with _ydl({"extract_flat": "in_playlist", "playlistend": n}) as y:
        return y.extract_info(url, download=False) or {}


def video_info(url):
    with _ydl({}) as y:
        return y.extract_info(url, download=False) or {}


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
    def one(item):
        url, short = item
        try:
            return video_info(url), short
        except Exception:
            return None, short
    res = [(i, s) for i, s in pool.map(one, urls) if i]
    vids = [normalize_video(i, platform, s) for i, s in res]
    vids.sort(key=lambda v: v["timestamp"] or 0, reverse=True)
    return vids[:n], [i for i, _ in res]


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


def fetch_generic(ch, n, pool):
    platform = ch["platform"]
    base = ch["url"].rstrip("/")
    handle = ch["handle"].lstrip("@")
    list_url = ch.get("list_url") or (LIST_URL[platform].format(h=handle) if platform in LIST_URL else base)
    if platform == "tiktok":
        list_url = base
    # TikTok: i video fissati in alto non sono i più recenti -> ne prendo di più
    extra = 3 if platform == "tiktok" else 0
    info = list_entries(list_url, n + extra)
    urls = [(u, platform == "tiktok") for u in (_entry_url(e, base) for e in info.get("entries") or []) if u]
    if not urls:
        raise RuntimeError("Nessun video trovato (profilo privato o richiesta bloccata).")
    vids, infos = _full(urls, platform, n, pool)
    first = infos[0] if infos else {}
    return {
        "name": first.get("channel") or first.get("uploader") or info.get("uploader") or info.get("title") or ch["handle"],
        "followers": first.get("channel_follower_count") or info.get("channel_follower_count"),
        "avatar": _avatar(info),
        "url": ch["url"],
    }, vids


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
        try:
            channel, videos = fetch_channel(ch, n, inner)
            _merge_history(videos, prev.get(ch["id"]), now)
            log(f"  ok   {ch['id']}  ({len(videos)} video, {time.time() - t0:.1f}s)")
            return ch["id"], {"channel": channel, "videos": videos, "fetched_at": now}
        except Exception as e:
            msg = clean_error(e)
            log(f"  err  {ch['id']}  {msg}")
            old = prev.get(ch["id"])
            if old and old.get("videos"):
                return ch["id"], {**old, "error": msg, "error_at": now}
            return ch["id"], {"error": msg, "error_at": now, "fetched_at": None}

    with ThreadPoolExecutor(max_workers=3) as outer:
        for cid, entry in outer.map(work, channels):
            out[cid] = entry
    inner.shutdown()
    return {"updated_at": now, "source": source, "channels": out}


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
