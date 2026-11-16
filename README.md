<p align="center"><img src="assets/logo.svg" width="96" alt="Vyral"></p>

<h1 align="center">Vyral</h1>
<p align="center">Le statistiche dei tuoi ultimi video su <b>YouTube</b>, <b>TikTok</b>, <b>Twitch</b>, <b>Kick</b> e altri.<br>Stesso account su PC e telefono. Gratis, tutto su GitHub.</p>


## Cosa fa

- **Sidebar con i tuoi social**: entri in YouTube, TikTok… e aggiungi i canali lì. Col tasto **Aggiungi social** ne attivi altri (Twitch, Kick, o qualsiasi link supportato da yt-dlp).
- **Per ogni video**: views, like, commenti, condivisioni, salvataggi, durata, engagement, like %, views all'ora, confronto con la media del canale (🔥), crescita nelle ultime 24 ore e mini-grafico dell'andamento.
- **Visualizza tutti**: tabella di tutti i video, ordinabile, filtrabile e con ricerca.
- **Home**: follower totali, video "in fiamme", confronto tra canali.
- **Impostazioni sincronizzate**: 7 temi, sfondo animato (aurora, griglia, stelle), nero OLED, effetti luce, animazioni, densità, arrotondamento, quanti video analizzare, soglia 🔥, statistiche da mostrare, backup.
- **Programma per PC** (`Vyral.exe`) e **sito per telefono** (installabile sulla schermata Home dell'iPhone), con la stessa grafica e lo stesso account.

## Come funziona

```
 iPhone (sito)  ─┐                         ┌─ GitHub Actions: ogni 30 min scarica le statistiche
                 ├──  il tuo repository  ──┤
 PC (Vyral.exe) ─┘    data/*.json          └─ Vyral.exe: le scarica dal tuo PC quando è aperto
```

Il repository **è** il tuo account: dentro `data/` ci sono canali, impostazioni e statistiche. Ogni dispositivo ci accede con un token personale.

## Installazione (una volta sola, 10 minuti)

### 1. Crea il repository
1. Su GitHub crea un repository **pubblico** chiamato `vyral` (pubblico serve per avere GitHub Pages gratis).
2. Carica tutti i file di questa cartella, **compresa la cartella nascosta `.github`**. Il modo più semplice è [GitHub Desktop](https://desktop.github.com/): *File → Add local repository* → *Publish repository*.

### 2. Attiva il sito
*Settings → Pages* → **Source: Deploy from a branch** → branch `main`, cartella `/ (root)` → **Save**.
Dopo un minuto il sito è su `https://TUONOME.github.io/vyral/`.

### 3. Attiva gli aggiornamenti automatici
1. *Settings → Actions → General* → **Workflow permissions: Read and write** → Save.
2. Scheda **Actions** → se richiesto, premi **I understand… enable them**.
3. Apri **Crea Vyral.exe** → **Run workflow**. In ~3 minuti trovi `Vyral.exe` in *Releases*.

### 4. Crea il token (la tua "password")
1. Apri [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new).
2. **Repository access** → *Only select repositories* → `vyral`.
3. **Permissions** → *Contents*: **Read and write**, *Actions*: **Read and write**.
4. **Generate token** e copialo (inizia con `github_pat_`).

### 5. Accedi
- **iPhone**: apri il sito in Safari → incolla il token → *Condividi → Aggiungi alla schermata Home*. Si apre a schermo intero come un'app.
- **PC**: apri `Vyral.exe` → stesso utente, stesso token.

## Collega YouTube Studio

Tempo di visualizzazione, durata media, % visualizzata, impression, CTR, iscritti guadagnati/persi, fonti di traffico, paesi, età e sesso, dispositivi e guadagni dei **tuoi** canali. I dati vengono salvati **cifrati** (`data/studio.enc.json`): nel repository pubblico sono illeggibili, Vyral li apre con la tua password.

**A. Google Cloud (5 minuti, una volta sola)**
1. Apri [console.cloud.google.com](https://console.cloud.google.com/) → in alto *Seleziona un progetto* → **Nuovo progetto** → nome `Vyral` → **Crea** (poi selezionalo).
2. Nella barra di ricerca in alto cerca **YouTube Analytics API** → **Abilita**. Ripeti con **YouTube Data API v3** → **Abilita**.
3. Cerca **Google Auth Platform** (o *Schermata consenso OAuth*) → **Inizia**:
   nome app `Vyral`, la tua email → *Avanti* → Pubblico: **Esterno** → la tua email → accetta → **Crea**.
4. Nel menu a sinistra **Pubblico** → **Pubblica app** → **Conferma**. *(Importante: se resta "In test", l'accesso scade dopo 7 giorni.)*
5. Menu a sinistra **Client** → **Crea client** → Tipo: **App desktop** → nome `Vyral` → **Crea** → **Scarica JSON** (resta nella cartella Download).

**B. Collega i canali (sul PC)**
1. Doppio clic su `studio\studio_setup.bat` (serve Python). Trova da solo il file JSON in Download.
2. Si apre il browser: scegli l'account e **il canale**. Se compare *"Google non ha verificato questa app"* → **Avanzate** → **Vai a Vyral** → spunta tutti i permessi → **Continua**. È la tua app, è normale.
3. Alla domanda *"Vuoi collegare un altro canale?"* scrivi `s` e ripeti per ogni canale (Bryzee6, Meowuefn, ecc.).
4. Scegli una **password** (minimo 8 caratteri). Il programma copia negli appunti un testo segreto.

**C. GitHub**
1. Nel repository: **Settings → Secrets and variables → Actions → New repository secret**. Name: `VYRAL_STUDIO`, Secret: incolla (Ctrl+V) → **Add secret**.
2. **Add file → Create new file**, nome `.github/workflows/studio.yml`, incolla il contenuto di `workflows-github/studio.yml` → **Commit changes**.
3. **Actions → Aggiorna YouTube Studio → Run workflow**. Dopo un minuto apri Vyral → **YouTube Studio** → inserisci la password (una volta per dispositivo).

Si aggiorna da solo ogni 3 ore. YouTube fornisce questi dati con 1–3 giorni di ritardo. I guadagni compaiono solo per i canali monetizzati.

## Note

- Le statistiche sono pubbliche come i video, ma con un repository pubblico anche **la lista dei canali che segui è visibile** a chi apre il repo.
- A volte YouTube o TikTok bloccano i server di GitHub (messaggio "anti-bot"): il programma per PC scarica i dati dal tuo computer e risolve. GitHub usa sempre l'ultima versione di yt-dlp, e `Vyral.exe` viene ricreato ogni mese per restare aggiornato.
- Puoi provare tutto senza account col tasto **Prova la demo**.
- Per creare l'exe a mano: doppio clic su `build_exe.bat` (serve Python).

## Licenza

MIT
