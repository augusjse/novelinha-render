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
function arm(sx,sy,a,o,item,t){
  ctx.save(); ctx.translate(sx,sy); ctx.rotate(a);
  ctx.fillStyle = o.sleeve; rr(-24,-10,48,180,22); ctx.fill();
  ctx.fillStyle = o.skin; ctx.beginPath(); ctx.arc(0,186,27,0,Math.PI*2); ctx.fill();
  if (item === 'key') keyGlyph(0,212,t*6,1);
  ctx.restore();
}
function person(x,y,s,o,t){
  ctx.save(); ctx.translate(x,y); ctx.scale(s*(o.face||1),s);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0,0,120,22,0,0,Math.PI*2); ctx.fill();
  const run = o.run != null ? Math.sin(o.run) : 0;
  [[-38,run],[38,-run]].forEach(([lx,a]) => {
    ctx.save(); ctx.translate(lx,-205); ctx.rotate(a*.55);
    ctx.fillStyle = o.pants; rr(-28,0,56,200,24); ctx.fill();
    ctx.fillStyle = '#0e0f12'; rr(-30,182,78,30,14); ctx.fill();
    ctx.restore();
  });
  arm(-100,-400, o.armB ?? (o.run != null ? -run*.9 : .1), o, null, t);
  if (o.suit){
    ctx.fillStyle = o.suit; rr(-96,-432,192,245,56); ctx.fill();
    ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.moveTo(-34,-432); ctx.lineTo(34,-432); ctx.lineTo(0,-330); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.moveTo(-10,-420); ctx.lineTo(10,-420); ctx.lineTo(14,-350); ctx.lineTo(0,-335); ctx.lineTo(-14,-350); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = o.shirt; rr(-96,-432,192,245,56); ctx.fill();
    if (o.vest){
      ctx.fillStyle = o.vest; rr(-96,-424,80,235,[50,10,10,44]); ctx.fill(); rr(16,-424,80,235,[10,50,44,10]); ctx.fill();
      ctx.fillStyle = '#f2d16b'; rr(30,-380,44,12,4); ctx.fill();
    }
  }
  arm(100,-400, o.armF ?? (o.run != null ? run*.9 : -.1), o, o.item, t);
  ctx.fillStyle = o.skin; rr(-22,-462,44,42,10); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-512,82,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-80,-505,16,0,Math.PI*2); ctx.arc(80,-505,16,0,Math.PI*2); ctx.fill();
  if (o.cap){
    ctx.fillStyle = o.cap; ctx.beginPath(); ctx.ellipse(0,-548,88,62,0,Math.PI,0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(30,-556,118,22,11); ctx.fill();
    ctx.fillStyle = o.cap; rr(30,-556,118,18,9); ctx.fill();
    ctx.fillStyle = '#f2d16b'; ctx.beginPath(); ctx.arc(0,-580,8,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = o.hair; ctx.beginPath(); ctx.ellipse(0,-548,86,58,0,Math.PI,0); ctx.fill();
    ctx.fillRect(-86,-552,26,40);
  }
  const blink = ((t + (o.seed||0)) % 3.4) < .12;
  const lx = o.look || 0, scared = o.mood === 'scared';
  [-30,30].forEach(ex => {
    if (blink){ ctx.fillStyle = '#2a1a12'; ctx.fillRect(ex-14,-508,28,5); return; }
    if (scared){
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex,-506,19,23,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a120d'; ctx.beginPath(); ctx.arc(ex+lx,-504,9,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = '#1a120d'; ctx.beginPath(); ctx.ellipse(ex+lx,-505,9,13,0,0,Math.PI*2); ctx.fill();
    }
  });
  ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 7; ctx.lineCap='round';
  ctx.beginPath();
  if (scared){ ctx.moveTo(-46,-536); ctx.lineTo(-16,-546); ctx.moveTo(46,-536); ctx.lineTo(16,-546); }
  else { ctx.moveTo(-44,-534); ctx.lineTo(-16,-536); ctx.moveTo(44,-534); ctx.lineTo(16,-536); }
  ctx.stroke();
  if (o.glasses){
    ctx.fillStyle = '#0b0b0d'; rr(-64,-526,54,34,10); ctx.fill(); rr(10,-526,54,34,10); ctx.fill();
    ctx.fillRect(-10,-516,20,6);
  }
  ctx.fillStyle = '#5a2a22';
  if (scared){ ctx.beginPath(); ctx.ellipse(0,-462,13,17,0,0,Math.PI*2); ctx.fill(); }
  else { ctx.strokeStyle = '#5a2a22'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-16,-464); ctx.lineTo(16,-466); ctx.stroke(); }
  ctx.restore();
  if (o.nome){
    ctx.save(); ctx.font = `700 ${Math.round(40*Math.max(s,.8))}px ${F.ui}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    const tw = ctx.measureText(o.nome).width + 40, cy = y - 680*s;
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
      ctx.strokeText(txt,540,690); ctx.fillStyle = C.white; ctx.fillText(txt,540,690);
    }
    if (c.local){ ctx.font = `600 38px ${F.ui}`; ctx.fillStyle = C.sodium; ctx.fillText(String(c.local).toUpperCase(),540,c.relogio ? 760 : 700); }
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
    bag(540,1300,2.05,true);
    const st = c.dinheiro_em ?? 1.4;
    for (let k=0;k<16;k++){
      const ts = st + k*.13;
      if (lt < ts) continue;
      const q = clamp((lt-ts)/1.1);
      const x = 540 + Math.sin(k*2.3)*380*eo(q);
      const y = 950 - Math.sin(q*Math.PI*.5)*480 + q*q*120;
      note(x,y,k*.7 + q*3*(k%2?1:-1),.95);
    }
    const m = moneyNow(tl,T);
    ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';
    ctx.font = `190px ${F.hud}`; ctx.lineWidth = 16; ctx.strokeStyle = '#000';
    const s = 'R$ ' + m.toLocaleString('pt-BR');
    ctx.strokeText(s,540,620); ctx.fillStyle = C.money; ctx.fillText(s,540,620);
  },
  celular_tocando(c,lt,p,t){ darkBg(c.fundo || '#22281a'); phone(540,1000,1.22,'ring',t,lt,c); },
  celular_chamada(c,lt,p,t){
    darkBg(c.fundo || '#1a1316');
    phone(540,1040,1.05,'call',t,lt,c);
    if (c.camera !== false){
      const at = c.alerta_em ?? c.estrelas_em ?? 99;
      const al = lt > at ? .5 + .5*Math.sin((lt-at)*10) : 0;
      cctv(870,470,1,t,al,c.camera_num);
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
  const revealDur = s.voz_dur ? s.voz_dur*.85 : Math.min(s.dur*.62, words.length*.28);
  ctx.save(); ctx.font = `74px ${F.cap}`; ctx.textBaseline='alphabetic'; ctx.lineJoin='round'; ctx.textAlign='left';
  const space = ctx.measureText(' ').width;
  const lines = []; let cur = [], w = 0;
  words.forEach((wd,i) => {
    const ww = ctx.measureText(wd).width;
    if (cur.length && w + space + ww > 920){ lines.push({items:cur,w}); cur = []; w = 0; }
    w += (cur.length ? space : 0) + ww; cur.push({wd,i,ww});
  });
  if (cur.length) lines.push({items:cur,w});
  const lh = 94, y0 = 1400 - (lines.length-1)*lh/2;
  if (s.falante){
    ctx.font = `700 36px ${F.ui}`;
    const lab = String(s.falante).toUpperCase(), lw = ctx.measureText(lab).width + 44, cy = y0 - 120;
    ctx.fillStyle = C.alert; rr(540-lw/2,cy-44,lw,60,30); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.fillText(lab,540,cy-2); ctx.textAlign='left';
    ctx.font = `74px ${F.cap}`;
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
        ctx.save(); ctx.translate(x + it.ww/2, y - 26); ctx.scale(sc,sc); ctx.globalAlpha = clamp(q*2);
        ctx.lineWidth = 15; ctx.strokeStyle = '#000';
        ctx.strokeText(it.wd,-it.ww/2,26); ctx.fillStyle = col; ctx.fillText(it.wd,-it.ww/2,26);
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
function renderFrame(context, tl, T){
  ctx = context;
  const i = sceneAt(tl,T), s = tl.cenas[i], lt = T - s.start, p = clamp(lt/s.dur);
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
  const z = s.zoom ? lerp(s.zoom[0], s.zoom[1], eo(p)) : lerp(1, 1.06, p);
  let sh = (s.tremor||0) * (lt < .5 ? 1 - lt/.5 : 0) * 26;
  if (s.humor === 'assustado') sh += 5;
  const sx = sh ? Math.sin(T*90)*sh : 0, sy = sh ? Math.cos(T*77)*sh : 0;
  ctx.translate(W/2+sx, H*.55+sy); ctx.scale(z,z); ctx.translate(-W/2, -H*.55);
  KIT[s.tipo](s,lt,p,T,T,tl);
  ctx.restore();
  vignette();
  if (s.tipo !== 'voto') hud(tl,T);
  captions(s,lt);
  if (lt < .16 && i > 0){ ctx.fillStyle = `rgba(255,255,255,${.5*(1-lt/.16)})`; ctx.fillRect(0,0,W,H); }
}

module.exports = { W, H, KIT, prepare, renderFrame, sceneAt };
