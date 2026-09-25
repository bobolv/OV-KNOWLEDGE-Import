import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');const file=resolve(root,'.env.collector');
if(existsSync(file)){console.log('已有采集凭据，保持不变。');process.exit(0)}
const token=randomBytes(32).toString('hex');writeFileSync(file,'COLLECTOR_TOKEN='+token+'\n',{mode:0o600});
const env=resolve(root,'.env');const original=existsSync(env)?readFileSync(env,'utf8'):'';
writeFileSync(env,original.replace(/^COLLECTOR_TOKEN=.*\r?\n?/gm,'').trimEnd()+'\nCOLLECTOR_TOKEN='+token+'\n',{mode:0o600});
console.log('已创建只用于采集的凭据；未显示密钥。请重建工作台容器使其生效。');
