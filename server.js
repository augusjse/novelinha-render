// Novelinha · serviço de render. Recebe o JSON do episódio e devolve o MP4.
// POST /render            -> { id, status }   (fila; consulte /status/:id)
// POST /render?esperar=1  -> espera terminar e já devolve { id, url, duracao }
// GET  /status/:id        -> { status, url?, erro? }
// GET  /arquivos/:nome    -> o MP4 (link público, serve pro Instagram)
// GET  /kit               -> tipos de cena e efeitos disponíveis
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { W, H, KIT, prepare, renderFrame } = require('./engine');
const { buildAudio, FX_LIST } = require('./audio');

const PORT = 3000, FPS = 30;
const DIR = path.join(__dirname, 'arquivos');
fs.mkdirSync(DIR, { recursive: true });

const fb = path.join(__dirname, 'node_modules', '@fontsource');
GlobalFonts.registerFromPath(path.join(fb,'archivo-black/files/archivo-black-latin-400-normal.woff2'),'Archivo Black');
GlobalFonts.registerFromPath(path.join(fb,'bebas-neue/files/bebas-neue-latin-400-normal.woff2'),'Bebas Neue');
GlobalFonts.registerFromPath(path.join(fb,'archivo/files/archivo-latin-600-normal.woff2'),'Archivo');

const jobs = new Map();
let queue = Promise.resolve();

const probe = f => new Promise(res => execFile('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f],(e,o) => res(e ? 0 : parseFloat(o) || 0)));

async function render(ep, id){
  const work = fs.mkdtempSync(path.join(DIR, '.tmp-'));
  try {
    // 1. narração por cena (opcional): voz_url ou voz_base64
    const vozes = [], vozDur = {};
    for (let i=0;i<ep.cenas.length;i++){
      const c = ep.cenas[i];
      if (!c.voz_url && !c.voz_base64) continue;
      const f = path.join(work, `voz${i}.mp3`);
      if (c.voz_base64) fs.writeFileSync(f, Buffer.from(String(c.voz_base64).replace(/^data:.*?;base64,/,''), 'base64'));
      else { const r = await fetch(c.voz_url); if (!r.ok) throw new Error(`Cena ${i+1}: não consegui baixar voz_url (${r.status})`); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
      vozDur[i] = await probe(f);
      vozes.push({ i, f });
      delete c.voz_base64;
    }
    // 2. linha do tempo + trilha
    const tl = prepare(ep, vozDur);
    const wav = path.join(work, 'trilha.wav');
    fs.writeFileSync(wav, await buildAudio(tl, { musica: vozes.length ? .08 : .13 }));
    // 3. quadros direto pro ffmpeg
    const out = path.join(DIR, `${id}.mp4`);
    const args = ['-y','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',wav];
    vozes.forEach(v => args.push('-i', v.f));
    let filt = '', mix = '[1:a]';
    vozes.forEach((v,k) => { const ms = Math.round(tl.cenas[v.i].start*1000); filt += `[${k+2}:a]adelay=${ms}|${ms},volume=1.6[v${k}];`; mix += `[v${k}]`; });
    filt += `${mix}amix=inputs=${vozes.length+1}:normalize=0[a]`;
    args.push('-filter_complex', filt, '-map','0:v','-map','[a]',
      '-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
      '-c:a','aac','-b:a','160k','-movflags','+faststart','-t', tl.total.toFixed(3), out);
    const ff = spawn('ffmpeg', args, { stdio:['pipe','ignore','pipe'] });
    let ffErr = ''; ff.stderr.on('data', d => { ffErr = (ffErr + d).slice(-3000); });
    const done = new Promise((res,rej) => ff.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg: ' + ffErr.slice(-600)))));
    const canvas = createCanvas(W,H), cx = canvas.getContext('2d');
    const frames = Math.ceil(tl.total * FPS);
    for (let f=0; f<frames; f++){
      renderFrame(cx, tl, f/FPS);
      const px = Buffer.from(cx.getImageData(0,0,W,H).data.buffer);
      if (!ff.stdin.write(px)) await new Promise(r => ff.stdin.once('drain', r));
      jobs.get(id).progresso = Math.round(f/frames*100);
    }
    ff.stdin.end();
    await done;
    return { duracao: +tl.total.toFixed(2), cenas: tl.cenas.length };
  } finally {
    fs.rmSync(work, { recursive:true, force:true });
  }
}

function cleanup(){ // apaga vídeos com mais de 3 dias
  const lim = Date.now() - 3*24*3600e3;
  for (const f of fs.readdirSync(DIR)){ const p = path.join(DIR,f); try { if (fs.statSync(p).mtimeMs < lim) fs.rmSync(p,{recursive:true,force:true}); } catch(e){} }
}
setInterval(cleanup, 6*3600e3);

const send = (res, code, obj) => { res.writeHead(code, {'content-type':'application/json; charset=utf-8'}); res.end(JSON.stringify(obj)); };
const base = req => `${(req.headers['x-forwarded-proto'] || 'http').split(',')[0]}://${req.headers['x-forwarded-host'] || req.headers.host}`;

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && u.pathname === '/health') return send(res,200,{ ok:true, fila:[...jobs.values()].filter(j => j.status !== 'pronto' && j.status !== 'erro').length });
    if (req.method === 'GET' && u.pathname === '/kit') return send(res,200,{ cenas:Object.keys(KIT), sons:FX_LIST, cores_destaque:['amarelo','verde','vermelho','azul'] });
    if (req.method === 'GET' && u.pathname.startsWith('/status/')){
      const j = jobs.get(u.pathname.split('/')[2]); if (!j) return send(res,404,{ erro:'id não encontrado' });
      return send(res,200,j);
    }
    if (req.method === 'GET' && u.pathname.startsWith('/arquivos/')){
      const name = path.basename(u.pathname), p = path.join(DIR, name);
      if (!name.endsWith('.mp4') || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
      const size = fs.statSync(p).size, range = req.headers.range;
      if (range){
        const [s,e] = range.replace('bytes=','').split('-'); const start = +s, end = e ? +e : size-1;
        res.writeHead(206,{'content-type':'video/mp4','accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${size}`,'content-length':end-start+1});
        return fs.createReadStream(p,{start,end}).pipe(res);
      }
      res.writeHead(200,{'content-type':'video/mp4','content-length':size,'accept-ranges':'bytes'});
      return fs.createReadStream(p).pipe(res);
    }
    if (req.method === 'POST' && u.pathname === '/render'){
      let body = ''; for await (const ch of req) body += ch;
      let ep; try { ep = JSON.parse(body); } catch(e){ return send(res,400,{ erro:'JSON inválido' }); }
      if (ep.episodio) ep = ep.episodio;
      if (!Array.isArray(ep.cenas) || !ep.cenas.length) return send(res,400,{ erro:'faltou "cenas" (lista de cenas)' });
      try { prepare(JSON.parse(JSON.stringify(ep))); } catch(e){ return send(res,400,{ erro:e.message }); }
      const id = (ep.slug ? String(ep.slug).toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,40) + '-' : '') + crypto.randomBytes(4).toString('hex');
      const job = { id, status:'na fila', progresso:0, criado:new Date().toISOString() };
      jobs.set(id, job);
      const url = `${base(req)}/arquivos/${id}.mp4`;
      const p = queue = queue.then(async () => {
        job.status = 'renderizando';
        try { Object.assign(job, await render(ep, id), { status:'pronto', progresso:100, url }); }
        catch(e){ job.status = 'erro'; job.erro = e.message; }
      });
      if (u.searchParams.get('esperar')){ await p; return send(res, job.status === 'pronto' ? 200 : 500, job); }
      return send(res,202,job);
    }
    send(res,404,{ erro:'rota não encontrada' });
  } catch(e){ send(res,500,{ erro:e.message }); }
}).listen(PORT, () => console.log(`Novelinha render na porta ${PORT}`));
