<p align="center"><img src="assets/logo.svg" width="96" alt="Vyral"></p>

<h1 align="center">Vyral</h1>
<p align="center">Le statistiche dei tuoi ultimi video su <b>YouTube</b>, <b>TikTok</b>, <b>Twitch</b>, <b>Kick</b> e altri.<br>Stesso account su PC e telefono. Gratis, tutto su GitHub.</p>

<p align="center"><img src="docs/home.png" width="860" alt="Home di Vyral"></p>

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
2. Carica tutti i file di questa cartella (*Add file → Upload files*, trascina tutto dentro).
3. Aggiungi i due file della cartella `workflows-github` nel posto giusto: *Add file → Create new file*, come nome scrivi `.github/workflows/update-stats.yml`, incolla il contenuto del file omonimo e premi *Commit*. Ripeti con `.github/workflows/build-exe.yml`. Poi puoi cancellare la cartella `workflows-github` dal repo.

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

## Note

- Le statistiche sono pubbliche come i video, ma con un repository pubblico anche **la lista dei canali che segui è visibile** a chi apre il repo.
- A volte YouTube o TikTok bloccano i server di GitHub (messaggio "anti-bot"): il programma per PC scarica i dati dal tuo computer e risolve. GitHub usa sempre l'ultima versione di yt-dlp, e `Vyral.exe` viene ricreato ogni mese per restare aggiornato.
- Puoi provare tutto senza account col tasto **Prova la demo**.
- Per creare l'exe a mano: doppio clic su `build_exe.bat` (serve Python).

## Licenza

MIT
