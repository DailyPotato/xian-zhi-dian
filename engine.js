(function(root){
  'use strict';
  const D=root.X_DATA||(typeof require!=='undefined'?require('./data.js'):null);
  const createWorld=root.X_WORLD||(typeof require!=='undefined'?require('./world.js'):null);
  let W;
  const finalRealm=()=>D.realms.length-1;
  const labels={cultivation:'修为',insight:'悟性',physique:'体魄',spirit:'神识',health:'气血',resolve:'心境',stones:'灵石',reputation:'声望',contribution:'宗门贡献',morality:'善恶值'};
  const capped=['insight','physique','spirit','health','resolve','reputation'];
  const clone=s=>JSON.parse(JSON.stringify(s));
  const clamp=(v,a=0,b=100)=>Math.min(b,Math.max(a,v));
  const find=(list,id)=>list.find(x=>x.id===id);
  const snap=s=>Object.fromEntries(Object.keys(labels).map(k=>[k,s[k]]));
  const diff=(a,b)=>Object.fromEntries(Object.keys(labels).map(k=>[k,b[k]-a[k]]).filter(([,v])=>v));
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function log(s,text,type='normal'){s.log.unshift({year:s.year,month:(s.elapsedMonths||0)%12+1,text,type});s.log=s.log.slice(0,180);}
  function apply(s,e){for(const[k,v]of Object.entries(e||{}))if(Object.hasOwn(labels,k)){const before=s[k]||0;s[k]=k==='morality'?clamp(before+v,-100,100):capped.includes(k)?clamp(before+v):clamp(before+v,0,1000000000);if(k==='contribution'&&s.sect&&s[k]>before)s.sectMerit=clamp((s.sectMerit||0)+s[k]-before,0,1000000000);}}
  function drawTalents(seed,count=8){
    if(!Number.isInteger(seed)||!Number.isInteger(count)||count<1||count>D.talents.length)throw Error('命格抽取参数无效');
    const rng={seed:seed>>>0},pool=[...D.talents],result=[];
    while(result.length<count){const total=pool.reduce((n,t)=>n+(t.rarity==='rare'?1:4),0);let roll=random(rng)*total,index=pool.length-1;
      for(let i=0;i<pool.length;i++){roll-=pool[i].rarity==='rare'?1:4;if(roll<0){index=i;break;}}result.push(pool.splice(index,1)[0].id);}
    return result;
  }
  function drawRoot(seed){
    if(!Number.isInteger(seed))throw Error('测灵参数无效');
    let mixed=(seed^0x937ad19f)>>>0;mixed=Math.imul(mixed^(mixed>>>16),0x85ebca6b);mixed=Math.imul(mixed^(mixed>>>13),0xc2b2ae35);
    const rng={seed:(mixed^(mixed>>>16))>>>0},grades=D.rootGrades.filter(g=>g.weight>0);let roll=random(rng)*grades.reduce((n,g)=>n+g.weight,0),grade=grades.at(-1);
    for(const g of grades){roll-=g.weight;if(roll<0){grade=g;break;}}
    const pool=D.roots.filter((_,i)=>grade.id==='variant'?i>=5:i<5).map(r=>r.id),count=grade.minElements+Math.floor(random(rng)*(grade.maxElements-grade.minElements+1)),rootElements=[];
    for(let i=0;i<count;i++)rootElements.push(pool.splice(Math.floor(random(rng)*pool.length),1)[0]);
    return {root:rootElements[0],rootGrade:grade.id,rootElements};
  }
  function rootStatus(s){const grade=find(D.rootGrades,s.rootGrade)||find(D.rootGrades,'legacy'),elementNames=(s.rootElements||[s.root]).map(id=>find(D.roots,id).name.replace('灵根',''));return {name:grade.name+' · '+elementNames.join('、'),gradeName:grade.name,elementNames,desc:grade.desc,cultivationMultiplier:grade.cultivationMultiplier,breakthroughBonus:grade.breakthroughBonus||0};}
  function create(c={}){
    const seed=(Number.isInteger(c.seed)?c.seed:Date.now())>>>0,rolled=drawRoot(seed),origin=find(D.roots,rolled.root),path=find(D.paths,c.path)||D.paths[0];
    const talents=[...new Set(c.talents||[])].filter(id=>find(D.talents,id)).slice(0,2);
    const s={version:4,name:String(c.name||'无名散修').trim().slice(0,16)||'无名散修',...rolled,path:path.id,talents,sect:null,sectRank:null,sectMerit:0,sectJoinedMonth:null,
      seed,elapsedMonths:0,year:1,age:16,realm:0,phase:'planning',plan:[],lastAction:null,
      cultivation:0,insight:12,physique:12,spirit:10,health:85,resolve:80,stones:240,reputation:0,contribution:0,morality:0,
      inventory:{},buffs:{},conditions:[],perks:[],stories:{},seen:[],log:[],pendingEvent:null,lastEvent:null,lastYear:null,ending:null,breakthroughs:0,failures:0};
    apply(s,origin.start);apply(s,path.start);for(const id of talents)apply(s,find(D.talents,id).start);
    W.initialize(s);
    log(s,'十六岁这一年，你离开故乡，循着山中钟声踏上仙途。','milestone');
    log(s,'测灵结果：'+rootStatus(s).name+'。每项行动按标注耗时推进岁月；修为积满后可闭关破境，寿元也随境界增长。');return s;
  }
  const realmInfo=s=>D.realms[s.realm];
  function formatDuration(months){if(months===null)return '无尽';const years=Math.floor(months/12),rest=months%12;return (years?years+'年':'')+(rest?rest+'个月':'')||'0个月';}
  function timeStatus(s){const elapsedMonths=s.elapsedMonths??(s.year-1)*12,ageMonths=elapsedMonths%12,remainingMonths=realmInfo(s).lifespan===null?null:Math.max(0,(realmInfo(s).lifespan-16)*12-elapsedMonths);return {elapsedMonths,month:ageMonths+1,ageYears:s.age,ageMonths,remainingMonths,elapsedText:formatDuration(elapsedMonths),ageText:s.age+'岁'+(ageMonths?' '+ageMonths+'个月':''),dateText:`第 ${s.year} 年 ${ageMonths+1} 月`};}
  function lifespanStatus(s){const limit=realmInfo(s).lifespan,nextLimit=D.realms[s.realm+1]?.lifespan??null,t=timeStatus(s);return {limit,remaining:t.remainingMonths===null?null:t.remainingMonths/12,remainingMonths:t.remainingMonths,remainingText:formatDuration(t.remainingMonths),ageText:t.ageText,immortal:limit===null,nextLimit,gain:limit===null||nextLimit===null?null:nextLimit-limit};}
  function timeError(s,months){if(!Number.isInteger(months)||months<1)return '行动耗时无效';const remaining=timeStatus(s).remainingMonths;return remaining!==null&&months>=remaining?'剩余寿元不足以完成此事（需 '+formatDuration(months)+'，余 '+formatDuration(remaining)+'），请选择更短的行动':'';}
  function actionTime(s,id){const a=find(D.actions,id);if(!a)throw Error('未知行动');const months=a.timeMonths*(a.realmTime?[1,1,2,3,4,6,8,12,18,24,36,60,100,100][s.realm]:1);return {months,text:formatDuration(months)};}
  function spendTime(s,months){if(!Number.isInteger(months)||months<1)throw Error('行动耗时无效');const notes=[];s.elapsedMonths+=months;s.year=1+Math.floor(s.elapsedMonths/12);s.age=16+Math.floor(s.elapsedMonths/12);for(const id of Object.keys(s.buffs)){s.buffs[id]-=months;if(s.buffs[id]<=0){delete s.buffs[id];notes.push(find(D.buffs,id).name+'已随岁月消散');}}W.afterYear(s);return notes;}
  function pathStatus(s){
    const origin=find(D.roots,s.root),path=find(D.paths,s.path),matched=!!origin&&!!path?.affinityRoots?.some(id=>(s.rootElements||[s.root]).includes(id));
    const bonuses=matched?{actions:{meditate:{cultivation:4},[path.technique]:{cultivation:6}},breakthroughBonus:.04}:{};
    const technique=find(D.actions,path?.technique);
    return {rootId:origin?.id,rootName:origin?.name,pathId:path?.id,pathName:path?.name,matched,
      affinityRoots:[...(path?.affinityRoots||[])],recommendedPaths:D.paths.filter(p=>p.affinityRoots?.some(id=>(s.rootElements||[s.root]).includes(id))).map(p=>p.id),techniqueId:path?.technique,bonuses,
      summary:matched?`灵根契合：静室修炼额外修为 +4，${technique?.name||'专属修行'}额外修为 +6，破境成功率 +4 个百分点（总概率上限 95%）。`:'灵根未契合：仍可修习本流派专属行动，保留灵根与流派的原有收益，无额外契合加成。'};
  }
  function benefits(s){return [find(D.roots,s.root),find(D.rootGrades,s.rootGrade),find(D.paths,s.path),pathStatus(s).bonuses,find(D.sects,s.sect),s.sect?find(D.sectRanks,s.sectRank):null,...s.talents.map(id=>find(D.talents,id)),...D.items.filter(i=>i.kind==='equipment'&&s.inventory[i.id]),...D.buffs.filter(b=>s.buffs[b.id]),...D.perks.filter(p=>s.perks.includes(p.id)),...W.benefits(s)].filter(Boolean);}
  function power(s){return Math.round(s.realm*30+s.realm*s.realm*12+s.physique*.45+s.spirit*.35+s.reputation*.1+benefits(s).reduce((n,b)=>n+(b.powerBonus||0),0));}
  function actionPreview(s,id){const a=find(D.actions,id);if(!a)throw Error('未知行动');const e={...a.effects};if(e.cultivation>0)e.cultivation=Math.round(e.cultivation*(1+s.realm*.3+Math.max(0,s.realm-6)*.7));for(const k of ['stones','contribution'])if(e[k]>0)e[k]=Math.round(e[k]*(1+s.realm*.5));for(const b of benefits(s))for(const[k,v]of Object.entries(b.actions?.[id]||{}))e[k]=(e[k]||0)+v;if(e.cultivation>0)e.cultivation=Math.max(1,Math.round(e.cultivation*rootStatus(s).cultivationMultiplier));return e;}
  function breakthroughStatus(s){
    const threshold=realmInfo(s).threshold;
    const chance=clamp(.38+s.insight*.003+s.resolve*.002+benefits(s).reduce((n,b)=>n+(b.breakthroughBonus||0),0),.2,.95);
    let reason='';
    if(s.phase!=='planning')reason='请先处理当前奇遇';
    else if(s.realm>=finalRealm())reason='已登临仙帝';
    else if(s.cultivation<threshold)reason=`还需 ${threshold-s.cultivation} 修为`;
    else if(s.health<20||s.resolve<20)reason='突破需要气血、心境均达到 20';
    else reason=timeError(s,actionTime(s,'breakthrough').months);
    return {ready:!reason,chance,reason,threshold};
  }
  function identityLock(s,entry){
    if(entry.requirePath&&entry.requirePath!==s.path)return `仅限${find(D.paths,entry.requirePath)?.name||'对应流派'}修习`;
    if(entry.requireRoot&&!(s.rootElements||[s.root]).includes(entry.requireRoot))return `需要${find(D.roots,entry.requireRoot)?.name||'对应灵根'}`;
    return '';
  }
  function actionLock(s,a){
    if(!a)return '未知行动';
    const identity=identityLock(s,a);if(identity)return identity;
    if(a.id==='breakthrough')return breakthroughStatus(s).reason;
    const condition=D.conditions.find(c=>s.conditions.includes(c.id)&&c.blocks.includes(a.id));if(condition)return condition.name+'：'+condition.desc;
    if(a.requireRealm!==undefined&&s.realm<a.requireRealm)return `达到${D.realms[a.requireRealm].name}后开启`;
    if(a.requireSect&&!s.sect)return '加入宗门后开启';
    if(a.requireRank&&(!s.sect||rankIndex(s.sectRank)<rankIndex(a.requireRank)))return '需要宗门职务达到'+find(D.sectRanks,a.requireRank).name;
    if(a.requirePartner&&!W.benefits(s).length)return '与道侣结契后开启';
    if(a.requireItem&&!s.inventory[a.requireItem])return '需要持有'+find(D.items,a.requireItem).name;
    if(a.requireStory){const st=s.stories[a.requireStory],def=find(D.stories,a.requireStory);if(!st)return '需先遇见「'+def.name+'」';if(st.status!=='active')return '这段因缘已结束';if(s.elapsedMonths+actionTime(s,a.id).months>st.dueMonth)return '这项行动无法在因缘期限前完成';}
    return '';
  }
  function resourceError(s,a){
    const e=actionPreview(s,a.id);
    if(s.stones+(e.stones||0)<0)return '灵石不足，可先安排赚取灵石';
    if(s.contribution+(e.contribution||0)<0)return '宗门贡献不足';
    for(const[id,n]of Object.entries(a.costItems||{}))if((s.inventory[id]||0)<n)return `需要${find(D.items,id).name} ×${n}`;
    for(const[id,n]of Object.entries(a.gainItems||{})){const item=find(D.items,id);if((s.inventory[id]||0)-(a.costItems?.[id]||0)+n>item.max)return item.name+'的行囊空间不足';}
    return '';
  }
  function moveItems(s,c){
    for(const[id,n]of Object.entries(c.costItems||{})){s.inventory[id]-=n;if(s.inventory[id]===0)delete s.inventory[id];}
    for(const[id,n]of Object.entries(c.gainItems||{}))s.inventory[id]=(s.inventory[id]||0)+n;
  }
  function planResources(s,ids=s.plan){const probe=clone(s);for(const id of ids){const a=find(D.actions,id),err=resourceError(probe,a);if(err)return err;apply(probe,actionPreview(probe,id));moveItems(probe,a);}return '';}
  function actionError(s,id){
    if(s.phase!=='planning')return '先处理当前奇遇或查看此生结局';
    const a=find(D.actions,id),lock=actionLock(s,a);if(lock)return lock;
    return timeError(s,actionTime(s,id).months)||resourceError(s,a);
  }
  function addPlan(){throw Error('现在按实际耗时逐项修行，请直接执行行动');}
  function removePlan(){throw Error('已取消年度计划');}
  function setPlan(){throw Error('已取消年度计划，请逐项修行');}
  const rankIndex=id=>D.sectRanks.findIndex(r=>r.id===id);
  function sectStatus(s){const sect=find(D.sects,s.sect)||null,rank=sect?find(D.sectRanks,s.sectRank):null,nextRank=rank?D.sectRanks[rankIndex(rank.id)+1]||null:null;let reason=!sect?'尚未加入宗门':!nextRank?'已任最高职务':s.phase!=='planning'?'先处理当前奇遇':s.morality<=-60?'恶名昭著，暂不能晋升':s.realm<nextRank.requireRealm?'需达到'+D.realms[nextRank.requireRealm].name:s.sectMerit<nextRank.requireMerit?'累计贡献还需 '+(nextRank.requireMerit-s.sectMerit):timeError(s,D.worldTimes.promotion);return {sect,rank,nextRank,merit:s.sectMerit,canPromote:!reason,reason,benefits:rank||{}};}
  function sectError(s,id){const sect=find(D.sects,id);if(!sect)return '未知宗门';if(s.phase!=='planning')return '先处理当前奇遇';if(s.sect===id)return '已入此门';if(s.sect&&sect.requireRealm<=find(D.sects,s.sect).requireRealm)return '只能转入门槛更高的宗门';if(s.morality<=-60)return '恶名昭著，山门暂不接纳；可赈济乡里改善善恶值';if(s.realm<sect.requireRealm)return `达到${D.realms[sect.requireRealm].name}后可拜入山门`;return timeError(s,D.worldTimes.sectJoin);}
  function joinSect(s,id){const err=sectError(s,id);if(err)throw Error(err);const next=clone(s),before=snap(next),transfer=!!next.sect,sect=find(D.sects,id),months=D.worldTimes.sectJoin,changes=spendTime(next,months);next.sect=id;next.sectRank=D.sectRanks[0].id;next.sectMerit=0;next.contribution=0;next.sectJoinedMonth=next.elapsedMonths;if(transfer)changes.push('旧宗门贡献与职务已结清；功法、装备和其他所得保留。');const text='你拜入「'+sect.name+'」，从'+D.sectRanks[0].name+'开始新的师承。';log(next,text,'milestone');Object.assign(s,next);return {title:transfer?'转入上宗':'拜入山门',text,effects:diff(before,snap(next)),changes,months,elapsedText:formatDuration(months)};}
  function promoteSect(s){const st=sectStatus(s);if(!st.canPromote)throw Error(st.reason);const next=clone(s),months=D.worldTimes.promotion,changes=spendTime(next,months);next.sectRank=st.nextRank.id;const text='你在'+st.sect.name+'晋任'+st.nextRank.name+'，贡献余额保留，新的职务收益已生效。';log(next,text,'milestone');Object.assign(s,next);return {title:'山门晋升',text,effects:{},changes,months,elapsedText:formatDuration(months)};}
  function itemPrice(s,item){return Math.max(1,Math.ceil(item.price*(1-(find(D.sects,s.sect)?.shopDiscount||0)+W.moralityStatus(s).shopModifier)));}
  function buyError(s,item){if(!item)return '未知道具';if(item.auctionOnly)return '此物仅在拍卖场竞得';if(s.realm<(item.requireRealm||0))return '境界不足，达到'+D.realms[item.requireRealm].name+'后可购买';if(s.phase!=='planning')return '安排修行时才能交易';if((s.inventory[item.id]||0)>=item.max)return item.kind==='equipment'?'已经拥有，持有即生效':'行囊已达到持有上限';if(s.stones<itemPrice(s,item))return '灵石不足';const probe=clone(s);probe.stones-=itemPrice(s,item);probe.inventory[item.id]=(probe.inventory[item.id]||0)+1;return '';}
  function useError(s,item){if(!item)return '未知道具';if(s.phase!=='planning')return '安排修行时才能使用';if(!s.inventory[item.id])return '行囊中没有这件物品';if(s.realm<(item.requireRealm||0))return '达到'+D.realms[item.requireRealm].name+'后可使用';if(item.kind==='equipment')return '装备持有即生效';if(!item.useEffects&&!item.buff&&!item.clearCondition)return '这是炼制材料，在相应行动中使用';if(item.buff&&s.buffs[item.buff])return '同类效果尚未结束';if(item.clearCondition&&!s.conditions.includes(item.clearCondition)&&!item.useEffects&&!item.buff)return '目前没有需要治疗的伤势';const probe=clone(s);probe.inventory[item.id]--;return '';}
  function itemStatus(s,id){const i=find(D.items,id),buyReason=buyError(s,i),useReason=useError(s,i);return {owned:s.inventory[id]||0,price:i?itemPrice(s,i):0,canBuy:!buyReason,buyReason,canUse:!useReason,useReason};}
  function buyItem(s,id){const i=find(D.items,id),err=buyError(s,i);if(err)throw Error(err);const before=snap(s);s.stones-=itemPrice(s,i);s.inventory[id]=(s.inventory[id]||0)+1;const changes=['获得「'+i.name+'」×1'];log(s,'坊市交易：'+i.name+'，花费 '+itemPrice(s,i)+' 灵石。','item');return {title:'交易完成',text:i.desc,effects:diff(before,snap(s)),changes};}
  function useItem(s,id){const i=find(D.items,id),err=useError(s,i);if(err)throw Error(err);const before=snap(s);apply(s,i.useEffects);const changes=consequences(s,{costItems:{[id]:1},buff:i.buff,clearCondition:i.clearCondition});log(s,'使用「'+i.name+'」：'+changes.join('；'),'item');return {title:'已使用',text:i.desc,effects:diff(before,snap(s)),changes};}
  function storyStatus(s,id){const def=find(D.stories,id),st=s.stories[id];if(!def||!st)return null;const remainingMonths=Math.max(0,st.dueMonth-s.elapsedMonths);return {...st,id,name:def.name,desc:def.desc,actionName:find(D.actions,def.actionId).name,target:def.target,remainingYears:remainingMonths/12,remainingMonths,remainingText:formatDuration(remainingMonths),ready:st.progress>=def.target||s.elapsedMonths>=st.dueMonth,rewardDesc:def.rewardDesc};}
  function consequenceError(s,c){
    for(const[id,n]of Object.entries(c.costItems||{}))if((s.inventory[id]||0)<n)return `需要${find(D.items,id).name} ×${n}`;
    for(const[id,n]of Object.entries(c.gainItems||{}))if((s.inventory[id]||0)-(c.costItems?.[id]||0)+n>find(D.items,id).max)return find(D.items,id).name+'已经拥有或行囊已满';
    if(c.startStory){const def=find(D.stories,c.startStory);if(s.stories[def.id])return '这段因缘已经体验过';const life=lifespanStatus(s);if(!life.immortal&&def.duration*12>=life.remainingMonths)return '剩余寿元不足以完成这段因缘，可先突破延寿';}
    if(c.resolveStory&&s.stories[c.resolveStory.id]?.status!=='active')return '这段因缘已结束';
    const needed=c.requireStoryComplete||(c.resolveStory?.outcome==='completed'?c.resolveStory.id:null);
    if(needed){const st=s.stories[needed],def=find(D.stories,needed);if(st?.status!=='active'||st.progress<def.target)return `尚需完成${def.target}次${find(D.actions,def.actionId).name}`;}
    return '';
  }
  function consequencesText(s,c){const lines=[];
    for(const[id,n]of Object.entries(c.costItems||{}))lines.push(`消耗${find(D.items,id).name} ×${n}`);
    for(const[id,n]of Object.entries(c.gainItems||{}))lines.push(`获得${find(D.items,id).name} ×${n}`);
    if(c.buff){const b=find(D.buffs,c.buff);lines.push(`${b.name}：持续 ${formatDuration(b.duration)}`);}
    if(c.startStory){const def=find(D.stories,c.startStory);lines.push(`开启「${def.name}」：${def.duration} 年内完成 ${def.target} 次${find(D.actions,def.actionId).name}`);}
    if(c.resolveStory)lines.push((c.resolveStory.outcome==='completed'?'完成':'结束')+'因缘「'+find(D.stories,c.resolveStory.id).name+'」');
    if(c.grantPerk){const p=find(D.perks,c.grantPerk);lines.push('长久收获「'+p.name+'」：'+p.desc);}
    if(c.addCondition){const con=find(D.conditions,c.addCondition);lines.push(con.name+'：'+con.desc);}
    if(c.clearCondition)lines.push('解除'+find(D.conditions,c.clearCondition).name);
    return lines;
  }
  function consequences(s,c){const lines=[];moveItems(s,c);
    for(const[id,n]of Object.entries(c.costItems||{}))lines.push(`消耗「${find(D.items,id).name}」×${n}`);
    for(const[id,n]of Object.entries(c.gainItems||{}))lines.push(`获得「${find(D.items,id).name}」×${n}`);
    if(c.buff){const b=find(D.buffs,c.buff);s.buffs[b.id]=b.duration;lines.push(`${b.name}：接下来 ${formatDuration(b.duration)}生效`);}
    if(c.addCondition&&!s.conditions.includes(c.addCondition)){s.conditions.push(c.addCondition);lines.push('留下伤势：'+find(D.conditions,c.addCondition).name);}
    if(c.clearCondition&&s.conditions.includes(c.clearCondition)){s.conditions=s.conditions.filter(id=>id!==c.clearCondition);lines.push('已经解除'+find(D.conditions,c.clearCondition).name);}
    if(c.grantPerk&&!s.perks.includes(c.grantPerk)){s.perks.push(c.grantPerk);lines.push('获得长久收获「'+find(D.perks,c.grantPerk).name+'」');}
    if(c.startStory){const def=find(D.stories,c.startStory);s.stories[def.id]={status:'active',progress:0,startedYear:s.year,dueYear:s.year+def.duration,startedMonth:s.elapsedMonths,dueMonth:s.elapsedMonths+def.duration*12,resolvedYear:null,ending:''};lines.push(`开启「${def.name}」：${def.duration} 年内完成 ${def.target} 次${find(D.actions,def.actionId).name}`);}
    if(c.resolveStory){const st=s.stories[c.resolveStory.id];st.status=c.resolveStory.outcome;st.resolvedYear=s.year;st.ending=c.result||'因缘已了。';lines.push('因缘'+(st.status==='completed'?'圆满':'结束')+'：'+find(D.stories,c.resolveStory.id).name);}
    return lines;
  }
  function eventWeight(s,e){
    if(identityLock(s,e))return 0;
    if(s.morality<(e.minMorality??-100)||s.morality>(e.maxMorality??100))return 0;
    if(e.storyOnly||e.once&&s.seen.includes(e.id)||e.requireSect&&!s.sect||s.realm<(e.minRealm||0)||s.realm>(e.maxRealm??finalRealm())||s.year<(e.minYear||1))return 0;
    const starters=e.choices.filter(c=>c.startStory);if(starters.length&&starters.every(c=>consequenceError(s,c)))return 0;
    let weight=e.weight??1;const cap={stones:1500,cultivation:500,contribution:200,power:150};
    for(const b of e.bias||[]){const value=clamp((b.stat==='power'?power(s):s[b.stat]||0)/(cap[b.stat]||100),0,1);weight*=1+(b.direction==='low'?1-value:value)*b.factor;}return weight;
  }
  function eventPool(s){const ready=D.stories.filter(d=>{const st=s.stories[d.id];return st?.status==='active'&&(st.progress>=d.target||s.elapsedMonths>=st.dueMonth);}).sort((a,b)=>s.stories[a.id].dueMonth-s.stories[b.id].dueMonth||a.id.localeCompare(b.id));if(ready.length)return [find(D.events,ready[0].followupEvent)];const eligible=D.events.filter(e=>eventWeight(s,e)>0),unseen=eligible.filter(e=>!s.seen.includes(e.id));return unseen.length?unseen:eligible;}
  function selectEvent(s){const pool=eventPool(s);if(!pool.length)throw Error('没有可用的奇遇');let roll=random(s)*pool.reduce((n,e)=>n+(e.storyOnly?1:eventWeight(s,e)),0),event=pool[pool.length-1];for(const e of pool){roll-=e.storyOnly?1:eventWeight(s,e);if(roll<0){event=e;break;}}s.pendingEvent=event.id;s.phase='event';if(!s.seen.includes(event.id))s.seen.push(event.id);}
  function endingFor(s){
    if(s.realm>=finalRealm())return {id:'emperor',reason:'emperor',title:'仙之巅，万道归一',desc:'从十六岁初闻大道，到大乘、渡劫、飞升，再到仙界诸境，你终于登临仙帝，寿元无尽。身后的山门、道侣与故交，以及世人对你的评价，都是这段仙途的一部分。'};
    if(s.health<=0)return {id:'fallen',reason:'fallen',title:'一盏命灯，归于山风',desc:'伤势终究耗尽了这一程的气血。你留下的书卷与因缘仍有人记得。来世修行，记得给疗伤和休养留一席。'};
    const result=mortalEnding(s);return {...result,reason:'lifespan',desc:`${s.age} 岁，${realmInfo(s).name}之境的寿元已尽。${result.desc}`};
  }
  function mortalEnding(s){
    if(s.realm>=4)return {id:'master',title:'人间自有一位真君',desc:'漫长修行中，你曾照拂一方山河。天门未开并非失败；留下来守护自己珍视之物，也是大道。'};
    if(s.path==='alchemy'&&s.insight>=65)return {id:'healer',title:'一炉丹火，万家灯明',desc:'你的丹药走过远比你更远的山路。有人以境界铭刻一生，你选择以救治过的人作答。'};
    if(s.perks.length>=2)return {id:'companions',title:'山长水阔，总有故人',desc:'你曾答应的事，许多已经做到了。商路上的朋友、山中的伙伴，都是岁月留下的回声。修行之外，你也拥有了丰盛的一生。'};
    if(s.stones>=3000)return {id:'merchant',title:'仙市灯火，为你长明',desc:'灵石、见识与可靠的信誉，让你在修真界站稳了脚跟。你仍然修行，也给后来者留了一处不必风餐露宿的地方。'};
    if(s.sect)return {id:'elder',title:'山门深处，桃李成林',desc:'你回到了熟悉的山门。传道、护山、看新人第一次御剑，成为往后岁月里安静的喜悦。'};
    return {id:'wanderer',title:'一蓑烟雨，自在平生',desc:'一生走过的山水，早已写进你的心里。境界之外，你知道何时前行，何时停下饮一盏茶。此生没有白走。'};
  }
  function end(s){s.phase='ending';s.plan=[];s.pendingEvent=null;for(const [id,st]of Object.entries(s.stories))if(st.status==='active'){st.status='abandoned';st.resolvedYear=s.year;st.ending='此卷修行已尽，未竟因缘留给后来人。';log(s,find(D.stories,id).name+'：未竟因缘收入行卷。','story');}s.ending=endingFor(s);log(s,s.ending.title,'milestone');}
  function attempt(s,status=breakthroughStatus(s)){if(!status.ready)return ['突破暂缓：'+status.reason];const from=realmInfo(s).name,beforeLife=lifespanStatus(s);if(random(s)<status.chance){s.cultivation-=status.threshold;s.realm++;s.breakthroughs++;apply(s,{health:15,resolve:10,insight:3,reputation:8});const life=lifespanStatus(s),notes=[`突破成功：${from} → ${realmInfo(s).name}`,life.immortal?'登临仙帝，寿元无尽。':`寿元上限 ${beforeLife.limit} → ${life.limit} 岁（增加 ${life.limit-beforeLife.limit} 年），当前剩余 ${life.remainingText}。`];if(realmInfo(s).id==='ascended')notes.push('渡过天劫，飞升真仙！仙界道途已开启，可以继续修行至仙帝。');return notes;}s.failures++;apply(s,{cultivation:-Math.ceil(status.threshold*.2),health:-10,resolve:-8});return ['突破未成：寿元未变。保留大部分修为，稍作休整仍可再试。'];}
  function performAction(s,id){
    const error=actionError(s,id);if(error)throw Error(error);
    const next=clone(s),a=find(D.actions,id),before=snap(next),time=actionTime(next,id),effects=actionPreview(next,id),breakStatus=id==='breakthrough'?breakthroughStatus(next):null;
    const notes=spendTime(next,time.months);
    if(id==='breakthrough'){notes.push(...attempt(next,breakStatus));for(const line of notes)log(next,line,'breakthrough');}
    else{
      apply(next,effects);notes.push(...consequences(next,a));
      for(const def of D.stories){const st=next.stories[def.id];if(st?.status==='active'&&def.actionId===id&&next.elapsedMonths<=st.dueMonth&&st.progress<def.target){st.progress++;notes.push(def.name+'：'+st.progress+' / '+def.target+(st.progress===def.target?'，后续已至':''));}}
      log(next,a.name+' · '+effectsText(effects));for(const line of notes)log(next,line,'story');
    }
    next.plan=[];
    if(next.realm>=finalRealm()||next.health<=0)end(next);
    else if(D.stories.some(d=>{const st=next.stories[d.id];return st?.status==='active'&&(st.progress>=d.target||next.elapsedMonths>=st.dueMonth);})||random(next)<(a.category==='游历'?.55:.3))selectEvent(next);
    const result={title:a.name+'完成',text:'此番耗时 '+time.text+'，如今 '+timeStatus(next).ageText+'。',effects:diff(before,snap(next)),changes:notes,notes,months:time.months,elapsedText:time.text,eventOccurred:next.phase==='event'};
    next.lastAction=clone(result);Object.assign(s,next);return result;
  }
  function advance(s,id){return performAction(s,id);}
  function waitToEnd(s){const remaining=timeStatus(s).remainingMonths;if(s.phase!=='planning'||remaining===null||remaining>1||remaining<=0)throw Error('尚有时间继续修行');const next=clone(s);spendTime(next,remaining);end(next);Object.assign(s,next);return clone(s.ending);}
  function checkChance(s,check){const value=check.stat==='power'?power(s):s[check.stat];return clamp(.55+(value-check.difficulty)*.008,.1,.95);}
  function choiceError(s,c){
    if(s.phase!=='event')return '当前没有待处理奇遇';
    for(const[k,n]of Object.entries(c.require||{}))if((k==='power'?power(s):s[k])<n)return `需要${k==='power'?'战力':labels[k]} ${n}`;
    if(s.stones+(c.effects?.stones||0)<0)return '灵石不足';if(s.contribution+(c.effects?.contribution||0)<0)return '宗门贡献不足';
    const error=consequenceError(s,c);if(error)return error;
    if(c.check){const probe=clone(s);apply(probe,c.effects);consequences(probe,c);for(const key of ['success','failure']){const branch=c.check[key],reason=consequenceError(probe,branch);if(reason)return (key==='success'?'成功后':'未达成时')+'：'+reason;if(probe.stones+(branch.effects?.stones||0)<0||probe.contribution+(branch.effects?.contribution||0)<0)return '需为可能的结果预留灵石或贡献';}}
    return '';
  }
  function chooseYear(s,index){
    const event=find(D.events,s.pendingEvent),choice=event?.choices[index];if(!Number.isInteger(index)||!choice)throw Error('无效的奇遇选择');const err=choiceError(s,choice);if(err)throw Error(err);
    if(identityLock(s,event))throw Error('这场奇遇不属于当前灵根或流派');
    const before=snap(s),chance=choice.check?checkChance(s,choice.check):null;
    const outcome=choice.check?(random(s)<chance?'success':'failure'):'normal';const branch=choice.check?.[outcome];
    // Validate branch inventory before making any resource change. Static data has free fallback choices.
    if(branch){const probe=clone(s);apply(probe,choice.effects);consequences(probe,choice);const branchError=consequenceError(probe,branch);if(branchError)throw Error(branchError);}
    apply(s,choice.effects);const changes=consequences(s,choice);
    if(branch){apply(s,branch.effects);changes.push(...consequences(s,branch));}
    const result=branch?.result||choice.result||'山中岁月，又添一笔。';
    for(const text of changes)log(s,text,'story');
    s.lastEvent={title:event.title,result,outcome,chance,effects:diff(before,snap(s)),changes};log(s,event.title+'：'+result,'event');s.pendingEvent=null;
    if(s.health<=0)end(s);else{s.phase='planning';W.afterYear(s);}
    return clone(s.lastEvent);
  }
  function choose(s,index){const next=clone(s),result=chooseYear(next,index);Object.assign(s,next);return result;}
  function effectsText(e){return Object.entries(e||{}).filter(([k,v])=>labels[k]&&v).map(([k,v])=>`${labels[k]} ${v>0?'+':''}${v}`).join(' · ')||'无数值变化';}
  function validate(input){
    const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
    if(!input||typeof input!=='object'||Array.isArray(input)||![1,2,3,4].includes(input.version))throw Error('无法识别行卷版本');
    const s=clone(input),legacy=s.version===1,old=s.version<3,timedOld=s.version<4;
    let resumedAscension=false;
    if(old){
      if(!Number.isInteger(s.realm)||s.realm<0||s.realm>5||s.breakthroughs!==s.realm||legacy&&(s.year>60||s.age>75)||!legacy&&(s.year>1985||s.age>2000))throw Error('旧行卷的境界或年月无效');
      s.morality=0;delete s.world;
      if(s.realm===5){s.realm=D.realms.findIndex(r=>r.id==='ascended');s.breakthroughs=s.realm;if(s.phase==='ending'&&s.health>0){if(s.plan?.length||s.pendingEvent!==null)throw Error('旧飞升记录无效');s.phase='planning';s.ending=null;resumedAscension=true;}}
    }else if(!own(s,'world'))throw Error('缺少天地游历记录');
    if(typeof s.name!=='string'||s.name.length>16||!find(D.roots,s.root)||!find(D.paths,s.path))throw Error('修士档案无效');
    if(timedOld){s.elapsedMonths=(s.year-1)*12;s.rootGrade='legacy';s.rootElements=[s.root];s.sectRank=s.sect?'outer':null;s.sectMerit=s.sect?s.contribution:0;s.sectJoinedMonth=s.sect?0:null;s.lastAction=null;}
    const grade=find(D.rootGrades,s.rootGrade);
    if(!grade||!Array.isArray(s.rootElements)||s.rootElements.length<grade.minElements||s.rootElements.length>grade.maxElements||new Set(s.rootElements).size!==s.rootElements.length||s.rootElements[0]!==s.root||s.rootElements.some(id=>!find(D.roots,id)||s.rootGrade!=='legacy'&&(s.rootGrade==='variant'?!['ice','thunder','wind','yin','yang'].includes(id):!['metal','wood','water','fire','earth'].includes(id))))throw Error('灵根资质记录无效');
    if(!Array.isArray(s.talents)||s.talents.length>2||new Set(s.talents).size!==s.talents.length||s.talents.some(id=>!find(D.talents,id)))throw Error('命格无效');
    if(s.sect!==null&&!find(D.sects,s.sect))throw Error('师承无效');
    const maxLife=Math.max(...D.realms.map(r=>r.lifespan||0));
    const ranges={seed:[0,4294967295],year:[1,legacy?60:maxLife-15],age:[16,legacy?75:maxLife],elapsedMonths:[0,(maxLife-16)*12],sectMerit:[0,1000000000],realm:[0,finalRealm()],cultivation:[0,1000000000],stones:[0,1000000000],contribution:[0,1000000000],morality:[-100,100],breakthroughs:[0,finalRealm()],failures:[0,(maxLife-16)*12]};for(const k of capped)ranges[k]=[0,100];
    for(const[k,[a,b]]of Object.entries(ranges))if(!Number.isInteger(s[k])||s[k]<a||s[k]>b)throw Error('行卷数值无效：'+k);
    if(s.age!==s.year+15||s.year!==1+Math.floor(s.elapsedMonths/12)||s.breakthroughs!==s.realm)throw Error('修行年月或境界记录不一致');
    const rank=find(D.sectRanks,s.sectRank);
    if(s.sect?(!rank||s.realm<find(D.sects,s.sect).requireRealm||s.realm<rank.requireRealm||s.sectMerit<rank.requireMerit||s.sectMerit<s.contribution||!Number.isInteger(s.sectJoinedMonth)||s.sectJoinedMonth<0||s.sectJoinedMonth>s.elapsedMonths):(s.sectRank!==null||s.sectMerit!==0||s.sectJoinedMonth!==null))throw Error('宗门职务记录无效');
    const life=lifespanStatus(s);
    if(!life.immortal&&(s.elapsedMonths>(life.limit-16)*12||s.phase!=='ending'&&life.remainingMonths<=0))throw Error('年龄已超出当前寿元');
    if(!['planning','event','ending'].includes(s.phase)||s.phase!=='ending'&&(s.realm===finalRealm()||s.health===0))throw Error('行卷阶段无效');
    if(!Array.isArray(s.plan)||s.plan.length>(timedOld?3:0)||s.plan.some(id=>!find(D.actions,id)||identityLock(s,find(D.actions,id)))||s.plan.filter(id=>id==='breakthrough').length>1||s.phase!=='planning'&&s.plan.length)throw Error('修行安排无效');
    const object=(v)=>v&&typeof v==='object'&&!Array.isArray(v);
    for(const[key,cat,max]of [['inventory',D.items,i=>i.max],['buffs',D.buffs,b=>timedOld?b.duration/12:b.duration]]){if(s[key]===undefined)continue;if(!object(s[key]))throw Error('行囊记录无效');for(const[id,n]of Object.entries(s[key])){const d=find(cat,id);if(!d||!Number.isInteger(n)||n<1||n>max(d))throw Error('行囊数量无效');if(key==='buffs'&&timedOld)s.buffs[id]=n*12;}}
    for(const[key,cat]of [['perks',D.perks],['conditions',D.conditions]])if(s[key]!==undefined&&(!Array.isArray(s[key])||new Set(s[key]).size!==s[key].length||s[key].some(id=>!find(cat,id))))throw Error('因缘状态无效');
    if(s.stories!==undefined){if(!object(s.stories))throw Error('因缘记录无效');for(const[id,st]of Object.entries(s.stories)){
      const d=find(D.stories,id);if(!d||!object(st))throw Error('因缘记录无效');
      if(timedOld){st.startedMonth=(st.startedYear-1)*12;st.legacyDeadline=true;st.dueMonth=st.dueYear*12;}
      const grace=st.legacyDeadline===true?12:0;
      if(st.legacyDeadline!==undefined&&st.legacyDeadline!==true||!['active','completed','abandoned'].includes(st.status)||!Number.isInteger(st.progress)||st.progress<0||st.progress>d.target||!Number.isInteger(st.startedMonth)||st.startedMonth<0||st.startedMonth>s.elapsedMonths||st.dueMonth!==st.startedMonth+d.duration*12+grace||st.startedYear!==1+Math.floor(st.startedMonth/12)||st.dueYear!==1+Math.floor((st.dueMonth-grace)/12)||typeof st.ending!=='string'||st.ending.length>2000)throw Error('因缘进度无效');
      if(st.status==='active'&&(st.resolvedYear!==null||st.ending||s.phase==='ending'))throw Error('进行中的因缘无效');
      if(st.status!=='active'&&(!Number.isInteger(st.resolvedYear)||st.resolvedYear<st.startedYear||st.resolvedYear>s.year))throw Error('因缘结局时间无效');
      if(st.status==='completed'&&st.progress<d.target)throw Error('因缘尚未完成');
    }}
    if(!Array.isArray(s.seen)||new Set(s.seen).size!==s.seen.length||s.seen.some(id=>!find(D.events,id)))throw Error('奇遇记录无效');
    if(!Array.isArray(s.log)||s.log.length>180||s.log.some(l=>!l||!Number.isInteger(l.year)||l.year<1||l.year>s.year||typeof l.text!=='string'||l.text.length>3000||typeof l.type!=='string'||l.month!==undefined&&(!Number.isInteger(l.month)||l.month<1||l.month>12||l.year===s.year&&l.month>s.elapsedMonths%12+1)))throw Error('行记无效');
    const evt=find(D.events,s.pendingEvent);if(s.phase==='event'&&(!evt||identityLock(s,evt)||evt.storyOnly&&s.stories?.[evt.storyId]?.status!=='active')||s.phase!=='event'&&s.pendingEvent!==null)throw Error('待处理奇遇无效');
    for(const key of ['lastYear','lastEvent'])if(s[key]!==undefined&&s[key]!==null){const r=s[key];if(!object(r)||!object(r.effects)||Object.entries(r.effects).some(([k,v])=>!own(labels,k)||!Number.isFinite(v)||Math.abs(v)>1000000))throw Error('结算记录无效');const notes=key==='lastYear'?r.notes:r.changes;if(!Array.isArray(notes)||notes.length>80||notes.some(t=>typeof t!=='string'||t.length>3000))throw Error('经历记录无效');if(key==='lastYear'&&(!Number.isInteger(r.year)||r.year<1||r.year>s.year))throw Error('结算年月无效');if(key==='lastEvent'&&(typeof r.title!=='string'||r.title.length>200||typeof r.result!=='string'||r.result.length>3000||!['normal','success','failure'].includes(r.outcome)||(r.chance!==null&&(!Number.isFinite(r.chance)||r.chance<.1||r.chance>.95))))throw Error('奇遇结算无效');}
    if(s.lastAction!==null){const r=s.lastAction;if(!object(r)||typeof r.title!=='string'||r.title.length>200||typeof r.text!=='string'||r.text.length>3000||!Number.isInteger(r.months)||r.months<1||r.months>s.elapsedMonths||r.elapsedText!==formatDuration(r.months)||typeof r.eventOccurred!=='boolean'||!object(r.effects)||Object.entries(r.effects).some(([k,v])=>!own(labels,k)||!Number.isInteger(v)||Math.abs(v)>1000000000)||!Array.isArray(r.changes)||r.changes.length>80||r.changes.some(t=>typeof t!=='string'||t.length>3000)||!Array.isArray(r.notes)||JSON.stringify(r.notes)!==JSON.stringify(r.changes))throw Error('行动结算记录无效');}
    if(s.phase==='ending'&&s.realm!==finalRealm()&&s.health>0&&(legacy?s.year!==60:s.elapsedMonths!==(life.limit-16)*12))throw Error('此生尚未结束');
    const clean=create({name:s.name,root:s.root,path:s.path,talents:s.talents,seed:s.seed});for(const k of Object.keys(clean))if(own(s,k))clean[k]=clone(s[k]);clean.version=4;clean.plan=[];
    if(legacy&&s.phase==='ending'&&s.health>0&&s.realm<5){clean.year++;clean.age++;clean.elapsedMonths+=12;clean.phase='planning';clean.ending=null;log(clean,`寿元规则已更新：${realmInfo(clean).name}寿元 ${lifespanStatus(clean).limit} 岁，你在 ${clean.age} 岁继续仙途。过往因缘与所得均已保留。`,'milestone');}
    else if(clean.phase==='ending')clean.ending=endingFor(clean);else clean.ending=null;
    if(resumedAscension)log(clean,'仙界道途已开启：旧飞升行卷接续为真仙，继续修行至仙帝；原有所得均已保留。','milestone');
    if(old)delete clean.world;
    W.initialize(clean);W.validate(clean);
    if(timedOld)log(clean,'岁月规则已更新：行动按实际月数消耗寿元；原灵根和既有所得保留，未执行的年度安排已解除。','milestone');
    if(clean.plan.some(id=>find(D.actions,id).requirePartner&&!W.benefits(clean).length))throw Error('道侣修行安排缺少已结契道侣');
    return clean;
  }
  W=createWorld(D,{clone,apply,log,snap,diff,random,find,clamp,power,consequences,consequenceError,planResources,end,realmInfo,labels,spendTime,timeError,formatDuration,sectStatus,rankIndex});
  const E={create,drawTalents,drawRoot,rootStatus,timeStatus,formatDuration,actionTime,performAction,waitToEnd,sectStatus,promoteSect,rankIndex,realmInfo,lifespanStatus,pathStatus,power,breakthroughStatus,actionPreview,actionError,addPlan,removePlan,setPlan,advance,choose,eventPool,eventWeight,choiceError,checkChance,consequencesText,itemStatus,buyItem,useItem,joinSect,sectError,storyStatus,effectsText,labels,validate,clone};
  for(const name of ['worldStatus','moralityStatus','facilityStatus','exchangeFacility','companionStatus','interactCompanion','auctionStatus','bidAuction','dungeonStatus','enterDungeon','exploreDungeon','leaveDungeon','combatStatus','fight'])E[name]=W[name];
  root.X_ENGINE=E;if(typeof module!=='undefined')module.exports=E;
})(typeof globalThis!=='undefined'?globalThis:window);
