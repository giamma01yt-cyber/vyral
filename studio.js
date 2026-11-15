/* ============================================================
   VYRAL — YouTube Studio
   Dati privati cifrati (AES-GCM + PBKDF2): si sbloccano con la tua password.
   Caricato prima di app.js: usa le sue funzioni solo quando viene chiamato.
   ============================================================ */
'use strict';

const STUDIO = { env: null, data: null, error: null, period: '28', ch: null, metric: 'views', vtab: 'recent', vsort: { k: 'published', d: -1 } };

/* ---------------- cifratura ---------------- */
async function studioDecrypt(env, password) {
  const d = b => Uint8Array.from(atob(b), c => c.charCodeAt(0));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: d(env.salt), iterations: env.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: d(env.iv) }, key, d(env.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
async function studioLoad(env) {
  STUDIO.env = env; STUDIO.error = null;
  if (!env) { STUDIO.data = null; return; }
  if (env.plain) { STUDIO.data = env.plain; return; } // demo
  const pw = LS.get('studioPw');
  if (!pw) { STUDIO.data = null; return; }
  try { STUDIO.data = await studioDecrypt(env, pw); }
  catch { STUDIO.data = null; STUDIO.error = 'La password salvata non è più valida.'; LS.del('studioPw'); }
}
const studioOn = () => !!STUDIO.env;
/* statistiche Studio di un video (per le schede canale) */
function studioVideo(id) {
  for (const c of STUDIO.data?.channels || []) {
    const v = (c.recent_videos || []).find(x => x.video === id) || (c.top_videos || []).find(x => x.video === id);
    if (v) return v;
  }
  return null;
}
const studioChannelByHandle = h => (STUDIO.data?.channels || []).find(c => c.handle && c.handle === String(h).toLowerCase());

/* ---------------- formattazione ---------------- */
const hrs = m => m == null ? '—' : fmt(m / 60);
const secs = s => { if (s == null) return '—'; s = Math.round(s); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; };
const eur = v => v == null ? '—' : v.toLocaleString(LOC(), { style: 'currency', currency: 'EUR', maximumFractionDigits: v < 10 ? 2 : 0 });
const flag = cc => cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '🌍';
const countryName = cc => { try { return new Intl.DisplayNames([I18N.lang], { type: 'region' }).of(cc); } catch { return cc; } };
const ctrP = v => v == null ? null : (v <= 1 ? v * 100 : v);
const isoDur = s => { const m = String(s || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : null; };

/* ---------------- grafico giornaliero ---------------- */
function studioChart(daily, key) {
  const W = 900, H = 240, P = { l: 46, r: 14, t: 16, b: 28 };
  const vals = daily.map(d => key === 'hours' ? (d.estimatedMinutesWatched || 0) / 60 : key === 'subs' ? (d.subscribersGained || 0) - (d.subscribersLost || 0) : key === 'revenue' ? (d.estimatedRevenue || 0) : (d.views || 0));
  if (!vals.length) return '<p class="mut" style="padding:30px;text-align:center">Nessun dato nel periodo.</p>';
  const max = Math.max(...vals, 1), min = Math.min(0, ...vals);
  const x = i => P.l + (vals.length === 1 ? 0 : i / (vals.length - 1)) * (W - P.l - P.r);
  const y = v => P.t + (1 - (v - min) / (max - min || 1)) * (H - P.t - P.b);
  let d = '';
  vals.forEach((v, i) => { d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); });
  const area = d + ` L${x(vals.length - 1)} ${y(min)} L${x(0)} ${y(min)}Z`;
  const ticks = [0, .5, 1].map(t => min + (max - min) * t);
  const f = key === 'revenue' ? eur : fmt;
  const step = Math.max(1, Math.ceil(daily.length / 7));
  return `<svg class="schart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-vals='${JSON.stringify(vals)}' data-days='${JSON.stringify(daily.map(d => d.day))}' data-key="${key}">
    <defs><linearGradient id="sca" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--p1)" stop-opacity=".45"/><stop offset="1" stop-color="var(--p1)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${P.l - 8}" y="${y(t) + 4}" class="yl">${f(t)}</text>`).join('')}
    ${daily.map((dd, i) => i % step === 0 ? `<text x="${x(i)}" y="${H - 8}" class="xl">${new Date(dd.day).toLocaleDateString(LOC(), { day: 'numeric', month: 'short' })}</text>` : '').join('')}
    <path d="${area}" fill="url(#sca)" class="sarea"/><path d="${d}" class="sline"/>
    <line class="hov-l" y1="${P.t}" y2="${H - P.b}" x1="0" x2="0"/><circle class="hov-c" r="5" cx="0" cy="0"/>
  </svg><div class="stip"></div>`;
}
function bindChart(root) {
  const svg = root.querySelector('.schart'); if (!svg) return;
  const vals = JSON.parse(svg.dataset.vals), days = JSON.parse(svg.dataset.days), key = svg.dataset.key;
  const tip = root.querySelector('.stip'), l = svg.querySelector('.hov-l'), c = svg.querySelector('.hov-c');
  const W = 900, H = 240, P = { l: 46, r: 14, t: 16, b: 28 };
  const max = Math.max(...vals, 1), min = Math.min(0, ...vals);
  const f = key === 'revenue' ? eur : key === 'hours' ? (v => fmt(v) + ' h') : fmt;
  svg.onpointermove = e => {
    const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
    const i = clamp(Math.round((px - P.l) / (W - P.l - P.r) * (vals.length - 1)), 0, vals.length - 1);
    const X = P.l + (vals.length === 1 ? 0 : i / (vals.length - 1)) * (W - P.l - P.r), Y = P.t + (1 - (vals[i] - min) / (max - min || 1)) * (H - P.t - P.b);
    l.setAttribute('x1', X); l.setAttribute('x2', X); c.setAttribute('cx', X); c.setAttribute('cy', Y);
    svg.classList.add('hover');
    tip.innerHTML = `<b>${f(vals[i])}</b><span>${new Date(days[i]).toLocaleDateString(LOC(), { weekday: 'short', day: 'numeric', month: 'long' })}</span>`;
    tip.style.left = (X / W * r.width) + 'px'; tip.style.top = (Y / H * r.height) + 'px'; tip.classList.add('on');
  };
  svg.onpointerleave = () => { svg.classList.remove('hover'); tip.classList.remove('on'); };
}

/* ---------------- barre ---------------- */
function bars(rows, { label, value, fmtV = fmt, icon }) {
  const tot = rows.reduce((a, r) => a + (value(r) || 0), 0) || 1, max = Math.max(...rows.map(value), 1);
  return rows.length ? rows.map((r, i) => `<div class="sbar" style="--i:${i}"><div class="top"><span>${icon ? icon(r) : ''}${esc(label(r))}</span><b>${fmtV(value(r))} <small>${pct(value(r) / tot)}</small></b></div><div class="bar"><i data-w="${(value(r) / max * 100).toFixed(1)}%"></i></div></div>`).join('') : '<p class="mut">Nessun dato.</p>';
}

/* ---------------- vista ---------------- */
function viewStudio(v) {
  setPageColor('youtube');
  if (!STUDIO.env) {
    v.innerHTML = `<div class="glass empty rise" style="${pVars('youtube')}"><div class="ill"><div style="--i:0">${ic('chart', 28)}</div></div>
      <h2>YouTube Studio non è ancora collegato</h2>
      <p>Per vedere tempo di visualizzazione, impression, CTR, fonti di traffico e guadagni dei tuoi canali segui la guida <b>"Collega YouTube Studio"</b> nel README del repository (circa 10 minuti, una volta sola).</p>
      ${S.auth ? `<a class="btn primary" href="https://github.com/${esc(S.auth.owner)}/${esc(S.auth.repo)}#collega-youtube-studio" target="_blank" rel="noopener">${ic('ext', 16)}Apri la guida</a>` : ''}</div>`;
    return;
  }
  if (!STUDIO.data) {
    v.innerHTML = `<div class="studio-lock rise"><form class="lcard glass" id="unlock" style="${pVars('youtube')};--p1:#ff2d3d;--p2:#ff7a59">
      <div class="lock-ic"><span class="ring"></span>${ic('key', 34, 1.8)}</div>
      <h1>YouTube Studio</h1><p>I dati del tuo canale sono cifrati.<br>Inserisci la password che hai scelto durante la configurazione.</p>
      <div class="field"><div class="input">${ic('key', 17)}<input id="spw" type="password" placeholder="Password" autocomplete="current-password" autofocus></div></div>
      <button class="btn primary" type="submit" id="sbtn">${ic('check', 17, 2.6)}Sblocca</button>
      ${STUDIO.error ? `<div class="lerr">${esc(STUDIO.error)}</div>` : ''}
      <p class="mut" style="font-size:12px;margin:14px 0 0">Si inserisce una volta per dispositivo.</p></form></div>`;
    $('#unlock').onsubmit = async e => {
      e.preventDefault();
      const b = $('#sbtn'); b.disabled = true; b.innerHTML = '<span class="dot busy"></span>Sblocco…';
      try { STUDIO.data = await studioDecrypt(STUDIO.env, $('#spw').value); LS.set('studioPw', $('#spw').value); STUDIO.error = null; toast('YouTube Studio sbloccato'); render(); }
      catch { STUDIO.error = 'Password sbagliata.'; render(); }
    };
    return;
  }
  const D = STUDIO.data, chans = D.channels || [];
  if (!chans.length) { v.innerHTML = `<div class="glass empty rise"><h2>Nessun canale</h2><p>${esc((D.errors || []).map(e => e.name + ': ' + e.error).join(' · ') || 'Nessun dato ancora.')}</p></div>`; return; }
  const ch = chans.find(c => c.id === STUDIO.ch) || chans[0]; STUDIO.ch = ch.id;
  const P = ch.periods?.[STUDIO.period] || {}, T = P.totals || {};
  const hasRev = T.estimatedRevenue != null;
  const net = (T.subscribersGained || 0) - (T.subscribersLost || 0);
  const kpi = (i, l, val, h, k1, k2, n) => `<div class="kpi glass glow-card rise" style="--i:${n};--k1:${k1};--k2:${k2};--p1:${k1}"><div class="deco"></div><div class="ki">${ic(i, 18)}</div><div class="l">${l}</div><div class="v">${val}</div><div class="h">${h}</div></div>`;
  const kp = [
    kpi('eye', 'Visualizzazioni', cnt(T.views), `${fmt(T.likes)} like · ${fmt(T.comments)} commenti`, '#ff2d3d', '#ff7a59', 1),
    kpi('clock', 'Ore di visualizzazione', T.estimatedMinutesWatched != null ? cnt(T.estimatedMinutesWatched / 60) : '—', `${fmt(T.estimatedMinutesWatched)} minuti`, '#8b7bff', '#5b8cff', 2),
    kpi('play', 'Durata media', secs(T.averageViewDuration), `${T.averageViewPercentage != null ? T.averageViewPercentage.toFixed(1).replace('.', ',') + '% del video' : ''}`, '#22d3ee', '#3b82f6', 3),
    kpi('users', 'Iscritti', net >= 0 ? '+' + cnt(net) : '−' + fmt(-net), `<span class="pos">+${fmt(T.subscribersGained)}</span> · <span style="color:var(--bad)">−${fmt(T.subscribersLost)}</span>`, '#3ddc97', '#14b8a6', 4),
    kpi('grid', 'Impression', cnt(T.videoThumbnailImpressions), 'volte che la miniatura è stata mostrata', '#ffb547', '#ff8a3d', 5),
    kpi('bolt', 'CTR impression', T.videoThumbnailImpressionsClickRate != null ? cnt(ctrP(T.videoThumbnailImpressionsClickRate) / 100, 'p') : '—', 'click sulla miniatura', '#ff6bd6', '#8b7bff', 6),
    kpi('share', 'Condivisioni', cnt(T.shares), `${fmt(ch.total_views)} views totali del canale`, '#94a3b8', '#e2e8f0', 7),
    hasRev ? kpi('trend', 'Guadagni stimati', eur(T.estimatedRevenue), `RPM ${eur(T.views ? T.estimatedRevenue / T.views * 1000 : null)} · CPM ${eur(T.cpm)}`, '#3ddc97', '#ffd36b', 8)
      : kpi('trend', 'Guadagni', '—', 'canale non monetizzato', '#3ddc97', '#ffd36b', 8),
  ].join('');
  const ages = {}; let male = 0, female = 0;
  (P.demographics || []).forEach(r => { ages[r.age] = (ages[r.age] || 0) + r.pct; if (r.gender === 'male') male += r.pct; else if (r.gender === 'female') female += r.pct; });
  const ageRows = Object.entries(ages).map(([age, p]) => ({ age, p })).sort((a, b) => a.age.localeCompare(b.age));
  const subRows = (P.subscribed || []).map(r => ({ l: r.subscribedStatus === 'SUBSCRIBED' ? 'Iscritti' : 'Non iscritti', v: r.views }));
  const vids = (STUDIO.vtab === 'recent' ? ch.recent_videos : ch.top_videos) || [];
  const { k: sk, d: sd } = STUDIO.vsort;
  const sortedV = [...vids].sort((a, b) => { const x = a[sk], y = b[sk]; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sd; });
  const VC = [['title', 'Video'], ['published', 'Pubblicato'], ['views', 'Views', 1], ['estimatedMinutesWatched', 'Ore', 1], ['averageViewDuration', 'Durata media', 1], ['averageViewPercentage', '% vista', 1], ['videoThumbnailImpressions', 'Impression', 1], ['videoThumbnailImpressionsClickRate', 'CTR', 1], ['subscribersGained', 'Iscritti +', 1], ['likes', 'Like', 1]];
  const errs = (ch.errors || []).filter(e => !/guadagni/.test(e));
  const metricOpts = [['views', 'Views'], ['hours', 'Ore'], ['subs', 'Iscritti']].concat(hasRev ? [['revenue', 'Guadagni']] : []);

  v.innerHTML = `
  <div class="pbanner glass rise" style="--i:0;${pVars('youtube')}"><div class="glowbg"></div>
    <div class="row1">
      ${ch.avatar ? `<img class="bi" src="${esc(ch.avatar)}" referrerpolicy="no-referrer" alt="" style="object-fit:cover;padding:0">` : `<div class="bi">${pIcon('youtube', 30)}</div>`}
      <div><h2>${esc(ch.name)}</h2><div class="sub">${esc(ch.handle)} · ${fmt(ch.subscribers)} iscritti · ${fmt(ch.video_count)} video · dati fino al ${new Date(ch.end_date).toLocaleDateString(LOC(), { day: 'numeric', month: 'long' })}</div></div>
      <div class="seg tabs" id="sper">${[['7', '7 giorni'], ['28', '28 giorni'], ['90', '90 giorni']].map(([k, l]) => `<button data-p="${k}" class="${STUDIO.period === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    </div>
    ${chans.length > 1 ? `<div class="seg" id="sch" style="margin-top:18px;position:relative;flex-wrap:wrap">${chans.map(c => `<button data-c="${esc(c.id)}" class="${c.id === ch.id ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div>` : ''}
  </div>
  ${errs.length ? `<div class="err-box soft rise" style="margin:0 0 14px">Alcuni report non sono disponibili: ${esc(errs.slice(0, 3).join(' · '))}</div>` : ''}
  <div class="kpis studio-kpis">${kp}</div>
  <div class="glass schart-wrap rise" style="--i:9">
    <div class="sec-title" style="margin:0 0 6px"><h3>${ic('chart', 19)}Andamento</h3><div class="seg" id="smet">${metricOpts.map(([k, l]) => `<button data-m="${k}" class="${STUDIO.metric === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="schart-box">${studioChart(P.daily || [], STUDIO.metric)}</div>
  </div>
  <div class="sgrid">
    <div class="glass spanel rise" style="--i:10"><h3>${ic('share2', 17)}Da dove arrivano</h3>${bars((P.traffic || []).slice(0, 8), { label: r => r.label, value: r => r.views })}</div>
    <div class="glass spanel rise" style="--i:11"><h3>${ic('home', 17)}Paesi</h3>${bars((P.countries || []).slice(0, 8), { label: r => countryName(r.country), value: r => r.views, icon: r => `<span class="flag">${flag(r.country)}</span>` })}</div>
    <div class="glass spanel rise" style="--i:12"><h3>${ic('users', 17)}Pubblico</h3>
      ${male + female ? `<div class="gender"><div class="gbar"><i style="width:${male}%"></i></div><div class="gl2"><span>👨 Uomini <b>${male.toFixed(1).replace('.', ',')}%</b></span><span>Donne <b>${female.toFixed(1).replace('.', ',')}%</b> 👩</span></div></div>` : ''}
      ${bars(ageRows, { label: r => r.age + ' anni', value: r => r.p, fmtV: x => x.toFixed(1).replace('.', ',') + '%' })}</div>
    <div class="glass spanel rise" style="--i:13"><h3>${ic('pc', 17)}Dispositivi e iscritti</h3>${bars(P.devices || [], { label: r => r.label, value: r => r.views })}<div style="height:12px"></div>${bars(subRows, { label: r => r.l, value: r => r.v })}</div>
  </div>
  <div class="sec-title rise" style="--i:14"><h3>${ic('play', 18)}Video</h3><div class="seg" id="svt"><button data-t="recent" class="${STUDIO.vtab === 'recent' ? 'on' : ''}">Ultimi caricati</button><button data-t="top" class="${STUDIO.vtab === 'top' ? 'on' : ''}">Più visti (28 g)</button></div></div>
  <div class="glass twrap rise" style="--i:15;${pVars('youtube')}"><table><thead><tr>${VC.map(([k, l, n]) => `<th class="s ${n ? 'num' : ''} ${sk === k ? 'on' : ''}" data-k="${k}">${l}${sk === k ? (sd < 0 ? ' ↓' : ' ↑') : ''}</th>`).join('')}</tr></thead>
  <tbody>${sortedV.map((r, i) => `<tr style="--i:${Math.min(i, 20)}">
    <td><a class="tvid" href="https://youtu.be/${esc(r.video)}" target="_blank" rel="noopener">${imgTag(r.thumbnail)}<div><div class="tt">${esc(r.title || r.video)}</div><div class="tc">${r.duration ? secs(isoDur(r.duration)) : ''}</div></div></a></td>
    <td class="mut">${r.published ? ago(Date.parse(r.published) / 1000) : '—'}</td>
    <td class="num"><b>${fmt(r.views)}</b></td><td class="num">${hrs(r.estimatedMinutesWatched)}</td><td class="num">${secs(r.averageViewDuration)}</td>
    <td class="num"><div class="vbar"><span>${r.averageViewPercentage != null ? r.averageViewPercentage.toFixed(0) + '%' : '—'}</span><span class="track"><i style="width:${Math.min(100, r.averageViewPercentage || 0)}%"></i></span></div></td>
    <td class="num">${fmt(r.videoThumbnailImpressions)}</td><td class="num">${r.videoThumbnailImpressionsClickRate != null ? ctrP(r.videoThumbnailImpressionsClickRate).toFixed(1).replace('.', ',') + '%' : '—'}</td>
    <td class="num pos">${r.subscribersGained ? '+' + fmt(r.subscribersGained) : '—'}</td><td class="num">${fmt(r.likes)}</td></tr>`).join('') || `<tr><td colspan="10" class="mut" style="text-align:center;padding:40px">Nessun video.</td></tr>`}</tbody></table></div>
  <p class="mut" style="text-align:center;font-size:12px;margin:22px 0">YouTube Studio fornisce i dati con 1–3 giorni di ritardo · aggiornati ${ago(D.updated_at)}</p>`;

  const re = () => { viewStudio(v); countUp(v); initSegs(v); requestAnimationFrame(() => $$('.sbar .bar i', v).forEach(i => i.style.width = i.dataset.w)); };
  $$('#sper button', v).forEach(b => b.onclick = () => { STUDIO.period = b.dataset.p; re(); });
  $$('#sch button', v).forEach(b => b.onclick = () => { STUDIO.ch = b.dataset.c; re(); });
  $$('#smet button', v).forEach(b => b.onclick = () => { STUDIO.metric = b.dataset.m; $$('#smet button', v).forEach(x => x.classList.toggle('on', x === b)); initSegs(v); $('.schart-box', v).innerHTML = studioChart(P.daily || [], STUDIO.metric); bindChart(v); });
  $$('#svt button', v).forEach(b => b.onclick = () => { STUDIO.vtab = b.dataset.t; re(); });
  $$('th[data-k]', v).forEach(th => th.onclick = () => { const k = th.dataset.k; STUDIO.vsort = STUDIO.vsort.k === k ? { k, d: -STUDIO.vsort.d } : { k, d: k === 'title' ? 1 : -1 }; re(); });
  bindChart(v);
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.sbar .bar i', v).forEach(i => i.style.width = i.dataset.w)));
}

/* ---------------- dati finti per la demo ---------------- */
function studioDemo() {
  const now = Math.floor(Date.now() / 1000), end = new Date(Date.now() - 86400000);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mk = (name, handle, base) => {
    const periods = {};
    for (const n of [7, 28, 90]) {
      const daily = Array.from({ length: n }, (_, i) => { const d = new Date(end - (n - 1 - i) * 86400000); const v = Math.round(base * (0.5 + rnd() + i / n)); return { day: d.toISOString().slice(0, 10), views: v, estimatedMinutesWatched: Math.round(v * (.3 + rnd() * .4)), subscribersGained: Math.round(v / 180 * (1 + rnd())), subscribersLost: Math.round(v / 900 * rnd()), estimatedRevenue: +(v / 1000 * (0.2 + rnd() * .5)).toFixed(2) }; });
      const sum = k => daily.reduce((a, d) => a + d[k], 0);
      periods[n] = {
        totals: { views: sum('views'), estimatedMinutesWatched: sum('estimatedMinutesWatched'), averageViewDuration: 21 + rnd() * 14, averageViewPercentage: 62 + rnd() * 30, subscribersGained: sum('subscribersGained'), subscribersLost: sum('subscribersLost'), likes: Math.round(sum('views') * .04), comments: Math.round(sum('views') * .003), shares: Math.round(sum('views') * .004), videoThumbnailImpressions: Math.round(sum('views') * 3.4), videoThumbnailImpressionsClickRate: 4 + rnd() * 5, estimatedRevenue: +sum('estimatedRevenue').toFixed(2), cpm: 3.1 },
        daily,
        traffic: [['SHORTS', 'Feed Shorts', .62], ['YT_SEARCH', 'Ricerca YouTube', .14], ['BROWSE', 'Home e feed', .1], ['SUGGESTED', 'Video suggeriti', .08], ['CHANNEL', 'Pagina del canale', .04], ['EXT_URL', 'Siti esterni', .02]].map(([k, label, p]) => ({ k, label, views: Math.round(sum('views') * p) })),
        countries: [['IT', .48], ['US', .12], ['DE', .07], ['FR', .06], ['ES', .05], ['GB', .04], ['BR', .03], ['CH', .02]].map(([c, p]) => ({ country: c, views: Math.round(sum('views') * p) })),
        devices: [['Telefono', .81], ['Computer', .11], ['Tablet', .05], ['TV', .03]].map(([label, p]) => ({ label, views: Math.round(sum('views') * p) })),
        demographics: [['13-17', 'male', 31], ['18-24', 'male', 28], ['25-34', 'male', 12], ['35-44', 'male', 4], ['13-17', 'female', 11], ['18-24', 'female', 9], ['25-34', 'female', 4], ['35-44', 'female', 1]].map(([age, gender, pct]) => ({ age, gender, pct })),
        subscribed: [{ subscribedStatus: 'UNSUBSCRIBED', views: Math.round(sum('views') * .86) }, { subscribedStatus: 'SUBSCRIBED', views: Math.round(sum('views') * .14) }],
      };
    }
    const titles = ['How I Got The Pirate Shop Access For FREE!', 'I To Find The Pirate Shop Access!', 'Red vs Blue ma ogni kill vale doppio', 'Box fight 1v1 contro un pro', 'Il mio livello sale troppo velocemente…', 'Nuovo update della mappa!'];
    const vids = titles.map((t, i) => { const v = Math.round(base * 6 * (0.3 + rnd() * 2)); return { video: 'demo' + handle + i, title: t, published: new Date(Date.now() - (i * 1.7 + .5) * 86400000).toISOString(), thumbnail: null, duration: 'PT' + (20 + i * 7) + 'S', views: v, estimatedMinutesWatched: Math.round(v * .4), averageViewDuration: 15 + rnd() * 20, averageViewPercentage: 55 + rnd() * 45, videoThumbnailImpressions: Math.round(v * 3), videoThumbnailImpressionsClickRate: 3 + rnd() * 7, subscribersGained: Math.round(v / 150), likes: Math.round(v * .04) }; });
    return { id: 'UC' + handle, handle: '@' + handle.toLowerCase(), name, avatar: null, subscribers: base * 9, total_views: base * 400, video_count: 48, end_date: end.toISOString().slice(0, 10), periods, recent_videos: vids, top_videos: [...vids].sort((a, b) => b.views - a.views), errors: [] };
  };
  return { updated_at: now, channels: [mk('Bryzee6', 'Bryzee6', 300), mk('Giqmmq Clips', 'GiqmmqClips', 90)], errors: [] };
}
