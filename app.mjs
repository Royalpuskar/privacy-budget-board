import {run} from './engine.mjs';
import {sample} from './sample.mjs';

const $=id=>document.getElementById(id);
let result=null;

function cell(tag,value,className=''){
  const element=document.createElement(tag);
  element.textContent=String(value??'');
  if(className)element.className=className;
  return element;
}

function invalidate(){
  result=null;
  $('export').disabled=true;
  $('metrics').replaceChildren();
  $('table').replaceChildren();
  $('raw').textContent='';
  $('budget-used').style.width='0%';
  $('budget-meter').setAttribute('aria-valuenow','0');
  $('budget-meter').setAttribute('aria-valuetext','Budget usage not analyzed');
  $('budget-caption').textContent='Run an analysis to view spending.';
  $('status').textContent='Input changed. Recalculate to refresh the ledger.';
}

function renderRows(){
  const term=$('filter').value.trim().toLowerCase();
  const decision=$('decision-filter').value;
  const rows=(result?.rows||[]).filter(row=>
    (decision==='all'||row.decision===decision)&&JSON.stringify(row).toLowerCase().includes(term)
  );
  const list=$('table');
  list.replaceChildren();
  if(!rows.length){
    list.append(cell('p',result?'No queries match these filters.':'Run an analysis to populate the ledger.','empty-state'));
    return;
  }
  const budget=result.metrics.budget;
  for(const row of rows){
    const entry=cell('article',undefined,'ledger-entry '+row.decision);
    const heading=cell('div',undefined,'entry-heading');
    const title=cell('h3',row.id,'query-name');
    const status=cell('span',row.decision,'decision '+row.decision);
    heading.append(title,status);
    const track=cell('div',undefined,'entry-track');
    const fill=cell('span',undefined,'entry-fill');
    const ratio=budget>0?Math.max(0,Math.min(100,(row.spentAfter/budget)*100)):0;
    fill.style.width=ratio+'%';
    track.setAttribute('role','meter');
    track.setAttribute('aria-valuemin','0');
    track.setAttribute('aria-valuemax','100');
    track.setAttribute('aria-valuenow',String(ratio));
    track.setAttribute('aria-valuetext','After this query, '+row.spentAfterExact+' epsilon is spent from a budget of '+result.metrics.budgetExact);
    track.append(fill);
    const values=cell('div',undefined,'entry-values');
    const facts=[
      ['Requested ε',row.epsilonExact],
      ['Spent after',row.spentAfterExact],
      ['Remaining',row.remainingExact]
    ];
    for(const [label,value] of facts){
      const fact=cell('div',undefined,'entry-fact');
      fact.append(cell('span',label),cell('strong',value));
      values.append(fact);
    }
    entry.append(heading,track,values);
    if(row.decision==='rejected'){
      entry.append(cell('p','Not counted. This query would exceed the budget by ε '+row.overrunExact+'.','overrun-note'));
    }
    list.append(entry);
  }
}

function renderMetrics(metrics){
  const data=[
    ['Declared ε budget',metrics.budgetExact],
    ['Spent ε',metrics.spentExact],
    ['Remaining ε',metrics.remainingExact],
    ['Accepted queries',metrics.accepted],
    ['Rejected queries',metrics.rejected]
  ];
  $('metrics').replaceChildren(...data.map(([label,value])=>{
    const item=cell('div',undefined,'metric');
    item.append(cell('span',label),cell('strong',value));
    return item;
  }));
  const ratio=metrics.budget>0?Math.max(0,Math.min(100,(metrics.spent/metrics.budget)*100)):0;
  $('budget-used').style.width=ratio+'%';
  $('budget-meter').setAttribute('aria-valuenow',String(ratio));
  $('budget-meter').setAttribute('aria-valuetext',metrics.spentExact+' epsilon spent out of '+metrics.budgetExact);
  $('budget-caption').textContent=metrics.spentExact+' of '+metrics.budgetExact+' ε · '+ratio.toFixed(1)+'% used';
}

function analyze(){
  invalidate();
  try{
    const input=$('input').value;
    if(input.length>200000)throw Error('Input exceeds 200 KB limit');
    result=run(JSON.parse(input));
    renderMetrics(result.metrics);
    $('raw').textContent=JSON.stringify(result,null,2);
    $('export').disabled=false;
    renderRows();
    $('status').textContent='Ledger complete. '+result.metrics.accepted+' accepted and '+result.metrics.rejected+' rejected queries.';
  }catch(error){
    result=null;
    $('status').textContent='Input error: '+error.message;
  }
}

$('input').value=JSON.stringify(sample,null,2);
$('input').addEventListener('input',invalidate);
$('run').addEventListener('click',analyze);
$('reset').addEventListener('click',()=>{
  $('input').value=JSON.stringify(sample,null,2);
  $('filter').value='';
  $('decision-filter').value='all';
  analyze();
});
$('filter').addEventListener('input',renderRows);
$('decision-filter').addEventListener('change',renderRows);
$('export').addEventListener('click',()=>{
  if(!result)return;
  const blob=new Blob([JSON.stringify({project:document.title,report:result},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='privacy-budget-report.json';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});

analyze();
