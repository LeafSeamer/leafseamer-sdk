import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {build,served,csp,root,hash} from './build.mjs';
const at=process.argv.indexOf('--result');if(at<0)throw new Error('result_required');const destination=path.resolve(process.argv[at+1]);
for(const [p,b] of Object.entries(build()))if(!fs.readFileSync(path.join(root,'preview',p)).equals(Buffer.from(b)))throw new Error('preview_drift');
const assets=served(),reports={},servers=[];
const artifacts=Object.fromEntries(Object.values(assets).map(v=>[v.path,hash(v.bytes)]));
for(const mode of ['plain','isolated']) {
  const requests=[];let saved=false;
  const headers={'Content-Security-Policy':csp,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
    ...(mode==='isolated'?{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin'}:{})};
  const server=http.createServer((req,res)=>{
    for(const [k,v] of Object.entries(headers))res.setHeader(k,v);
    if(req.method==='POST'&&req.url==='/result') {
      const chunks=[];let size=0;
      req.on('data',b=>{size+=b.length;if(size>4*1024*1024){req.destroy();return;}chunks.push(b);});
      req.on('end',()=>{try {
        if(saved)throw new Error('duplicate_result');const report=JSON.parse(Buffer.concat(chunks));saved=true;
        reports[mode]={report,headers,requests};fs.mkdirSync(path.dirname(destination),{recursive:true});
        fs.writeFileSync(destination,JSON.stringify({format:'wire-browser-result/1',approved:false,runtime_ready:false,artifacts,reports},null,2)+'\n');
        res.writeHead(200,{'Content-Type':'application/json'});res.end('{"saved":true}');
        console.log(JSON.stringify({mode,saved:true,all_passed:report.all_passed}));
        if(Object.keys(reports).length===2)setTimeout(()=>{for(const server of servers){server.close();server.closeAllConnections();}},1000);
      }catch{res.writeHead(400);res.end();}});return;
    }
    const target=req.url==='/'+mode?'/browser.html':req.url;
    if(req.method!=='GET'||!Object.hasOwn(assets,target)){res.writeHead(404);res.end();return;}
    requests.push(target);const type=target.endsWith('.html')?'text/html':target.endsWith('.mjs')?'text/javascript':'application/json';
    res.setHeader('Content-Type',type+'; charset=utf-8');res.end(assets[target].bytes);
  });
  servers.push(server);server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({mode,url:'http://127.0.0.1:'+server.address().port+'/'+mode})));
}
