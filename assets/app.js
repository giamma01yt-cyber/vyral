/* ============================================================
   VYRAL — app
   Dati salvati nel tuo repository GitHub (data/*.json):
   stesso account su PC e telefono.
   ============================================================ */
'use strict';

/* ---------------- utility ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let nfC, nfF;
function mkNF() { nfC = new Intl.NumberFormat(LOC(), { notation: 'compact', maximumFractionDigits: 1 }); nfF = new Intl.NumberFormat(LOC()); }
mkNF();
const fmt = n => n == null || !isFinite(n) ? '—' : nfC.format(n);
const full = n => n == null ? 'n/d' : nfF.format(n);
const pct = n => n == null || !isFinite(n) ? '—' : (n * 100).toLocaleString(LOC(), { maximumFractionDigits: n < .1 ? 2 : 1 }) + '%';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function ago(ts) {
  if (!ts) return '—';
  const s = Date.now() / 1000 - ts;
  if (s < 60) return 'adesso';
  if (s < 3600) return Math.round(s / 60) + ' min fa';
  if (s < 86400) return Math.round(s / 3600) + ' h fa';
  if (s < 86400 * 30) return Math.round(s / 86400) + ' g fa';
  return new Date(ts * 1000).toLocaleDateString(LOC(), { day: 'numeric', month: 'short', year: 'numeric' });
}
function dur(s) {
  if (!s) return '';
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`;
}
const b64enc = str => { const b = new TextEncoder().encode(str); let s = ''; b.forEach(x => s += String.fromCharCode(x)); return btoa(s); };
const b64dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0)));
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
const LS = {
  get(k, d) { try { const v = localStorage.getItem('vyral.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('vyral.' + k, JSON.stringify(v)); } catch { } },
  del(k) { try { localStorage.removeItem('vyral.' + k); } catch { } },
};

/* ---------------- icone ---------------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  ref: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>',
  ext: '<path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  msg: '<path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.8A8.4 8.4 0 1 1 21 11.5z"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
  save: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  trend: '<path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.2 1.5 1.2 2.7 2.5 2.7z"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  pin: '<path d="M12 17v5M9 10.8V5h6v5.8l2.6 2.7a1 1 0 0 1-.7 1.7H7.1a1 1 0 0 1-.7-1.7z"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2a5.6 5.6 0 0 0 5.5-5.6C22 6 17.5 2 12 2z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  share2: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M3 21v-5h5"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  pc: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  gh: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-6.9a5.4 5.4 0 0 0-1.5-3.7 5 5 0 0 0-.1-3.8s-1.2-.3-3.9 1.5a13.4 13.4 0 0 0-7 0C6.3 1.8 5.1 2.1 5.1 2.1a5 5 0 0 0-.1 3.8 5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.5 6.4 6.9a3.4 3.4 0 0 0-.9 2.6V22"/>',
};
const ic = (n, s = 18, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
const LOGO_SVG = (s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M6 7.5l5.5 9 7-11.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 5h4.5v4.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* repository predefinito (il tuo): così basta incollare il token */
const DEFAULT_REPO = { owner: 'giamma01yt-cyber', repo: 'vyral' };

/* ---------------- social ---------------- */
const PLATFORMS = {
  youtube: {
    name: 'YouTube', c1: '#ff2d3d', c2: '#ff7a59', follow: 'iscritti', desc: 'Video lunghi e Shorts',
    ph: 'Link del canale o @nome', svg: '<path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/>',
    match: /youtube\.com|youtu\.be/i,
  },
  tiktok: {
    name: 'TikTok', c1: '#25f4ee', c2: '#fe2c55', follow: 'follower', desc: 'Video, condivisioni e salvataggi',
    ph: 'Link del profilo o @nome', svg: '<path fill="currentColor" d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.7V9.5a6.3 6.3 0 1 0 5.4 6.2V8.8a8.2 8.2 0 0 0 3.8 1.2z"/>',
    match: /tiktok\.com/i,
  },
  twitch: {
    name: 'Twitch', c1: '#9146ff', c2: '#d1b3ff', follow: 'follower', desc: 'Ultime live salvate (VOD)',
    ph: 'Link del canale o nome', svg: '<path fill="currentColor" d="M4 2 2.5 6v14h5v2.5h3L13 20h4l5-5V2zm16 12-3 3h-4.5l-2.5 2.5V17H6V4h14zM16 7.5h-2v5h2zm-5 0H9v5h2z"/>',
    match: /twitch\.tv/i,
  },
  kick: {
    name: 'Kick', c1: '#53fc18', c2: '#c6ff9e', follow: 'follower', desc: 'Ultimi VOD del canale',
    ph: 'Link del canale o nome', svg: '<path fill="currentColor" d="M3 3h6v4h2V5h2V3h8v6h-2v2h-2v2h2v2h2v6h-8v-2h-2v-2H9v4H3z"/>',
    match: /kick\.com/i,
  },
  other: {
    name: 'Altro', c1: '#94a3b8', c2: '#e2e8f0', follow: 'follower', desc: 'Qualsiasi link a una pagina di video supportata',
    ph: 'Link completo della pagina video', svg: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    match: null,
  },
};
const pIcon = (p, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24">${PLATFORMS[p]?.svg || ''}</svg>`;
const pVars = p => `--c1:${PLATFORMS[p].c1};--c2:${PLATFORMS[p].c2}`;

function detectPlatform(input) {
  for (const [k, p] of Object.entries(PLATFORMS)) if (p.match && p.match.test(input)) return k;
  return null;
}
function parseChannel(platform, raw, ytTab) {
  const s = (raw || '').trim();
  if (!s) throw new Error('Scrivi un link o il nome del canale.');
  const det = detectPlatform(s);
  if (det) platform = det;
  const now = Math.floor(Date.now() / 1000);
  const name = s.replace(/^@/, '');
  const okName = n => /^[\w.\-]+$/.test(n);
  if (platform === 'youtube') {
    let path;
    if (det) {
      const m = s.match(/youtube\.com\/(@[\w.\-]+|channel\/UC[\w\-]+|c\/[\w.\-]+|user\/[\w.\-]+)/i);
      if (!m) throw new Error('Usa il link del canale (youtube.com/@nome), non di un video.');
      path = m[1];
    } else {
      if (!okName(name)) throw new Error('Nome canale non valido.');
      path = '@' + name;
    }
    const handle = path.startsWith('@') ? path : path.split('/')[1];
    return { id: 'youtube:' + path.toLowerCase(), platform, handle, url: 'https://www.youtube.com/' + path, yt_tab: ytTab || 'both', added_at: now };
  }
  if (platform === 'tiktok') {
    const u = det ? (s.match(/tiktok\.com\/@([\w.\-]+)/i) || [])[1] : name;
    if (!u || !okName(u)) throw new Error('Usa il link del profilo (tiktok.com/@nome).');
    return { id: 'tiktok:' + u.toLowerCase(), platform, handle: '@' + u, url: 'https://www.tiktok.com/@' + u, added_at: now };
  }
  if (platform === 'twitch' || platform === 'kick') {
    const host = platform === 'twitch' ? 'twitch\\.tv' : 'kick\\.com';
    const u = det ? (s.match(new RegExp(host + '/([\\w\\-]+)', 'i')) || [])[1] : name;
    if (!u || !okName(u)) throw new Error('Nome canale non valido.');
    const base = platform === 'twitch' ? 'https://www.twitch.tv/' : 'https://kick.com/';
    return { id: platform + ':' + u.toLowerCase(), platform, handle: u, url: base + u, added_at: now };
  }
  let url;
  try { url = new URL(s); } catch { throw new Error('Per "Altro" serve un link completo (https://…).'); }
  const handle = (url.hostname.replace('www.', '') + url.pathname).replace(/\/$/, '').slice(0, 40);
  return { id: 'other:' + hash(url.href), platform: 'other', handle, url: url.href, list_url: url.href, added_at: now };
}

/* ---------------- impostazioni ---------------- */
const THEMES = {
  aurora: { n: 'Aurora', a1: '#8b7bff', a2: '#fe2c55' },
  neon: { n: 'Neon', a1: '#22d3ee', a2: '#a855f7' },
  sunset: { n: 'Tramonto', a1: '#ff7a3d', a2: '#ff2e88' },
  toxic: { n: 'Tossico', a1: '#a3ff12', a2: '#14b8a6' },
  ocean: { n: 'Oceano', a1: '#3b82f6', a2: '#06d6a0' },
  gold: { n: 'Oro', a1: '#ffd36b', a2: '#ff8a3d' },
  mono: { n: 'Mono', a1: '#e5e7eb', a2: '#6b7280' },
};
const METRICS = { views: ['Views', 'eye'], likes: ['Like', 'heart'], comments: ['Commenti', 'msg'], shares: ['Condivisioni', 'share'], saves: ['Salvataggi', 'save'], er: ['Engagement', 'bolt'], vph: ['Views/ora', 'clock'], growth: ['Crescita', 'trend'], spark: ['Grafico', 'chart'], studio: ['YouTube Studio', 'play'] };
const DEFAULT_SETTINGS = {
  name: '', theme: 'aurora', bg: 'aurora', oled: false, glow: true, animations: true, density: 'comfy', radius: 20,
  videos_per_channel: 3, hot_threshold: 1.3, yt_tab: 'both',
  metrics: Object.fromEntries(Object.keys(METRICS).map(k => [k, true])),
  platforms: ['youtube', 'tiktok'], auto_reload: 5, pinned: [], lang: '', catalog_size: 30,
};
const withDefaults = s => ({ ...DEFAULT_SETTINGS, ...(s || {}), metrics: { ...DEFAULT_SETTINGS.metrics, ...(s?.metrics || {}) } });

/* ============================================================
   BACKEND: GitHub (account = repository)
   ============================================================ */
class GitHubBackend {
  constructor(auth) { this.a = auth; this.sha = {}; }
  get kind() { return window.pywebview?.api?.refresh ? 'pc' : 'github'; }
  async req(path, opts = {}, raw = false) {
    const r = await fetch(`https://api.github.com/repos/${this.a.owner}/${this.a.repo}${path}`, {
      cache: 'no-store', ...opts,
      headers: { Authorization: 'Bearer ' + this.a.token, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
    });
    if (r.status === 401) throw new Error('Token non valido o scaduto.');
    return r;
  }
  async verify() {
    const r = await this.req('');
    if (r.status === 404) throw new Error('Repository non trovato (o il token non ha accesso).');
    const repo = await r.json();
    if (repo.permissions && !repo.permissions.push) throw new Error('Il token non ha il permesso di scrittura.');
    this.branch = repo.default_branch;
    const f = await this.req('/contents/data/channels.json');
    if (f.status === 404) throw new Error('Questo repository non contiene Vyral (manca data/channels.json).');
    return repo;
  }
  async getJSON(path, def) {
    const r = await this.req('/contents/' + path + '?t=' + Date.now());
    if (r.status === 404) return def;
    if (!r.ok) throw new Error('GitHub: errore ' + r.status);
    const j = await r.json();
    this.sha[path] = j.sha;
    if (!j.content && j.size > 0) { const rr = await this.req('/contents/' + path + '?t=' + Date.now(), {}, true); return rr.json(); }
    try { return JSON.parse(b64dec(j.content || '') || 'null') ?? def; } catch { return def; }
  }
  async putJSON(path, data, msg) {
    for (let i = 0; i < 4; i++) {
      if (this.sha[path] === undefined) await this.getJSON(path, null);
      const r = await this.req('/contents/' + path, { method: 'PUT', body: JSON.stringify({ message: msg, content: b64enc(JSON.stringify(data, null, 2) + '\n'), sha: this.sha[path] || undefined }) });
      if (r.ok) { this.sha[path] = (await r.json()).content.sha; return; }
      if (r.status === 409 || r.status === 422) { delete this.sha[path]; await sleep(400 * (i + 1)); continue; }
      throw new Error('Salvataggio non riuscito (' + r.status + ')');
    }
    throw new Error('Salvataggio non riuscito: riprova.');
  }
  async load() {
    const [c, s, st] = await Promise.all([
      this.getJSON('data/channels.json', { channels: [] }),
      this.getJSON('data/settings.json', {}),
      this.getJSON('data/stats.json', { channels: {} }),
    ]);
    const studio = await this.getJSON('data/studio.enc.json', null).catch(() => null);
    return { channels: c.channels || [], settings: s, stats: st || { channels: {} }, studio };
  }
  async loadStats() { return this.getJSON('data/stats.json', { channels: {} }); }
  saveChannels(list) { return this.putJSON('data/channels.json', { channels: list }, 'Vyral: canali aggiornati'); }
  saveSettings(s) { return this.putJSON('data/settings.json', s, 'Vyral: impostazioni'); }
  async refresh(onStatus) {
    if (this.kind === 'pc') {
      onStatus?.('Il tuo PC sta scaricando i dati…');
      const res = await window.pywebview.api.refresh(this.a);
      if (!res || res.error) throw new Error(res?.error || 'Aggiornamento non riuscito.');
      return this.loadStats();
    }
    const wf = '/actions/workflows/update-stats.yml';
    const t0 = Date.now() - 5000;
    const d = await this.req(wf + '/dispatches', { method: 'POST', body: JSON.stringify({ ref: this.branch || 'main' }) });
    if (d.status === 404) throw new Error('Workflow non trovato: hai attivato GitHub Actions?');
    if (!d.ok) throw new Error('Non riesco ad avviare l\'aggiornamento (' + d.status + ').');
    onStatus?.('In coda su GitHub…');
    const end = Date.now() + 15 * 60 * 1000;
    while (Date.now() < end) {
      await sleep(5000);
      const r = await this.req(wf + '/runs?per_page=3&event=workflow_dispatch');
      if (!r.ok) continue;
      const run = (await r.json()).workflow_runs?.find(x => new Date(x.created_at).getTime() >= t0);
      if (!run) continue;
      if (run.status !== 'completed') { onStatus?.(run.status === 'in_progress' ? 'GitHub sta scaricando i dati…' : 'In coda su GitHub…'); continue; }
      if (run.conclusion !== 'success') throw new Error('L\'aggiornamento su GitHub è fallito: apri la scheda Actions per i dettagli.');
      await sleep(1500);
      return this.loadStats();
    }
    throw new Error('L\'aggiornamento ci sta mettendo troppo.');
  }
}

/* Solo visione: legge i dati pubblici del repository, senza token */
class ViewBackend {
  constructor(auth) { this.a = auth; this.kind = 'view'; }
  async raw(path, def) {
    const r = await fetch(`https://raw.githubusercontent.com/${this.a.owner}/${this.a.repo}/main/${path}?t=${Date.now()}`, { cache: 'no-store' });
    if (r.status === 404) return def;
    if (!r.ok) throw new Error('Non riesco a leggere il repository (' + r.status + ').');
    return r.json();
  }
  async verify() { const c = await this.raw('data/channels.json', null); if (!c) throw new Error('Repository non trovato o senza Vyral.'); }
  async load() {
    const [c, s, st, studio] = await Promise.all([this.raw('data/channels.json', { channels: [] }), this.raw('data/settings.json', {}), this.raw('data/stats.json', { channels: {} }), this.raw('data/studio.enc.json', null).catch(() => null)]);
    return { channels: c.channels || [], settings: s, stats: st || { channels: {} }, studio };
  }
  loadStats() { return this.raw('data/stats.json', { channels: {} }); }
  ro() { throw new Error('Sei in modalità solo visione: accedi col token per modificare.'); }
  async saveChannels() { this.ro(); }
  async saveSettings() { /* le preferenze restano su questo dispositivo */ LS.set('viewSettings', S.settings); }
  async refresh() { this.ro(); }
}

/* Demo: nessun account, dati finti salvati nel browser */
class DemoBackend {
  constructor() { this.kind = 'demo'; }
  async load() {
    let d = LS.get('demo');
    if (!d) {
      const now = Math.floor(Date.now() / 1000);
      const ch = [['youtube', '@Bryzee6'], ['youtube', '@GiqmmqClips'], ['tiktok', '@giqmmq'], ['tiktok', '@lqrisfn'], ['twitch', 'giqmmq']].map(([p, h]) => ({ ...parseChannel(p, h), added_at: now }));
      d = { channels: ch, settings: { ...DEFAULT_SETTINGS, name: 'Gian Maria', platforms: ['youtube', 'tiktok', 'twitch'] }, stats: { channels: {} } };
      d.stats = this.gen(d.channels, d.settings, null);
      LS.set('demo', d);
    }
    return { ...d, studio: { plain: studioDemo() } };
  }
  async loadStats() { return LS.get('demo').stats; }
  async saveChannels(list) { const d = LS.get('demo'); d.channels = list; LS.set('demo', d); }
  async saveSettings(s) { const d = LS.get('demo'); d.settings = s; LS.set('demo', d); }
  async refresh(onStatus) {
    onStatus?.('Scarico i dati (demo)…');
    await sleep(1800);
    const d = LS.get('demo');
    d.stats = this.gen(d.channels, withDefaults(d.settings), d.stats);
    LS.set('demo', d);
    return d.stats;
  }
  gen(channels, settings, prev) {
    const titles = ['Ho provato la mappa 1v1 più difficile di Fortnite', 'Red vs Blue ma ogni kill vale doppio', 'Il mio livello sale troppo velocemente…', 'Nuovo update della mappa! Codice in bio', 'Box fight 1v1 contro un pro', 'Ho raggiunto il livello 200 in un giorno', 'La mappa più giocata della settimana', 'Reazione al nuovo aggiornamento di Fortnite'];
    const now = Math.floor(Date.now() / 1000), out = {};
    for (const ch of channels) {
      const old = prev?.channels?.[ch.id];
      let seed = parseInt(hash(ch.id), 36) % 100000;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const base = [4000, 30000, 220000, 1400000][Math.floor(rnd() * 4)];
      const vert = ch.platform !== 'youtube' || rnd() > .4;
      const videos = [];
      for (let i = 0; i < settings.videos_per_channel; i++) {
        const id = 'd' + hash(ch.id + i);
        const ov = old?.videos?.find(v => v.id === id);
        const ageH = (i * 40 + 6 + rnd() * 30);
        const views = ov ? Math.round(ov.views * (1 + Math.random() * .08)) : Math.round(base * (.3 + rnd() * 1.9));
        const likes = Math.round(views * (.02 + rnd() * .1));
        const hist = ov?.history ? [...ov.history, [now, views]].slice(-72) : Array.from({ length: 14 }, (_, k) => [now - (13 - k) * 3600 * 3, Math.round(views * Math.pow((k + 1) / 14, .6 + rnd()))]);
        videos.push({
          id, title: titles[Math.floor(rnd() * titles.length)], url: ch.url,
          thumbnail: `https://picsum.photos/seed/${id}/${vert ? '360/640' : '640/360'}`,
          timestamp: now - Math.round(ageH * 3600), duration: vert ? 15 + Math.round(rnd() * 45) : 240 + Math.round(rnd() * 700),
          views, likes, comments: Math.round(likes * (.03 + rnd() * .12)),
          shares: ch.platform === 'tiktok' ? Math.round(likes * (.02 + rnd() * .2)) : null,
          saves: ch.platform === 'tiktok' ? Math.round(likes * (.03 + rnd() * .1)) : null,
          is_short: vert, history: hist,
        });
      }
      out[ch.id] = { channel: { name: ch.handle.replace('@', '').replace(/([a-z])([A-Z])/g, '$1 $2'), followers: Math.round(base * (2 + rnd() * 12)), avatar: null, url: ch.url }, videos, fetched_at: now };
    }
    const catalog = {};
    for (const ch of channels) {
      const base = out[ch.id].videos[0]?.views || 5000, vert = ch.platform !== 'youtube';
      const titles = ['Ho provato la mappa 1v1 più difficile', 'Red vs Blue ma ogni kill vale doppio', 'Il mio livello sale troppo velocemente', 'Nuovo update della mappa!', 'Box fight 1v1 contro un pro', 'Livello 200 in un giorno', 'La mappa più giocata', 'Reazione al nuovo aggiornamento', 'XP glitch ancora funzionante', 'Pirate Shop Access gratis'];
      const extra = Array.from({ length: Math.max(0, settings.catalog_size - 3) }, (_, i) => {
        const v = Math.round(base * (0.15 + ((i * 37) % 100) / 60));
        return { id: 'c' + hash(ch.id + i), title: titles[i % titles.length] + (i > 9 ? ' #' + i : ''), url: ch.url, thumbnail: `https://picsum.photos/seed/c${hash(ch.id + i)}/${vert ? '360/640' : '640/360'}`,
          timestamp: now - (i + 3) * 86400 * 2, duration: vert ? 20 + i : 300 + i * 10, views: v, likes: ch.platform === 'youtube' && i % 2 ? null : Math.round(v * .06), comments: Math.round(v * .004), is_short: vert };
      });
      catalog[ch.id] = { updated_at: now, videos: [...out[ch.id].videos.map(({ history, ...x }) => x), ...extra] };
    }
    return { updated_at: now, source: 'demo', channels: out, catalog };
  }
}

/* ============================================================
   STATO
   ============================================================ */
const S = {
  backend: null, auth: null,
  channels: [], settings: withDefaults(), stats: { channels: {} },
  busy: false, busyMsg: '', lastError: null, saving: 0,
  sort: { k: 'timestamp', d: -1 }, q: '', filterCh: 'all', filterP: 'all',
  route: { name: 'home' },
};

/* statistiche derivate */
function enrich(entry, thr) {
  if (!entry?.videos) return entry;
  const vids = entry.videos;
  const vw = vids.filter(v => v.views != null);
  const avg = vw.length ? vw.reduce((a, v) => a + v.views, 0) / vw.length : null;
  const now = Date.now() / 1000;
  for (const v of vids) {
    const inter = (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0);
    v.er = v.views ? inter / v.views : null;
    v.likeRate = v.views && v.likes != null ? v.likes / v.views : null;
    const hrs = v.timestamp ? Math.max((now - v.timestamp) / 3600, 1) : null;
    v.vph = v.views != null && hrs ? v.views / hrs : null;
    v.perf = avg && v.views != null && vw.length > 1 ? v.views / avg : null;
    v.hot = v.perf != null && v.perf >= thr;
    const h = v.history || [];
    v.delta = h.length > 1 ? h[h.length - 1][1] - h[h.length - 2][1] : null;
    const dayAgo = h.find(p => p[0] >= now - 86400 - 1800);
    v.delta24 = h.length > 1 && dayAgo && dayAgo !== h[h.length - 1] ? h[h.length - 1][1] - dayAgo[1] : null;
    const span = dayAgo ? h[h.length - 1][0] - dayAgo[0] : 0;
    v.deltaLbl = span >= 20 * 3600 ? 'in 24h' : span >= 3600 ? `in ${Math.round(span / 3600)}h` : `in ${Math.max(1, Math.round(span / 60))} min`;
  }
  const avgOf = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  entry.agg = { avgViews: avg, totViews: vw.reduce((a, v) => a + v.views, 0), avgER: avgOf(vids.map(v => v.er).filter(x => x != null)), avgVph: avgOf(vids.map(v => v.vph).filter(x => x != null)) };
  return entry;
}
const entryOf = id => S.stats.channels?.[id];
function allVideos(platform) {
  const out = [];
  for (const ch of S.channels) {
    if (platform && platform !== 'all' && ch.platform !== platform) continue;
    const d = entryOf(ch.id);
    for (const v of d?.videos || []) out.push({ ...v, ch, chName: d.channel?.name || ch.handle });
  }
  return out;
}
const isPinned = id => (S.settings.pinned || []).includes(id);
const pinRank = id => { const i = (S.settings.pinned || []).indexOf(id); return i < 0 ? 1e9 : i; };
const chOf = p => S.channels.filter(c => c.platform === p).sort((a, b) => pinRank(a.id) - pinRank(b.id));

/* ============================================================
   UI helpers: toast, modale, animazioni
   ============================================================ */
function toast(msg, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.innerHTML = `<span class="ti">${ic(err ? 'x' : 'check', 15, 2.6)}</span><span>${esc(msg)}</span>`;
  $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, err ? 4500 : 2600);
}
function modal(html, onMount) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal glass">${html}</div>`;
  const close = () => { bg.style.animation = 'fadein .2s reverse both'; setTimeout(() => bg.remove(), 200); };
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  document.body.append(bg);
  onMount?.(bg, close);
  return close;
}
function confirmBox(title, text, okLabel = 'Conferma', danger = true) {
  return new Promise(res => {
    modal(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="btn ghost" data-close>Annulla</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button></div>`,
      (bg, close) => { bg.querySelector('[data-ok]').onclick = () => { close(); res(true); }; bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) res(false); }); });
  });
}
function countUp(root = document) {
  const anim = S.settings.animations;
  $$('[data-count]', root).forEach(el => {
    const to = parseFloat(el.dataset.count), kind = el.dataset.kind || 'n', suf = el.dataset.suf || '';
    const f = v => (kind === 'p' ? pct(v) : fmt(v)) + suf;
    if (!anim || !isFinite(to)) { el.textContent = isFinite(to) ? f(to) : '—'; return; }
    const t0 = performance.now(), D = 1100;
    const step = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(2, -10 * k); el.textContent = f(kind === 'p' ? to * e : Math.round(to * e)); if (k < 1) requestAnimationFrame(step); else el.textContent = f(to); };
    requestAnimationFrame(step);
  });
}
const cnt = (v, kind = 'n', suf = '') => v == null || !isFinite(v) ? '—' : `<span data-count="${v}" data-kind="${kind}" data-suf="${suf}">0</span>`;
function initSegs(root = document) {
  $$('.seg', root).forEach(seg => {
    let pill = seg.querySelector('.seg-pill');
    if (!pill) { pill = document.createElement('span'); pill.className = 'seg-pill'; seg.prepend(pill); }
    const on = seg.querySelector('button.on');
    if (on) { pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px'; pill.style.opacity = 1; } else pill.style.opacity = 0;
  });
}
document.addEventListener('pointermove', e => {
  const c = e.target.closest?.('.glow-card');
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

function spark(hist) {
  if (!hist || hist.length < 2) return '';
  const W = 74, H = 34, xs = hist.map(p => p[0]), ys = hist.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pts = hist.map(([x, y]) => [((x - x0) / (x1 - x0 || 1)) * W, H - 3 - ((y - y0) / (y1 - y0 || 1)) * (H - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" style="color:var(--c1)"><path class="f" d="${d} L${W} ${H} L0 ${H}Z"/><path class="l" d="${d}"/><circle cx="${last[0]}" cy="${last[1]}" r="2.6"/></svg>`;
}
function avatar(ch, d) {
  if (d?.channel?.avatar) return `<div class="avatar"><img src="${esc(d.channel.avatar)}" referrerpolicy="no-referrer" alt=""></div>`;
  const name = (d?.channel?.name || ch.handle).replace('@', '');
  return `<div class="avatar" style="background:linear-gradient(135deg,var(--c1),var(--c2))">${esc(name[0]?.toUpperCase() || '?')}</div>`;
}
const imgTag = (src, cls = '') => src ? `<img ${cls ? `class="${cls}"` : ''} src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer" alt="" onerror="this.style.opacity=0">` : `<div class="noimg"></div>`;

/* ---------------- tema ---------------- */
function applyLang(l) {
  if (!l || l === I18N.lang) return false;
  setLang(l); mkNF(); return true;
}
function applySettings() {
  const s = S.settings, t = THEMES[s.theme] || THEMES.aurora, b = document.body, r = document.documentElement.style;
  r.setProperty('--a1', t.a1); r.setProperty('--a2', t.a2); r.setProperty('--r', s.radius + 'px');
  b.dataset.bg = s.bg;
  b.classList.toggle('oled', !!s.oled);
  b.classList.toggle('glow', !!s.glow);
  b.classList.toggle('no-anim', !s.animations);
  b.classList.toggle('compact', s.density === 'compact');
  b.classList.toggle('ro', S.backend?.kind === 'view');
  $('meta[name="theme-color"]').content = s.oled ? '#000000' : '#07070c';
}
function setPageColor(p) {
  const r = document.documentElement.style, pl = PLATFORMS[p];
  r.setProperty('--p1', pl ? pl.c1 : 'var(--a1)');
  r.setProperty('--p2', pl ? pl.c2 : 'var(--a2)');
}

/* ---------------- salvataggio impostazioni (debounce) ---------------- */
let saveT = null;
function saveSettingsSoon() {
  applySettings();
  showSave('Salvataggio…');
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    try { await S.backend.saveSettings(S.settings); showSave('Sincronizzato', true); }
    catch (e) { showSave(''); toast(e.message, true); }
  }, 900);
}
function showSave(t, ok) {
  const el = $('#saveInd');
  if (!el) return;
  if (!t) { el.classList.remove('show'); return; }
  el.innerHTML = ok ? `<span style="color:var(--ok)">${ic('check', 14, 2.6)}</span>${t}` : `<span class="dot busy"></span>${t}`;
  el.classList.add('show');
  if (ok) { clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2200); }
}

/* ============================================================
   ROUTER
   ============================================================ */
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'p' && PLATFORMS[h[1]]) return { name: 'platform', p: h[1], tab: h[2] === 'tutti' ? 'all' : 'channels' };
  if (h[0] === 'tutti') return { name: 'all' };
  if (h[0] === 'studio') return { name: 'studio' };
  if (h[0] === 'c' && h[1]) return { name: 'channel', id: decodeURIComponent(h[1]) };
  if (h[0] === 'impostazioni') return { name: 'settings' };
  return { name: 'home' };
}
const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };
window.addEventListener('hashchange', () => { S.route = parseRoute(); S.q = ''; S.filterCh = 'all'; CH.q = ''; render(); window.scrollTo({ top: 0, behavior: S.settings.animations ? 'smooth' : 'auto' }); });

/* ============================================================
   SHELL (sidebar + topbar + bottom nav)
   ============================================================ */
function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'Notte fonda' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
}
function syncText() {
  if (S.busy) return `<div class="row"><span class="dot busy"></span><b>${esc(S.busyMsg || 'Aggiornamento…')}</b></div><div class="progress"><i></i></div>`;
  const st = S.stats;
  const src = { github: 'GitHub', pc: 'il tuo PC', demo: 'demo' }[st.source] || '—';
  if (S.lastError) return `<div class="row"><span class="dot err"></span><b>Errore</b></div><div style="margin-top:6px;line-height:1.4">${esc(S.lastError)}</div>`;
  return `<div class="row"><span class="dot"></span><b>${st.updated_at ? 'Aggiornato ' + ago(st.updated_at) : 'Mai aggiornato'}</b></div><div style="margin-top:4px">${st.updated_at ? 'Dati da ' + src : 'Premi Aggiorna per iniziare'}</div>`;
}
function renderShell() {
  const r = S.route, s = S.settings;
  const navP = s.platforms.filter(p => PLATFORMS[p]);
  const item = (href, on, icon, label, extra = '', color) => `<a class="nav-item ${on ? 'on' : ''}" href="${href}" data-color="${color || ''}"><span class="ni">${icon}</span>${label}${extra}</a>`;
  const initials = (s.name || S.auth?.owner || 'V')[0].toUpperCase();
  $('#app').innerHTML = `
  <aside class="sidebar">
    <div class="brand"><div class="logo">${LOGO_SVG(22)}</div><div><b>Vyral</b><small>${{ demo: 'Modalità demo', pc: 'Programma per PC', view: 'Solo visione' }[S.backend.kind] || 'Statistiche social'}</small></div></div>
    <nav class="nav" id="nav"><span class="nav-pill" id="navPill"></span>
      ${item('#/', r.name === 'home', ic('home', 18), 'Home')}
      ${item('#/tutti', r.name === 'all', ic('grid', 18), 'Tutti i video', `<span class="cnt">${allVideos().length}</span>`)}
      <div class="nav-label">Social</div>
      ${navP.map(p => item('#/p/' + p, r.name === 'platform' && r.p === p, `<span style="color:${PLATFORMS[p].c1}">${pIcon(p, 18)}</span>`, PLATFORMS[p].name, `<span class="cnt">${chOf(p).length}</span>`, PLATFORMS[p].c1)
        + (p === 'youtube' ? item('#/studio', r.name === 'studio', `<span style="color:${PLATFORMS.youtube.c1}">${ic('chart', 17)}</span>`, 'YouTube Studio', studioOn() ? (STUDIO.data ? '' : `<span class="cnt">${ic('key', 11)}</span>`) : '<span class="cnt">nuovo</span>', PLATFORMS.youtube.c1).replace('class="nav-item', 'class="nav-item sub') : '')).join('')}
      <button class="nav-add" data-act="add-social">${ic('plus', 16, 2.4)}Aggiungi social</button>
    </nav>
    <div class="side-bottom">
      <div class="sync-card" id="syncCard">${syncText()}</div>
      ${item('#/impostazioni', r.name === 'settings', ic('gear', 18), 'Impostazioni')}
      <div class="me"><div class="av">${esc(initials)}</div><div style="min-width:0"><b>${esc(s.name || S.auth?.owner || 'Demo')}</b><small>${S.backend.kind === 'demo' ? 'Account demo' : esc(S.auth.owner + '/' + S.auth.repo) + (S.backend.kind === 'view' ? ' · solo visione' : '')}</small></div></div>
    </div>
  </aside>
  <main class="main">
    <header class="topbar">
      <div class="crumb"><div class="logo m-logo">${LOGO_SVG(18)}</div><h1 id="pageTitle"></h1></div>
      <div class="top-actions">
        <span class="save-ind" id="saveInd"></span>
        <button class="btn ${S.busy ? 'spin' : ''}" id="refreshBtn" ${S.busy ? 'disabled' : ''} title="Scarica i dati più recenti">${ic('ref', 17, 2.2)}<span class="lbl">${S.busy ? 'Aggiorno…' : 'Aggiorna'}</span></button>
      </div>
    </header>
    <section id="view"></section>
  </main>
  <nav class="bnav">
    <a href="#/" class="${r.name === 'home' ? 'on' : ''}"><span class="ni">${ic('home', 21)}</span>Home</a>
    ${navP.slice(0, 3).map(p => `<a href="#/p/${p}" class="${r.name === 'platform' && r.p === p ? 'on' : ''}" style="--pill:${PLATFORMS[p].c1}"><span class="ni" style="color:${r.name === 'platform' && r.p === p ? PLATFORMS[p].c1 : 'inherit'}">${pIcon(p, 21)}</span>${PLATFORMS[p].name}</a>`).join('')}
    <a href="#/tutti" class="${r.name === 'all' ? 'on' : ''}"><span class="ni">${ic('grid', 21)}</span>Tutti</a>
    <a href="#/impostazioni" class="${r.name === 'settings' ? 'on' : ''}"><span class="ni">${ic('gear', 21)}</span>Opzioni</a>
  </nav>`;
  $('#refreshBtn').onclick = refresh;
  requestAnimationFrame(movePill);
}
function movePill() {
  const pill = $('#navPill'), on = $('#nav .nav-item.on');
  if (!pill) return;
  if (!on) { pill.style.opacity = 0; return; }
  pill.style.opacity = 1;
  pill.style.transform = `translateY(${on.offsetTop}px)`;
  pill.style.height = on.offsetHeight + 'px';
  pill.style.setProperty('--pill', on.dataset.color || 'var(--a1)');
}
function updateSyncUI() {
  const c = $('#syncCard'); if (c) c.innerHTML = syncText();
  const b = $('#refreshBtn');
  if (b) { b.disabled = S.busy; b.classList.toggle('spin', S.busy); b.querySelector('.lbl').textContent = S.busy ? 'Aggiorno…' : 'Aggiorna'; }
}

/* ============================================================
   RENDER
   ============================================================ */
let shellKey = '';
function render() {
  S.route = parseRoute();
  const r = S.route;
  setPageColor(r.name === 'platform' ? r.p : r.name === 'studio' ? 'youtube' : r.name === 'channel' ? S.channels.find(c => c.id === r.id)?.platform : null);
  const key = JSON.stringify([r, S.settings.platforms, S.channels.length, S.settings.name]);
  if (key !== shellKey || !$('#view')) { renderShell(); shellKey = key; }
  const v = $('#view');
  v.className = '';
  void v.offsetWidth;
  v.className = 'view';
  const t = { home: ['Home', viewHome], all: ['Tutti i video', viewAll], settings: ['Impostazioni', viewSettings], platform: [PLATFORMS[r.p]?.name, viewPlatform], studio: ['YouTube Studio', viewStudio], channel: [entryOf(r.id)?.channel?.name || S.channels.find(c => c.id === r.id)?.handle || 'Canale', viewChannel] }[r.name];
  $('#pageTitle').textContent = t[0];
  document.title = t[0] + ' · Vyral';
  t[1](v);
  countUp(v);
  initSegs(v);
  requestAnimationFrame(() => { $$('.cmp-row .bar i, .sbar .bar i', v).forEach(i => i.style.width = i.dataset.w); });
}
/* aggiorna solo il contenuto (senza animazione di pagina) */
function rerenderView() {
  const v = $('#view'); if (!v) return render();
  const y = window.scrollY;
  const r = S.route;
  ({ home: viewHome, all: viewAll, settings: viewSettings, platform: viewPlatform, studio: viewStudio, channel: viewChannel })[r.name](v, true);
  countUp(v); initSegs(v);
  $$('.cmp-row .bar i', v).forEach(i => i.style.width = i.dataset.w);
  window.scrollTo(0, y);
  $$('.nav-item .cnt').forEach(() => { }); // contatori aggiornati al prossimo render shell
}

/* ---------------- HOME ---------------- */
function viewHome(v) {
  const s = S.settings;
  const all = allVideos();
  if (!S.channels.length) {
    v.innerHTML = `<div class="glass empty rise">
      <div class="ill">${s.platforms.slice(0, 3).map((p, i) => `<div style="${pVars(p)};--i:${i}">${pIcon(p, 28)}</div>`).join('')}</div>
      <h2>${greeting()}${s.name ? ', ' + esc(s.name) : ''}! Iniziamo?</h2>
      <p>Aggiungi i tuoi canali: Vyral ti mostrerà le statistiche degli ultimi video, sempre aggiornate su PC e telefono.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${s.platforms.map(p => `<a class="btn" href="#/p/${p}" style="${pVars(p)}"><span style="color:var(--c1)">${pIcon(p, 17)}</span>Aggiungi su ${PLATFORMS[p].name}</a>`).join('')}</div></div>`;
    return;
  }
  const followers = S.channels.reduce((a, c) => a + (entryOf(c.id)?.channel?.followers || 0), 0);
  const views = all.reduce((a, x) => a + (x.views || 0), 0);
  const ers = all.map(x => x.er).filter(x => x != null);
  const vphs = all.map(x => x.vph).filter(x => x != null);
  const growth = all.reduce((a, x) => a + (x.delta24 || 0), 0);
  const hot = [...all].sort((a, b) => (b.vph || 0) - (a.vph || 0)).slice(0, 5);
  const cmp = S.channels.map(c => ({ c, e: entryOf(c.id) })).filter(x => x.e?.agg?.avgViews != null).sort((a, b) => b.e.agg.avgViews - a.e.agg.avgViews).slice(0, 7);
  const maxAvg = Math.max(1, ...cmp.map(x => x.e.agg.avgViews));
  v.innerHTML = `
  <div class="hero rise" style="--i:0"><div><h2>${greeting()}${s.name ? ', <span>' + esc(s.name) + '</span>' : ''} 👋</h2><p>Ecco come stanno andando i tuoi ${S.channels.length} canali.</p></div></div>
  <div class="kpis">
    ${[['users', 'Follower totali', cnt(followers), 'su tutti i canali', '#8b7bff', '#5b8cff'],
    ['eye', 'Views ultimi video', cnt(views), growth > 0 ? `<span class="pos">+${fmt(growth)}</span> nelle ultime 24h` : `${all.length} video analizzati`, '#fe2c55', '#ff8a3d'],
    ['bolt', 'Engagement medio', cnt(ers.length ? ers.reduce((a, b) => a + b) / ers.length : null, 'p'), 'like + commenti + condivisioni', '#22d3ee', '#3b82f6'],
    ['clock', 'Views all\'ora', cnt(vphs.length ? vphs.reduce((a, b) => a + b) / vphs.length : null), 'media dalla pubblicazione', '#3ddc97', '#14b8a6']]
      .map(([i, l, val, h, k1, k2], n) => `<div class="kpi glass glow-card rise" style="--i:${n + 1};--k1:${k1};--k2:${k2};--p1:${k1}"><div class="deco"></div><div class="ki">${ic(i, 19)}</div><div class="l">${l}</div><div class="v">${val}</div><div class="h">${h}</div></div>`).join('')}
  </div>
  ${pinnedSection()}
  <div class="sec-title rise" style="--i:5"><h3>I tuoi social</h3></div>
  <div class="ptiles">
    ${s.platforms.map((p, n) => {
      const chs = chOf(p), vids = allVideos(p), tv = vids.reduce((a, x) => a + (x.views || 0), 0);
      return `<div class="ptile glass glow-card rise" style="--i:${n + 6};${pVars(p)};--p1:${PLATFORMS[p].c1}" data-go="#/p/${p}"><div class="bgl"></div><span class="arrow">${ic('arrow', 18)}</span>
        <div class="pi">${pIcon(p, 22)}</div><div class="pn">${PLATFORMS[p].name}</div><div class="ps">${chs.length} ${chs.length === 1 ? 'canale' : 'canali'} · ${vids.length} video</div>
        <div class="pv">${cnt(tv)}<small>views recenti</small></div></div>`;
    }).join('')}
    <button class="ptile glass addp rise" style="--i:${s.platforms.length + 6};--c1:var(--a1)" data-act="add-social">${ic('plus', 26, 2)}<b>Aggiungi social</b><small class="mut">Twitch, Kick e altri</small></button>
  </div>
  <div class="home-grid">
    <div>
      <div class="sec-title rise" style="--i:9"><h3><span style="color:var(--warn)">${ic('fire', 20)}</span>In fiamme adesso</h3><a class="btn sm ghost" href="#/tutti">Vedi tutti ${ic('arrow', 14)}</a></div>
      <div class="glass hot-list rise" style="--i:10">${hot.length ? hot.map((x, i) => `
        <a class="hot" href="${esc(x.url)}" target="_blank" rel="noopener" style="${pVars(x.ch.platform)}">
          <div class="rk">${i + 1}</div>${imgTag(x.thumbnail)}
          <div style="min-width:0;flex:1"><div class="ht">${esc(x.title)}</div><div class="hm"><span class="plat-tag">${pIcon(x.ch.platform, 11)}${esc(x.chName)}</span>${ago(x.timestamp)}${x.hot ? `<span class="badge hot">🔥 ${x.perf.toFixed(1)}×</span>` : ''}</div></div>
          <div class="hv">${fmt(x.vph)}/h<small>${fmt(x.views)} views</small></div></a>`).join('') : '<p class="mut" style="padding:20px">Nessun video ancora: premi Aggiorna.</p>'}</div>
    </div>
    <div>
      <div class="sec-title rise" style="--i:11"><h3><span style="color:var(--a1)">${ic('chart', 20)}</span>Confronto canali</h3><span class="mut" style="font-size:12px">media views</span></div>
      <div class="glass cmp rise" style="--i:12">${cmp.length ? cmp.map(({ c, e }) => `
        <div class="cmp-row" style="${pVars(c.platform)};cursor:pointer" data-go="#/c/${encodeURIComponent(c.id)}"><div class="top"><span><span style="color:var(--c1)">${pIcon(c.platform, 14)}</span>${esc(e.channel?.name || c.handle)}</span><b>${fmt(e.agg.avgViews)}</b></div>
        <div class="bar"><i data-w="${(e.agg.avgViews / maxAvg * 100).toFixed(1)}%"></i></div></div>`).join('') : '<p class="mut">Ancora nessun dato.</p>'}</div>
    </div>
  </div>`;
}

function pinnedSection() {
  const pins = (S.settings.pinned || []).map(id => S.channels.find(c => c.id === id)).filter(Boolean);
  if (!pins.length) return `<div class="pin-hint glass rise" style="--i:5">${ic('pin', 16)}<span>Fissa i tuoi canali migliori con la puntina: compaiono qui e sempre per primi.</span></div>`;
  return `<div class="sec-title rise" style="--i:5"><h3><span style="color:var(--a1)">${ic('pin', 19)}</span>Canali fissati</h3></div>
  <div class="pgrid">${pins.map((ch, i) => {
    const d = entryOf(ch.id), pl = PLATFORMS[ch.platform], last = d?.videos?.[0], a = d?.agg || {};
    return `<div class="pcard glass glow-card rise" style="--i:${i + 6};${pVars(ch.platform)};--p1:${pl.c1}" data-go="#/c/${encodeURIComponent(ch.id)}">
      <div class="pc-top">${avatar(ch, d)}<div style="min-width:0;flex:1"><div class="ch-name">${esc(d?.channel?.name || ch.handle)}</div>
        <div class="ch-sub"><span class="plat-tag">${pIcon(ch.platform, 11)}${pl.name}</span>${d?.channel?.followers != null ? `<span><b>${fmt(d.channel.followers)}</b> ${pl.follow}</span>` : ''}</div></div></div>
      <div class="pc-stats"><div><b>${cnt(a.avgViews)}</b><small>Media views</small></div><div><b>${cnt(a.avgER, 'p')}</b><small>Engagement</small></div><div><b>${cnt(a.avgVph)}</b><small>Views/ora</small></div></div>
      ${last ? `<div class="pc-last">${imgTag(last.thumbnail)}<div style="min-width:0"><div class="ht">${esc(last.title)}</div><div class="hm">${ago(last.timestamp)} · ${fmt(last.views)} views${last.hot ? ' · 🔥' : ''}</div></div></div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

/* ---------------- PAGINA SOCIAL ---------------- */
function viewPlatform(v, keep) {
  const r = S.route, p = r.p, pl = PLATFORMS[p], chs = chOf(p);
  if (!S.settings.platforms.includes(p)) { S.settings.platforms.push(p); saveSettingsSoon(); }
  const vids = allVideos(p), tv = vids.reduce((a, x) => a + (x.views || 0), 0);
  const prevInput = keep ? $('#addInput')?.value || '' : '';
  v.innerHTML = `
  <div class="pbanner glass rise" style="--i:0">
    <div class="glowbg"></div>
    <div class="row1">
      <div class="bi">${pIcon(p, 30)}</div>
      <div><h2>${pl.name}</h2><div class="sub">${chs.length} ${chs.length === 1 ? 'canale' : 'canali'} · ${fmt(tv)} views sugli ultimi video</div></div>
      ${p === 'youtube' ? `<a class="btn sm studio-btn" href="#/studio">${ic('chart', 15)}YouTube Studio</a>` : ''}
      <div class="seg tabs"><button class="${r.tab === 'channels' ? 'on' : ''}" data-go="#/p/${p}">${ic('users', 15)}Canali</button><button class="${r.tab === 'all' ? 'on' : ''}" data-go="#/p/${p}/tutti">${ic('grid', 15)}Visualizza tutti</button></div>
    </div>
    <form class="addrow" id="addForm" autocomplete="off">
      <label class="input">${pIcon(p, 18)}<input id="addInput" placeholder="${esc(pl.ph)}" value="${esc(prevInput)}"></label>
      ${p === 'youtube' ? `<select class="select" id="ytTab"><option value="both">Video + Shorts</option><option value="videos">Solo video</option><option value="shorts">Solo Shorts</option></select>` : ''}
      <button class="btn primary" type="submit">${ic('plus', 17, 2.6)}Aggiungi canale</button>
    </form>
    <div id="addMsg"></div>
  </div>
  <div id="pcontent"></div>`;
  if (p === 'youtube') $('#ytTab').value = S.settings.yt_tab;
  $('#addForm').onsubmit = e => { e.preventDefault(); addChannel(p); };
  const c = $('#pcontent');
  if (r.tab === 'all') return renderTable(c, p);
  if (!chs.length) {
    c.innerHTML = `<div class="glass empty rise" style="--i:1;${pVars(p)}"><div class="ill"><div style="--i:0">${pIcon(p, 28)}</div></div><h2>Nessun canale ${pl.name}</h2><p>Incolla qui sopra il link di un canale per vedere le statistiche dei suoi ultimi ${S.settings.videos_per_channel} video.</p></div>`;
    return;
  }
  c.innerHTML = `<div class="cgrid">${chs.map((ch, i) => channelCard(ch, i)).join('')}</div>`;
}
function channelCard(ch, i) {
  const d = entryOf(ch.id), pl = PLATFORMS[ch.platform], m = S.settings.metrics;
  const tab = ch.platform === 'youtube' ? { both: 'Video + Shorts', videos: 'Solo video', shorts: 'Solo Shorts' }[ch.yt_tab] : '';
  let body;
  if (!d || (!d.videos && !d.error)) {
    body = `<div class="waiting"><div class="radar"><i></i></div><b style="color:var(--txt)">In attesa dei dati</b><br>${S.busy ? 'Aggiornamento in corso…' : 'Premi <b>Aggiorna</b> per scaricare le statistiche.'}</div>`;
  } else if (d.error && !d.videos) {
    const ttBtn = d.needs_login && S.backend.kind === 'pc' ? `<div style="margin-top:10px"><button class="btn sm primary" data-act="tt-login">${pIcon('tiktok', 14)}Collega TikTok</button></div>` : '';
    body = `<div class="err-box"><b>Non riesco a leggere questo canale.</b><br>${esc(d.error)}${ttBtn}</div>`;
  } else {
    const a = d.agg || {};
    body = `<div class="mini-kpis">
      <div><div class="l">Media views</div><div class="v">${cnt(a.avgViews)}</div></div>
      <div><div class="l">Views tot.</div><div class="v">${cnt(a.totViews)}</div></div>
      <div><div class="l">Engagement</div><div class="v">${cnt(a.avgER, 'p')}</div></div>
      <div><div class="l">Views/ora</div><div class="v">${cnt(a.avgVph)}</div></div></div>
      ${d.error ? `<div class="err-box soft">Ultimo aggiornamento fallito (${esc(d.error)}): mostro i dati precedenti.</div>` : ''}
      <div class="vlist">${d.videos.map((x, k) => videoRow(x, k, m)).join('') || '<p class="mut" style="padding:14px">Nessun video.</p>'}</div>
      <button class="allvids" data-go="#/c/${encodeURIComponent(ch.id)}">${ic('grid', 15)}Tutti i video del canale${S.stats.catalog?.[ch.id]?.videos?.length ? ` <b>${S.stats.catalog[ch.id].videos.length}</b>` : ''}${ic('arrow', 14)}</button>
      <div class="card-foot"><span>Aggiornato ${ago(d.fetched_at)}</span>${d.needs_login ? `<span class="badge low" title="TikTok mostra questi video solo con l'accesso: li aggiorna il programma per PC">${ic('pc', 11)}dal PC</span>` : `<span>${d.videos.length} video</span>`}</div>`;
  }
  const pinned = isPinned(ch.id);
  return `<article class="ccard glass glow-card rise ${pinned ? 'pinned' : ''}" style="--i:${i + 1};${pVars(ch.platform)};--p1:${pl.c1}">
    ${pinned ? `<span class="pin-flag">${ic('pin', 12, 2.4)}Fissato</span>` : ''}
    <div class="stripe"></div>
    <div class="ch-head"><a class="ch-link" href="#/c/${encodeURIComponent(ch.id)}" title="Apri il canale">${avatar(ch, d)}</a>
      <div class="ch-info"><a class="ch-name ch-link" href="#/c/${encodeURIComponent(ch.id)}">${esc(d?.channel?.name || ch.handle)}</a>
        <div class="ch-sub">${d?.channel?.followers != null ? `<span><b>${fmt(d.channel.followers)}</b> ${pl.follow}</span>·` : ''}${d?.channel?.likes != null ? `<span><b>${fmt(d.channel.likes)}</b> like</span>·` : ''}<span>${esc(ch.handle)}</span>${tab ? `<span>· ${tab}</span>` : ''}</div></div>
      <div class="ch-actions">
        <button class="ibtn pin-btn ${pinned ? 'on' : ''}" data-act="pin" data-id="${esc(ch.id)}" title="${pinned ? 'Togli dai fissati' : 'Fissa in alto'}">${ic('pin', 17)}</button>
        <a class="ibtn" href="${esc(d?.channel?.url || ch.url)}" target="_blank" rel="noopener" title="Apri canale">${ic('ext', 17)}</a>
        <button class="ibtn danger" data-act="del-ch" data-id="${esc(ch.id)}" title="Rimuovi">${ic('del', 17)}</button>
      </div></div>${body}</article>`;
}
function videoRow(x, k, m) {
  const chip = (key, icon, val, title, cls = '') => m[key] && val != null ? `<span class="chip ${cls}" title="${esc(title)}">${ic(icon, 13)}${val}</span>` : '';
  return `<div class="vid" style="--i:${k}">
    <a class="thumb ${x.is_short ? 'v' : ''}" href="${esc(x.url)}" target="_blank" rel="noopener">${imgTag(x.thumbnail)}<span class="play">${ic('play', 26)}</span><span class="rank">#${k + 1}</span>${x.duration ? `<span class="d">${dur(x.duration)}</span>` : ''}</a>
    <div class="vbody">
      <div class="vtop"><a class="vt" href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.title)}">${esc(x.title)}</a>${m.spark ? spark(x.history) : ''}</div>
      <div class="vm"><span title="${x.timestamp ? new Date(x.timestamp * 1000).toLocaleString(LOC()) : ''}">${ago(x.timestamp)}</span>
        ${x.hot ? `<span class="badge hot">🔥 ${x.perf.toFixed(1)}× media</span>` : x.perf != null && x.perf <= .7 ? `<span class="badge low">${x.perf.toFixed(1)}× media</span>` : ''}
        ${m.growth && x.delta24 > 0 ? `<span class="badge up" title="Views guadagnate nel periodo indicato">+${fmt(x.delta24)} ${x.deltaLbl}</span>` : m.growth && x.delta > 0 ? `<span class="badge up" title="Dall'aggiornamento precedente">+${fmt(x.delta)}</span>` : ''}</div>
      <div class="chips">
        ${chip('views', 'eye', fmt(x.views), 'Visualizzazioni: ' + full(x.views))}
        ${chip('likes', 'heart', fmt(x.likes), 'Mi piace: ' + full(x.likes))}
        ${chip('comments', 'msg', fmt(x.comments), 'Commenti: ' + full(x.comments))}
        ${chip('shares', 'share', x.shares != null ? fmt(x.shares) : null, 'Condivisioni: ' + full(x.shares))}
        ${chip('saves', 'save', x.saves != null ? fmt(x.saves) : null, 'Salvataggi: ' + full(x.saves))}
        ${chip('er', 'bolt', pct(x.er), 'Engagement = interazioni / views', 'er')}
        ${chip('vph', 'clock', fmt(x.vph) + '/h', 'Views medie all\'ora dalla pubblicazione')}
        ${studioChips(x, m)}
      </div></div></div>`;
}

function studioChips(x, m) {
  if (!m.studio || !STUDIO.data) return '';
  const sv = studioVideo(x.id); if (!sv) return '';
  const c = (icon, val, title) => val == null ? '' : `<span class="chip studio" title="${esc(title)}">${ic(icon, 13)}${val}</span>`;
  return c('play', sv.averageViewDuration != null ? secs(sv.averageViewDuration) + ' medi' : null, 'Durata media di visualizzazione (YouTube Studio)')
    + c('chart', sv.averageViewPercentage != null ? Math.round(sv.averageViewPercentage) + '% visto' : null, 'Percentuale media visualizzata (YouTube Studio)')
    + c('grid', sv.videoThumbnailImpressionsClickRate != null ? 'CTR ' + ctrP(sv.videoThumbnailImpressionsClickRate).toFixed(1).replace('.', ',') + '%' : null, 'CTR delle impression (YouTube Studio)')
    + c('users', sv.subscribersGained ? '+' + fmt(sv.subscribersGained) + ' iscritti' : null, 'Iscritti ottenuti con questo video (YouTube Studio)');
}

/* ---------------- PAGINA CANALE: tutti i video ---------------- */
const CH = { sort: 'recent', q: '', mode: 'grid' };
function viewChannel(v) {
  const id = S.route.id, ch = S.channels.find(c => c.id === id);
  if (!ch) { v.innerHTML = `<div class="glass empty rise"><h2>Canale non trovato</h2><p><a class="btn" href="#/">Torna alla Home</a></p></div>`; return; }
  const d = entryOf(id), pl = PLATFORMS[ch.platform], cat = S.stats.catalog?.[id];
  let vids = (cat?.videos || d?.videos || []).map(x => ({ ...x }));
  const vw = vids.filter(x => x.views != null), avg = vw.length ? vw.reduce((a, x) => a + x.views, 0) / vw.length : null;
  const now = Date.now() / 1000;
  vids.forEach(x => {
    x.er = x.views ? ((x.likes || 0) + (x.comments || 0) + (x.shares || 0) + (x.saves || 0)) / x.views : null;
    x.perf = avg && x.views != null ? x.views / avg : null;
    x.vph = x.views != null && x.timestamp ? x.views / Math.max((now - x.timestamp) / 3600, 1) : null;
  });
  const total = vw.reduce((a, x) => a + x.views, 0), likes = vids.reduce((a, x) => a + (x.likes || 0), 0);
  const best = [...vw].sort((a, b) => b.views - a.views)[0];
  let list = CH.q ? vids.filter(x => x.title.toLowerCase().includes(CH.q.toLowerCase())) : vids;
  const key = { recent: 'timestamp', views: 'views', likes: 'likes', er: 'er' }[CH.sort];
  list = [...list].sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1));
  const shorts = vids.filter(x => x.is_short).length > vids.length / 2;
  const hasLikes = vids.some(x => x.likes != null);
  const card = (x, i) => `<a class="vcard glass glow-card ${shorts ? 'v' : ''}" href="${esc(x.url)}" target="_blank" rel="noopener" style="--i:${Math.min(i, 24)}">
      <div class="vthumb">${imgTag(x.thumbnail)}<span class="play">${ic('play', 30)}</span>${x.duration ? `<span class="d">${dur(x.duration)}</span>` : ''}${x.perf != null && x.perf >= S.settings.hot_threshold ? `<span class="hotb">🔥 ${x.perf.toFixed(1)}×</span>` : ''}</div>
      <div class="vinfo"><div class="vt2">${esc(x.title)}</div>
        <div class="vm">${x.timestamp ? ago(x.timestamp) : ''}</div>
        <div class="chips">${x.views != null ? `<span class="chip">${ic('eye', 13)}${fmt(x.views)}</span>` : ''}${x.likes != null ? `<span class="chip">${ic('heart', 13)}${fmt(x.likes)}</span>` : ''}${x.comments != null ? `<span class="chip">${ic('msg', 13)}${fmt(x.comments)}</span>` : ''}${x.er != null && x.likes != null ? `<span class="chip er">${ic('bolt', 13)}${pct(x.er)}</span>` : ''}</div></div></a>`;
  v.innerHTML = `
  <div class="pbanner glass rise" style="--i:0;${pVars(ch.platform)}"><div class="glowbg"></div>
    <div class="row1">
      <a class="ibtn" href="#/p/${ch.platform}" title="Indietro">${ic('arrow', 18)}</a>
      <div style="${pVars(ch.platform)}">${avatar(ch, d)}</div>
      <div style="min-width:0"><h2>${esc(d?.channel?.name || ch.handle)}</h2>
        <div class="sub"><span class="plat-tag" style="${pVars(ch.platform)}">${pIcon(ch.platform, 11)}${pl.name}</span> ${d?.channel?.followers != null ? `<b>${fmt(d.channel.followers)}</b> ${pl.follow} · ` : ''}${esc(ch.handle)}</div></div>
      <a class="btn sm" style="margin-left:auto" href="${esc(d?.channel?.url || ch.url)}" target="_blank" rel="noopener">${ic('ext', 15)}Apri canale</a>
    </div></div>
  <div class="sum">
    ${[['Video nell\'archivio', cnt(vids.length), cat ? 'aggiornato ' + ago(cat.updated_at) : 'in attesa dell\'archivio'],
    ['Views totali', cnt(total), full(total)],
    ['Media views', cnt(avg), 'per video'],
    [hasLikes ? 'Like totali' : 'Più visto', hasLikes ? cnt(likes) : cnt(best?.views), hasLikes ? pct(total ? likes / total : null) + ' delle views' : esc(best?.title || '—')]]
      .map(([l, val, h], i) => `<div class="s glass rise" style="--i:${i + 1}"><div class="l">${l}</div><div class="v">${val}</div><div class="h">${h}</div></div>`).join('')}
  </div>
  <div class="toolbar rise" style="--i:6">
    <label class="input">${ic('search', 17)}<input id="cq" placeholder="Cerca tra i video del canale…" value="${esc(CH.q)}"></label>
    <div class="seg" id="csort">${[['recent', 'Più recenti'], ['views', 'Più visti']].concat(hasLikes ? [['likes', 'Più like'], ['er', 'Engagement']] : []).map(([k, l]) => `<button data-s="${k}" class="${CH.sort === k ? 'on' : ''}">${l}</button>`).join('')}</div>
  </div>
  ${list.length ? `<div class="vgrid ${shorts ? 'shorts' : ''}">${list.map(card).join('')}</div>`
      : `<div class="glass empty rise"><h2>${vids.length ? 'Nessun risultato' : 'Archivio in preparazione'}</h2><p>${vids.length ? 'Prova un\'altra ricerca.' : `Al prossimo aggiornamento Vyral raccoglie fino a ${S.settings.catalog_size} video di questo canale.`}</p></div>`}`;
  const q = $('#cq', v);
  q.oninput = () => { CH.q = q.value; const pos = q.selectionStart; viewChannel(v); initSegs(v); countUp(v); const n = $('#cq', v); n.focus(); n.setSelectionRange(pos, pos); };
  $$('#csort button', v).forEach(b => b.onclick = () => { CH.sort = b.dataset.s; viewChannel(v); initSegs(v); countUp(v); });
}

/* ---------------- TABELLA (Visualizza tutti) ---------------- */
const COLS = [
  { k: 'title', l: 'Video' }, { k: 'timestamp', l: 'Pubblicato' }, { k: 'views', l: 'Views', n: 1 }, { k: 'likes', l: 'Like', n: 1 },
  { k: 'comments', l: 'Commenti', n: 1 }, { k: 'shares', l: 'Condiv.', n: 1 }, { k: 'er', l: 'Engagement', n: 1 },
  { k: 'likeRate', l: 'Like %', n: 1 }, { k: 'vph', l: 'Views/ora', n: 1 }, { k: 'perf', l: 'vs media', n: 1 }, { k: 'delta24', l: '24h', n: 1 },
];
function viewAll(v) { v.innerHTML = '<div id="pcontent"></div>'; renderTable($('#pcontent', v), null); }
function renderTable(c, platform) {
  const base = allVideos(platform || S.filterP).filter(x => S.filterCh === 'all' || (S.filterCh === 'pinned' ? isPinned(x.ch.id) : x.ch.id === S.filterCh));
  let vids = base;
  if (S.q) { const q = S.q.toLowerCase(); vids = vids.filter(x => (x.title + ' ' + x.chName).toLowerCase().includes(q)); }
  const { k, d } = S.sort;
  vids = [...vids].sort((a, b) => { const x = a[k], y = b[k]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * d; });
  const sumV = base.reduce((a, x) => a + (x.views || 0), 0), sumL = base.reduce((a, x) => a + (x.likes || 0), 0);
  const ers = base.map(x => x.er).filter(x => x != null);
  const best = [...base].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
  const fast = [...base].sort((a, b) => (b.vph || 0) - (a.vph || 0))[0];
  const chList = platform ? chOf(platform) : S.channels.filter(c => S.filterP === 'all' || c.platform === S.filterP);
  const maxV = Math.max(1, ...vids.map(x => x.views || 0));
  const firstRender = !c.querySelector('table');
  c.innerHTML = `
  <div class="sum">
    ${[['Video analizzati', cnt(base.length), `${new Set(base.map(x => x.ch.id)).size} canali`],
    ['Views totali', cnt(sumV), full(sumV)],
    ['Like totali', cnt(sumL), pct(sumV ? sumL / sumV : null) + ' delle views'],
    ['Engagement medio', cnt(ers.length ? ers.reduce((a, b) => a + b) / ers.length : null, 'p'), 'interazioni / views'],
    ['Più visto', cnt(best?.views), best ? esc(best.chName + ' · ' + best.title) : '—'],
    ['Più veloce', cnt(fast?.vph, 'n', '/h'), fast ? esc(fast.chName + ' · ' + fast.title) : '—']]
      .map(([l, val, h], i) => `<div class="s glass ${firstRender ? 'rise' : ''}" style="--i:${i + 1}"><div class="l">${l}</div><div class="v">${val}</div><div class="h">${h}</div></div>`).join('')}
  </div>
  <div class="toolbar ${firstRender ? 'rise' : ''}" style="--i:7">
    <label class="input">${ic('search', 17)}<input id="tq" placeholder="Cerca per titolo o canale…" value="${esc(S.q)}"></label>
    ${platform ? '' : `<div class="seg" id="fp"><button data-f="all" class="${S.filterP === 'all' ? 'on' : ''}">Tutti</button>${S.settings.platforms.map(p => `<button data-f="${p}" class="${S.filterP === p ? 'on' : ''}"><span style="color:${PLATFORMS[p].c1}">${pIcon(p, 14)}</span>${PLATFORMS[p].name}</button>`).join('')}</div>`}
    ${(S.settings.pinned || []).length ? `<button class="btn sm ${S.filterCh === 'pinned' ? 'primary' : ''}" id="fpin" style="height:44px">${ic('pin', 15)}Solo fissati</button>` : ''}
    <select class="select" id="fc"><option value="all">Tutti i canali</option>${chList.map(ch => `<option value="${esc(ch.id)}" ${S.filterCh === ch.id ? 'selected' : ''}>${esc(entryOf(ch.id)?.channel?.name || ch.handle)}</option>`).join('')}</select>
  </div>
  <div class="glass twrap ${firstRender ? 'rise' : ''}" style="--i:8"><table>
    <thead><tr><th>#</th>${COLS.map(cl => `<th class="s ${cl.n ? 'num' : ''} ${k === cl.k ? 'on' : ''}" data-k="${cl.k}">${cl.l}${k === cl.k ? (d < 0 ? ' ↓' : ' ↑') : ''}</th>`).join('')}</tr></thead>
    <tbody>${vids.length ? vids.map((x, i) => `<tr style="--i:${Math.min(i, 20)};${pVars(x.ch.platform)}">
      <td class="mut">${i + 1}</td>
      <td><a class="tvid" href="${esc(x.url)}" target="_blank" rel="noopener">${imgTag(x.thumbnail)}<div><div class="tt">${esc(x.title)}</div><div class="tc"><span class="plat-tag">${pIcon(x.ch.platform, 11)}</span>${esc(x.chName)}${x.duration ? ' · ' + dur(x.duration) : ''}</div></div></a></td>
      <td class="mut">${ago(x.timestamp)}</td>
      <td class="num"><div class="vbar"><b>${fmt(x.views)}</b><span class="track"><i style="width:${((x.views || 0) / maxV * 100).toFixed(1)}%"></i></span></div></td>
      <td class="num">${fmt(x.likes)}</td><td class="num">${fmt(x.comments)}</td><td class="num">${fmt(x.shares)}</td>
      <td class="num"><b style="color:color-mix(in srgb,var(--a1) 60%,#fff)">${pct(x.er)}</b></td>
      <td class="num">${pct(x.likeRate)}</td><td class="num">${fmt(x.vph)}</td>
      <td class="num">${x.perf != null ? `<span style="color:${x.hot ? 'var(--warn)' : x.perf <= .7 ? 'var(--mut)' : 'var(--txt)'}">${x.hot ? '🔥 ' : ''}${x.perf.toFixed(2)}×</span>` : '—'}</td>
      <td class="num">${x.delta24 > 0 ? `<span class="pos">+${fmt(x.delta24)}</span>` : '<span class="mut">—</span>'}</td></tr>`).join('')
      : `<tr><td colspan="${COLS.length + 1}" class="mut" style="text-align:center;padding:48px">${S.busy ? 'Aggiornamento in corso…' : 'Nessun video da mostrare.'}</td></tr>`}</tbody></table></div>`;
  const re = () => { renderTable(c, platform); countUp(c); initSegs(c); };
  const q = $('#tq', c);
  q.oninput = () => { S.q = q.value; const pos = q.selectionStart; re(); const n = $('#tq', c); n.focus(); n.setSelectionRange(pos, pos); };
  $('#fc', c).onchange = e => { S.filterCh = e.target.value; re(); };
  const fp = $('#fpin', c); if (fp) fp.onclick = () => { S.filterCh = S.filterCh === 'pinned' ? 'all' : 'pinned'; re(); };
  $$('#fp button', c).forEach(b => b.onclick = () => { S.filterP = b.dataset.f; S.filterCh = 'all'; re(); });
  $$('th[data-k]', c).forEach(th => th.onclick = () => { const kk = th.dataset.k; if (S.sort.k === kk) S.sort.d *= -1; else S.sort = { k: kk, d: kk === 'title' ? 1 : -1 }; re(); });
}

/* ---------------- IMPOSTAZIONI ---------------- */
function viewSettings(v, keep) {
  const s = S.settings, kind = S.backend.kind;
  const sw = (key, on) => `<button class="switch ${on ? 'on' : ''}" data-sw="${key}" role="switch" aria-checked="${!!on}"></button>`;
  const segm = (key, opts) => `<div class="seg" data-seg="${key}">${opts.map(([val, lab]) => `<button data-v="${val}" class="${String(s[key]) === String(val) ? 'on' : ''}">${lab}</button>`).join('')}</div>`;
  const range = (key, min, max, step, f) => `<div class="range"><input type="range" data-range="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}" style="--fill:${(s[key] - min) / (max - min) * 100}%"><output>${f(s[key])}</output></div>`;
  const row = (t, d, ctl) => `<div class="set-row"><div class="t"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</div>${ctl}</div>`;
  const sec = (id, icon, title, rows, i) => `<section class="set-sec glass ${keep ? '' : 'rise'}" id="s-${id}" style="--i:${i}"><h3><span class="si">${ic(icon, 17)}</span>${title}</h3>${rows}</section>`;
  const repoUrl = S.auth ? `https://github.com/${S.auth.owner}/${S.auth.repo}` : '#';
  v.innerHTML = `<div class="set-wrap">
  <nav class="set-nav glass ${keep ? '' : 'rise'}">${[['profilo', 'user', 'Profilo'], ['aspetto', 'palette', 'Aspetto'], ['statistiche', 'chart', 'Statistiche'], ['social', 'share2', 'Social'], ['aggiornamento', 'sync', 'Aggiornamento'], ['account', 'key', 'Account'], ['dati', 'db', 'Dati']].map(([id, i, l], n) => `<a href="#s-${id}" data-scroll="s-${id}" class="${n === 0 ? 'on' : ''}">${ic(i, 17)}${l}</a>`).join('')}</nav>
  <div>
  ${sec('profilo', 'user', 'Profilo', row('Il tuo nome', 'Compare nel saluto della Home.', `<label class="input"><input data-text="name" value="${esc(s.name)}" placeholder="Come ti chiami?" maxlength="30"></label>`)
    + row('Lingua', "Lingua dell'interfaccia su questo dispositivo.", `<div class="seg" id="langSeg">${Object.entries(LANGS).map(([k, l]) => `<button data-l="${k}" class="${I18N.lang === k ? 'on' : ''}">${l}</button>`).join('')}</div>`), 0)}
  ${sec('aspetto', 'palette', 'Aspetto',
    row('Tema', 'Colori di pulsanti, grafici ed effetti.', `<div class="swatches">${Object.entries(THEMES).map(([k, t]) => `<button class="sw ${s.theme === k ? 'on' : ''}" data-theme="${k}" style="--s1:${t.a1};--s2:${t.a2}"><div class="c"></div>${t.n}</button>`).join('')}</div>`) +
    row('Sfondo animato', 'L\'effetto dietro all\'interfaccia.', segm('bg', [['aurora', 'Aurora'], ['grid', 'Griglia'], ['stars', 'Stelle'], ['off', 'Spento']])) +
    row('Nero OLED', 'Sfondo nero puro: perfetto per l\'iPhone.', sw('oled', s.oled)) +
    row('Luce sulle schede', 'Le schede si illuminano dove passi col mouse.', sw('glow', s.glow)) +
    row('Animazioni', 'Transizioni, numeri che salgono, grafici che si disegnano.', sw('animations', s.animations)) +
    row('Densità', 'Quanto spazio tra gli elementi.', segm('density', [['comfy', 'Comoda'], ['compact', 'Compatta']])) +
    row('Arrotondamento', 'Quanto sono tondi gli angoli.', range('radius', 6, 30, 1, x => x + 'px')), 1)}
  ${sec('statistiche', 'chart', 'Statistiche',
    row('Video per canale', 'Quanti video recenti analizzare. Vale dal prossimo aggiornamento.', range('videos_per_channel', 1, 10, 1, x => x)) +
    row('Archivio video per canale', 'Quanti video tenere nella pagina "Tutti i video del canale". Si aggiorna ogni 6 ore.', range('catalog_size', 10, 60, 5, x => x)) +
    row('Soglia 🔥', 'Un video è "in fiamme" se supera la media del canale di questo fattore.', range('hot_threshold', 1.1, 3, .1, x => (+x).toFixed(1) + '×')) +
    row('YouTube: video da contare', 'Scelta predefinita quando aggiungi un canale.', segm('yt_tab', [['both', 'Tutti'], ['videos', 'Video'], ['shorts', 'Shorts']])) +
    `<div class="set-row" style="display:block"><div class="t" style="margin-bottom:12px"><b>Statistiche visibili</b><small>Scegli cosa mostrare sotto ogni video.</small></div><div class="mchips">${Object.entries(METRICS).map(([k, [l, i]]) => `<button class="mchip ${s.metrics[k] ? 'on' : ''}" data-metric="${k}">${ic(i, 14)}${l}</button>`).join('')}</div></div>`, 2)}
  ${sec('social', 'share2', 'Social',
    `<div class="set-row"><div class="plist">${s.platforms.map(p => `<div class="prow" style="${pVars(p)}"><div class="pi">${pIcon(p, 18)}</div><div class="pn">${PLATFORMS[p].name} <small>· ${chOf(p).length} canali</small></div>${s.platforms.length > 1 ? `<button class="ibtn danger" data-act="rm-social" data-p="${p}" title="Nascondi">${ic('x', 16)}</button>` : ''}</div>`).join('')}
    <button class="nav-add" data-act="add-social" style="margin-top:4px">${ic('plus', 16, 2.4)}Aggiungi social</button></div></div>`
    + (kind === 'pc' ? row('Accesso TikTok (solo su questo PC)', "Serve per i profili che TikTok mostra solo a chi ha fatto l'accesso. L'accesso resta su questo computer e non va su GitHub.",
      TT.connected ? `<span class="badge up">${ic('check', 12, 3)} Collegato</span><button class="btn sm danger" data-act="tt-logout">Scollega</button>` : `<button class="btn primary" data-act="tt-login">${pIcon('tiktok', 15)}Collega TikTok</button>`) : ''), 3)}
  ${sec('aggiornamento', 'sync', 'Aggiornamento',
    row('Aggiornamento automatico', kind === 'pc' ? 'Il programma per PC scarica i dati da solo ogni tanto; GitHub lo fa comunque ogni 30 minuti.' : 'GitHub scarica i dati da solo ogni 30 minuti, anche a PC spento.', `<span class="badge up">${ic('check', 12, 3)} Ogni 30 min</span>`) +
    row('Ricarica la pagina', 'Ogni quanto l\'app controlla se ci sono dati nuovi.', segm('auto_reload', [[0, 'Mai'], [2, '2 min'], [5, '5 min'], [15, '15 min']])) +
    row('Aggiorna adesso', kind === 'pc' ? 'Scarica i dati direttamente da questo PC.' : 'Avvia subito l\'aggiornamento su GitHub (circa 1-2 minuti).', `<button class="btn primary" data-act="refresh">${ic('ref', 16)}Aggiorna ora</button>`), 4)}
  ${sec('account', 'key', 'Account',
    kind === 'view' ? row('Solo visione', 'Vedi le statistiche ma non puoi aggiungere canali o aggiornare. Esci e accedi col token per avere tutto.', `<button class="btn" data-act="logout">${ic('logout', 16)}Esci</button>`) :
    kind === 'demo' ? row('Modalità demo', 'I dati sono finti e restano solo su questo dispositivo. Esci e accedi con GitHub per usare i tuoi canali.', `<button class="btn" data-act="logout">${ic('logout', 16)}Esci dalla demo</button>`) :
      row('Repository', 'Il tuo account: canali, impostazioni e statistiche sono salvati qui.', `<a class="btn" href="${repoUrl}" target="_blank" rel="noopener">${ic('gh', 16)}${esc(S.auth.owner + '/' + S.auth.repo)}</a>`) +
      row('Programma per PC', 'Scarica Vyral.exe: stesso account, aggiornamenti più veloci.', `<a class="btn" href="${repoUrl}/releases/latest" target="_blank" rel="noopener">${ic('pc', 16)}Scarica Vyral.exe</a>`) +
      row('Attività di GitHub', 'Controlla gli aggiornamenti automatici.', `<a class="btn" href="${repoUrl}/actions" target="_blank" rel="noopener">${ic('ext', 16)}Apri Actions</a>`) +
      row('Esci', 'Il token viene cancellato da questo dispositivo. I dati restano su GitHub.', `<button class="btn danger" data-act="logout">${ic('logout', 16)}Esci</button>`), 5)}
  ${sec('dati', 'db', 'Dati',
    (studioOn() && !STUDIO.env.plain ? row('YouTube Studio', STUDIO.data ? 'Sbloccato su questo dispositivo.' : 'Bloccato: inserisci la password nella pagina YouTube Studio.', STUDIO.data ? `<button class="btn" data-act="studio-lock">${ic('key', 16)}Blocca di nuovo</button>` : `<a class="btn" href="#/studio">${ic('key', 16)}Sblocca</a>`) : '') +
    row('Backup', 'Scarica canali e impostazioni in un file.', `<button class="btn" data-act="export">${ic('down', 16)}Esporta</button>`) +
    row('Ripristina backup', 'Carica un file esportato in precedenza.', `<label class="btn">${ic('up', 16)}Importa<input type="file" accept=".json" id="importFile" hidden></label>`) +
    row('Impostazioni predefinite', 'Riporta l\'aspetto e le opzioni come all\'inizio. I canali restano.', `<button class="btn danger" data-act="reset-settings">Ripristina</button>`), 6)}
  <p class="mut" style="text-align:center;font-size:12px;margin:24px 0">Vyral · dati dalle pagine pubbliche tramite yt-dlp</p>
  </div></div>`;

  const set = (k, val, rerender = true) => { S.settings[k] = val; saveSettingsSoon(); if (rerender) rerenderView(); };
  $$('[data-sw]', v).forEach(b => b.onclick = () => { const k = b.dataset.sw; b.classList.toggle('on'); set(k, b.classList.contains('on'), false); });
  $$('[data-seg]', v).forEach(sg => sg.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', sg).forEach(x => x.classList.toggle('on', x === b)); initSegs(v);
    const k = sg.dataset.seg; set(k, typeof DEFAULT_SETTINGS[k] === 'number' ? +b.dataset.v : b.dataset.v, false);
    if (k === 'auto_reload') startAutoReload();
  });
  $$('[data-range]', v).forEach(inp => {
    const k = inp.dataset.range, out = inp.nextElementSibling, f = { radius: x => x + 'px', hot_threshold: x => (+x).toFixed(1) + '×' }[k] || (x => x);
    inp.oninput = () => { inp.style.setProperty('--fill', (inp.value - inp.min) / (inp.max - inp.min) * 100 + '%'); out.textContent = f(inp.value); S.settings[k] = +inp.value; if (k === 'radius') applySettings(); };
    inp.onchange = () => { set(k, +inp.value, false); if (k === 'hot_threshold') reEnrich(); };
  });
  $$('[data-theme]', v).forEach(b => b.onclick = () => { $$('[data-theme]', v).forEach(x => x.classList.toggle('on', x === b)); set('theme', b.dataset.theme, false); });
  $$('[data-metric]', v).forEach(b => b.onclick = () => { b.classList.toggle('on'); S.settings.metrics = { ...S.settings.metrics, [b.dataset.metric]: b.classList.contains('on') }; saveSettingsSoon(); });
  const nameIn = $('[data-text="name"]', v);
  nameIn.oninput = () => { S.settings.name = nameIn.value.trim(); saveSettingsSoon(); const me = $('.me b'); if (me) me.textContent = S.settings.name || S.auth?.owner || 'Demo'; };
  $('#importFile', v).onchange = importBackup;
  $$('#langSeg button', v).forEach(b => b.onclick = () => { S.settings.lang = b.dataset.l; if (applyLang(b.dataset.l)) { saveSettingsSoon(); shellKey = ''; render(); } });
  // evidenzia sezione visibile
  const links = $$('.set-nav a', v);
  links.forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById(a.dataset.scroll).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.scroll === en.target.id)); }), { rootMargin: '-30% 0px -60% 0px' });
  $$('.set-sec', v).forEach(sct => io.observe(sct));
}

/* ============================================================
   AZIONI
   ============================================================ */
async function addChannel(p) {
  const inp = $('#addInput'), msg = $('#addMsg');
  msg.innerHTML = '';
  let ch;
  try { ch = parseChannel(p, inp.value, $('#ytTab')?.value || S.settings.yt_tab); }
  catch (e) { msg.innerHTML = `<div class="addmsg">${esc(e.message)}</div>`; return; }
  if (S.channels.some(c => c.id === ch.id)) { msg.innerHTML = '<div class="addmsg">Questo canale è già nella lista.</div>'; return; }
  const btn = $('#addForm button[type=submit]'); btn.disabled = true;
  const prev = S.channels;
  S.channels = [...S.channels, ch];
  if (!S.settings.platforms.includes(ch.platform)) { S.settings.platforms = [...S.settings.platforms, ch.platform]; saveSettingsSoon(); }
  try {
    showSave('Salvataggio…');
    await S.backend.saveChannels(S.channels);
    showSave('Sincronizzato', true);
    inp.value = '';
    toast(ch.platform !== p ? `Aggiunto in ${PLATFORMS[ch.platform].name}` : 'Canale aggiunto');
    if (ch.platform !== p) go('#/p/' + ch.platform); else render();
    refresh();
  } catch (e) { S.channels = prev; showSave(''); msg.innerHTML = `<div class="addmsg">${esc(e.message)}</div>`; btn.disabled = false; }
}
async function deleteChannel(id) {
  const ch = S.channels.find(c => c.id === id);
  if (!ch || !await confirmBox('Rimuovere il canale?', `${entryOf(id)?.channel?.name || ch.handle} sparirà da Vyral su tutti i tuoi dispositivi.`, 'Rimuovi')) return;
  const prev = S.channels;
  S.channels = S.channels.filter(c => c.id !== id);
  if (isPinned(id)) { S.settings.pinned = S.settings.pinned.filter(x => x !== id); saveSettingsSoon(); }
  render();
  try { await S.backend.saveChannels(S.channels); toast('Canale rimosso'); }
  catch (e) { S.channels = prev; render(); toast(e.message, true); }
}
const TT = { connected: false };
async function ttRefreshStatus() {
  if (!window.pywebview?.api?.tiktok_status) return;
  try { TT.connected = !!(await window.pywebview.api.tiktok_status()).connected; } catch { }
}
async function ttLogin() {
  const api = window.pywebview?.api;
  if (!api?.tiktok_login_start) { toast("Il collegamento a TikTok si fa dal programma per PC (Vyral.exe).", true); return; }
  await api.tiktok_login_start();
  modal(`<h3>Collega TikTok</h3><p>Si è aperta una finestra di TikTok: <b>accedi con il tuo account</b> (va bene anche il codice QR dal telefono). Quando vedi la tua pagina TikTok, torna qui e premi <b>Fatto</b>.</p>
    <p class="mut" style="font-size:13px">L'accesso resta solo su questo computer: non viene salvato su GitHub né sul telefono.</p>
    <div class="acts"><button class="btn ghost" data-close>Annulla</button><button class="btn primary" data-ok>${ic('check', 16, 2.6)}Fatto</button></div>`, (bg, close) => {
    bg.querySelector('[data-ok]').onclick = async () => {
      const r = await api.tiktok_login_finish();
      if (r?.error) { toast(r.error, true); return; }
      close(); TT.connected = true; toast('TikTok collegato: aggiorno i dati…');
      if (S.route.name === 'settings') rerenderView();
      refresh();
    };
  });
}
async function ttLogout() {
  if (!await confirmBox('Scollegare TikTok?', "Vyral non userà più il tuo accesso TikTok su questo PC.", 'Scollega')) return;
  await window.pywebview.api.tiktok_logout(); TT.connected = false; toast('TikTok scollegato'); rerenderView();
}
function togglePin(id) {
  const p = S.settings.pinned || [];
  const on = !p.includes(id);
  S.settings.pinned = on ? [...p, id] : p.filter(x => x !== id);
  saveSettingsSoon();
  toast(on ? 'Canale fissato in alto' : 'Canale tolto dai fissati');
  rerenderView();
}
function openAddSocial() {
  const close = modal(`<h3>Aggiungi un social</h3><p>Scegli quale piattaforma mostrare nella barra laterale.</p>
    <div class="catalog">${Object.entries(PLATFORMS).map(([k, p], i) => `<button class="cat pop ${S.settings.platforms.includes(k) ? 'added' : ''}" data-p="${k}" style="${pVars(k)};--i:${i}"><div class="pi">${pIcon(k, 20)}</div><b>${p.name}</b><small>${p.desc}</small></button>`).join('')}</div>
    <div class="acts"><button class="btn ghost" data-close>Chiudi</button></div>`, (bg, cl) => {
    $$('.cat', bg).forEach(b => b.onclick = () => {
      const p = b.dataset.p;
      S.settings.platforms = [...S.settings.platforms, p];
      saveSettingsSoon(); cl(); toast(PLATFORMS[p].name + ' aggiunto'); go('#/p/' + p);
    });
  });
}
async function removeSocial(p) {
  const n = chOf(p).length;
  if (n && !await confirmBox('Nascondere ' + PLATFORMS[p].name + '?', `I suoi ${n} canali restano salvati: li ritrovi se lo riaggiungi.`, 'Nascondi')) return;
  S.settings.platforms = S.settings.platforms.filter(x => x !== p);
  saveSettingsSoon(); shellKey = ''; render();
}
function reEnrich() { for (const id in S.stats.channels) enrich(S.stats.channels[id], S.settings.hot_threshold); }

async function refresh() {
  if (S.busy) return;
  S.busy = true; S.busyMsg = 'Avvio aggiornamento…'; S.lastError = null;
  updateSyncUI(); if (S.route.name !== 'settings') rerenderView();
  try {
    const st = await S.backend.refresh(m => { S.busyMsg = m; updateSyncUI(); });
    S.stats = st || S.stats; reEnrich();
    const errs = Object.values(S.stats.channels).filter(e => e.error).length;
    toast(errs ? `Aggiornato, ma ${errs} canali hanno dato errore` : 'Statistiche aggiornate', !!errs);
  } catch (e) { S.lastError = e.message; toast(e.message, true); }
  S.busy = false;
  updateSyncUI();
  if (S.route.name !== 'settings') rerenderView();
}
let reloadT = null;
function startAutoReload() {
  clearInterval(reloadT);
  const m = S.settings.auto_reload;
  if (!m || S.backend.kind === 'demo') return;
  reloadT = setInterval(async () => {
    if (S.busy || document.hidden) return;
    try {
      const st = await S.backend.loadStats();
      if (st?.updated_at && st.updated_at !== S.stats.updated_at) { S.stats = st; reEnrich(); updateSyncUI(); if (S.route.name !== 'settings') rerenderView(); }
    } catch { }
  }, m * 60000);
}
function exportBackup() {
  const blob = new Blob([JSON.stringify({ vyral: 1, channels: S.channels, settings: S.settings }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'vyral-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function importBackup(e) {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (!Array.isArray(j.channels)) throw new Error('File non valido.');
    if (!await confirmBox('Ripristinare il backup?', `Verranno caricati ${j.channels.length} canali e le impostazioni del file.`, 'Ripristina', false)) return;
    S.channels = j.channels; S.settings = withDefaults(j.settings);
    await S.backend.saveChannels(S.channels); await S.backend.saveSettings(S.settings);
    applySettings(); shellKey = ''; render(); toast('Backup ripristinato');
  } catch (err) { toast(err.message, true); }
}
async function logout() {
  if (!await confirmBox('Uscire?', S.backend.kind === 'demo' ? 'Torni alla schermata di accesso.' : 'Il token verrà cancellato da questo dispositivo. I tuoi dati restano su GitHub.', 'Esci')) return;
  LS.del('auth'); LS.del('mode'); location.hash = ''; location.reload();
}

/* click globali */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act],[data-go]');
  if (!t) return;
  if (t.dataset.go) { go(t.dataset.go); return; }
  const a = t.dataset.act;
  if (a === 'add-social') openAddSocial();
  else if (a === 'rm-social') removeSocial(t.dataset.p);
  else if (a === 'del-ch') deleteChannel(t.dataset.id);
  else if (a === 'pin') togglePin(t.dataset.id);
  else if (a === 'tt-login') ttLogin();
  else if (a === 'tt-logout') ttLogout();
  else if (a === 'refresh') refresh();
  else if (a === 'logout') logout();
  else if (a === 'export') exportBackup();
  else if (a === 'studio-lock') { LS.del('studioPw'); STUDIO.data = null; toast('YouTube Studio bloccato'); render(); }
  else if (a === 'reset-settings') confirmBox('Ripristinare le impostazioni?', 'Aspetto e opzioni torneranno come all\'inizio.', 'Ripristina').then(ok => { if (!ok) return; S.settings = withDefaults({ name: S.settings.name, platforms: S.settings.platforms }); saveSettingsSoon(); reEnrich(); render(); toast('Impostazioni ripristinate'); });
});
window.addEventListener('resize', () => { movePill(); initSegs(); });
window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

/* ============================================================
   LOGIN
   ============================================================ */
function renderLogin(err, prefill) {
  document.body.dataset.bg = 'aurora';
  const guess = { ...DEFAULT_REPO };
  const m = location.hostname.match(/^([\w-]+)\.github\.io$/i);
  if (m) { guess.owner = m[1]; const seg = location.pathname.split('/').filter(Boolean)[0]; if (seg && !seg.includes('.')) guess.repo = seg; }
  const saved = prefill || LS.get('lastLogin', {});
  $('#app').innerHTML = `<div class="login"><form class="lcard glass" id="login" autocomplete="off">
    <div class="seg lang-mini" id="loginLang">${Object.keys(LANGS).map(k => `<button type="button" data-l="${k}" class="${I18N.lang === k ? 'on' : ''}">${k.toUpperCase()}</button>`).join('')}</div>
    <div class="lhero"><span class="orb"></span><span class="orb o2"></span><div class="logo">${LOGO_SVG(40)}</div></div>
    <h1>Benvenuto su Vyral</h1>
    <p>Il tuo account è il tuo repository GitHub:<br>stessi canali e impostazioni su PC e telefono.</p>
    <div class="field"><label>Utente GitHub</label><div class="input">${ic('user', 17)}<input id="lo" value="${esc(saved.owner || guess.owner)}" placeholder="es. giqmmq" autocapitalize="off" required></div></div>
    <div class="field"><label>Repository</label><div class="input">${ic('gh', 17)}<input id="lr" value="${esc(saved.repo || guess.repo)}" placeholder="vyral" autocapitalize="off" required></div></div>
    <div class="field"><label>Token di accesso</label><div class="input">${ic('key', 17)} <input id="lt" type="password" value="${esc(prefill?.token || '')}" placeholder="github_pat_…" autocapitalize="off"><button type="button" class="ibtn" id="showT" title="Mostra">${ic('eye', 16)}</button></div></div>
    <button class="btn primary" type="submit" id="lbtn">Accedi</button>
    ${err ? `<div class="lerr">${esc(err)}</div>` : ''}
    <details class="help"><summary>${ic('key', 15)}Come ottengo il token?</summary><ol>
      <li>Apri <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">questa pagina di GitHub</a>.</li>
      <li>Nome: <b>Vyral</b>. Scadenza: quella che preferisci.</li>
      <li>In <b>Repository access</b> scegli <b>Only select repositories</b> → il tuo repo Vyral.</li>
      <li>In <b>Permissions</b> metti <b>Contents</b> e <b>Actions</b> su <b>Read and write</b>.</li>
      <li>Premi <b>Generate token</b>, copialo e incollalo qui. Fallo su ogni dispositivo una volta sola.</li></ol></details>
    <div class="or">oppure</div>
    <button type="button" class="btn demo" id="viewBtn" style="margin-bottom:8px">${ic('eye', 15)}Entra solo per guardare (senza token)</button>
    <button type="button" class="btn demo ghost" id="demoBtn">${ic('play', 14)}Prova la demo</button>
  </form></div>`;
  initSegs($('#login'));
  $$('#loginLang button').forEach(b => b.onclick = () => { setLang(b.dataset.l); mkNF(); renderLogin(err, { owner: $('#lo').value, repo: $('#lr').value, token: $('#lt').value }); });
  $('#showT').onclick = () => { const t = $('#lt'); t.type = t.type === 'password' ? 'text' : 'password'; };
  $('#demoBtn').onclick = () => { LS.set('mode', 'demo'); boot(); };
  $('#viewBtn').onclick = async () => {
    const auth = { owner: $('#lo').value.trim(), repo: $('#lr').value.trim() };
    if (!auth.owner || !auth.repo) return renderLogin('Scrivi utente e repository.', auth);
    try { await new ViewBackend(auth).verify(); LS.set('auth', auth); LS.set('mode', 'view'); boot(); }
    catch (er) { renderLogin(er.message === 'Failed to fetch' ? 'Connessione non riuscita.' : er.message, auth); }
  };
  $('#login').onsubmit = async e => {
    e.preventDefault();
    const auth = { owner: $('#lo').value.trim(), repo: $('#lr').value.trim(), token: $('#lt').value.trim() };
    if (!auth.token) return renderLogin('Incolla il token, oppure entra solo per guardare.', auth);
    const b = $('#lbtn'); b.disabled = true; b.innerHTML = `<span class="dot busy"></span>Verifico…`;
    try {
      const be = new GitHubBackend(auth);
      await be.verify();
      LS.set('auth', auth); LS.set('mode', 'github'); LS.set('lastLogin', { owner: auth.owner, repo: auth.repo });
      boot();
    } catch (er) { renderLogin(er.message === 'Failed to fetch' ? 'Connessione non riuscita.' : er.message, auth); }
  };
}

/* ============================================================
   AVVIO
   ============================================================ */
function loadingScreen() {
  $('#app').innerHTML = `<div class="login"><div style="text-align:center"><div class="lhero"><span class="orb"></span><span class="orb o2"></span><div class="logo">${LOGO_SVG(40)}</div></div><p class="mut">Carico i tuoi dati…</p></div></div>`;
}
async function boot() {
  const mode = LS.get('mode'), auth = LS.get('auth');
  if (mode === 'demo') S.backend = new DemoBackend();
  else if (mode === 'github' && auth) { S.auth = auth; S.backend = new GitHubBackend(auth); }
  else if (mode === 'view' && auth) { S.auth = auth; S.backend = new ViewBackend(auth); }
  else return renderLogin();
  loadingScreen();
  try {
    const d = await S.backend.load();
    S.channels = d.channels; S.settings = withDefaults(S.backend.kind === 'view' ? { ...d.settings, ...LS.get('viewSettings', {}) } : d.settings); S.stats = d.stats || { channels: {} };
    if (!S.stats.channels) S.stats.channels = {};
    await studioLoad(d.studio);
    reEnrich(); applyLang(S.settings.lang); applySettings();
    shellKey = '';
    render();
    startAutoReload();
    pcAutoRefresh();
  } catch (e) {
    if (S.backend.kind !== 'demo') { LS.del('mode'); renderLogin(e.message === 'Failed to fetch' ? 'Connessione non riuscita.' : e.message); }
    else { LS.del('demo'); boot(); }
  }
}
// pywebview inietta l'API dopo il caricamento
/* programma per PC: aggiorna da solo all'avvio e ogni 30 minuti se i dati sono vecchi */
let pcTimer = null;
function pcAutoRefresh() {
  if (!S.backend || S.backend.kind !== 'pc') return;
  ttRefreshStatus();
  const stale = () => S.channels.length && (!S.stats.updated_at || Date.now() / 1000 - S.stats.updated_at > 20 * 60);
  if (stale()) refresh();
  clearInterval(pcTimer);
  pcTimer = setInterval(() => { if (stale()) refresh(); }, 5 * 60000);
  updateSyncUI(); shellKey = ''; if ($('#view')) render();
}
window.addEventListener('pywebviewready', () => { if (S.channels) pcAutoRefresh(); });
boot();
