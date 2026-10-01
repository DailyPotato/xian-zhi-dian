'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const base=__dirname,port=Number(process.env.PORT)||4174;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400).end();return;}
 pathname=pathname.replace(/^\/xian-zhi-dian(?=\/|$)/,'');
 const target=path.resolve(base,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!target.startsWith(base+path.sep)||path.basename(target).startsWith('.')){res.writeHead(403).end();return;}
 fs.readFile(target,(err,body)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(body);});
}).listen(port,'127.0.0.1',()=>console.log('仙之巅 preview: http://127.0.0.1:'+port+'/xian-zhi-dian/'));
