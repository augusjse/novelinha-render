// Novelinha · vozes. Narrador no myvoicestudio (Chatterbox, voz clonada), personagens no Kokoro.
// Tudo dentro da VPS, sem custo. Se o Chatterbox falhar, a fala sai no Kokoro pra o episódio nunca ficar mudo.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const SERV = {
  chatterbox: 'http://automacoes_myvoicestudio:8765',
  kokoro: 'http://automacoes_kokoro:8880'
};
// apelidos de voz que o roteiro pode usar
const VOZES = {
  augusto: { motor:'chatterbox', ref:'AugustoCloneNormal.wav', ritmo:1.12 },
  padrao:  { motor:'chatterbox', ref:'', ritmo:1.12 },
  dora:    { motor:'kokoro', id:'pf_dora', ritmo:1.1 },
  alex:    { motor:'kokoro', id:'pm_alex', ritmo:1.1 },
  santa:   { motor:'kokoro', id:'pm_santa', ritmo:1.05 }
};
const RESERVA = 'alex';

const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, (e, o, er) => e ? rej(new Error(er || e.message)) : res(o)));

async function http(url, opts = {}, ms = 300000){
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { ...opts, signal: ac.signal }); if (!r.ok) throw new Error(`${url} respondeu ${r.status}`); return r; }
  finally { clearTimeout(tm); }
}

async function viaChatterbox(v, texto, out, opt){
  const body = new URLSearchParams({ texto, idioma:'pt', exaggeration:String(opt.emocao ?? .5), cfg_weight:String(opt.cfg ?? .5) });
  if (v.ref) body.set('voz', v.ref);
  const j = await (await http(`${SERV.chatterbox}/api/gerar`, { method:'POST', body }, 600000)).json();
  if (!j.ok || !j.url) throw new Error('Chatterbox não devolveu o áudio');
  fs.writeFileSync(out, Buffer.from(await (await http(SERV.chatterbox + j.url)).arrayBuffer()));
  http(`${SERV.chatterbox}/api/saidas/deletar`, { method:'POST', body:new URLSearchParams({ arquivo:j.arquivo }) }, 20000).catch(() => {});
}
async function viaKokoro(v, texto, out){
  const r = await http(`${SERV.kokoro}/v1/audio/speech`, { method:'POST', headers:{ 'content-type':'application/json' },
    body: JSON.stringify({ model:'kokoro', input:texto, voice:v.id, response_format:'mp3', lang_code:'p', speed:v.ritmo || 1.1 }) }, 120000);
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
}

// gera (ou reaproveita do cache) a fala e devolve o caminho do mp3 já no ritmo certo
async function falar(nome, texto, cacheDir, opt = {}, log = () => {}){
  const v = VOZES[nome] || VOZES[RESERVA];
  const key = crypto.createHash('sha1').update(JSON.stringify([nome, v, texto, opt.emocao ?? null])).digest('hex').slice(0,16);
  const final = path.join(cacheDir, `${key}.mp3`);
  if (fs.existsSync(final)) return final;
  fs.mkdirSync(cacheDir, { recursive:true });
  const bruto = path.join(cacheDir, `${key}.bruto.mp3`);
  try {
    if (v.motor === 'chatterbox') await viaChatterbox(v, texto, bruto, opt); else await viaKokoro(v, texto, bruto);
  } catch(e){
    log(`voz "${nome}" falhou (${e.message}); usando ${RESERVA}`);
    await viaKokoro(VOZES[RESERVA], texto, bruto);
  }
  // Chatterbox fala mais devagar: acelera sem mudar o tom e corta silêncio das pontas
  const tempo = v.motor === 'chatterbox' ? (v.ritmo || 1) : 1;
  await run('ffmpeg', ['-y','-v','error','-i',bruto,'-af',
    `silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=${tempo}`,
    '-ar','48000','-ac','1','-b:a','160k', final]);
  fs.rmSync(bruto, { force:true });
  return final;
}

module.exports = { falar, VOZES, SERV };
