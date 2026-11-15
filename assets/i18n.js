/* ============================================================
   VYRAL — lingue (Italiano / English)
   L'interfaccia è scritta in italiano; in inglese i testi vengono
   tradotti al volo appena compaiono sullo schermo.
   ============================================================ */
'use strict';

const I18N = { lang: 'it' };
try { I18N.lang = JSON.parse(localStorage.getItem('vyral.lang')) || ((navigator.language || 'it').startsWith('it') ? 'it' : 'en'); } catch { }
const LOC = () => I18N.lang === 'en' ? 'en-US' : 'it-IT';
const LANGS = { it: '🇮🇹 Italiano', en: '🇬🇧 English' };

const EN = {
  // navigazione
  'Home': 'Home', 'Tutti i video': 'All videos', 'Social': 'Social', 'Aggiungi social': 'Add social', 'Impostazioni': 'Settings', 'Opzioni': 'Settings', 'Tutti': 'All',
  'Statistiche social': 'Social stats', 'Modalità demo': 'Demo mode', 'Programma per PC': 'PC app', 'Solo visione': 'View only', 'Account demo': 'Demo account',
  'Aggiorna': 'Refresh', 'Aggiorno…': 'Refreshing…', 'Scarica i dati più recenti': 'Download the latest data', 'nuovo': 'new',
  'Mai aggiornato': 'Never updated', 'Premi Aggiorna per iniziare': 'Press Refresh to start', 'Errore': 'Error',
  'Dati da GitHub': 'Data from GitHub', 'Dati da il tuo PC': 'Data from your PC', 'Dati da demo': 'Demo data',
  'Avvio aggiornamento…': 'Starting update…', 'In coda su GitHub…': 'Queued on GitHub…', 'GitHub sta scaricando i dati…': 'GitHub is downloading the data…',
  'Il tuo PC sta scaricando i dati…': 'Your PC is downloading the data…', 'Scarico i dati (demo)…': 'Downloading data (demo)…',
  'Collega TikTok': 'Connect TikTok', 'Scollega': 'Disconnect', 'Collegato': 'Connected', 'dal PC': 'from PC', 'Fatto': 'Done',
  'Accesso TikTok (solo su questo PC)': 'TikTok login (this PC only)', 'Scollegare TikTok?': 'Disconnect TikTok?', 'TikTok scollegato': 'TikTok disconnected',
  "Serve per i profili che TikTok mostra solo a chi ha fatto l'accesso. L'accesso resta su questo computer e non va su GitHub.": "Needed for profiles TikTok only shows to signed-in users. The login stays on this computer and never goes to GitHub.",
  "Vyral non userà più il tuo accesso TikTok su questo PC.": 'Vyral will no longer use your TikTok login on this PC.', 'TikTok collegato: aggiorno i dati…': 'TikTok connected: updating data…',
  "TikTok mostra questi video solo a chi ha fatto l'accesso: collega il tuo account TikTok in Vyral.exe (Impostazioni → Social).": 'TikTok only shows these videos to signed-in users: connect your TikTok account in Vyral.exe (Settings → Social).',
  "Il collegamento a TikTok si fa dal programma per PC (Vyral.exe).": 'Connecting TikTok is done from the PC app (Vyral.exe).',
  'Tutti i video del canale': 'All channel videos', "Video nell'archivio": 'Videos in archive', 'Più recenti': 'Newest', 'Più like': 'Most liked',
  'Cerca tra i video del canale…': "Search this channel's videos…", 'Archivio in preparazione': 'Archive being prepared', 'Nessun risultato': 'No results',
  "Prova un'altra ricerca.": 'Try another search.', 'Archivio video per canale': 'Video archive per channel', 'Canale non trovato': 'Channel not found', 'Torna alla Home': 'Back to Home',
  'Quanti video tenere nella pagina "Tutti i video del canale". Si aggiorna ogni 6 ore.': 'How many videos to keep on the "All channel videos" page. Updated every 6 hours.',
  "in attesa dell'archivio": 'waiting for archive', 'per video': 'per video', 'Indietro': 'Back', 'Canale': 'Channel',
  'nelle ultime 24h': 'in the last 24h', 'like': 'likes', 'Salvataggio…': 'Saving…', 'Sincronizzato': 'Synced', 'adesso': 'just now',
  // home
  'Ecco come stanno andando i tuoi canali.': 'Here is how your channels are doing.',
  'Follower totali': 'Total followers', 'su tutti i canali': 'across all channels', 'Views ultimi video': 'Latest videos views', 'video analizzati': 'videos analyzed',
  'Engagement medio': 'Average engagement', 'like + commenti + condivisioni': 'likes + comments + shares', "Views all'ora": 'Views per hour', 'media dalla pubblicazione': 'average since upload',
  'I tuoi social': 'Your socials', 'views recenti': 'recent views', 'Twitch, Kick e altri': 'Twitch, Kick and more',
  'In fiamme adesso': 'On fire right now', 'Vedi tutti': 'See all', 'Confronto canali': 'Channel comparison', 'media views': 'average views',
  'Nessun video ancora: premi Aggiorna.': 'No videos yet: press Refresh.', 'Ancora nessun dato.': 'No data yet.',
  'Canali fissati': 'Pinned channels', 'Fissato': 'Pinned', 'Fissa in alto': 'Pin to top', 'Togli dai fissati': 'Unpin',
  'Fissa i tuoi canali migliori con la puntina: compaiono qui e sempre per primi.': 'Pin your best channels: they show up here and always first.',
  'Aggiungi i tuoi canali: Vyral ti mostrerà le statistiche degli ultimi video, sempre aggiornate su PC e telefono.': 'Add your channels: Vyral will show the stats of their latest videos, always in sync on PC and phone.',
  // pagina social
  'Canali': 'Channels', 'Visualizza tutti': 'View all', 'Aggiungi canale': 'Add channel', 'Video + Shorts': 'Videos + Shorts', 'Solo video': 'Videos only', 'Solo Shorts': 'Shorts only',
  'Link del canale o @nome': 'Channel link or @name', 'Link del profilo o @nome': 'Profile link or @name', 'Link del canale o nome': 'Channel link or name', 'Link completo della pagina video': 'Full link of the videos page',
  'Media views': 'Avg views', 'Views tot.': 'Total views', 'Engagement': 'Engagement', 'Views/ora': 'Views/hour', 'Apri canale': 'Open channel', 'Rimuovi': 'Remove',
  'In attesa dei dati': 'Waiting for data', 'Aggiornamento in corso…': 'Update in progress…', 'Non riesco a leggere questo canale.': "I can't read this channel.",
  'Nessun video.': 'No videos.', 'video': 'videos', 'iscritti': 'subscribers', 'follower': 'followers',
  'Engagement = interazioni / views': 'Engagement = interactions / views', "Views medie all'ora dalla pubblicazione": 'Average views per hour since upload',
  "Dall'aggiornamento precedente": 'Since the previous update', 'Views guadagnate nel periodo indicato': 'Views gained in the period shown',
  // tabella
  'Video': 'Video', 'Pubblicato': 'Published', 'Views': 'Views', 'Like': 'Likes', 'Commenti': 'Comments', 'Condiv.': 'Shares', 'Like %': 'Like %', 'vs media': 'vs avg', 'Crescita': 'Growth',
  'Video analizzati': 'Videos analyzed', 'Views totali': 'Total views', 'Like totali': 'Total likes', 'Più visto': 'Most viewed', 'Più veloce': 'Fastest',
  'interazioni / views': 'interactions / views', 'Cerca per titolo o canale…': 'Search by title or channel…', 'Tutti i canali': 'All channels',
  'Nessun video da mostrare.': 'No videos to show.', 'Solo fissati': 'Pinned only',
  // social
  'YouTube': 'YouTube', 'TikTok': 'TikTok', 'Twitch': 'Twitch', 'Kick': 'Kick', 'Altro': 'Other',
  'Video lunghi e Shorts': 'Long videos and Shorts', 'Video, condivisioni e salvataggi': 'Videos, shares and saves', 'Ultime live salvate (VOD)': 'Latest saved streams (VODs)',
  'Ultimi VOD del canale': 'Latest channel VODs', 'Qualsiasi link a una pagina di video supportata': 'Any link to a supported videos page',
  'Aggiungi un social': 'Add a social', 'Scegli quale piattaforma mostrare nella barra laterale.': 'Choose which platform to show in the sidebar.', 'Chiudi': 'Close', 'Già attivo': 'Already on',
  // impostazioni
  'Profilo': 'Profile', 'Aspetto': 'Appearance', 'Statistiche': 'Stats', 'Aggiornamento': 'Updates', 'Account': 'Account', 'Dati': 'Data',
  'Il tuo nome': 'Your name', 'Compare nel saluto della Home.': 'Shown in the Home greeting.', 'Come ti chiami?': "What's your name?",
  'Lingua': 'Language', "Lingua dell'interfaccia su questo dispositivo.": 'Interface language on this device.',
  'Tema': 'Theme', 'Colori di pulsanti, grafici ed effetti.': 'Colors of buttons, charts and effects.',
  'Aurora': 'Aurora', 'Neon': 'Neon', 'Tramonto': 'Sunset', 'Tossico': 'Toxic', 'Oceano': 'Ocean', 'Oro': 'Gold', 'Mono': 'Mono',
  'Sfondo animato': 'Animated background', "L'effetto dietro all'interfaccia.": 'The effect behind the interface.', 'Griglia': 'Grid', 'Stelle': 'Stars', 'Spento': 'Off',
  'Nero OLED': 'OLED black', "Sfondo nero puro: perfetto per l'iPhone.": 'Pure black background: perfect for iPhone.',
  'Luce sulle schede': 'Card glow', 'Le schede si illuminano dove passi col mouse.': 'Cards light up where you move the mouse.',
  'Animazioni': 'Animations', 'Transizioni, numeri che salgono, grafici che si disegnano.': 'Transitions, counting numbers, charts that draw themselves.',
  'Densità': 'Density', 'Quanto spazio tra gli elementi.': 'How much space between elements.', 'Comoda': 'Comfy', 'Compatta': 'Compact',
  'Arrotondamento': 'Roundness', 'Quanto sono tondi gli angoli.': 'How round the corners are.',
  'Video per canale': 'Videos per channel', 'Quanti video recenti analizzare. Vale dal prossimo aggiornamento.': 'How many recent videos to analyze. Applies from the next update.',
  'Soglia 🔥': '🔥 threshold', 'Un video è "in fiamme" se supera la media del canale di questo fattore.': 'A video is "on fire" when it beats the channel average by this factor.',
  'YouTube: video da contare': 'YouTube: videos to count', 'Scelta predefinita quando aggiungi un canale.': 'Default choice when you add a channel.', 'Shorts': 'Shorts',
  'Statistiche visibili': 'Visible stats', 'Scegli cosa mostrare sotto ogni video.': 'Choose what to show under each video.',
  'Condivisioni': 'Shares', 'Salvataggi': 'Saves', 'Views/ora ': 'Views/hour', 'Grafico': 'Chart', 'YouTube Studio': 'YouTube Studio',
  'Nascondi': 'Hide', 'Aggiornamento automatico': 'Automatic updates', 'Ogni 30 min': 'Every 30 min',
  'GitHub scarica i dati da solo ogni 30 minuti, anche a PC spento.': 'GitHub downloads the data by itself every 30 minutes, even with your PC off.',
  'Il programma per PC scarica i dati da solo ogni tanto; GitHub lo fa comunque ogni 30 minuti.': 'The PC app downloads the data by itself from time to time; GitHub does it every 30 minutes anyway.',
  'Ricarica la pagina': 'Reload data', "Ogni quanto l'app controlla se ci sono dati nuovi.": 'How often the app checks for new data.', 'Mai': 'Never',
  'Aggiorna adesso': 'Update now', 'Aggiorna ora': 'Update now', "Avvia subito l'aggiornamento su GitHub (circa 1-2 minuti).": 'Start the update on GitHub right away (about 1-2 minutes).',
  'Scarica i dati direttamente da questo PC.': 'Download the data directly from this PC.',
  'Repository': 'Repository', 'Il tuo account: canali, impostazioni e statistiche sono salvati qui.': 'Your account: channels, settings and stats are saved here.',
  'Scarica Vyral.exe: stesso account, aggiornamenti più veloci.': 'Download Vyral.exe: same account, faster updates.', 'Scarica Vyral.exe': 'Download Vyral.exe',
  'Attività di GitHub': 'GitHub activity', 'Controlla gli aggiornamenti automatici.': 'Check the automatic updates.', 'Apri Actions': 'Open Actions',
  'Esci': 'Log out', 'Il token viene cancellato da questo dispositivo. I dati restano su GitHub.': 'The token is removed from this device. Your data stays on GitHub.',
  'Esci dalla demo': 'Leave demo', 'I dati sono finti e restano solo su questo dispositivo. Esci e accedi con GitHub per usare i tuoi canali.': 'The data is fake and stays on this device only. Log out and sign in with GitHub to use your channels.',
  'Vedi le statistiche ma non puoi aggiungere canali o aggiornare. Esci e accedi col token per avere tutto.': "You can see the stats but can't add channels or refresh. Log out and sign in with the token to get everything.",
  'Backup': 'Backup', 'Scarica canali e impostazioni in un file.': 'Download channels and settings to a file.', 'Esporta': 'Export',
  'Ripristina backup': 'Restore backup', 'Carica un file esportato in precedenza.': 'Load a previously exported file.', 'Importa': 'Import',
  'Impostazioni predefinite': 'Default settings', "Riporta l'aspetto e le opzioni come all'inizio. I canali restano.": 'Resets appearance and options. Channels are kept.', 'Ripristina': 'Reset',
  'Sbloccato su questo dispositivo.': 'Unlocked on this device.', 'Bloccato: inserisci la password nella pagina YouTube Studio.': 'Locked: enter the password on the YouTube Studio page.',
  'Blocca di nuovo': 'Lock again', 'Sblocca': 'Unlock', 'Vyral · dati dalle pagine pubbliche tramite yt-dlp': 'Vyral · data from public pages via yt-dlp',
  // modali, toast, errori
  'Annulla': 'Cancel', 'Conferma': 'Confirm', 'Rimuovere il canale?': 'Remove the channel?', 'Ripristinare il backup?': 'Restore the backup?', 'Ripristinare le impostazioni?': 'Reset the settings?',
  "Aspetto e opzioni torneranno come all'inizio.": 'Appearance and options will go back to the defaults.', 'Uscire?': 'Log out?', 'Torni alla schermata di accesso.': 'You go back to the sign-in screen.',
  'Il token verrà cancellato da questo dispositivo. I tuoi dati restano su GitHub.': 'The token will be removed from this device. Your data stays on GitHub.',
  'Canale aggiunto': 'Channel added', 'Canale rimosso': 'Channel removed', 'Statistiche aggiornate': 'Stats updated', 'Backup ripristinato': 'Backup restored',
  'Impostazioni ripristinate': 'Settings reset', 'YouTube Studio sbloccato': 'YouTube Studio unlocked', 'YouTube Studio bloccato': 'YouTube Studio locked',
  'Canale fissato in alto': 'Channel pinned to top', 'Canale tolto dai fissati': 'Channel unpinned',
  'Scrivi un link o il nome del canale.': 'Type a link or the channel name.', 'Usa il link del canale (youtube.com/@nome), non di un video.': 'Use the channel link (youtube.com/@name), not a video link.',
  'Usa il link del profilo (tiktok.com/@nome).': 'Use the profile link (tiktok.com/@name).', 'Nome canale non valido.': 'Invalid channel name.',
  'Per "Altro" serve un link completo (https://…).': '"Other" needs a full link (https://…).', 'Questo canale è già nella lista.': 'This channel is already in the list.',
  'Token non valido o scaduto.': 'Invalid or expired token.', 'Repository non trovato (o il token non ha accesso).': 'Repository not found (or the token has no access).',
  'Il token non ha il permesso di scrittura.': "The token doesn't have write permission.", 'Questo repository non contiene Vyral (manca data/channels.json).': "This repository doesn't contain Vyral (data/channels.json is missing).",
  'Connessione non riuscita.': 'Connection failed.', 'Salvataggio non riuscito: riprova.': 'Saving failed: try again.', 'Aggiornamento non riuscito.': 'Update failed.',
  'Workflow non trovato: hai attivato GitHub Actions?': 'Workflow not found: did you enable GitHub Actions?', "L'aggiornamento ci sta mettendo troppo.": 'The update is taking too long.',
  "L'aggiornamento su GitHub è fallito: apri la scheda Actions per i dettagli.": 'The update on GitHub failed: open the Actions tab for details.',
  'Sei in modalità solo visione: accedi col token per modificare.': "You're in view-only mode: sign in with the token to make changes.",
  'Repository non trovato o senza Vyral.': 'Repository not found or without Vyral.', 'Scrivi utente e repository.': 'Type user and repository.',
  'Incolla il token, oppure entra solo per guardare.': 'Paste the token, or enter in view-only mode.', 'File non valido.': 'Invalid file.',
  'Canale non trovato: controlla il nome o il link.': 'Channel not found: check the name or the link.', 'Nessun video trovato su questo canale.': 'No videos found on this channel.',
  'YouTube ha bloccato il server (anti-bot). Aggiorna dal programma per PC.': 'YouTube blocked the server (anti-bot). Refresh from the PC app.',
  'TikTok ha bloccato la richiesta: riprova più tardi o aggiorna dal PC.': 'TikTok blocked the request: try later or refresh from your PC.',
  'TikTok non ha restituito video (succede ogni tanto con i server di GitHub). Riprova più tardi o premi Aggiorna dal programma per PC.': "TikTok didn't return any videos (it happens now and then with GitHub's servers). Try later or press Refresh in the PC app.",
  'Ho trovato i video ma TikTok non ha permesso di leggerli. Riprova più tardi o premi Aggiorna dal programma per PC.': 'I found the videos but TikTok did not allow reading them. Try later or press Refresh in the PC app.',
  'Nessun video trovato (profilo privato o richiesta bloccata).': 'No videos found (private profile or blocked request).',
  // login
  'Benvenuto su Vyral': 'Welcome to Vyral', 'Il tuo account è il tuo repository GitHub:': 'Your account is your GitHub repository:', 'stessi canali e impostazioni su PC e telefono.': 'same channels and settings on PC and phone.',
  'Utente GitHub': 'GitHub user', 'Token di accesso': 'Access token', 'Accedi': 'Sign in', 'Verifico…': 'Checking…', 'Come ottengo il token?': 'How do I get the token?',
  'Apri': 'Open', 'questa pagina di GitHub': 'this GitHub page', 'Nome:': 'Name:', '. Scadenza: quella che preferisci.': '. Expiration: whatever you prefer.',
  'In': 'In', 'scegli': 'choose', '→ il tuo repo Vyral.': '→ your Vyral repo.', 'metti': 'set', 'e': 'and', 'su': 'to', 'Premi': 'Press',
  ', copialo e incollalo qui. Fallo su ogni dispositivo una volta sola.': ', copy it and paste it here. Do it once on each device.',
  'oppure': 'or', 'Entra solo per guardare (senza token)': 'Enter in view-only mode (no token)', 'Prova la demo': 'Try the demo', 'Carico i tuoi dati…': 'Loading your data…', 'es. giqmmq': 'e.g. giqmmq', 'Mostra': 'Show',
  // studio
  'Andamento': 'Trend', 'Ore': 'Hours', 'Iscritti': 'Subscribers', 'Guadagni': 'Revenue', 'Visualizzazioni': 'Views', 'Ore di visualizzazione': 'Watch time (hours)',
  'Durata media': 'Avg view duration', 'Impression': 'Impressions', 'CTR impression': 'Impressions CTR', 'Guadagni stimati': 'Estimated revenue', 'canale non monetizzato': 'channel not monetized',
  'volte che la miniatura è stata mostrata': 'times the thumbnail was shown', 'click sulla miniatura': 'thumbnail clicks',
  'Da dove arrivano': 'Traffic sources', 'Paesi': 'Countries', 'Pubblico': 'Audience', 'Dispositivi e iscritti': 'Devices and subscribers', 'Uomini': 'Men', 'Donne': 'Women', '👨 Uomini': '👨 Men',
  'Non iscritti': 'Not subscribed', 'Telefono': 'Phone', 'Computer': 'Computer', 'Tablet': 'Tablet', 'TV': 'TV', 'Console': 'Console',
  'Ricerca YouTube': 'YouTube search', 'Video suggeriti': 'Suggested videos', 'Home e feed': 'Browse features', 'Feed Shorts': 'Shorts feed', 'Siti esterni': 'External',
  'Diretto / sconosciuto': 'Direct / unknown', 'Playlist': 'Playlists', 'Notifiche': 'Notifications', 'Pagina del canale': 'Channel pages', 'Schermate finali': 'End screens', 'Altre pagine YouTube': 'Other YouTube features', 'Hashtag': 'Hashtags',
  'Ultimi caricati': 'Latest uploads', 'Iscritti +': 'Subs +', '% vista': '% viewed', 'CTR': 'CTR', 'Nessun dato.': 'No data.', 'Nessun dato nel periodo.': 'No data in this period.',
  'YouTube Studio non è ancora collegato': 'YouTube Studio is not connected yet', 'Apri la guida': 'Open the guide', 'I dati del tuo canale sono cifrati.': "Your channel's data is encrypted.",
  'Inserisci la password che hai scelto durante la configurazione.': 'Enter the password you chose during setup.', 'Password': 'Password', 'Sblocco…': 'Unlocking…',
  'Password sbagliata.': 'Wrong password.', 'Si inserisce una volta per dispositivo.': 'You enter it once per device.', 'La password salvata non è più valida.': 'The saved password is no longer valid.',
  'Nessun canale': 'No channels', 'Durata media di visualizzazione (YouTube Studio)': 'Average view duration (YouTube Studio)', 'Percentuale media visualizzata (YouTube Studio)': 'Average percentage viewed (YouTube Studio)',
  'CTR delle impression (YouTube Studio)': 'Impressions CTR (YouTube Studio)', 'Iscritti ottenuti con questo video (YouTube Studio)': 'Subscribers gained from this video (YouTube Studio)',
};

const GREET = { 'Buongiorno': 'Good morning', 'Buon pomeriggio': 'Good afternoon', 'Buonasera': 'Good evening', 'Notte fonda': 'Late night' };
const N = '([\\d.,]+\\s?(?:[KMB]|Mln|Mrd|mila)?)';
const PAT = [
  [/^(Buongiorno|Buon pomeriggio|Buonasera|Notte fonda)(.*)$/, (m, a, b) => GREET[a] + b.replace('! Iniziamo?', '! Shall we start?')],
  [/^Aggiornato (.+)$/, (m, a) => 'Updated ' + tr(a)],
  [/^Aggiornato, ma (\d+) canali hanno dato errore$/, (m, a) => `Updated, but ${a} channels returned an error`],
  [/^(\d+) min fa$/, (m, a) => `${a} min ago`], [/^(\d+) h fa$/, (m, a) => `${a}h ago`], [/^(\d+) g fa$/, (m, a) => `${a}d ago`],
  [/^Ecco come stanno andando i tuoi (\d+) canali\.$/, (m, a) => `Here is how your ${a} channels are doing.`],
  [new RegExp('^' + N + ' (canale|canali) · ' + N + ' video$'), (m, a, b, c) => `${a} ${b === 'canale' ? 'channel' : 'channels'} · ${c} videos`],
  [new RegExp('^' + N + ' (canale|canali) · ' + N + ' views sugli ultimi video$'), (m, a, b, c) => `${a} ${b === 'canale' ? 'channel' : 'channels'} · ${c} views on latest videos`],
  [new RegExp('^·? ?' + N + ' (canale|canali)$'), (m, a, b) => `${m.startsWith('·') ? '· ' : ''}${a} ${b === 'canale' ? 'channel' : 'channels'}`],
  [new RegExp('^' + N + ' video analizzati$'), (m, a) => `${a} videos analyzed`],
  [new RegExp('^' + N + ' like · ' + N + ' commenti$'), (m, a, b) => `${a} likes · ${b} comments`],
  [new RegExp('^' + N + ' minuti$'), (m, a) => `${a} minutes`],
  [/^(.+)% del video$/, (m, a) => `${a}% of the video`], [/^(.+)% delle views$/, (m, a) => `${a}% of views`],
  [/^(.+) anni$/, (m, a) => `${a} years`], [/^(\d+) giorni$/, (m, a) => `${a} days`], [/^Più visti \((\d+) g\)$/, (m, a) => `Most viewed (${a}d)`],
  [/^(🔥 )?(.+)× media$/, (m, a, b) => `${a || ''}${b}× avg`],
  [/^(Commenti|Mi piace|Visualizzazioni|Salvataggi|Condivisioni): (.+)$/, (m, a, b) => ({ Commenti: 'Comments', 'Mi piace': 'Likes', Visualizzazioni: 'Views', Salvataggi: 'Saves', Condivisioni: 'Shares' }[a] + ': ' + b)],
  [new RegExp('^' + N + ' views totali del canale$'), (m, a) => `${a} total channel views`],
  [new RegExp('^\\+' + N + ' nelle ultime 24h$'), (m, a) => `+${a} in the last 24h`],
  [new RegExp('^\\+' + N + ' iscritti$'), (m, a) => `+${a} subs`], [/^(\S+) medi$/, (m, a) => `${a} avg`], [/^(\d+)% visto$/, (m, a) => `${a}% viewed`],
  [/^Incolla qui sopra il link di un canale per vedere le statistiche dei suoi ultimi (\d+) video\.$/, (m, a) => `Paste a channel link above to see the stats of its latest ${a} videos.`],
  [/^Nessun canale (.+)$/, (m, a) => `No ${a} channels`], [/^Aggiungi su (.+)$/, (m, a) => `Add on ${a}`], [/^Aggiunto in (.+)$/, (m, a) => `Added to ${a}`],
  [/^(.+) aggiunto$/, (m, a) => `${a} added`], [/^Nascondere (.+)\?$/, (m, a) => `Hide ${a}?`],
  [/^I suoi (\d+) canali restano salvati: li ritrovi se lo riaggiungi\.$/, (m, a) => `Its ${a} channels stay saved: you'll find them again if you add it back.`],
  [/^(.+) sparirà da Vyral su tutti i tuoi dispositivi\.$/, (m, a) => `${a} will disappear from Vyral on all your devices.`],
  [/^Verranno caricati (\d+) canali e le impostazioni del file\.$/, (m, a) => `${a} channels and the file's settings will be loaded.`],
  [/^(.+) · (.+) iscritti · (.+) video · dati fino al (.+)$/, (m, a, b, c, d) => `${a} · ${b} subscribers · ${c} videos · data up to ${d}`],
  [/^YouTube Studio fornisce i dati con 1–3 giorni di ritardo · aggiornati (.+)$/, (m, a) => `YouTube Studio provides data with a 1–3 day delay · updated ${tr(a)}`],
  [/^Alcuni report non sono disponibili: (.+)$/, (m, a) => `Some reports are not available: ${a}`],
  [/^Ultimo aggiornamento fallito \((.+)\): mostro i dati precedenti\.$/, (m, a) => `Last update failed (${tr(a)}): showing previous data.`],
  [/^(\d+) canali$/, (m, a) => `${a} channels`], [/^aggiornato (.+)$/, (m, a) => 'updated ' + tr(a)],
  [/^Al prossimo aggiornamento Vyral raccoglie fino a (\d+) video di questo canale\.$/, (m, a) => `On the next update Vyral will collect up to ${a} videos from this channel.`], [/^(\d+) video$/, (m, a) => `${a} videos`],
  [/^(.+ · .+)$/, m => m.split(' · ').map(x => tr(x)).join(' · ')],
];

function tr(s) {
  if (I18N.lang === 'it' || !s) return s;
  const core = s.trim();
  if (!core) return s;
  const pre = s.slice(0, s.indexOf(core)), post = s.slice(s.indexOf(core) + core.length);
  let out = EN[core];
  if (out === undefined) {
    const arrow = core.match(/^(.+?)( [↓↑])$/);
    if (arrow && EN[arrow[1]] !== undefined) out = EN[arrow[1]] + arrow[2];
  }
  if (out === undefined) for (const [re, fn] of PAT) { const m = core.match(re); if (m) { try { out = fn(...m); } catch { } break; } }
  return out === undefined ? s : pre + out + post;
}
const SKIP = '.vt,.tt,.ht,.ch-name,script,style,textarea';
function translateTree(root) {
  if (I18N.lang === 'it' || !root) return;
  if (root.nodeType === 3) { const p = root.parentElement; if (p && !p.closest(SKIP)) { const t = tr(root.nodeValue); if (t !== root.nodeValue) root.nodeValue = t; } return; }
  if (root.nodeType !== 1 || root.closest?.(SKIP)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; const list = [];
  while ((n = w.nextNode())) list.push(n);
  for (const t of list) { if (t.parentElement?.closest(SKIP)) continue; const v = tr(t.nodeValue); if (v !== t.nodeValue) t.nodeValue = v; }
  const els = root.querySelectorAll ? [root, ...root.querySelectorAll('[placeholder],[title]')] : [];
  for (const e of els) {
    if (e.placeholder) { const v = tr(e.placeholder); if (v !== e.placeholder) e.placeholder = v; }
    if (e.title && !e.closest(SKIP)) { const v = tr(e.title); if (v !== e.title) e.title = v; }
  }
}
const i18nObserver = new MutationObserver(muts => {
  if (I18N.lang === 'it') return;
  for (const m of muts) {
    if (m.type === 'characterData') translateTree(m.target);
    else m.addedNodes.forEach(translateTree);
  }
});
function setLang(l) {
  I18N.lang = LANGS[l] ? l : 'it';
  try { localStorage.setItem('vyral.lang', JSON.stringify(I18N.lang)); } catch { }
  document.documentElement.lang = I18N.lang;
  document.title = tr(document.title);
}
document.addEventListener('DOMContentLoaded', () => {
  i18nObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  document.documentElement.lang = I18N.lang;
  translateTree(document.body);
});
