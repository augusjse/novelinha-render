// Novelinha · kit "noite na cidade": prédio no temporal, janela com a avenida, celular (alerta, grupo, bateria),
// quarto escuro, torneira, portão, tela de texto. Chuva e relâmpago funcionam em qualquer cena desse kit.
module.exports = function (h) {
  const { W, H, C, F, clamp, lerp, eo, eob, rr, shade, getCtx } = h;
  let ctx;

  /* ---------- clima ---------- */
  const DROPS = Array.from({ length: 260 }, (_, i) => ({ x: (i * 397.13) % 1, y: (i * 613.71) % 1, v: .8 + ((i * 7.31) % 1) * .9, l: 40 + ((i * 3.7) % 1) * 70 }));
  function rain(t, k = 1) {
    ctx.save(); ctx.strokeStyle = `rgba(170,195,230,${.22 * k})`; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath();
    for (const d of DROPS) {
      const y = ((d.y * (H + 200) + t * 1700 * d.v) % (H + 200)) - 100, x = (d.x * (W + 300) - y * .18 + 2000) % (W + 300) - 150;
      ctx.moveTo(x, y); ctx.lineTo(x - d.l * .18, y + d.l);
    }
    ctx.stroke(); ctx.restore();
  }
  // intensidade do relâmpago (0 a 1) a partir do segundo "at" da cena
  function flash(lt, at) {
    if (at == null) return 0;
    const ats = Array.isArray(at) ? at : [at]; let v = 0;
    for (const a of ats) { const d = lt - a; if (d < 0) continue;
      v = Math.max(v, d < .07 ? 1 : d < .15 ? .25 : d < .24 ? .95 : Math.exp(-(d - .24) * 4.5)); }
    return v;
  }
  function flashOverlay(L) { if (L <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(190,210,255,${.55 * L})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  /* ---------- gente vista de cima ---------- */
  function runner(x, y, s, t, ph, back, cor) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const a = Math.sin(t * 16 + ph);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 4, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    const body = cor || '#3a4352'; ctx.strokeStyle = shade(body, -.35); ctx.lineCap = 'round'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(a * 16, 0); ctx.moveTo(0, -46); ctx.lineTo(-a * 16, 0); ctx.stroke();
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(-a * 18, -52); ctx.moveTo(0, -80); ctx.lineTo(a * 18, -52); ctx.stroke();
    ctx.fillStyle = body; rr(-13, -88, 26, 46, 10); ctx.fill(); ctx.strokeStyle = 'rgba(160,190,240,.6)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#5a4a40'; ctx.beginPath(); ctx.arc(back ? -5 : 4, -100, 13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // gente parada olhando pra cima (rosto pálido, dois olhos)
  const CROWD = Array.from({ length: 64 }, (_, i) => { const r1 = (i * 0.6180339) % 1, r2 = (i * 0.414213 + .13) % 1; return { x: r1, y: Math.pow(r2, .8), ph: i * 1.7 }; });
  function crowd(t, vis, L, near) {
    if (vis <= 0) return;
    ctx.save();
    const y0 = near ? 900 : 1060, y1 = near ? 2250 : 1860;
    const list = CROWD.map(p => ({ ...p, Y: lerp(y0, y1, p.y) })).sort((a, b) => a.Y - b.Y);
    for (const p of list) {
      const s = lerp(near ? 1.3 : .38, near ? 3.6 : 1.05, p.y), spread = lerp(near ? 1000 : 560, near ? 1900 : 1180, p.y);
      const x = 540 + (p.x - .5) * spread, y = p.Y, sway = Math.sin(t * .8 + p.ph) * 1.2;
      ctx.save(); ctx.translate(x + sway, y); ctx.scale(s, s); ctx.globalAlpha = vis;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
      const body = shade('#1a1f29', L * .5);
      ctx.fillStyle = body; rr(-20, -96, 40, 96, 16); ctx.fill();
      ctx.fillStyle = shade('#232a36', L * .55); ctx.beginPath(); ctx.ellipse(0, -114, 17, 15, 0, 0, Math.PI * 2); ctx.fill();
      // rosto virado pra cima
      ctx.fillStyle = `rgba(${Math.round(150 + 90 * L)},${Math.round(150 + 85 * L)},${Math.round(160 + 80 * L)},${.55 + .45 * L})`;
      ctx.beginPath(); ctx.ellipse(0, -122, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#05070a'; ctx.beginPath(); ctx.ellipse(-4.5, -125, 2.4, 3.2, 0, 0, Math.PI * 2); ctx.ellipse(4.5, -125, 2.4, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      if (near) { ctx.fillStyle = 'rgba(10,8,10,.7)'; ctx.beginPath(); ctx.ellipse(0, -116.5, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- a avenida vista do 9º andar ---------- */
  function avenue(t, L, dark) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, shade('#0f1626', L * .6)); g.addColorStop(.42, shade('#18223a', L * .55)); g.addColorStop(1, shade('#141b28', L * .5));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // prédios do outro lado, todos apagados
    for (let i = 0; i < 6; i++) {
      const x = -40 + i * 200, w = 180, top = 160 + ((i * 137) % 5) * 60;
      ctx.fillStyle = shade('#121a2b', L * .45); ctx.fillRect(x, top, w, 760 - top);
      ctx.fillStyle = shade('#151c28', L * .4);
      for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) { const yy = top + 30 + r * 52; if (yy < 740) ctx.fillRect(x + 18 + c * 42, yy, 26, 30); }
    }
    // calçada e avenida
    ctx.fillStyle = shade('#151a22', L * .5); ctx.fillRect(0, 760, W, 120);
    const rg = ctx.createLinearGradient(0, 880, 0, H); rg.addColorStop(0, shade('#1c2433', L * .5)); rg.addColorStop(1, shade('#2a3445', L * .5));
    ctx.fillStyle = rg; ctx.fillRect(0, 880, W, H - 880);
    ctx.fillStyle = shade('#c9b04a', L * .3); ctx.globalAlpha = .55;
    for (let k = 0; k < 7; k++) { ctx.fillRect(110 + k * 150, 1360, 90, 12); }
    ctx.globalAlpha = 1;
    // reflexo molhado
    ctx.fillStyle = `rgba(150,180,220,${.07 + .25 * L})`;
    for (let k = 0; k < 9; k++) ctx.fillRect(60 + k * 118, 900, 6, 1000);
    ctx.fillStyle = 'rgba(220,225,235,.5)'; for (let k = 0; k < 9; k++) ctx.fillRect(40 + k * 120, 1560, 70, 160);
    // postes apagados
    for (let k = 0; k < 4; k++) { const x = 120 + k * 280; ctx.fillStyle = '#07090c'; ctx.fillRect(x, 640, 10, 250); ctx.fillRect(x, 640, 60, 10); }
    if (dark) { ctx.fillStyle = `rgba(0,0,0,${dark * (1 - L)})`; ctx.fillRect(0, 0, W, H); }
  }
  const GLASS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 0.7548776) % 1, y: (i * 0.5698403) % 1, r: 5 + ((i * 3.1) % 1) * 9, v: ((i * 1.37) % 1) * 40 }));
  function windowFrame(t, L, sill) {
    // gotas no vidro
    ctx.save();
    for (const d of GLASS) {
      const x = 90 + d.x * 900, y = (170 + d.y * 1500 + t * d.v) % 1750 + 120;
      ctx.fillStyle = `rgba(200,220,255,${.10 + .3 * L})`; ctx.beginPath(); ctx.ellipse(x, y, d.r * .7, d.r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${.18 + .4 * L})`; ctx.beginPath(); ctx.arc(x - d.r * .25, y - d.r * .35, d.r * .25, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // moldura
    const fr = shade('#0b0d11', L * .35);
    ctx.fillStyle = fr; ctx.fillRect(0, 0, W, 110); ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H); ctx.fillRect(522, 0, 36, H);
    ctx.fillRect(0, 1700, W, H - 1700);
    ctx.strokeStyle = shade('#1c2230', L * .5); ctx.lineWidth = 6; ctx.strokeRect(70, 110, 452, 1590); ctx.strokeRect(558, 110, 452, 1590);
    if (sill) {
      ctx.fillStyle = shade('#1a1e26', L * .4); ctx.fillRect(0, 1690, W, 40);
      // panela
      ctx.save(); ctx.translate(300, 1690);
      ctx.fillStyle = shade('#6b7280', L * .5); ctx.beginPath(); ctx.moveTo(-110, -90); ctx.lineTo(-96, 0); ctx.lineTo(96, 0); ctx.lineTo(110, -90); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade('#9aa3b2', L * .5); ctx.beginPath(); ctx.ellipse(0, -90, 110, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,160,210,.55)'; ctx.beginPath(); ctx.ellipse(0, -84, 96, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20242c'; ctx.fillRect(110, -84, 70, 12);
      ctx.restore();
      // balde
      ctx.save(); ctx.translate(780, 1690);
      ctx.fillStyle = shade('#2f6fd0', L * .4); ctx.beginPath(); ctx.moveTo(-100, -170); ctx.lineTo(-80, 0); ctx.lineTo(80, 0); ctx.lineTo(100, -170); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade('#4c8ae6', L * .4); ctx.beginPath(); ctx.ellipse(0, -170, 100, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,170,230,.6)'; ctx.beginPath(); ctx.ellipse(0, -160, 86, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -170, 100, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------- prédio no temporal ---------- */
  function building(c, lt, t, L) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade('#070a12', L * .7)); g.addColorStop(1, shade('#0d121b', L * .5));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // vizinhos
    [[-60, 520, 300], [800, 640, 340]].forEach(([x, top, w]) => { ctx.fillStyle = shade('#0b0f17', L * .45); ctx.fillRect(x, top, w, H - top); });
    const bx = 250, bw = 580, top = 330, rows = 14, rowH = 108;
    const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, shade('#28324a', L * .5)); bg.addColorStop(1, shade('#161d2b', L * .5));
    ctx.fillStyle = bg; ctx.fillRect(bx, top, bw, H - top);
    ctx.fillStyle = shade('#0c1018', L * .4); ctx.fillRect(bx - 10, top - 20, bw + 20, 24);
    // luz do prédio
    const at = c.apaga_em;
    let on = c.luz === 'acesa' ? 1 : c.luz === 'apagando' ? (lt < at ? 1 : lt < at + .5 ? (Math.sin(lt * 70) > 0 ? .7 : .1) : 0) : 0;
    const hot = c.andar_aceso; // andar (contando de baixo) com a luz fria do celular
    for (let r = 0; r < rows; r++) for (let k = 0; k < 4; k++) {
      const andar = rows - r, x = bx + 40 + k * 136, y = top + 30 + r * rowH;
      const lit = on * (((r * 7 + k * 3) % 5) > 1 ? 1 : .35);
      ctx.fillStyle = shade('#0f1420', L * .4); ctx.fillRect(x, y, 100, 72); ctx.fillStyle = 'rgba(140,170,220,.08)'; ctx.fillRect(x, y, 100, 18);
      if (lit > 0) { ctx.fillStyle = `rgba(255,196,120,${.8 * lit})`; ctx.fillRect(x, y, 100, 72); }
      if (hot && andar === hot && k === 1) {
        const pu = .75 + .25 * Math.sin(t * 2.4);
        ctx.save(); ctx.shadowColor = '#9cc4ff'; ctx.shadowBlur = 60 * pu; ctx.fillStyle = `rgba(170,205,255,${.85 * pu})`; ctx.fillRect(x, y, 100, 72); ctx.restore();
        if (c.marcar_andar) { ctx.strokeStyle = C.alert; ctx.lineWidth = 6; ctx.strokeRect(x - 16, y - 16, 132, 104);
          ctx.font = `48px ${F.hud}`; ctx.fillStyle = C.alert; ctx.textAlign = 'left'; ctx.fillText('9º ANDAR', x + 140, y + 54); }
      }
    }
    // rua embaixo
    ctx.fillStyle = shade('#0b0e13', L * .5); ctx.fillRect(0, 1800, W, 120);
    if (c.multidao) crowdAtBase(t, L);
  }
  function crowdAtBase(t, L) {
    for (let i = 0; i < 40; i++) {
      const x = 30 + ((i * 0.618) % 1) * 1020, y = 1830 + ((i * 0.37) % 1) * 80, s = .45 + ((i * .29) % 1) * .2;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = shade('#151a22', L * .4); rr(-18, -90, 36, 90, 14); ctx.fill();
      ctx.fillStyle = `rgba(200,205,215,${.45 + .5 * L})`; ctx.beginPath(); ctx.ellipse(0, -106, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- celular ---------- */
  function phoneFrame(x, y, s, shake, drawScreen, bat) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#0c0e12'; rr(-232, -472, 464, 944, 72); ctx.fill(); ctx.strokeStyle = '#2d323c'; ctx.lineWidth = 6; ctx.stroke();
    ctx.save(); rr(-210, -448, 420, 896, 56); ctx.clip(); drawScreen();
    // barra de status
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `600 22px ${F.ui}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(bat.hora || '', -170, -414);
    if (bat.pct != null) {
      ctx.textAlign = 'right'; ctx.fillText(`${bat.pct}%`, 120, -414);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; rr(130, -426, 42, 22, 5); ctx.stroke();
      ctx.fillStyle = bat.pct <= 40 ? C.alert : '#fff'; rr(133, -423, 36 * bat.pct / 100, 16, 3); ctx.fill();
    }
    if (bat.aviao) { ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.font = `26px ${F.cap}`; ctx.fillText('✈', 60, -412); }
    ctx.restore();
    ctx.fillStyle = '#000'; rr(-62, -432, 124, 28, 14); ctx.fill();
    ctx.restore();
  }
  function wrap(text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL; }
    if (cur) lines.push(cur); return lines;
  }

  /* ---------- texto grande no meio ---------- */
  function bigText(c, lt) {
    const text = c.grande || c.texto || '';
    ctx.save(); ctx.font = `92px ${F.cap}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    const words = text.split(/\s+/), space = ctx.measureText(' ').width, lines = []; let cur = [], w = 0;
    words.forEach((wd, i) => { const ww = ctx.measureText(wd).width; if (cur.length && w + space + ww > 880) { lines.push({ items: cur, w }); cur = []; w = 0; } w += (cur.length ? space : 0) + ww; cur.push({ wd, i, ww }); });
    if (cur.length) lines.push({ items: cur, w });
    const per = c.voz_dur ? c.voz_dur * .8 / words.length : .22, lh = 112, y0 = 1010 - (lines.length - 1) * lh / 2;
    const hi = {}; Object.entries(c.destaques || {}).forEach(([k, v]) => hi[k.toLowerCase()] = v);
    const HIc = { amarelo: C.sodium, vermelho: C.alert, verde: C.money, azul: C.blue };
    lines.forEach((ln, li) => { let x = 540 - ln.w / 2; ln.items.forEach(it => {
      const q = clamp((lt - it.i * per) / .2);
      if (q > 0) { const key = it.wd.toLowerCase().replace(/[.,!?;:]+$/, ''); ctx.save(); ctx.globalAlpha = q; ctx.translate(x, y0 + li * lh + (1 - eo(q)) * 30);
        ctx.fillStyle = HIc[hi[key]] || '#f4f6fa'; ctx.fillText(it.wd, 0, 0); ctx.restore(); }
      x += it.ww + space; }); });
    ctx.restore();
  }

  const KIT = {
    predio_noite(c, lt, p, t) {
      const L = flash(lt, c.relampago_em);
      building(c, lt, t, L);
      if (c.chuva !== false) rain(t, 1);
      flashOverlay(L);
    },
    janela(c, lt, p, t) {
      const L = flash(lt, c.relampago_em);
      avenue(t, L, c.breu ? .55 : 0);
      // corredores: [{ em, de: 'esq'|'dir', atras: true }]
      (c.corredores || []).forEach((r, i) => {
        const em = r.em ?? 0, dur = r.dur ?? 2.6, q = clamp((lt - em) / dur);
        if (q <= 0 || q >= 1) return;
        const fromL = (r.de || 'esq') === 'esq';
        const x = fromL ? lerp(-80, 1160, q) : lerp(1160, -80, q), y = (r.y ?? 1240) + i * 26;
        ctx.save(); if (!fromL) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
        runner(x, y, r.s ?? 2.1, t, i * 1.3, r.olha, r.cor || (i === 0 ? '#d9dee8' : '#3a4352'));
        ctx.restore();
      });
      // multidão: 'relampago' só aparece com o clarão; 'visivel' fica à vista; 'perto' fica à vista e mais perto
      const m = c.multidao;
      if (m) { const vis = m === 'relampago' ? clamp(L * 1.6) : clamp(.55 + L); crowd(t, vis, Math.max(L, m === 'relampago' ? 0 : .15), m === 'perto'); }
      if (c.chuva !== false) rain(t, .8);
      flashOverlay(L * .6);
      windowFrame(t, L, c.parapeito);
    },
    quarto_escuro(c, lt, p, t) {
      const L = flash(lt, c.relampago_em);
      ctx.fillStyle = shade('#06080d', L * .5); ctx.fillRect(0, 0, W, H);
      // janela na parede com chuva
      ctx.save(); ctx.beginPath(); ctx.rect(560, 380, 400, 620); ctx.clip();
      ctx.fillStyle = shade('#0d1320', L * .7); ctx.fillRect(560, 380, 400, 620);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = shade('#0a0f18', L * .5); ctx.fillRect(570 + k * 100, 640 + (k % 2) * 80, 80, 400); }
      ctx.translate(0, 0); rain(t, .7); ctx.restore();
      ctx.strokeStyle = shade('#1a1f2a', L * .4); ctx.lineWidth = 16; ctx.strokeRect(560, 380, 400, 620); ctx.beginPath(); ctx.moveTo(760, 380); ctx.lineTo(760, 1000); ctx.stroke();
      // luz da janela no chão
      ctx.fillStyle = `rgba(120,150,200,${.05 + .3 * L})`; ctx.beginPath(); ctx.moveTo(560, 1000); ctx.lineTo(960, 1000); ctx.lineTo(1080, 1600); ctx.lineTo(380, 1600); ctx.closePath(); ctx.fill();
      // cama
      ctx.fillStyle = shade('#121722', L * .4); rr(60, 1260, 640, 260, 30); ctx.fill();
      ctx.fillStyle = shade('#1b2230', L * .4); rr(80, 1200, 220, 110, 40); ctx.fill();
      ctx.fillStyle = shade('#182030', L * .45); ctx.beginPath(); ctx.moveTo(260, 1250); ctx.quadraticCurveTo(520, 1180, 700, 1270); ctx.lineTo(700, 1420); ctx.lineTo(260, 1420); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#07090d'; ctx.fillRect(60, 1500, 640, 30);
      if (c.celular) {
        const pu = .8 + .2 * Math.sin(t * 3);
        const g = ctx.createRadialGradient(420, 1240, 10, 420, 1000, 650); g.addColorStop(0, `rgba(150,190,255,${.5 * pu})`); g.addColorStop(1, 'rgba(150,190,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 300, W, 1300);
        ctx.fillStyle = `rgba(200,225,255,${.9 * pu})`; rr(392, 1226, 56, 30, 6); ctx.fill();
      }
      flashOverlay(L * .5);
    },
    celular_alerta(c, lt, p, t) {
      ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
      const pu = .5 + .5 * Math.sin(t * 9);
      const g = ctx.createRadialGradient(540, 1100, 50, 540, 1100, 900); g.addColorStop(0, `rgba(255,60,70,${.22 + .2 * pu})`); g.addColorStop(1, 'rgba(255,60,70,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const shake = lt < 2.5 ? Math.sin(t * 90) * 6 : 0;
      phoneFrame(540 + shake, 1180, 1.05, 0, () => {
        ctx.fillStyle = '#0d1016'; ctx.fillRect(-210, -448, 420, 896);
        const ap = clamp(eob(clamp(lt / .4)), 0, 1.1);
        ctx.save(); ctx.translate(0, -120); ctx.scale(ap, ap);
        ctx.fillStyle = '#f2f3f5'; rr(-190, -200, 380, 470, 34); ctx.fill();
        ctx.fillStyle = C.alert; rr(-190, -200, 380, 84, [34, 34, 0, 0]); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `30px ${F.cap}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.alerta_titulo || 'ALERTA EXTREMO', 0, -158);
        ctx.fillStyle = '#14161b'; ctx.font = `30px ${F.cap}`; ctx.fillText(c.alerta_de || 'Defesa Civil', 0, -80);
        ctx.font = `600 26px ${F.ui}`; ctx.fillStyle = '#2a2d35'; ctx.textAlign = 'left';
        wrap(c.alerta_texto || '', 320).forEach((ln, i) => ctx.fillText(ln, -160, -24 + i * 38));
        ctx.restore();
      }, { hora: c.hora_tela || '', pct: c.bateria });
      // ondas de vibração
      for (let k = 0; k < 2; k++) { const q = ((t * 1.8 + k / 2) % 1); ctx.strokeStyle = `rgba(255,80,90,${.45 * (1 - q)})`; ctx.lineWidth = 8; rr(540 - 250 - q * 120, 1180 - 500 - q * 120, 500 + q * 240, 1000 + q * 240, 80); ctx.stroke(); }
    },
    celular_grupo(c, lt, p, t) {
      ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(540, 1150, 50, 540, 1150, 800); g.addColorStop(0, 'rgba(120,170,255,.16)'); g.addColorStop(1, 'rgba(120,170,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const msgs = c.mensagens || [], n = msgs.length, gap = c.intervalo ?? Math.max(.35, ((c.voz_dur || c.dur || 3) - .4) / Math.max(1, n));
      phoneFrame(540, 1160, 1.05, 0, () => {
        ctx.fillStyle = '#0e1621'; ctx.fillRect(-210, -448, 420, 896);
        ctx.fillStyle = '#1b2a3a'; ctx.fillRect(-210, -400, 420, 92);
        ctx.fillStyle = '#4b6b8c'; ctx.beginPath(); ctx.arc(-160, -354, 26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `600 26px ${F.ui}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(c.grupo || 'Condomínio Bela Vista', -120, -368);
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `600 20px ${F.ui}`; ctx.fillText(c.grupo_sub || '128 participantes', -120, -336);
        // bolhas: as mais novas embaixo, as antigas sobem
        const shown = msgs.map((m, i) => ({ ...m, q: clamp((lt - .2 - i * gap) / .25) })).filter(m => m.q > 0);
        let y = 400; ctx.font = `600 24px ${F.ui}`;
        for (let i = shown.length - 1; i >= 0 && y > -300; i--) {
          const m = shown[i], lines = m.audio ? [''] : wrap(m.texto, 300), h = 56 + lines.length * 32;
          y -= h + 14;
          ctx.save(); ctx.globalAlpha = m.q; ctx.translate(0, (1 - eo(m.q)) * 40);
          ctx.fillStyle = '#1f2c3a'; rr(-190, y, 360, h, 18); ctx.fill();
          ctx.fillStyle = m.cor || ['#6fd3a0', '#f2a63b', '#8fb8ff', '#ff8fa3'][i % 4]; ctx.font = `600 20px ${F.ui}`; ctx.fillText(m.de || 'Vizinho', -170, y + 24);
          ctx.fillStyle = '#e8edf3'; ctx.font = `600 24px ${F.ui}`;
          if (m.audio) {
            ctx.fillStyle = '#6fd3a0'; ctx.beginPath(); ctx.arc(-150, y + 62, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#0e1621'; ctx.beginPath(); ctx.moveTo(-156, y + 52); ctx.lineTo(-142, y + 62); ctx.lineTo(-156, y + 72); ctx.closePath(); ctx.fill();
            for (let k = 0; k < 18; k++) { const hh = 8 + Math.abs(Math.sin(k * 1.9)) * 26; ctx.fillStyle = '#9fb3c8'; rr(-118 + k * 13, y + 62 - hh / 2, 7, hh, 3); ctx.fill(); }
            ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `600 18px ${F.ui}`; ctx.fillText(m.texto || '0:47', 120, y + 64);
          } else lines.forEach((ln, k) => ctx.fillText(ln, -170, y + 62 + k * 32));
          ctx.restore();
        }
      }, { hora: c.hora_tela || '', pct: c.bateria });
    },
    celular_bateria(c, lt, p, t) {
      ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H);
      const off = c.apagar_em != null && lt > c.apagar_em, q = c.apagar_em != null ? clamp((lt - c.apagar_em) / .35) : 0;
      if (!off || q < 1) {
        const g = ctx.createRadialGradient(540, 1150, 50, 540, 1150, 800); g.addColorStop(0, `rgba(255,80,90,${.18 * (1 - q)})`); g.addColorStop(1, 'rgba(255,80,90,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      const av = c.aviao_em != null && lt > c.aviao_em, br = c.brilho_em != null ? clamp((lt - c.brilho_em) / .6) : 0;
      phoneFrame(540, 1160, 1.05, 0, () => {
        ctx.fillStyle = '#10131a'; ctx.fillRect(-210, -448, 420, 896);
        ctx.fillStyle = C.alert; ctx.font = `150px ${F.hud}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${c.bateria ?? 38}%`, 0, -190);
        ctx.strokeStyle = '#e8edf3'; ctx.lineWidth = 8; rr(-120, -80, 220, 100, 18); ctx.stroke(); ctx.fillStyle = '#e8edf3'; rr(104, -46, 18, 32, 5); ctx.fill();
        ctx.fillStyle = C.alert; rr(-110, -70, 200 * (c.bateria ?? 38) / 100, 80, 10); ctx.fill();
        [['Modo avião', av], ['Brilho mínimo', br >= 1]].forEach(([lab, on], i) => {
          const y = 110 + i * 100; ctx.fillStyle = '#1b2029'; rr(-180, y - 40, 360, 80, 20); ctx.fill();
          ctx.fillStyle = '#e8edf3'; ctx.font = `600 26px ${F.ui}`; ctx.textAlign = 'left'; ctx.fillText(lab, -150, y + 2);
          ctx.fillStyle = on ? C.money : '#3a404c'; rr(70, y - 22, 84, 44, 22); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(on ? 132 : 92, y, 18, 0, Math.PI * 2); ctx.fill();
        });
        if (br > 0) { ctx.fillStyle = `rgba(0,0,0,${.45 * br})`; ctx.fillRect(-210, -448, 420, 896); }
        if (q > 0) { ctx.fillStyle = `rgba(0,0,0,${q})`; ctx.fillRect(-210, -448, 420, 896); }
      }, { hora: c.hora_tela || '', pct: c.bateria ?? 38, aviao: av });
    },
    torneira(c, lt, p, t) {
      ctx.fillStyle = '#0b0e14'; ctx.fillRect(0, 0, W, H);
      // azulejos
      ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 3;
      for (let y = 300; y < 1250; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, 1250); ctx.stroke(); }
      const g = ctx.createRadialGradient(540, 900, 30, 540, 900, 800); g.addColorStop(0, 'rgba(150,180,220,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // bancada e pia
      ctx.fillStyle = '#1b2029'; ctx.fillRect(0, 1250, W, 70); ctx.fillStyle = '#12161d'; ctx.fillRect(0, 1320, W, 600);
      ctx.fillStyle = '#2a313d'; rr(300, 1230, 480, 60, 20); ctx.fill(); ctx.fillStyle = '#0a0c10'; rr(330, 1240, 420, 36, 16); ctx.fill();
      // torneira
      ctx.fillStyle = '#9aa4b4'; rr(520, 860, 40, 380, 14); ctx.fill(); rr(400, 840, 160, 44, 20); ctx.fill(); rr(390, 840, 44, 80, 14); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(528, 880, 8, 340);
      const mode = c.modo || 'enchendo', stop = c.para_em ?? 1;
      let flow = mode === 'enchendo' ? 1 : mode === 'parando' ? (lt < stop ? 1 : lt < stop + .9 ? (Math.sin(lt * 26) > .3 ? .8 : 0) : 0) : 0;
      if (flow > 0) {
        const wg = ctx.createLinearGradient(400, 0, 432, 0); wg.addColorStop(0, 'rgba(160,200,255,.4)'); wg.addColorStop(.5, 'rgba(220,240,255,.9)'); wg.addColorStop(1, 'rgba(160,200,255,.4)');
        ctx.fillStyle = wg; ctx.fillRect(400, 918, 32 * flow, 330);
      }
      const drip = (mode === 'pingando' || (mode === 'parando' && lt > stop + .9));
      if (drip) { const q = (lt * 1.2) % 1; ctx.fillStyle = 'rgba(200,225,255,.9)'; ctx.beginPath(); ctx.ellipse(416, 930 + q * q * 300, 7, 10, 0, 0, Math.PI * 2); ctx.fill(); }
      // recipientes na bancada
      if (c.recipientes !== false) {
        const fill = mode === 'enchendo' ? clamp(lt / (c.voz_dur || 3)) : 1;
        const items = [['galão', 120, 260, 140], ['balde', 860, 200, 150], ['panela', 690, 140, 80]];
        items.forEach(([nm, x, h, w]) => {
          const yb = 1250;
          ctx.fillStyle = nm === 'galão' ? 'rgba(90,150,220,.35)' : nm === 'balde' ? '#2f6fd0' : '#6b7280'; rr(x - w / 2, yb - h, w, h, nm === 'galão' ? 26 : 10); ctx.fill();
          ctx.fillStyle = 'rgba(140,190,250,.75)'; const lv = h * .85 * fill; rr(x - w / 2 + 8, yb - lv - 6, w - 16, lv, 8); ctx.fill();
          if (nm === 'galão') { ctx.fillStyle = '#2f6fd0'; rr(x - 26, yb - h - 30, 52, 34, 8); ctx.fill(); }
        });
      }
      if (c.litros != null) {
        const v = Math.round(lerp(0, c.litros, eo(clamp(lt / ((c.voz_dur || 2) * .6)))));
        ctx.font = `200px ${F.hud}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = '#000';
        ctx.strokeText(`${v} L`, 540, 820); ctx.fillStyle = C.blue; ctx.fillText(`${v} L`, 540, 820);
        if (c.legenda_extra) { ctx.font = `600 40px ${F.ui}`; ctx.fillStyle = '#e8edf3'; ctx.fillText(c.legenda_extra, 540, 880); }
      }
    },
    portao(c, lt, p, t) {
      const L = flash(lt, c.relampago_em);
      ctx.fillStyle = shade('#06080c', L * .5); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = shade('#11151d', L * .5); ctx.fillRect(0, 0, W, 1500);
      ctx.fillStyle = shade('#0d1016', L * .5); ctx.fillRect(0, 1500, W, 420);
      ctx.fillStyle = `rgba(150,180,220,${.06 + .2 * L})`; for (let k = 0; k < 8; k++) ctx.fillRect(40 + k * 135, 1520, 6, 400);
      // pilares
      ctx.fillStyle = shade('#1a1f29', L * .5); ctx.fillRect(140, 640, 110, 880); ctx.fillRect(830, 640, 110, 880);
      // portão de grade com abertura nos rangidos
      const ems = c.range_em || [], open = ems.reduce((a, e, i) => a + (lt > e ? Math.sin(clamp((lt - e) / .9) * Math.PI) * (.14 + i * .05) + (lt > e + .9 ? .02 * (i + 1) : 0) : 0), 0);
      ctx.save(); ctx.translate(250, 0); ctx.scale(1 - open, 1);
      ctx.strokeStyle = shade('#2a313d', L * .6); ctx.lineWidth = 12;
      for (let k = 0; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(k * 58, 720); ctx.lineTo(k * 58, 1500); ctx.stroke(); }
      ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 740); ctx.lineTo(580, 740); ctx.moveTo(0, 1110); ctx.lineTo(580, 1110); ctx.moveTo(0, 1480); ctx.lineTo(580, 1480); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = shade('#0a0c11', L * .3); ctx.fillRect(250 + 580 * (1 - open), 720, 580 * open, 780);
      if (c.chuva !== false) rain(t, .9);
      flashOverlay(L * .6);
    },
    texto_tela(c, lt, p, t) {
      ctx.fillStyle = '#030406'; ctx.fillRect(0, 0, W, H);
      if (c.chuva) rain(t, .35);
      bigText(c, lt);
    }
  };
  return { KIT, setCtx: x => { ctx = x; } };
};
