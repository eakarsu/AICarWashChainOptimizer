
'use strict';
// Feature pack 29A pure helpers — no DB/provider side effects.
function hasAIKey(env=process.env){ return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY); }
function filterRecords(records, opts={}){
  const list=Array.isArray(records)?records:[];
  const q=String(opts.search||opts.q||'').trim().toLowerCase();
  return list.filter((r)=>{
    if(!r||typeof r!=='object') return false;
    if(opts.status!==undefined&&opts.status!==''&&String(r.status??'')!==String(opts.status)) return false;
    if(opts.type!==undefined&&opts.type!==''&&String(r.projectType??r.type??r.plot_type??r.body_type??'')!==String(opts.type)) return false;
    if(!q) return true;
    return Object.values(r).some((v)=> v===false||v===0 ? String(v)===q : String(v??'').toLowerCase().includes(q));
  });
}
function toCSV(records){
  const list=Array.isArray(records)?records:[]; if(!list.length) return '';
  const keys=[...new Set(list.flatMap((r)=>Object.keys(r||{})))];
  const esc=(v)=>{ if(v===null||v===undefined) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  return [keys.join(','), ...list.map((r)=>keys.map((k)=>esc(r[k])).join(','))].join('\n');
}
function createTaskStore(){
  const tasks=new Map(); let seq=1;
  return {
    list(ownerId){ return [...tasks.values()].filter((t)=>String(t.ownerId)===String(ownerId)); },
    create(ownerId, body={}){
      const title=String(body.title||'').trim(); if(!title) throw new Error('title is required');
      const status=['todo','in_progress','done'].includes(body.status)?body.status:'todo';
      const task={id:seq++, ownerId, title, notes:body.notes??'', status, dueDate:body.dueDate??null, createdAt:new Date().toISOString()};
      tasks.set(task.id,task); return task;
    },
    update(ownerId,id,patch={}){
      const t=tasks.get(Number(id)); if(!t||String(t.ownerId)!==String(ownerId)) return null;
      if(patch.title!==undefined){ if(!String(patch.title).trim()) throw new Error('title is required'); t.title=String(patch.title).trim(); }
      if(patch.status!==undefined){ if(!['todo','in_progress','done'].includes(patch.status)) throw new Error('invalid status'); t.status=patch.status; }
      if(patch.notes!==undefined) t.notes=patch.notes; if(patch.dueDate!==undefined) t.dueDate=patch.dueDate;
      return t;
    },
    _clear(){ tasks.clear(); seq=1; }
  };
}
const num=(v)=>{ const n=Number(v); return Number.isFinite(n)?n:0; };

function locationPerformance(record={}){
  const rev=num(record.monthly_revenue??record.monthlyRevenue); const cap=num(record.capacity);
  return {location:record.name||'', monthlyRevenue:rev, capacity:cap, revenuePerCapacityUnit:cap?Math.round((rev/cap)*100)/100:0, isZeroRevenue:rev===0, status:record.status||'', summary:`${record.name||'Location'} revenue ${rev} capacity ${cap}`};
}
function chainSummary(records=[]){
  const list=Array.isArray(records)?records:[]; const total=list.reduce((s,r)=>s+num(r.monthly_revenue??r.monthlyRevenue),0);
  return {recordCount:list.length, totalMonthlyRevenue:total, averageMonthlyRevenue:list.length?Math.round(total/list.length):0, emptyChain:list.length===0, activeCount:list.filter((r)=>String(r.status||'').toLowerCase()==='active').length, summary:`${list.length} locations, total monthly revenue ${total}`};
}
function capacityCheck(record={}){
  const cap=num(record.capacity); return {location:record.name||'', capacity:cap, hasCapacity:cap>0, utilisationNote: cap===0?'No capacity recorded — add capacity before forecasting':'Capacity recorded; compare with wash volume in revenue records', summary:`Capacity ${cap} for ${record.name||'location'}`};
}

module.exports={hasAIKey,filterRecords,toCSV,createTaskStore,locationPerformance,chainSummary,capacityCheck};
