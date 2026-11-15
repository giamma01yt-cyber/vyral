"""
Vyral Studio - statistiche private di YouTube Studio (YouTube Analytics API).

Gira su GitHub Actions. Legge il secret VYRAL_STUDIO (creato da studio/studio_setup.py),
scarica i report dei tuoi canali e li salva CIFRATI in data/studio.enc.json:
nel repository pubblico restano illeggibili, l'app li apre con la tua password.

    VYRAL_STUDIO='{"client_id":..,"client_secret":..,"password":..,"channels":[{"refresh_token":..}]}' \
        python fetcher/vyral_studio.py data
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

TOKEN_URL = "https://oauth2.googleapis.com/token"
ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports"
DATA_API = "https://www.googleapis.com/youtube/v3"
PBKDF2_ITER = 210_000

TRAFFIC = {
    "YT_SEARCH": "Ricerca YouTube", "SUGGESTED": "Video suggeriti", "BROWSE": "Home e feed",
    "SHORTS": "Feed Shorts", "EXT_URL": "Siti esterni", "NO_LINK_OTHER": "Diretto / sconosciuto",
    "PLAYLIST": "Playlist", "SUBSCRIBER": "Iscrizioni", "NOTIFICATION": "Notifiche",
    "CHANNEL": "Pagina del canale", "END_SCREEN": "Schermate finali", "ANNOTATION": "Schede",
    "YT_OTHER_PAGE": "Altre pagine YouTube", "YT_CHANNEL": "Pagina del canale", "RELATED_VIDEO": "Video correlati",
    "HASHTAGS": "Hashtag", "LIVE_REDIRECT": "Reindirizzamento live", "SOUND_PAGE": "Pagina audio",
    "VIDEO_REMIXES": "Remix", "IMMERSIVE_LIVE": "Live", "CAMPAIGN_CARD": "Campagne", "PRODUCT_PAGE": "Prodotti",
    "ADVERTISING": "Pubblicità", "PROMOTED": "Promozioni", "SHORTS_CONTENT_LINKS": "Link nei Shorts",
}
DEVICES = {"MOBILE": "Telefono", "DESKTOP": "Computer", "TV": "TV", "TABLET": "Tablet", "GAME_CONSOLE": "Console", "UNKNOWN_PLATFORM": "Altro"}
AGES = {"age13-17": "13-17", "age18-24": "18-24", "age25-34": "25-34", "age35-44": "35-44", "age45-54": "45-54", "age55-64": "55-64", "age65-": "65+"}


# ----------------------------------------------------------------- HTTP
def _req(url, data=None, token=None):
    body = urllib.parse.urlencode(data).encode() if data else None
    r = urllib.request.Request(url, data=body)
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=40) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read()).get("error", {})
            msg = msg.get("message") if isinstance(msg, dict) else msg
        except Exception:  # noqa: BLE001
            msg = str(e)
        raise RuntimeError(f"{e.code}: {msg}") from None


def access_token(cfg, refresh_token):
    j = _req(TOKEN_URL, {"client_id": cfg["client_id"], "client_secret": cfg["client_secret"],
                         "refresh_token": refresh_token, "grant_type": "refresh_token"})
    return j["access_token"]


def report(tok, start, end, metrics, dimensions=None, sort=None, max_results=None, filters=None):
    q = {"ids": "channel==MINE", "startDate": start, "endDate": end, "metrics": metrics}
    if dimensions:
        q["dimensions"] = dimensions
    if sort:
        q["sort"] = sort
    if max_results:
        q["maxResults"] = max_results
    if filters:
        q["filters"] = filters
    j = _req(ANALYTICS + "?" + urllib.parse.urlencode(q), token=tok)
    cols = [c["name"] for c in j.get("columnHeaders", [])]
    return [dict(zip(cols, row)) for row in j.get("rows") or []]


def safe(fn, errors, label):
    try:
        return fn()
    except Exception as e:  # noqa: BLE001
        errors.append(f"{label}: {str(e)[:160]}")
        return None


# ----------------------------------------------------------------- report di un canale
BASE = "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares"
REACH = "videoThumbnailImpressions,videoThumbnailImpressionsClickRate"
MONEY = "estimatedRevenue,playbackBasedCpm,cpm"


def channel_report(cfg, ch_cfg, log=print):
    tok = access_token(cfg, ch_cfg["refresh_token"])
    info = _req(f"{DATA_API}/channels?part=snippet,statistics,contentDetails&mine=true", token=tok)["items"][0]
    sn, st = info["snippet"], info["statistics"]
    errors = []
    end = date.today() - timedelta(days=1)
    periods = {"7": end - timedelta(days=6), "28": end - timedelta(days=27), "90": end - timedelta(days=89)}
    E = end.isoformat()

    out = {
        "id": info["id"],
        "handle": (sn.get("customUrl") or "").lower(),
        "name": sn.get("title"),
        "avatar": (sn.get("thumbnails", {}).get("high") or sn.get("thumbnails", {}).get("default") or {}).get("url"),
        "subscribers": int(st.get("subscriberCount", 0)) if not st.get("hiddenSubscriberCount") else None,
        "total_views": int(st.get("viewCount", 0)),
        "video_count": int(st.get("videoCount", 0)),
        "end_date": E,
        "periods": {},
    }

    for key, start in periods.items():
        S = start.isoformat()
        p = {}
        tot = safe(lambda: report(tok, S, E, BASE), errors, f"totali {key}g")
        p["totals"] = tot[0] if tot else {}
        reach = safe(lambda: report(tok, S, E, REACH), errors, f"impression {key}g")
        if reach:
            p["totals"].update(reach[0])
        money = safe(lambda: report(tok, S, E, MONEY), errors, f"guadagni {key}g")
        if money:
            p["totals"].update(money[0])
        p["daily"] = safe(lambda: report(tok, S, E, "views,estimatedMinutesWatched,subscribersGained,subscribersLost", "day", "day"), errors, f"giornaliero {key}g") or []
        if money:
            rev = safe(lambda: report(tok, S, E, "estimatedRevenue", "day", "day"), errors, f"guadagni giornalieri {key}g") or []
            rmap = {r["day"]: r["estimatedRevenue"] for r in rev}
            for d in p["daily"]:
                d["estimatedRevenue"] = rmap.get(d["day"])
        traffic = safe(lambda: report(tok, S, E, "views,estimatedMinutesWatched", "insightTrafficSourceType", "-views"), errors, f"traffico {key}g") or []
        p["traffic"] = [{"k": r["insightTrafficSourceType"], "label": TRAFFIC.get(r["insightTrafficSourceType"], r["insightTrafficSourceType"].replace("_", " ").title()),
                         "views": r["views"], "minutes": r["estimatedMinutesWatched"]} for r in traffic]
        p["countries"] = safe(lambda: report(tok, S, E, "views,estimatedMinutesWatched", "country", "-views", 12), errors, f"paesi {key}g") or []
        dev = safe(lambda: report(tok, S, E, "views,estimatedMinutesWatched", "deviceType", "-views"), errors, f"dispositivi {key}g") or []
        p["devices"] = [{"k": r["deviceType"], "label": DEVICES.get(r["deviceType"], r["deviceType"].title()), "views": r["views"]} for r in dev]
        demo = safe(lambda: report(tok, S, E, "viewerPercentage", "ageGroup,gender", "gender,ageGroup"), errors, f"età e sesso {key}g") or []
        p["demographics"] = [{"age": AGES.get(r["ageGroup"], r["ageGroup"]), "gender": r["gender"], "pct": r["viewerPercentage"]} for r in demo]
        subs = safe(lambda: report(tok, S, E, "views,estimatedMinutesWatched,averageViewDuration", "subscribedStatus"), errors, f"iscritti/non iscritti {key}g") or []
        p["subscribed"] = subs
        out["periods"][key] = p
        time.sleep(0.2)

    # ---- per video (ultimi 28 giorni + intera vita dei video recenti)
    S28 = periods["28"].isoformat()
    top = safe(lambda: report(tok, S28, E, BASE, "video", "-views", 25), errors, "video 28g") or []
    top_reach = safe(lambda: report(tok, S28, E, "views," + REACH, "video", "-views", 25), errors, "impression video 28g") or []
    rmap = {r["video"]: r for r in top_reach}
    for r in top:
        r.update({k: v for k, v in rmap.get(r["video"], {}).items() if k != "views"})

    # ultimi video caricati (lifetime)
    uploads = info.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    recent_ids = []
    if uploads:
        pl = safe(lambda: _req(f"{DATA_API}/playlistItems?part=contentDetails&maxResults=15&playlistId={uploads}", token=tok), errors, "lista video")
        recent_ids = [i["contentDetails"]["videoId"] for i in (pl or {}).get("items", [])]
    life = []
    if recent_ids:
        F = "video==" + ",".join(recent_ids)
        life = safe(lambda: report(tok, "2005-02-14", E, BASE, "video", "-views", 50, F), errors, "video recenti") or []
        lr = safe(lambda: report(tok, "2005-02-14", E, "views," + REACH, "video", "-views", 50, F), errors, "impression video recenti") or []
        lmap = {r["video"]: r for r in lr}
        for r in life:
            r.update({k: v for k, v in lmap.get(r["video"], {}).items() if k != "views"})

    # titoli e miniature
    ids = list(dict.fromkeys([r["video"] for r in top] + [r["video"] for r in life]))[:50]
    meta = {}
    if ids:
        vj = safe(lambda: _req(f"{DATA_API}/videos?part=snippet,contentDetails&id={','.join(ids)}", token=tok), errors, "titoli video") or {}
        for v in vj.get("items", []):
            th = v["snippet"].get("thumbnails", {})
            meta[v["id"]] = {"title": v["snippet"]["title"], "published": v["snippet"]["publishedAt"],
                             "thumbnail": (th.get("medium") or th.get("default") or {}).get("url"),
                             "duration": v["contentDetails"].get("duration")}
    for r in top + life:
        r.update(meta.get(r["video"], {}))
    out["top_videos"] = top
    out["recent_videos"] = sorted(life, key=lambda r: r.get("published") or "", reverse=True)
    out["errors"] = errors
    log(f"  ok   {out['name']}  ({len(errors)} report non disponibili)")
    return out


# ----------------------------------------------------------------- cifratura
def encrypt(obj, password):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=PBKDF2_ITER).derive(password.encode())
    ct = AESGCM(key).encrypt(iv, json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode(), None)
    b = lambda x: base64.b64encode(x).decode()  # noqa: E731
    return {"v": 1, "kdf": "PBKDF2-SHA256", "iter": PBKDF2_ITER, "salt": b(salt), "iv": b(iv), "data": b(ct)}


def decrypt(env, password):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    d = base64.b64decode
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=d(env["salt"]), iterations=env["iter"]).derive(password.encode())
    return json.loads(AESGCM(key).decrypt(d(env["iv"]), d(env["data"]), None))


# ----------------------------------------------------------------- main
def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    raw = os.environ.get("VYRAL_STUDIO", "").strip()
    if not raw:
        print("VYRAL_STUDIO non impostato: salto YouTube Studio.")
        return
    cfg = json.loads(raw)
    print(f"Vyral Studio: {len(cfg['channels'])} canali…")
    channels, errors = [], []
    for c in cfg["channels"]:
        try:
            channels.append(channel_report(cfg, c))
        except Exception as e:  # noqa: BLE001
            msg = str(e)[:200]
            if "invalid_grant" in msg:
                msg = "Accesso Google scaduto o revocato: rifai studio_setup per questo canale."
            errors.append({"name": c.get("name"), "error": msg})
            print(f"  err  {c.get('name')}: {msg}")
    payload = {"updated_at": int(time.time()), "channels": channels, "errors": errors}
    with open(os.path.join(data_dir, "studio.enc.json"), "w", encoding="utf-8") as f:
        json.dump(encrypt(payload, cfg["password"]), f)
    print("Fatto (dati cifrati).")


if __name__ == "__main__":
    main()
