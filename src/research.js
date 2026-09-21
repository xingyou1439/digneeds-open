export function redditUrl(value) {
  try { const u = new URL(value, 'https://www.reddit.com'); if (!['reddit.com','www.reddit.com','old.reddit.com'].includes(u.hostname) || u.protocol!=='https:' || !/\/comments\/[a-z0-9]+\//i.test(u.pathname)) return ''; return 'https://www.reddit.com'+u.pathname; } catch { return ''; }
}
const str=(v)=>typeof v==='string'?v:'';
const text=(v)=>str(v).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
export function collectPosts(raw) {
  const result=new Map(); let visited=0;
  function walk(v,depth=0) {
    if(!v || typeof v!=='object'||depth>18||++visited>12000) return;
    if(Array.isArray(v)) {v.forEach(x=>walk(x,depth+1));return;}
    const title=text(v.title||v.postTitle||v.post_title);
    const url=redditUrl(v.permalink||v.post_url||v.url||v.link||'');
    if(title && url && !v.isSponsored && !v.is_sponsored && !v.promoted && !v.over_18 && !v.isNsfw) {
      const id=url.match(/\/comments\/([a-z0-9]+)/i)[1];
      const body=text(v.selftext||v.body||v.text||v.content?.markdown||v.content?.text||v.content?.html||v.description).slice(0,3000);
      const created=v.created_utc||v.createdAt||v.created_at||v.created||v.timestamp;
      const ms=typeof created==='number'?(created<1e12?created*1000:created):Date.parse(created);
      const item={id,title,body,url,subreddit:text(typeof v.subreddit==='string'?v.subreddit:v.subreddit?.prefixedName||v.subreddit?.name||v.subreddit_name||v.community||url.match(/\/r\/([^/]+)/)?.[1]||'未知社区').replace(/^r\//,''),score:Number(v.score??v.ups??v.upvotes??0)||0,comments:Number(v.num_comments??v.commentCount??v.comment_count??0)||0,created:Number.isFinite(ms)?new Date(ms).toISOString():null};
      if(!result.has(id)||body.length>result.get(id).body.length)result.set(id,item);
    }
    for(const child of Object.values(v))walk(child,depth+1);
  } walk(raw);return [...result.values()].slice(0,100);
}
export function collectComments(raw,post) {
  const result=new Map();let count=0;
  function walk(v,depth=0) {if(!v||typeof v!=='object'||depth>18||++count>10000)return;if(Array.isArray(v)){v.forEach(x=>walk(x,depth+1));return;}
    const body=text(v.body||v.content?.markdown||v.content?.text||v.text);
    const id=str(v.id||v.comment_id||v.name).replace(/^t1_/,'');
    if(body.length>30&&!['[removed]','[deleted]'].includes(body)&&/^[a-z0-9]{4,16}$/.test(id)&&!v.title&&!v.isSponsored) result.set(id,{id,body:body.slice(0,1500),url:redditUrl(v.permalink||v.url||'')||post.url.replace(/\/?$/,'/')+id+'/',score:Number(v.score||v.ups||0)||0});
    Object.values(v).forEach(x=>walk(x,depth+1));
  }walk(raw);return [...result.values()].slice(0,15);
}
const signals=[
 {id:'pain',label:'使用痛点',re:/\b(broke|broken|leak(?:s|ing)?|frustrat\w*|annoy\w*|hate|struggl\w*|doesn['’]?t work|does not work|too (?:loud|small|big|heavy)|hard to (?:clean|use)|stopped working|problem|uncomfortable)\b/i},
 {id:'recommend',label:'求推荐',re:/\b(recommend\w*|suggestions?|looking for|anyone (?:know|tried)|which (?:one|brand)|what(?:'s| is) the best)\b/i},
 {id:'alternative',label:'寻找替代',re:/\b(alternative|replacement|replace|instead of|better than|switch(?:ed|ing)? (?:from|to))\b/i},
 {id:'buy',label:'购买意向线索',re:/\b(willing to pay|(?:my|our) budget|budget (?:of|is)|ready to buy|want to buy|looking to buy|where (?:can|could) i (?:buy|get)|worth (?:buying|the money))\b/i}
];
const themes=[['耐用与可靠性',/break|broke|durab|leak|stopped working|quality/i,'验证寿命、故障场景与退换成本'],['清洁与维护',/clean|wash|odor|smell|mold|maintenan/i,'验证清洁步骤、耗材与长期维护成本'],['空间与便携',/space|small|compact|portab|heavy|travel|storage/i,'验证尺寸、重量、收纳与物流成本'],['价格与价值',/price|expensive|cheap|budget|\$|worth/i,'验证目标售价、到岸成本与替代品价格'],['使用体验',/use|comfort|noise|loud|setup|install|difficult/i,'验证操作步骤、舒适度与使用限制']];
function classify(body) {return signals.flatMap(s=>{const m=s.re.exec(body);if(!m)return [];const start=Math.max(0,m.index-65);return [{id:s.id,label:s.label,excerpt:(start?'…':'')+body.slice(start,m.index+m[0].length+100)+(m.index+m[0].length+100<body.length?'…':'')}];});}
export const ANALYSIS_VERSION=3;
const stopWords=new Set(['the','and','for','with','from','best','find','want','research','recommendation','recommendations']);
function singular(word){if(word.length>4&&word.endsWith('ies'))return word.slice(0,-3)+'y';if(/(?:ches|shes|xes|zes|sses)$/.test(word))return word.slice(0,-2);if(word.length>3&&word.endsWith('s')&&!/(?:ss|us|is)$/.test(word))return word.slice(0,-1);return word;}
function words(value){return (String(value||'').toLowerCase().replace(/https?:\/\/\S+/g,' ').match(/[a-z0-9]+/g)||[]).map(singular);}
function nearKeywords(value,tokens){
 const windowSize=Math.max(6,tokens.length+3);
 return String(value||'').replace(/https?:\/\/\S+/g,' ').split(/[.!?\n]/).some(sentence=>{const ws=words(sentence);for(let i=0;i<ws.length;i++){if(tokens.every(t=>ws.slice(i,i+windowSize).includes(t)))return true;}return false;});
}
function promotionalPost(post,postSignals){
 if(postSignals.length)return false;
 const community=String(post.subreddit||'').toLowerCase(),content=String((post.title||'')+' '+(post.body||'')).toLowerCase();
 const salesCommunity=/(?:^|_)(?:deals?|sales?|coupons?|promos?|shop|shopping|discounts?|offers?)(?:$|_)/.test(community)||/(?:deals?|sales?|coupons?|promos?|shop)$/.test(community);
 const salesCopy=/\b(?:on sale|flash sale|deal alert|coupon|promo code|discount(?:ed)?|\d+% off|buy now|shop now|limited time|reg(?:ular)?\s*\$|just\s*\$\s*\d|free shipping|affiliate)\b/i.test(content);
 const emptyListing=!String(post.body||'').trim()&&Number(post.comments||0)===0&&/\b(?:rechargeable|available|new arrival|blend on the go|for sale)\b/i.test(content);
 return salesCommunity||salesCopy||emptyListing;
}
export function analyzePosts(items,query,comments={}) {
  const tokens=[...new Set(words(query).filter(x=>x.length>2&&!stopWords.has(x)))];
  const posts=items.filter(p=>tokens.length&&(nearKeywords(p.title,tokens)||nearKeywords(p.body,tokens))).map(p=>{const content=p.title+' '+p.body;const ss=classify(content); const cs=(comments[p.id]||[]).map(c=>({...c,signals:classify(c.body)}));return {...p,signals:ss,commentEvidence:cs,matched:tokens,priority:tokens.length*8+ss.length*12+Math.min(cs.filter(c=>c.signals.length).length,3)*5};}).filter(p=>!promotionalPost(p,p.signals)).sort((a,b)=>b.priority-a.priority||Date.parse(b.created||0)-Date.parse(a.created||0)).slice(0,50);
  const clusters=themes.map(([name,re,next])=>{const evidence=posts.filter(p=>p.signals.length&&re.test(p.title+' '+p.body));return {name,next,count:evidence.length,postIds:evidence.map(p=>p.id),communities:[...new Set(evidence.map(p=>p.subreddit))].length};}).filter(x=>x.count).sort((a,b)=>b.count-a.count);
  return {analysisVersion:ANALYSIS_VERSION,posts,clusters,summary:{samples:posts.length,communities:new Set(posts.map(x=>x.subreddit)).size,pain:posts.filter(x=>x.signals.some(s=>s.id==='pain')).length,buy:posts.filter(x=>x.signals.some(s=>s.id==='buy')).length,signals:posts.filter(x=>x.signals.length).length,comments:posts.reduce((n,x)=>n+x.commentEvidence.length,0)},method:'透明规则初筛 v3：完整关键词在短句内近距离匹配，兼容常见复数；剔除没有需求信号的促销、优惠与商品广告帖；单独出现价格不计为购买意向。规则可能误判词义，请核查原帖。排序分不是市场规模或成功概率。'};
}
export function refreshAnalysis(report){
 if(report.analysisVersion===ANALYSIS_VERSION)return report;
 const comments=Object.fromEntries(report.posts.map(p=>[p.id,p.commentEvidence||[]]));
 return {...report,...analyzePosts(report.posts,report.query,comments)};
}
