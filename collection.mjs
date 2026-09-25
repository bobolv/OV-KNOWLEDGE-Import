import {createHash} from 'node:crypto';
export const TOPICS=['项目管理','信息化集成项目验收文档编写','密码应用方案'];
export function validateKnowledge(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('条目必须为对象');
 const allowed=['title','topic','sourceUrl','sourceVersion','publisher','publishedAt','summary','content','tags','applicability','caveats','purpose'];
 for(const k of Object.keys(raw))if(!allowed.includes(k))throw new Error('不允许的采集字段：'+k);
 const clean=(key,max,required=false)=>{const x=raw[key];if(x!==undefined&&typeof x!=='string')throw new Error(key+'必须为字符串');const s=(x||'').trim();if((required&&!s)||s.length>max)throw new Error(key+'为空或过长');return s};
 const k={title:clean('title',240,true),topic:clean('topic',80,true),sourceUrl:clean('sourceUrl',2048,true),sourceVersion:clean('sourceVersion',200),publisher:clean('publisher',200),publishedAt:clean('publishedAt',80),summary:clean('summary',2000,true),content:clean('content',20000,true),tags:clean('tags',500),applicability:clean('applicability',2000),caveats:clean('caveats',2000),purpose:clean('purpose',1000)};
 if(!TOPICS.includes(k.topic))throw new Error('采集主题不在允许范围');
 const u=new URL(k.sourceUrl);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('来源必须为不含凭据的HTTP(S)网址');
 if(/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname))throw new Error('知识来源应为公开外部网址');
 u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))u.searchParams.delete(key);u.searchParams.sort();k.sourceUrl=u.toString();
 k.collectionKey=createHash('sha256').update(k.sourceUrl+'\n'+(k.sourceVersion||k.publishedAt)).digest('hex');return k;
}
export function knowledgeMarkdown(k){return `# ${k.title}\n\n> Codex自动整理的知识笔记，尚待人工审核。本文为来源内容的摘要与提炼，不代替原始标准或主管部门文件。\n\n## 摘要\n\n${k.summary}\n\n## 知识要点\n\n${k.content}\n\n## 适用范围\n\n${k.applicability||'未说明'}\n\n## 限制及待核对事项\n\n${k.caveats||'未说明'}\n\n## 来源\n\n- 原始网址：${k.sourceUrl}\n- 发布机构：${k.publisher||'未说明'}\n- 发布日期原话：${k.publishedAt||'未说明'}\n- 来源版本：${k.sourceVersion||'未说明'}\n- 主题：${k.topic}\n- 标签：${k.tags||'未说明'}\n`}
export function reviewFingerprint(r){return createHash('sha256').update(JSON.stringify([r.sha,r.convertedSha,...['title','project','event','kind','occurred','people','progress','next','tags','purpose','note','summary','applicability','caveats','sourceUrl','sourceVersion','publisher','publishedAt'].map(k=>r[k]||'')])).digest('hex')}
