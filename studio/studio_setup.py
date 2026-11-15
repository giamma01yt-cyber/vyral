"""
Vyral - collega YouTube Studio (da fare una volta sola, sul PC).

1. Ti chiede il file client_secret.json scaricato da Google Cloud.
2. Apre il browser: accedi e scegli il canale (ripeti per ogni canale).
3. Scegli una password per cifrare i dati.
4. Copia negli appunti il testo da incollare nel secret VYRAL_STUDIO su GitHub.

Non salva niente su disco e non manda niente a nessuno tranne Google.
"""
import base64
import getpass
import hashlib
import http.server
import json
import os
import secrets
import subprocess
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

SCOPES = " ".join([
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
])
AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN = "https://oauth2.googleapis.com/token"


def title(t):
    print("\n" + "=" * 60 + f"\n  {t}\n" + "=" * 60)


def pick_client_file():
    here = [os.path.join(os.path.expanduser("~"), "Downloads", f) for f in os.listdir(os.path.join(os.path.expanduser("~"), "Downloads"))
            if f.startswith("client_secret") and f.endswith(".json")] if os.path.isdir(os.path.join(os.path.expanduser("~"), "Downloads")) else []
    if len(here) == 1:
        print(f"Trovato: {here[0]}")
        return here[0]
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk(); root.withdraw(); root.attributes("-topmost", True)
        p = filedialog.askopenfilename(title="Scegli il file client_secret….json scaricato da Google Cloud",
                                       filetypes=[("JSON", "*.json")])
        root.destroy()
        if p:
            return p
    except Exception:  # noqa: BLE001
        pass
    return input("Trascina qui il file client_secret….json e premi Invio: ").strip().strip('"')


def load_client(path):
    with open(path, encoding="utf-8") as f:
        j = json.load(f)
    c = j.get("installed") or j.get("web") or {}
    if not c.get("client_id"):
        sys.exit("Questo file non sembra quello giusto (manca client_id). Scarica il JSON del client 'App desktop'.")
    return c["client_id"], c["client_secret"]


def oauth_once(client_id, client_secret):
    """Login nel browser con ritorno su 127.0.0.1 (PKCE)."""
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    state = secrets.token_urlsafe(16)
    result = {}

    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass

        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if q.get("state", [""])[0] == state:
                result.update({k: v[0] for k, v in q.items()})
            ok = "code" in result
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            msg = "Fatto! Puoi chiudere questa scheda e tornare a Vyral." if ok else "Accesso annullato."
            self.wfile.write(f"<body style='background:#07070c;color:#fff;font:20px system-ui;display:grid;place-items:center;height:100vh'><div>{msg}</div></body>".encode())

    srv = http.server.HTTPServer(("127.0.0.1", 0), H)
    redirect = f"http://127.0.0.1:{srv.server_port}"
    url = AUTH + "?" + urllib.parse.urlencode({
        "client_id": client_id, "redirect_uri": redirect, "response_type": "code", "scope": SCOPES,
        "access_type": "offline", "prompt": "consent select_account", "state": state,
        "code_challenge": challenge, "code_challenge_method": "S256",
    })
    t = threading.Thread(target=srv.handle_request, daemon=True)
    t.start()
    print("Si apre il browser: accedi, scegli il CANALE (se ne hai più di uno) e consenti l'accesso.")
    print("Se Google dice 'app non verificata': Avanzate → Vai a Vyral (non sicuro). È la tua app, è normale.")
    webbrowser.open(url)
    t.join(timeout=600)
    srv.server_close()
    if "code" not in result:
        raise RuntimeError("Accesso non completato (" + result.get("error", "tempo scaduto") + ").")
    data = urllib.parse.urlencode({"code": result["code"], "client_id": client_id, "client_secret": client_secret,
                                   "redirect_uri": redirect, "grant_type": "authorization_code", "code_verifier": verifier}).encode()
    with urllib.request.urlopen(urllib.request.Request(TOKEN, data=data), timeout=30) as r:
        tok = json.loads(r.read())
    if "refresh_token" not in tok:
        raise RuntimeError("Google non ha dato il refresh token. Riprova.")
    req = urllib.request.Request("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true")
    req.add_header("Authorization", "Bearer " + tok["access_token"])
    with urllib.request.urlopen(req, timeout=30) as r:
        items = json.loads(r.read()).get("items") or []
    if not items:
        raise RuntimeError("Questo account non ha un canale YouTube. Riprova scegliendo il canale giusto.")
    sn = items[0]["snippet"]
    return {"name": sn["title"], "handle": sn.get("customUrl", ""), "refresh_token": tok["refresh_token"]}


def to_clipboard(text):
    try:
        if os.name == "nt":
            subprocess.run("clip", input=text.encode("utf-16le"), check=True, shell=True)
        elif sys.platform == "darwin":
            subprocess.run("pbcopy", input=text.encode(), check=True)
        else:
            subprocess.run(["xclip", "-selection", "clipboard"], input=text.encode(), check=True)
        return True
    except Exception:  # noqa: BLE001
        return False


def main():
    title("VYRAL · Collega YouTube Studio")
    client_id, client_secret = load_client(pick_client_file())
    channels = []
    while True:
        title(f"Canale n. {len(channels) + 1}")
        try:
            ch = oauth_once(client_id, client_secret)
            if any(c["refresh_token"] == ch["refresh_token"] or (c["handle"] and c["handle"] == ch["handle"]) for c in channels):
                print(f"{ch['name']} era già collegato.")
            else:
                channels.append(ch)
                print(f"✓ Collegato: {ch['name']} {ch['handle']}")
        except Exception as e:  # noqa: BLE001
            print(f"✗ {e}")
        again = input("\nVuoi collegare un altro canale? (s/n): ").strip().lower()
        if not again.startswith("s"):
            break
    if not channels:
        sys.exit("Nessun canale collegato.")

    title("Password per cifrare i dati")
    print("La userai una volta su PC e iPhone per sbloccare le statistiche di YouTube Studio.")
    while True:
        p1 = getpass.getpass("Scegli una password (minimo 8 caratteri, non si vede mentre scrivi): ")
        p2 = getpass.getpass("Ripetila: ")
        if len(p1) >= 8 and p1 == p2:
            break
        print("Le password non coincidono o sono troppo corte, riprova.")

    secret = json.dumps({"client_id": client_id, "client_secret": client_secret, "password": p1,
                         "channels": channels}, separators=(",", ":"))
    title("Ultimo passo")
    print("Canali collegati: " + ", ".join(c["name"] for c in channels))
    if to_clipboard(secret):
        print("\nHo COPIATO negli appunti il testo segreto.\n")
    else:
        print("\nCopia questo testo (è segreto, non mandarlo a nessuno):\n\n" + secret + "\n")
    print("Ora su GitHub, nel repository vyral:")
    print("  Settings → Secrets and variables → Actions → New repository secret")
    print("  Name:   VYRAL_STUDIO")
    print("  Secret: incolla (Ctrl+V)  →  Add secret")
    print("\nPoi Actions → 'Aggiorna YouTube Studio' → Run workflow.")
    input("\nPremi Invio per chiudere…")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAnnullato.")
