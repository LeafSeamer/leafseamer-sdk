import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),at=process.argv.indexOf('--result');
if(at<0)throw new Error('必须指定本地报告输出');
const resultPath=path.resolve(process.argv[at+1]),manifest=JSON.parse(fs.readFileSync(path.join(root,'preview/manifest.json'),'utf8'));
const names=['browser.html','browser.mjs','runtime-tests.mjs',...Object.keys(manifest.artifacts).map(n=>'preview/'+n),'preview/manifest.json'];
const files=new Map(names.map(n=>['/'+n,fs.readFileSync(path.join(root,n))]));files.set('/',files.get('/browser.html'));
const csp="default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'";
const requests=[];let saved=false;
const server=http.createServer((req,res)=>{
  res.setHeader('Content-Security-Policy',csp);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  if(req.method==='POST'&&req.url==='/result') {
    let raw='',size=0;req.on('data',part=>{size+=part.length;if(size>1048576){req.destroy();return;}raw+=part;});
    req.on('end',()=>{try{
      if(saved)throw new Error('重复报告');const report=JSON.parse(raw);saved=true;
      const artifacts=Object.fromEntries(names.map(n=>[n,crypto.createHash('sha256').update(files.get('/'+n)).digest('hex')]));
      fs.mkdirSync(path.dirname(resultPath),{recursive:true});
      fs.writeFileSync(resultPath,JSON.stringify({format:'wire-static-browser/1',approved:false,runtime_ready:false,
        report,csp,requests,artifacts,manifest_sha256:crypto.createHash('sha256').update(files.get('/preview/manifest.json')).digest('hex')},null,2)+'\n');
      res.writeHead(200,{'Content-Type':'application/json'});res.end('{"saved":true}');
      console.log(JSON.stringify({saved:true,all_passed:report.all_passed,cases_passed:report.cases_passed}));
      setTimeout(()=>{server.close();server.closeAllConnections();},1000);
    }catch{res.writeHead(400);res.end();}});return;
  }
  if(req.method!=='GET'||!files.has(req.url)){res.writeHead(404);res.end();return;}
  requests.push(req.url);res.setHeader('Content-Type',req.url==='/'||req.url.endsWith('.html')?'text/html; charset=utf-8':req.url.endsWith('.mjs')?'text/javascript; charset=utf-8':req.url.endsWith('.json')?'application/json':'text/plain; charset=utf-8');
  res.end(files.get(req.url));
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+server.address().port+'/',csp})));
