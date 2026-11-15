"""
Vyral per Windows - finestra del programma.

Mostra la stessa interfaccia del sito, con lo stesso account (repository GitHub),
ma scarica le statistiche direttamente dal tuo PC: più veloce e senza i blocchi
anti-bot che a volte colpiscono i server di GitHub.

Avvio da sorgente:  pip install pywebview yt-dlp  &&  python desktop/vyral_desktop.py
Il file Vyral.exe viene creato in automatico da GitHub (Actions -> "Crea Vyral.exe").
"""
import base64
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
if getattr(sys, "frozen", False):            # dentro Vyral.exe
    WEB_DIR = os.path.join(sys._MEIPASS, "web")
else:                                        # da sorgente
    WEB_DIR = os.path.dirname(HERE)
    sys.path.insert(0, os.path.join(WEB_DIR, "fetcher"))

import vyral_core  # noqa: E402

API = "https://api.github.com/repos/{owner}/{repo}/contents/{path}"
LOCK = threading.Lock()


def _gh(auth, path, method="GET", body=None, raw=False):
    url = API.format(owner=auth["owner"], repo=auth["repo"], path=path)
    if method == "GET":
        url += f"?t={int(time.time())}"
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header("Authorization", "Bearer " + auth["token"])
    req.add_header("Accept", "application/vnd.github.raw+json" if raw else "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", "Vyral-Desktop")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
            return r.status, (data.decode("utf-8") if raw else json.loads(data or b"null"))
    except urllib.error.HTTPError as e:
        return e.code, None


def _get_json(auth, path, default):
    code, meta = _gh(auth, path)
    if code == 404 or not meta:
        return default, None
    sha = meta.get("sha")
    if meta.get("content"):
        txt = base64.b64decode(meta["content"]).decode("utf-8")
    else:  # file > 1 MB
        _, txt = _gh(auth, path, raw=True)
    try:
        return json.loads(txt or "null") or default, sha
    except json.JSONDecodeError:
        return default, sha


def _put_json(auth, path, data, msg):
    content = base64.b64encode(json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).decode()
    for attempt in range(4):
        _, sha = _get_json(auth, path, None)
        body = {"message": msg, "content": content}
        if sha:
            body["sha"] = sha
        code, _ = _gh(auth, path, "PUT", body)
        if code in (200, 201):
            return
        if code in (409, 422):
            time.sleep(0.6 * (attempt + 1))
            continue
        raise RuntimeError(f"GitHub ha rifiutato il salvataggio ({code}).")
    raise RuntimeError("Salvataggio non riuscito, riprova.")


class Api:
    """Funzioni chiamabili dall'interfaccia (window.pywebview.api.*)."""

    def refresh(self, auth):
        if not LOCK.acquire(blocking=False):
            return {"error": "Aggiornamento già in corso."}
        try:
            channels = _get_json(auth, "data/channels.json", {})[0].get("channels", [])
            settings = _get_json(auth, "data/settings.json", {})[0]
            prev = _get_json(auth, "data/stats.json", {})[0]
            stats = vyral_core.build_stats(channels, settings, prev, source="pc", log=lambda *_: None)
            _put_json(auth, "data/stats.json", stats, "Statistiche aggiornate dal PC [skip ci]")
            return {"ok": True, "updated_at": stats["updated_at"]}
        except Exception as e:  # noqa: BLE001
            return {"error": str(e)[:300]}
        finally:
            LOCK.release()

    def version(self):
        import yt_dlp
        return {"yt_dlp": yt_dlp.version.__version__}


def main():
    import webview

    storage = os.path.join(os.environ.get("APPDATA") or os.path.expanduser("~"), "Vyral")
    os.makedirs(storage, exist_ok=True)
    webview.create_window(
        "Vyral",
        url=os.path.join(WEB_DIR, "index.html"),
        js_api=Api(),
        width=1360, height=880, min_size=(420, 640),
        background_color="#07070c",
    )
    # porta fissa: così il login resta salvato tra un avvio e l'altro
    webview.start(private_mode=False, storage_path=storage, http_server=True, http_port=48765,
                  icon=os.path.join(WEB_DIR, "assets", "logo.ico"))


if __name__ == "__main__":
    main()
