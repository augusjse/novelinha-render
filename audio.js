// Novelinha · trilha e efeitos sonoros sintetizados offline (sem nenhum arquivo de áudio).
const { OfflineAudioContext } = require('node-web-audio-api');
const SR = 48000;

async function buildAudio(tl, { musica = .13 } = {}){
  const total = tl.total + .5;
  const a = new OfflineAudioContext(1, Math.ceil(SR*total), SR);
  const out = a.createGain(); out.gain.value = .9;
  const comp = a.createDynamicsCompressor(); out.connect(comp); comp.connect(a.destination);

  const nb = a.createBuffer(1, SR*2, SR), d = nb.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;

  // trilha de suspense
  const music = a.createGain(); music.connect(out);
  music.gain.setValueAtTime(.0001,0); music.gain.exponentialRampToValueAtTime(musica,.4);
  music.gain.setValueAtTime(musica, Math.max(.5,total-1.2)); music.gain.exponentialRampToValueAtTime(.0001,total);
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320; f.Q.value = 5; f.connect(music);
  [49,49.7,98.3,146.8].forEach((fr,i) => {
    const o = a.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'sine'; o.frequency.value = fr;
    const g = a.createGain(); g.gain.value = i < 2 ? .5 : .28; o.connect(g); g.connect(f); o.start(0); o.stop(total);
  });
  const lfo = a.createOscillator(); lfo.frequency.value = .13;
  const lg = a.createGain(); lg.gain.value = 150; lfo.connect(lg); lg.connect(f.frequency); lfo.start(0); lfo.stop(total);

  if (tl.chuva){ // chuva de fundo o episódio inteiro
    const s = a.createBufferSource(); s.buffer = nb; s.loop = true;
    const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g = a.createGain(); g.gain.setValueAtTime(.0001,0); g.gain.exponentialRampToValueAtTime(.06,.8); g.gain.setValueAtTime(.06,Math.max(1,total-1)); g.gain.exponentialRampToValueAtTime(.0001,total);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out); s.start(0); s.stop(total);
  }
  const tone = (t0,type,f0,f1,dur,vol) => {
    const o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0,t0); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
    g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+.01); g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0+dur+.05);
  };
  const noise = (t0,dur,type,f0,f1,vol,q=1) => {
    const s = a.createBufferSource(); s.buffer = nb;
    const fl = a.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0,t0); fl.frequency.exponentialRampToValueAtTime(f1,t0+dur);
    const g = a.createGain(); g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+dur*.3); g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t0, Math.random()); s.stop(t0+dur+.05);
  };
  const FX = {
    whoosh: t => noise(t,.32,'bandpass',300,3200,.35,1.4),
    hit: t => { tone(t,'sine',90,38,.6,.9); noise(t,.35,'lowpass',1400,200,.5); },
    clunk: t => { tone(t,'sine',120,55,.22,.8); noise(t,.1,'lowpass',1500,400,.45); },
    keys: t => [0,.05,.12,.19].forEach((dd,i) => { tone(t+dd,'triangle',2400+i*380,2400+i*380,.09,.08); noise(t+dd,.06,'highpass',5000,7000,.12); }),
    steps: t => { for (let k=0;k<6;k++) tone(t+k*.19,'sine',95,60,.12,.32*(1-k/7)); },
    count: t => { for (let k=0;k<30;k++) tone(t+k*.072,'square',1800,1800,.025,.05); tone(t+2.2,'triangle',1318,1318,.5,.2); tone(t+2.3,'triangle',1760,1760,.6,.18); },
    ring: t => [0,.65].forEach(b => [1046,1318,1568,1318].forEach((fr,i) => tone(t+b+i*.12,'sine',fr,fr,.2,.16))),
    pickup: t => { noise(t,.04,'highpass',3000,5000,.3); tone(t+.05,'sine',300,300,.15,.05); },
    star: t => { tone(t,'triangle',660,990,.25,.22); tone(t+.12,'sine',1320,1320,.35,.12); },
    siren: t => {
      const o = a.createOscillator(), g = a.createGain(), lf = a.createOscillator(), l2 = a.createGain(), fl = a.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = 800; lf.frequency.value = 2.6; l2.gain.value = 170;
      lf.connect(l2); l2.connect(o.frequency); fl.type = 'lowpass'; fl.frequency.value = 1800;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.12,t+.6); g.gain.setValueAtTime(.12,t+3); g.gain.exponentialRampToValueAtTime(.0001,t+4.2);
      o.connect(fl); fl.connect(g); g.connect(out); o.start(t); lf.start(t); o.stop(t+4.3); lf.stop(t+4.3);
    },
    trovao: t => { noise(t,.25,'highpass',2000,600,.5); const s = a.createBufferSource(); s.buffer = nb; s.loop = true;
      const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(900,t); fl.frequency.exponentialRampToValueAtTime(120,t+3.2);
      const g = a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(1.1,t+.12); g.gain.exponentialRampToValueAtTime(.0001,t+3.6);
      s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t+3.7); tone(t,'sine',55,30,2.4,.6); },
    alerta: t => { for (let k=0;k<6;k++){ const tt = t + k*.42; tone(tt,'square',853,853,.36,.09); tone(tt,'square',960,960,.36,.09); } },
    gota: t => tone(t,'sine',1500,520,.12,.25),
    agua: t => noise(t,2.2,'bandpass',2500,1800,.22,.6),
    tosse: t => { for (let k=0;k<5;k++){ noise(t+k*.17,.1,'bandpass',1600,900,.3,.8); tone(t+k*.17,'sine',90,50,.1,.35); } },
    pop: t => { tone(t,'sine',880,1320,.09,.18); tone(t+.05,'sine',1320,1320,.08,.1); },
    clique: t => { noise(t,.03,'highpass',3000,5000,.35); tone(t,'sine',1800,1800,.03,.1); },
    rangido: t => { const o = a.createOscillator(), g = a.createGain(), lf = a.createOscillator(), lg = a.createGain(), fl = a.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(180,t); o.frequency.linearRampToValueAtTime(320,t+.5); o.frequency.linearRampToValueAtTime(140,t+.95);
      lf.frequency.value = 38; lg.gain.value = 40; lf.connect(lg); lg.connect(o.frequency); fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 3;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.35,t+.08); g.gain.setValueAtTime(.35,t+.8); g.gain.exponentialRampToValueAtTime(.0001,t+1);
      o.connect(fl); fl.connect(g); g.connect(out); o.start(t); lf.start(t); o.stop(t+1.05); lf.stop(t+1.05); },
    heart: t => { tone(t,'sine',58,40,.16,.9); tone(t+.17,'sine',52,38,.14,.6); },
    stinger: t => {
      FX.hit(t);
      const fl = a.createBiquadFilter(), g = a.createGain();
      fl.type = 'lowpass'; fl.frequency.setValueAtTime(400,t); fl.frequency.exponentialRampToValueAtTime(2600,t+1.2);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.12,t+.05); g.gain.exponentialRampToValueAtTime(.0001,t+2.6);
      fl.connect(g); g.connect(out);
      [110,164.8,220,261.6].forEach(fr => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(fl); o.start(t); o.stop(t+2.7); });
    }
  };
  tl.cenas.forEach((c,i) => {
    if (i > 0 && !c.sons.some(s => s.fx === 'whoosh' && (s.em||0) === 0)) FX.whoosh(c.start); // corte sempre tem whoosh
    c.sons.forEach(s => { const fn = FX[s.fx]; if (fn) fn(c.start + (Number(s.em) || 0)); });
  });
  const buf = await a.startRendering();
  return toWav(buf.getChannelData(0), SR);
}

function toWav(samples, sr){
  const b = Buffer.alloc(44 + samples.length*2);
  b.write('RIFF',0); b.writeUInt32LE(36 + samples.length*2,4); b.write('WAVE',8);
  b.write('fmt ',12); b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22);
  b.writeUInt32LE(sr,24); b.writeUInt32LE(sr*2,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34);
  b.write('data',36); b.writeUInt32LE(samples.length*2,40);
  for (let i=0;i<samples.length;i++) b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767), 44+i*2);
  return b;
}

module.exports = { buildAudio, FX_LIST: ['whoosh','hit','clunk','keys','steps','count','ring','pickup','star','siren','heart','stinger','trovao','alerta','gota','agua','tosse','pop','clique','rangido'] };
