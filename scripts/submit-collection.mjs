import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
try{
 const local=readFileSync(resolve(root,'.env.collector'),'utf8');const token=local.match(/^COLLECTOR_TOKEN=['"]?([^'"\r\n]+)['"]?$/m)?.[1];
 if(!token)throw new Error('采集凭据未配置，请运行scripts/setup-collector.mjs并重建容器');
 const args=process.argv.slice(2),manifest=args.includes('--manifest');const index=args.indexOf('--input');
 if(!manifest&&(index<0||!args[index+1]))throw new Error('用法：node scripts/submit-collection.mjs --input collection-runs/batch.json；或 --manifest');
 const url=process.env.PORTAL_URL||'http://127.0.0.1:8787';
 const payload=manifest?undefined:JSON.stringify(JSON.parse(readFileSync(resolve(args[index+1]),'utf8').replace(/^\uFEFF/,'')));
 const res=await fetch(url+(manifest?'/api/collector/manifest':'/api/collector/knowledge'),{method:manifest?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:payload,signal:AbortSignal.timeout(30000)});
 const data=await res.json();if(!res.ok)throw new Error(data.error||('HTTP '+res.status));
 if(!manifest){const folder=resolve(root,'collection-runs');mkdirSync(folder,{recursive:true});writeFileSync(resolve(folder,'receipt-'+Date.now()+'.json'),JSON.stringify(data,null,2));}
 console.log(JSON.stringify(data,null,2));if(data.failed)process.exitCode=1;
}catch(e){console.error('采集提交失败：'+e.message);process.exitCode=1}
