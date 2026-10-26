// Novelinha · motor de desenho. Mesmo código do piloto, sem navegador.
// Cada episódio é um JSON com "cenas"; cada cena usa um "tipo" do kit abaixo.
const W = 1080, H = 1920;
let ctx = null;
const C = { sodium:'#f2a63b', money:'#5fd38f', alert:'#ff4757', blue:'#6fb2ff', white:'#f4f6fa' };
const F = { cap:'"Archivo Black", "Noto Color Emoji", sans-serif', hud:'"Bebas Neue", sans-serif', ui:'"Archivo", "Noto Color Emoji", sans-serif' };
const HI = { amber:C.sodium, amarelo:C.sodium, green:C.money, verde:C.money, red:C.alert, vermelho:C.alert, blue:C.blue, azul:C.blue };

const clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
const eo = t => 1 - Math.pow(1-t, 3);
const eob = t => { const c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); };
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }

/* ---------- PERSONAGENS ---------- */
const PRESETS = {
  manobrista: { pants:'#23262d', shirt:'#eef0f3', sleeve:'#eef0f3', vest:'#c3343d', skin:'#c68b62', hair:'#2a1b12', cap:'#c3343d', seed:0 },
  cliente: { pants:'#15171c', shirt:'#f1f1f1', sleeve:'#1d2029', suit:'#1d2029', skin:'#e0b08a', hair:'#3a2a1d', glasses:true, seed:1.3 },
  casual: { pants:'#2d3a52', shirt:'#3d7a5a', sleeve:'#3d7a5a', skin:'#a8714d', hair:'#1b130e', seed:.7 }
};
// aceita "manobrista" ou { base, pele, cabelo, cor, oculos, bone, nome }
function char(spec){
  if (!spec) return { ...PRESETS.manobrista };
  if (typeof spec === 'string') return { ...(PRESETS[spec] || PRESETS.manobrista) };
  const o = { ...(PRESETS[spec.base] || PRESETS.casual) };
  if (spec.pele) o.skin = spec.pele;
  if (spec.cabelo) o.hair = spec.cabelo;
  if (spec.cor){ if (o.suit){ o.suit = spec.cor; o.sleeve = spec.cor; } else if (o.vest){ o.vest = spec.cor; if (o.cap) o.cap = spec.cor; } else { o.shirt = spec.cor; o.sleeve = spec.cor; } }
  if (spec.calca) o.pants = spec.calca;
  if (spec.oculos != null) o.glasses = !!spec.oculos;
  if (spec.bone === false) delete o.cap; else if (spec.bone) o.cap = typeof spec.bone === 'string' ? spec.bone : (o.cap || '#c3343d');
  if (spec.nome) o.nome = spec.nome;
  o.seed = spec.seed ?? Math.random()*3;
  return o;
}

/* ---------- CENÁRIOS ---------- */
function garage(t){
  let g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0a0d14'); g.addColorStop(.3,'#151b26'); g.addColorStop(.59,'#1b212c');
  g.addColorStop(.6,'#23262d'); g.addColorStop(1,'#111317');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#080b10'; ctx.fillRect(0,0,W,330);
  for (let i=0;i<4;i++){
    const x = 120 + i*280;
    const fl = i===2 ? ((Math.sin(t*31) > .2 || Math.sin(t*7) > .6) ? 1 : .25) : 1;
    const rg = ctx.createRadialGradient(x,360,10,x,720,560);
    rg.addColorStop(0,`rgba(242,166,59,${.26*fl})`); rg.addColorStop(1,'rgba(242,166,59,0)');
    ctx.fillStyle = rg; ctx.fillRect(x-580,330,1160,950);
    ctx.save(); ctx.shadowColor = C.sodium; ctx.shadowBlur = 40*fl;
    ctx.fillStyle = `rgba(255,214,150,${.35+.65*fl})`; rr(x-80,322,160,22,8); ctx.fill(); ctx.restore();
  }
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.font = `380px ${F.hud}`; ctx.fillText('P2',540,1030);
  ctx.fillStyle = 'rgba(242,166,59,.14)'; ctx.fillRect(0,880,W,26);
  [[30,150],[900,150]].forEach(([x,w]) => {
    ctx.fillStyle = '#212835'; ctx.fillRect(x,330,w,830);
    for (let k=0;k<6;k++){ ctx.fillStyle = k%2 ? '#15171b' : '#c9952c'; ctx.fillRect(x,1040+k*20,w,20); }
  });
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0,1150,W,14);
  ctx.strokeStyle = 'rgba(242,190,70,.45)'; ctx.lineWidth = 8;
  for (let k=-4;k<=4;k++){ ctx.beginPath(); ctx.moveTo(540+k*70,1164); ctx.lineTo(540+k*380,H); ctx.stroke(); }
  for (let i=0;i<4;i++){
    const x = 120 + i*280, rg = ctx.createRadialGradient(x,1500,0,x,1500,200);
    rg.addColorStop(0,'rgba(242,166,59,.08)'); rg.addColorStop(1,'rgba(242,166,59,0)');
    ctx.fillStyle = rg; ctx.fillRect(x-200,1300,400,400);
  }
}
function darkBg(tint){
  const g = ctx.createRadialGradient(540,1000,50,540,1000,1100);
  g.addColorStop(0, tint); g.addColorStop(1,'#040507');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
}
function policeWash(t, side){
  const red = Math.floor(t/0.2) % 2 === 0;
  if (side){
    const g = ctx.createLinearGradient(0,0,W*.8,0);
    g.addColorStop(0, red ? 'rgba(255,40,60,.32)' : 'rgba(60,120,255,.32)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g;
  } else ctx.fillStyle = red ? 'rgba(255,40,60,.16)' : 'rgba(60,120,255,.16)';
  ctx.fillRect(0,0,W,H);
}
function facade(t, sign){
  let g = ctx.createLinearGradient(0,0,0,700); g.addColorStop(0,'#05070d'); g.addColorStop(1,'#121829');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#1b2130'; ctx.fillRect(60,380,960,1000);
  for (let r=0;r<6;r++) for (let c=0;c<6;c++){
    const lit = ((r*73 + c*151) % 10) > 3;
    ctx.fillStyle = lit ? 'rgba(255,198,120,.72)' : '#11161f';
    rr(110+c*150, 470+r*120, 96, 84, 6); ctx.fill();
  }
  const fl = Math.sin(t*23) > -.85 ? 1 : .35;
  ctx.fillStyle = '#0d1017'; rr(150,250,780,130,22); ctx.fill();
  ctx.save(); ctx.shadowColor = C.sodium; ctx.shadowBlur = 36*fl;
  ctx.fillStyle = `rgba(242,166,59,${.45+.55*fl})`; ctx.font = `104px ${F.hud}`; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.fillText(String(sign).toUpperCase(),540,350); ctx.restore();
  ctx.fillStyle = '#2a3446'; rr(380,1150,320,230,8); ctx.fill();
  const dg = ctx.createRadialGradient(540,1300,10,540,1300,220);
  dg.addColorStop(0,'rgba(255,205,140,.55)'); dg.addColorStop(1,'rgba(255,205,140,0)');
  ctx.fillStyle = dg; ctx.fillRect(380,1150,320,230);
  ctx.fillStyle = '#0f1218'; ctx.fillRect(538,1150,4,230);
  ctx.fillStyle = '#0c0f15'; rr(340,1110,400,46,10); ctx.fill();
  ctx.fillStyle = '#262a32'; ctx.fillRect(0,1380,W,150);
  ctx.fillStyle = '#14161b'; ctx.fillRect(0,1530,W,H-1530);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let k=0;k<6;k++) ctx.fillRect(20+k*200,1880,120,14);
}

/* ---------- OBJETOS ---------- */
function note(x,y,rot,s){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(s,s);
  ctx.fillStyle = '#3f7fc9'; rr(-120,-56,240,112,8); ctx.fill();
  ctx.fillStyle = '#8fc0f0'; ctx.beginPath(); ctx.ellipse(-36,0,44,38,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; rr(-110,-46,220,92,6); ctx.stroke();
  ctx.fillStyle = '#e9f2ff'; ctx.font = `50px ${F.hud}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('100',62,4);
  ctx.restore();
}
function bag(x,y,s,open){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.strokeStyle = '#23271c'; ctx.lineWidth = 26; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-90,-150); ctx.quadraticCurveTo(0,-300,90,-150); ctx.stroke();
  if (open){ for (let k=0;k<5;k++) note(-112+k*56, -205 - (k%2)*16, -.18+k*.09, .55); }
  const g = ctx.createLinearGradient(0,-170,0,170); g.addColorStop(0,'#4f583a'); g.addColorStop(1,'#2a301e');
  ctx.fillStyle = g; rr(-170,-175,340,335,70); ctx.fill();
  if (open){ ctx.fillStyle = '#171a10'; rr(-150,-190,300,36,18); ctx.fill(); }
  ctx.fillStyle = '#3c442f'; rr(-110,10,220,120,36); ctx.fill();
  ctx.strokeStyle = '#c9b46a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-88,32); ctx.lineTo(88,32); ctx.stroke();
  ctx.restore();
}
function keyGlyph(x,y,rot,s){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(s,s);
  ctx.strokeStyle = '#e6c35c'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#e6c35c'; ctx.fillRect(18,-5,56,10); ctx.fillRect(56,5,8,14); ctx.fillRect(68,5,6,10);
  ctx.fillStyle = '#16181d'; rr(-40,-30,26,60,8); ctx.fill();
  ctx.restore();
}
function suvSide(x,y,s,o,t){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0,0,480,40,0,0,Math.PI*2); ctx.fill();
  const body = o.police ? '#e6e9ee' : '#1b1e25';
  const g = ctx.createLinearGradient(0,-300,0,-70);
  g.addColorStop(0, o.police ? '#f4f6f9' : '#2c313a'); g.addColorStop(1, o.police ? '#b9bec7' : '#0d0f12');
  ctx.fillStyle = g; rr(-450,-300,900,220,60); ctx.fill();
  ctx.fillStyle = o.police ? '#d6dae1' : '#191c22';
  ctx.beginPath(); ctx.moveTo(-360,-292); ctx.lineTo(-250,-470); ctx.lineTo(170,-470); ctx.quadraticCurveTo(250,-460,330,-292); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2b3a50';
  ctx.beginPath(); ctx.moveTo(-325,-300); ctx.lineTo(-240,-445); ctx.lineTo(160,-445); ctx.quadraticCurveTo(225,-435,290,-300); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.fillRect(-50,-450,34,160);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.moveTo(-200,-440); ctx.lineTo(-150,-440); ctx.lineTo(-240,-305); ctx.lineTo(-290,-305); ctx.closePath(); ctx.fill();
  if (o.police){
    ctx.fillStyle = '#16191f'; ctx.fillRect(-300,-240,560,90);
    ctx.fillStyle = '#f4f6f9'; ctx.font = `64px ${F.hud}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('POLÍCIA',-20,-192);
    const ph = Math.floor(t/0.18 + (o.phase||0)*2) % 2 === 0;
    ctx.save(); ctx.shadowBlur = 50;
    ctx.shadowColor = '#ff2a3a'; ctx.fillStyle = ph ? '#ff3b4b' : '#5a1a20'; rr(-130,-505,120,36,10); ctx.fill();
    ctx.shadowColor = '#3a7bff'; ctx.fillStyle = ph ? '#1b2e5e' : '#4a8bff'; rr(-10,-505,120,36,10); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-40,-290); ctx.lineTo(-40,-100); ctx.stroke();
  ctx.save(); ctx.shadowBlur = 30;
  ctx.shadowColor = '#ffd27a'; ctx.fillStyle = '#ffe2a6'; rr(400,-260,52,40,12); ctx.fill();
  ctx.shadowColor = '#ff2a3a'; ctx.fillStyle = '#ff3443'; rr(-452,-270,30,56,10); ctx.fill();
  ctx.restore();
  [-270,270].forEach(wx => {
    ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.arc(wx,-80,92,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#6d7480'; ctx.beginPath(); ctx.arc(wx,-80,50,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#25282e'; ctx.beginPath(); ctx.arc(wx,-80,16,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}
function suvRear(x,y,s,trunk,plate){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0,0,390,42,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0a0a0c'; rr(-305,-125,112,125,24); ctx.fill(); rr(193,-125,112,125,24); ctx.fill();
  let g = ctx.createLinearGradient(0,-570,0,-330); g.addColorStop(0,'#2a2f38'); g.addColorStop(1,'#15181d');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-275,-330); ctx.lineTo(-232,-542); ctx.quadraticCurveTo(0,-580,232,-542); ctx.lineTo(275,-330); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#26354a'; ctx.beginPath(); ctx.moveTo(-235,-370); ctx.lineTo(-208,-515); ctx.lineTo(208,-515); ctx.lineTo(235,-370); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.moveTo(-120,-515); ctx.lineTo(-60,-515); ctx.lineTo(-110,-370); ctx.lineTo(-170,-370); ctx.closePath(); ctx.fill();
  g = ctx.createLinearGradient(0,-345,0,-80); g.addColorStop(0,'#2d3139'); g.addColorStop(.5,'#16181d'); g.addColorStop(1,'#0b0c0f');
  ctx.fillStyle = g; rr(-322,-348,644,275,42); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-300,-326); ctx.lineTo(300,-326); ctx.stroke();
  ctx.save(); ctx.shadowColor = '#ff2a3a'; ctx.shadowBlur = 44; ctx.fillStyle = '#ff3443';
  rr(-312,-312,98,54,14); ctx.fill(); rr(214,-312,98,54,14); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#0f1013'; rr(-318,-112,636,58,22); ctx.fill();
  ctx.fillStyle = '#eef0f3'; rr(-95,-212,190,60,6); ctx.fill();
  ctx.fillStyle = '#1d4fa0'; ctx.fillRect(-95,-212,190,13);
  ctx.fillStyle = '#121418'; ctx.font = `46px ${F.hud}`; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(plate || 'QPX7A41',0,-160);
  if (trunk > 0){
    const a = clamp(trunk*1.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.moveTo(-262,-240); ctx.lineTo(-240,-536); ctx.lineTo(240,-536); ctx.lineTo(262,-240); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    const ig = ctx.createRadialGradient(0,-330,10,0,-330,320);
    ig.addColorStop(0,'rgba(90,160,255,.6)'); ig.addColorStop(1,'rgba(90,160,255,0)');
    ctx.fillStyle = ig; ctx.fillRect(-270,-560,540,340);
    bag(0,-300,.68,true);
    ctx.restore();
    ctx.globalAlpha = 1;
    const ly = -536 - trunk*250;
    ctx.fillStyle = '#23272e'; ctx.beginPath(); ctx.moveTo(-240,-536); ctx.lineTo(-285,ly); ctx.lineTo(285,ly); ctx.lineTo(240,-536); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.shadowColor = '#ffe7b8'; ctx.shadowBlur = 30*a; ctx.fillStyle = `rgba(255,232,190,${.9*a})`;
    ctx.fillRect(-70, ly + (-536-ly)*.35, 140, 10); ctx.restore();
  }
  ctx.restore();
}
function phone(x,y,s,mode,t,lt,c){
  ctx.save(); ctx.translate(x,y);
  if (mode === 'ring' && Math.sin(t*6) > -.2) ctx.rotate(Math.sin(t*55)*.035);
  ctx.scale(s,s);
  if (mode === 'ring'){
    for (let k=0;k<3;k++){
      const ph = ((t*1.2 + k/3) % 1);
      ctx.strokeStyle = `rgba(242,166,59,${.5*(1-ph)})`; ctx.lineWidth = 10;
      rr(-230-ph*140,-470-ph*140,460+ph*280,940+ph*280,70+ph*60); ctx.stroke();
    }
  }
  ctx.fillStyle = '#0d0f13'; rr(-232,-472,464,944,72); ctx.fill();
  ctx.strokeStyle = '#30353f'; ctx.lineWidth = 6; ctx.stroke();
  const g = ctx.createLinearGradient(0,-445,0,445); g.addColorStop(0,'#1f2a3a'); g.addColorStop(1,'#0c1118');
  ctx.fillStyle = g; rr(-210,-448,420,896,56); ctx.fill();
  ctx.fillStyle = '#000'; rr(-62,-432,124,28,14); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#2c3646'; ctx.beginPath(); ctx.arc(0,-190,92,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#9fb0c8'; ctx.font = `110px ${F.cap}`; ctx.fillText(c.contato_inicial || '?',0,-150);
  const nome = String(c.contato || 'Número desconhecido').split(' ');
  const l1 = nome.length > 1 ? nome.slice(0, Math.ceil(nome.length/2)).join(' ') : nome[0];
  const l2 = nome.length > 1 ? nome.slice(Math.ceil(nome.length/2)).join(' ') : '';
  ctx.fillStyle = '#93a0b4'; ctx.font = `600 34px ${F.ui}`; ctx.fillText(mode === 'ring' ? 'Chamada recebida' : 'Em chamada',0,-340);
  ctx.fillStyle = '#f2f5fa'; ctx.font = `600 54px ${F.ui}`; ctx.fillText(l1,0,-10); if (l2) ctx.fillText(l2,0,52);
  if (mode === 'ring'){
    const pu = 1 + Math.sin(t*9)*.06;
    [[-115,'#e5484d'],[115,'#30c96b']].forEach(([bx,col],i) => {
      ctx.save(); ctx.translate(bx,300); if (i) ctx.scale(pu,pu);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0,0,64,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; rr(-30,-11,60,22,11); ctx.fill(); ctx.restore();
    });
  } else {
    ctx.fillStyle = '#30c96b'; ctx.font = `70px ${F.hud}`; ctx.fillText('00:' + String(Math.floor(lt)).padStart(2,'0'),0,140);
    for (let k=0;k<11;k++){
      const h = 16 + Math.abs(Math.sin(t*14 + k*1.7)) * 60;
      ctx.fillStyle = 'rgba(242,166,59,.85)'; rr(-150+k*28,230-h/2,14,h,7); ctx.fill();
    }
    ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(0,360,64,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; rr(-30,349,60,22,11); ctx.fill();
  }
  ctx.restore();
}
function cctv(x,y,s,t,alert,num){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.fillStyle = '#2a2f38'; ctx.fillRect(-10,-140,20,120);
  ctx.rotate(.35);
  ctx.fillStyle = '#d9dde4'; rr(-120,-40,220,90,20); ctx.fill();
  ctx.fillStyle = '#11141a'; ctx.beginPath(); ctx.arc(-120,5,40,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3d6aa8'; ctx.beginPath(); ctx.arc(-120,5,18,0,Math.PI*2); ctx.fill();
  const on = Math.sin(t*8) > 0;
  ctx.save(); ctx.shadowColor = '#ff2a3a'; ctx.shadowBlur = on ? 30 : 0;
  ctx.fillStyle = on ? '#ff3b4b' : '#5a1a20'; ctx.beginPath(); ctx.arc(70,-10,12,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#11141a'; ctx.font = `48px ${F.hud}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(num ?? '4'),10,10);
  ctx.restore();
  if (alert > 0){
    ctx.save(); ctx.strokeStyle = `rgba(255,71,87,${.8*alert})`; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(x,y,120 + (1-alert)*60,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }
}
/* ---------- LUZ E COR ---------- */
function shade(hex,k){ // k>0 clareia, k<0 escurece
  const n = parseInt(String(hex).replace('#','').padEnd(6,'0').slice(0,6),16);
  let r=n>>16&255, g=n>>8&255, b=n&255;
  const tgt = k>0 ? 255 : 0, a = Math.abs(k);
  r=Math.round(r+(tgt-r)*a); g=Math.round(g+(tgt-g)*a); b=Math.round(b+(tgt-b)*a);
  return `rgb(${r},${g},${b})`;
}
const INK = 'rgba(12,10,14,.92)';
// pinta a forma atual com luz vinda de cima à esquerda, sombra à direita e borda de luz (rim)
function lit(base,x0,y0,x1,y1,rim){
  const g = ctx.createLinearGradient(x0,y0,x1,y1);
  g.addColorStop(0, shade(base,.22)); g.addColorStop(.45, base); g.addColorStop(1, shade(base,-.38));
  ctx.fillStyle = g; ctx.fill();
  if (rim){ ctx.save(); ctx.clip(); ctx.globalCompositeOperation='screen';
    const rg = ctx.createLinearGradient(x1,0,x1-34,0); rg.addColorStop(0,rim); rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(Math.min(x0,x1)-200,y0-400,Math.abs(x1-x0)+400,Math.abs(y1-y0)+800); ctx.restore(); }
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}

/* ---------- PERSONAGENS ---------- */
function arm(sx,sy,a,o,item,t){
  ctx.save(); ctx.translate(sx,sy); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(-27,-6); ctx.quadraticCurveTo(-30,90,-21,168); ctx.lineTo(21,168); ctx.quadraticCurveTo(30,90,27,-6); ctx.quadraticCurveTo(0,-26,-27,-6); ctx.closePath();
  lit(o.sleeve,-27,0,27,0,o.rim);
  ctx.beginPath(); ctx.ellipse(0,190,26,30,0,0,Math.PI*2); lit(o.skin,-26,170,26,210,o.rim);
  ctx.strokeStyle = shade(o.skin,-.35); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-8,200); ctx.lineTo(-8,214); ctx.stroke();
  if (item === 'key') keyGlyph(0,216,t*6,1);
  ctx.restore();
}
function person(x,y,s,o,t){
  o = { rim:'rgba(255,190,110,.55)', ...o };
  ctx.save(); ctx.translate(x,y); ctx.scale(s*(o.face||1),s);
  const sh = ctx.createRadialGradient(0,0,10,0,0,150); sh.addColorStop(0,'rgba(0,0,0,.6)'); sh.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0,0,150,30,0,0,Math.PI*2); ctx.fill();
  const run = o.run != null ? Math.sin(o.run) : 0;
  const breathe = Math.sin(t*2.2 + (o.seed||0))*3;
  [[-36,run],[36,-run]].forEach(([lx,a]) => {
    ctx.save(); ctx.translate(lx,-208); ctx.rotate(a*.55);
    ctx.beginPath(); ctx.moveTo(-30,0); ctx.lineTo(-25,186); ctx.lineTo(25,186); ctx.lineTo(30,0); ctx.closePath();
    lit(o.pants,-30,0,30,0,o.rim);
    ctx.beginPath(); ctx.moveTo(-30,178); ctx.quadraticCurveTo(-34,214,-10,214); ctx.lineTo(58,214); ctx.quadraticCurveTo(66,192,30,178); ctx.closePath();
    lit('#1a1b20',-30,178,60,214);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-4,184,40,5);
    ctx.restore();
  });
  ctx.translate(0,breathe*.4);
  arm(-104,-404, o.armB ?? (o.run != null ? -run*.9 : .12), o, null, t);
  // tronco com ombros largos e cintura
  const torso = () => { ctx.beginPath(); ctx.moveTo(-112,-410); ctx.quadraticCurveTo(-118,-440,-80,-446); ctx.lineTo(80,-446); ctx.quadraticCurveTo(118,-440,112,-410);
    ctx.lineTo(90,-200); ctx.quadraticCurveTo(0,-186,-90,-200); ctx.closePath(); };
  torso(); lit(o.suit || o.shirt,-112,-446,112,-200,o.rim);
  if (o.suit){
    ctx.beginPath(); ctx.moveTo(-36,-446); ctx.lineTo(36,-446); ctx.lineTo(0,-330); ctx.closePath(); lit(o.shirt,-36,-446,36,-330);
    ctx.beginPath(); ctx.moveTo(-10,-432); ctx.lineTo(10,-432); ctx.lineTo(15,-352); ctx.lineTo(0,-336); ctx.lineTo(-15,-352); ctx.closePath(); lit('#8e2433',-15,-432,15,-336);
    ctx.strokeStyle = shade(o.suit,-.5); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-36,-446); ctx.lineTo(-58,-300); ctx.moveTo(36,-446); ctx.lineTo(58,-300); ctx.stroke();
  } else if (o.vest){
    ctx.save(); torso(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-120,-450); ctx.lineTo(-22,-450); ctx.lineTo(-14,-180); ctx.lineTo(-120,-180); ctx.closePath(); lit(o.vest,-120,-450,-14,-180,o.rim);
    ctx.beginPath(); ctx.moveTo(22,-450); ctx.lineTo(120,-450); ctx.lineTo(120,-180); ctx.lineTo(14,-180); ctx.closePath(); lit(o.vest,14,-450,120,-180,o.rim);
    ctx.restore(); torso(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#f2d16b'; rr(34,-392,46,13,4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; [-310,-265,-220].forEach(by => { ctx.beginPath(); ctx.arc(-4,by,5,0,Math.PI*2); ctx.fill(); });
  } else {
    ctx.beginPath(); ctx.moveTo(-34,-446); ctx.quadraticCurveTo(0,-404,34,-446); ctx.strokeStyle = shade(o.shirt,-.45); ctx.lineWidth = 6; ctx.stroke();
  }
  arm(104,-404, o.armF ?? (o.run != null ? run*.9 : -.12), o, o.item, t);
  // pescoço com sombra do queixo
  ctx.beginPath(); rr(-24,-478,48,46,12); lit(o.skin,-24,-478,24,-432);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0,-472,30,12,0,0,Math.PI*2); ctx.fill();
  // cabelo de trás
  if (!o.cap){ ctx.beginPath(); ctx.ellipse(0,-540,94,84,0,0,Math.PI*2); lit(o.hair,-94,-620,94,-460); }
  // orelhas e cabeça
  [-1,1].forEach(d => { ctx.beginPath(); ctx.ellipse(d*82,-512,17,22,0,0,Math.PI*2); lit(o.skin,d*82-17,-534,d*82+17,-490);
    ctx.fillStyle = shade(o.skin,-.3); ctx.beginPath(); ctx.ellipse(d*84,-512,7,11,0,0,Math.PI*2); ctx.fill(); });
  ctx.beginPath(); ctx.moveTo(-84,-540); ctx.quadraticCurveTo(-86,-608,0,-608); ctx.quadraticCurveTo(86,-608,84,-540);
  ctx.quadraticCurveTo(84,-470,40,-446); ctx.quadraticCurveTo(0,-432,-40,-446); ctx.quadraticCurveTo(-84,-470,-84,-540); ctx.closePath();
  const face = ctx.createRadialGradient(-28,-560,12,0,-520,120);
  face.addColorStop(0, shade(o.skin,.2)); face.addColorStop(.55, o.skin); face.addColorStop(1, shade(o.skin,-.32));
  ctx.fillStyle = face; ctx.fill();
  ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'screen';
  const rg = ctx.createLinearGradient(86,0,52,0); rg.addColorStop(0,o.rim); rg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(0,-620,100,200); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // bochechas e nariz
  ctx.fillStyle = 'rgba(230,90,90,.22)'; [-48,48].forEach(cx => { ctx.beginPath(); ctx.ellipse(cx,-484,18,10,0,0,Math.PI*2); ctx.fill(); });
  ctx.strokeStyle = shade(o.skin,-.42); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(4,-512); ctx.quadraticCurveTo(16,-490,0,-486); ctx.stroke();
  // cabelo da frente / boné
  if (o.cap){
    ctx.beginPath(); ctx.moveTo(-90,-540); ctx.quadraticCurveTo(-92,-628,0,-628); ctx.quadraticCurveTo(92,-628,90,-540); ctx.closePath(); lit(o.cap,-90,-628,90,-540,o.rim);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0,-536,84,14,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10,-548); ctx.quadraticCurveTo(110,-562,150,-538); ctx.quadraticCurveTo(100,-524,10,-532); ctx.closePath(); lit(shade(o.cap,-.15),10,-562,150,-524);
    ctx.fillStyle = '#f2d16b'; ctx.beginPath(); ctx.arc(0,-596,9,0,Math.PI*2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(-88,-530); ctx.quadraticCurveTo(-96,-622,0,-622); ctx.quadraticCurveTo(96,-622,88,-536); ctx.quadraticCurveTo(40,-586,-10,-566); ctx.quadraticCurveTo(-50,-580,-88,-530); ctx.closePath();
    lit(o.hair,-96,-622,96,-530,o.rim);
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-50,-600); ctx.quadraticCurveTo(-10,-614,30,-602); ctx.stroke();
  }
  // olhos
  const blink = ((t + (o.seed||0)) % 3.4) < .12;
  const lx = o.look || 0, scared = o.mood === 'scared';
  [-32,32].forEach(ex => {
    if (blink){ ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex-16,-518); ctx.quadraticCurveTo(ex,-510,ex+16,-518); ctx.stroke(); return; }
    const ry = scared ? 25 : 20;
    ctx.fillStyle = '#fbfaf6'; ctx.beginPath(); ctx.ellipse(ex,-520,18,ry,0,0,Math.PI*2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#4a2c1a'; ctx.beginPath(); ctx.arc(ex+lx,-518,scared ? 8 : 11,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0d0907'; ctx.beginPath(); ctx.arc(ex+lx,-518,scared ? 4 : 6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex+lx-4,-523,3.5,0,Math.PI*2); ctx.fill();
    if (!scared){ ctx.fillStyle = shade(o.skin,-.12); ctx.beginPath(); ctx.ellipse(ex,-536,20,10,0,Math.PI,0); ctx.fill(); }
  });
  ctx.strokeStyle = shade(o.hair || '#2a1b12',-.2); ctx.lineWidth = 9; ctx.lineCap='round';
  ctx.beginPath();
  if (scared){ ctx.moveTo(-52,-548); ctx.quadraticCurveTo(-34,-562,-16,-556); ctx.moveTo(52,-548); ctx.quadraticCurveTo(34,-562,16,-556); }
  else { ctx.moveTo(-50,-548); ctx.quadraticCurveTo(-32,-554,-14,-548); ctx.moveTo(50,-548); ctx.quadraticCurveTo(32,-554,14,-548); }
  ctx.stroke();
  if (o.glasses){
    ctx.fillStyle = 'rgba(8,8,12,.94)'; rr(-66,-538,58,38,12); ctx.fill(); rr(8,-538,58,38,12); ctx.fill(); ctx.fillRect(-10,-526,20,6);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(-56,-532); ctx.lineTo(-40,-532); ctx.lineTo(-52,-508); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18,-532); ctx.lineTo(34,-532); ctx.lineTo(22,-508); ctx.closePath(); ctx.fill();
  }
  // boca
  if (scared){ ctx.beginPath(); ctx.ellipse(0,-466,14,18,0,0,Math.PI*2); ctx.fillStyle = '#3a1416'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#c25a5e'; ctx.beginPath(); ctx.ellipse(0,-458,8,6,0,0,Math.PI*2); ctx.fill(); }
  else { ctx.strokeStyle = '#5a2a22'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-18,-468); ctx.quadraticCurveTo(0,-464,18,-470); ctx.stroke(); }
  ctx.restore();
  if (o.nome){
    ctx.save(); ctx.font = `700 ${Math.round(40*Math.max(s,.8))}px ${F.ui}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    const tw = ctx.measureText(o.nome).width + 40, cy = y - 700*s;
    ctx.fillStyle = 'rgba(0,0,0,.72)'; rr(x-tw/2, cy-30, tw, 60, 30); ctx.fill();
    ctx.strokeStyle = C.sodium; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText(o.nome, x, cy+2); ctx.restore();
  }
}

/* ---------- KIT DE CENAS ---------- */
// Cada tipo recebe a cena "c" (com os parâmetros dela), o tempo local "lt", progresso "p", tempo global "t".
const KIT = {
  garagem_porta_malas(c,lt,p,t){
    garage(t);
    const at = c.abre_em ?? 1.4;
    const tr = c.abre === 'fechado' ? 0 : c.abre === 'abrindo' ? (lt < at ? 0 : clamp(eob(clamp((lt-at)/.65)),0,1.06)) : 1;
    suvRear(540,1610,1.4,tr,c.placa);
    if (tr > .9){
      const pu = .5 + .5*Math.sin(t*5);
      const g = ctx.createRadialGradient(540,1150,0,540,1150,500);
      g.addColorStop(0,`rgba(90,160,255,${.18+.12*pu})`); g.addColorStop(1,'rgba(90,160,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0,600,W,1100);
    }
  },
  garagem_personagem(c,lt,p,t){
    garage(t);
    if (c.carro !== false) suvSide(600,1300,.55,{},t);
    const o = char(c.personagem);
    const scared = c.humor === 'assustado';
    person(520,1780,1.3,{...o, item: c.item === 'chave' ? 'key' : null, armF: c.item === 'chave' ? -.45 : (c.mochila ? -.25 : undefined), mood: scared ? 'scared' : null, look: scared ? Math.sin(t*1.7)*7 : 0},t);
    if (c.mochila) bag(690,1640,.72,true);
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';
    if (c.relogio){
      const txt = Math.floor(t*2) % 2 === 0 ? c.relogio : c.relogio.replace(':',' ');
      ctx.font = `230px ${F.hud}`; ctx.lineWidth = 14; ctx.strokeStyle = '#000';
      ctx.strokeText(txt,540,860); ctx.fillStyle = C.white; ctx.fillText(txt,540,860);
    }
    if (c.local){ ctx.font = `600 38px ${F.ui}`; ctx.fillStyle = C.sodium; ctx.fillText(String(c.local).toUpperCase(),540,c.relogio ? 920 : 860); }
    if (c.luz_policia) policeWash(t,true);
  },
  garagem_fuga(c,lt,p,t){
    garage(t);
    suvSide(600,1360,.8,{},t);
    const q = clamp((lt-.35)/.5);
    const runQ = eo(clamp((lt-1.0)/2.6));
    const running = lt > 1.0;
    person(lerp(480,1450,runQ),1780,1.05,{...char(c.foge || 'cliente'), face: running ? 1 : -1, run: running ? lt*14 : null, armF: (!running && lt>.15) ? -1.2 : undefined},t);
    person(220,1790,1.05,{...char(c.fica || 'manobrista'), face:1, item: q>=1 ? 'key' : null, armF: q>=1 ? -.9 : (lt>.3 ? -1.1 : -.1), mood: lt>1.6 ? 'scared' : null, look: lt>1.6 ? 6 : 0},t);
    if (q > 0 && q < 1) keyGlyph(lerp(420,330,q), lerp(1430,1500,q) - Math.sin(q*Math.PI)*220, q*12, 1.15);
  },
  dinheiro(c,lt,p,t,T,tl){
    darkBg('#16243a');
    const g = ctx.createRadialGradient(540,1000,0,540,1000,600);
    g.addColorStop(0,'rgba(90,160,255,.35)'); g.addColorStop(1,'rgba(90,160,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0,300,W,1400);
    bag(540,1420,1.6,true);
    const st = c.dinheiro_em ?? 1.4;
    for (let k=0;k<16;k++){
      const ts = st + k*.13;
      if (lt < ts) continue;
      const q = clamp((lt-ts)/1.1);
      const x = 540 + Math.sin(k*2.3)*380*eo(q);
      const y = 1080 - Math.sin(q*Math.PI*.5)*380 + q*q*160;
      note(x,y,k*.7 + q*3*(k%2?1:-1),.95);
    }
    const m = moneyNow(tl,T);
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';
    ctx.font = `170px ${F.hud}`; ctx.lineWidth = 16; ctx.strokeStyle = '#000';
    const s = 'R$ ' + m.toLocaleString('pt-BR');
    ctx.strokeText(s,540,870); ctx.fillStyle = C.money; ctx.fillText(s,540,870);
  },
  celular_tocando(c,lt,p,t){ darkBg(c.fundo || '#22281a'); phone(540,1170,1.08,'ring',t,lt,c); },
  celular_chamada(c,lt,p,t){
    darkBg(c.fundo || '#1a1316');
    phone(540,1180,1.02,'call',t,lt,c);
    if (c.camera !== false){
      const at = c.alerta_em ?? c.estrelas_em ?? 99;
      const al = lt > at ? .5 + .5*Math.sin((lt-at)*10) : 0;
      cctv(900,760,.85,t,al,c.camera_num);
    }
  },
  fachada_policia(c,lt,p,t){
    facade(t, c.letreiro || 'Hotel Aurora');
    suvSide(300,1790,.62,{police:true},t);
    suvSide(800,1790,.62,{police:true,phase:.5},t);
    policeWash(t,false);
  },
  voto(c,lt,p,t){
    garage(t);
    ctx.fillStyle = 'rgba(5,6,9,.78)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';
    const pop = d => clamp(eob(clamp((lt-d)/.45)),0,1.2);
    const s0 = pop(0);
    ctx.save(); ctx.translate(540,640); ctx.scale(s0,s0);
    ctx.font = `150px ${F.cap}`; ctx.lineWidth = 16; ctx.strokeStyle = '#000';
    const tt = c.pergunta || 'E AGORA?';
    ctx.strokeText(tt,0,0); ctx.fillStyle = C.white; ctx.fillText(tt,0,0); ctx.restore();
    ctx.globalAlpha = clamp((lt-.25)/.3);
    ctx.font = `600 52px ${F.ui}`; ctx.fillStyle = '#c9d0dc'; ctx.fillText('Comenta uma palavra:',540,790);
    ctx.globalAlpha = 1;
    const op = c.opcoes || ['DEVOLVE','SOME'];
    [[op[0],'#2f6fd0',920,.4],[op[1],'#d23a48',1170,.65]].forEach(([w,col,yy,d],i) => {
      const s = pop(d) * (lt > 1.4 ? 1 + .03*Math.sin(t*6 + i*Math.PI) : 1);
      if (s <= 0) return;
      ctx.save(); ctx.translate(540,yy); ctx.scale(s,s);
      ctx.fillStyle = col; rr(-380,-90,760,180,90); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.font = `104px ${F.cap}`;
      const fit = Math.min(1, 680 / ctx.measureText(String(w).toUpperCase()).width);
      ctx.scale(fit,fit);
      ctx.fillStyle = '#fff'; ctx.textBaseline='middle'; ctx.fillText(String(w).toUpperCase(),0,6);
      ctx.restore();
    });
    ctx.textBaseline='alphabetic';
    ctx.globalAlpha = clamp((lt-.9)/.3);
    ctx.font = `600 44px ${F.ui}`; ctx.fillStyle = '#8d95a4'; ctx.fillText('ou',540,1058);
    ctx.globalAlpha = clamp((lt-1.2)/.4);
    ctx.font = `600 50px ${F.ui}`; ctx.fillStyle = C.white; ctx.fillText('Quer virar personagem? Comenta 🎭',540,1420);
    ctx.font = `70px ${F.hud}`; ctx.fillStyle = C.sodium; ctx.fillText(String(c.proximo || 'Próximo episódio amanhã, às 20h').toUpperCase(),540,1510);
    ctx.globalAlpha = 1;
  }
};

/* ---------- LINHA DO TEMPO ---------- */
// vozDur: { indiceCena: segundos } quando a cena tem narração
function prepare(ep, vozDur = {}){
  const cenas = ep.cenas.map((c,i) => ({ ...c, sons: c.sons || [], destaques: c.destaques || {} }));
  let acc = 0, pm = 0, ps = 0;
  cenas.forEach((c,i) => {
    if (!KIT[c.tipo]) throw new Error(`Cena ${i+1}: tipo "${c.tipo}" não existe no kit. Tipos: ${Object.keys(KIT).join(', ')}`);
    const vd = vozDur[i] || 0;
    c.voz_dur = vd;
    c.dur = Math.max(Number(c.dur) || 0, vd ? vd + .35 : 0, c.tipo === 'voto' ? 5 : 2);
    c.start = acc; acc += c.dur;
    c.m0 = pm; c.m1 = c.dinheiro ?? pm; pm = c.m1;
    c.s0 = ps; c.s1 = clamp(c.estrelas ?? ps, 0, 5); ps = c.s1;
  });
  return { titulo: ep.titulo || 'NOVELINHA', cenas, total: acc };
}
const sceneAt = (tl,T) => { const i = tl.cenas.findIndex(s => T < s.start + s.dur); return i < 0 ? tl.cenas.length-1 : i; };
function moneyNow(tl,T){
  const s = tl.cenas[sceneAt(tl,T)], lt = T - s.start;
  if (s.m0 === s.m1) return s.m1;
  const q = eo(clamp((lt - (s.dinheiro_em ?? 0)) / (s.dinheiro_dur ?? 2)));
  return Math.round(lerp(s.m0, s.m1, q) / 100) * 100;
}
function starsNow(tl,T){
  const s = tl.cenas[sceneAt(tl,T)], lt = T - s.start;
  if (s.s0 === s.s1) return { v:s.s1, since:99 };
  const at = s.estrelas_em ?? 0;
  return lt >= at ? { v:s.s1, since: lt-at } : { v:s.s0, since:99 };
}

/* ---------- HUD, LEGENDA, QUADRO ---------- */
function starPath(x,y,r){
  ctx.beginPath();
  for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, rad = k%2 ? r*.45 : r; ctx.lineTo(x + Math.cos(a)*rad, y + Math.sin(a)*rad); }
  ctx.closePath();
}
function hud(tl,T){
  const m = moneyNow(tl,T), st = starsNow(tl,T);
  ctx.save(); ctx.textBaseline='alphabetic'; ctx.lineJoin='round';
  ctx.font = `46px ${F.hud}`; ctx.textAlign='center'; ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.fillText(String(tl.titulo).toUpperCase(),540,205);
  ctx.textAlign='left'; ctx.font = `96px ${F.hud}`; ctx.lineWidth = 12; ctx.strokeStyle = '#000';
  const txt = 'R$ ' + m.toLocaleString('pt-BR');
  ctx.strokeText(txt,60,330); ctx.fillStyle = C.money; ctx.fillText(txt,60,330);
  for (let k=0;k<5;k++){
    const x = 700 + k*76, y = 300, filled = k < st.v;
    const isNew = filled && k === st.v-1 && st.since < .7;
    const sc = isNew ? 1 + .7*(1 - st.since/.7) : 1;
    starPath(x,y,30*sc);
    ctx.fillStyle = filled ? C.sodium : 'rgba(255,255,255,.12)'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = filled ? '#000' : 'rgba(255,255,255,.45)'; ctx.stroke();
  }
  ctx.restore();
}
function captions(s,lt){
  if (!s.texto || s.tipo === 'voto') return;
  const words = String(s.texto).split(/\s+/).filter(Boolean);
  const revealDur = s.voz_dur ? s.voz_dur*.85 : Math.min(s.dur*.5, words.length*.19);
  ctx.save(); ctx.font = `56px ${F.cap}`; ctx.textBaseline='alphabetic'; ctx.lineJoin='round'; ctx.textAlign='left';
  const space = ctx.measureText(' ').width;
  const lines = []; let cur = [], w = 0;
  words.forEach((wd,i) => {
    const ww = ctx.measureText(wd).width;
    if (cur.length && w + space + ww > 900){ lines.push({items:cur,w}); cur = []; w = 0; }
    w += (cur.length ? space : 0) + ww; cur.push({wd,i,ww});
  });
  if (cur.length) lines.push({items:cur,w});
  const lh = 70, y0 = s.falante ? 540 : 500;
  if (s.falante){
    ctx.font = `700 30px ${F.ui}`;
    const lab = String(s.falante).toUpperCase(), lw = ctx.measureText(lab).width + 40, cy = y0 - 62;
    ctx.fillStyle = C.alert; rr(540-lw/2,cy-36,lw,48,24); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.fillText(lab,540,cy-2); ctx.textAlign='left';
    ctx.font = `56px ${F.cap}`;
  }
  const hi = {}; Object.entries(s.destaques).forEach(([k,v]) => hi[k.toLowerCase()] = v);
  lines.forEach((ln,li) => {
    let x = 540 - ln.w/2; const y = y0 + li*lh;
    ln.items.forEach(it => {
      const at = it.i * revealDur / words.length;
      const q = clamp((lt-at)/.18);
      if (q > 0){
        const sc = .55 + .45*clamp(eob(q),0,1.15);
        const key = it.wd.toLowerCase(), bare = key.replace(/[.,!?;:]+$/,'');
        const col = HI[hi[key] ?? hi[bare]] || C.white;
        ctx.save(); ctx.translate(x + it.ww/2, y - 20); ctx.scale(sc,sc); ctx.globalAlpha = clamp(q*2);
        ctx.lineWidth = 12; ctx.strokeStyle = '#000';
        ctx.strokeText(it.wd,-it.ww/2,20); ctx.fillStyle = col; ctx.fillText(it.wd,-it.ww/2,20);
        ctx.restore();
      }
      x += it.ww + space;
    });
  });
  ctx.restore();
}
function vignette(){
  const v = ctx.createRadialGradient(540,1000,320,540,1000,1250);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.72)');
  ctx.fillStyle = v; ctx.fillRect(0,0,W,H);
}

/* ---------- ACABAMENTO (bloom, cor, grão) ---------- */
let PP = null;
function postInit(){
  const { createCanvas } = require('@napi-rs/canvas');
  const small = createCanvas(W/4, H/4), full = createCanvas(W, H);
  const grains = [0,1,2,3].map(() => { const g = createCanvas(256,256), gx = g.getContext('2d'), im = gx.createImageData(256,256);
    for (let i=0;i<im.data.length;i+=4){ const v = 128 + (Math.random()-.5)*90; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; }
    gx.putImageData(im,0,0); return g; });
  PP = { small, sx: small.getContext('2d'), full, fx: full.getContext('2d'), grains };
}
function finish(T){
  if (!PP) postInit();
  const src = ctx.canvas;
  // correção de cor: um pouco mais de contraste e saturação
  PP.fx.globalCompositeOperation = 'copy'; PP.fx.filter = 'contrast(1.1) saturate(1.12)'; PP.fx.drawImage(src,0,0);
  PP.fx.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'copy'; ctx.drawImage(PP.full,0,0); ctx.restore();
  // bloom: só as partes mais claras, borradas, somadas por cima
  PP.sx.globalCompositeOperation = 'copy'; PP.sx.filter = 'brightness(.62) contrast(3.2) blur(7px)'; PP.sx.drawImage(src,0,0,W/4,H/4); PP.sx.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .55; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(PP.small,0,0,W,H); ctx.restore();
  // grão de filme
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07;
  ctx.fillStyle = ctx.createPattern(PP.grains[Math.floor(T*24) % 4], 'repeat'); ctx.fillRect(0,0,W,H); ctx.restore();
}
function renderFrame(context, tl, T){
  ctx = context;
  const i = sceneAt(tl,T), s = tl.cenas[i], lt = T - s.start, p = clamp(lt/s.dur);
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
  let z = s.zoom ? lerp(s.zoom[0], s.zoom[1], eo(p)) : lerp(1, 1.09, p);
  if (i > 0) z *= 1 + .08*(1 - eo(clamp(lt/.32)));
  let sh = (s.tremor||0) * (lt < .5 ? 1 - lt/.5 : 0) * 26;
  if (s.humor === 'assustado') sh += 5;
  const sx = sh ? Math.sin(T*90)*sh : 0, sy = sh ? Math.cos(T*77)*sh : 0;
  ctx.translate(W/2+sx, H*.55+sy); ctx.scale(z,z); ctx.translate(-W/2, -H*.55);
  KIT[s.tipo](s,lt,p,T,T,tl);
  ctx.restore();
  vignette();
  finish(T);
  if (s.tipo !== 'voto') hud(tl,T);
  captions(s,lt);
  if (lt < .16 && i > 0){ ctx.fillStyle = `rgba(255,255,255,${.5*(1-lt/.16)})`; ctx.fillRect(0,0,W,H); }
}

module.exports = { W, H, KIT, prepare, renderFrame, sceneAt };
