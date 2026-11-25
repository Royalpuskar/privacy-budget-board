
function obj(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected an object');return v;}
function arr(v,label='array'){if(!Array.isArray(v)||v.length>500)throw Error(label+' must be an array with at most 500 items');return v;}
function str(v){if(typeof v!=='string'||!v.trim()||v.length>100000)throw Error('Expected nonempty text (max 100000 characters)');return v;}
function num(v,label='number',min=-1e12){if(typeof v!=='number'||!Number.isFinite(v)||v<min||Math.abs(v)>1e12)throw Error(label+' must be a finite number in range');return v;}
function bool(v){if(typeof v!=='boolean')throw Error('Expected a boolean');return v;}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Expected YYYY-MM-DD');const t=Date.parse(v+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return t;}
function decimalParts(value){
  const [mantissa,exponentText='0']=value.toString().toLowerCase().split('e');
  const [whole,fraction='']=mantissa.split('.');
  let coefficient=BigInt(whole+fraction),scale=fraction.length-Number(exponentText);
  if(scale<0){coefficient*=10n**BigInt(-scale);scale=0;}
  return {coefficient,scale};
}
function decimalText(coefficient,scale){
  if(coefficient===0n)return '0';
  let digits=coefficient.toString();
  if(scale===0)return digits;
  if(digits.length<=scale)digits='0'.repeat(scale+1-digits.length)+digits;
  const whole=digits.slice(0,-scale),fraction=digits.slice(-scale).replace(/0+$/,'');
  return fraction?`${whole}.${fraction}`:whole;
}
function numeric(coefficient,scale){return Number(decimalText(coefficient,scale));}

export function run(x){
  obj(x);if(JSON.stringify(x).length>200000)throw Error('Input exceeds 200 KB limit');
  num(x.budget,'budget',0);
  const inputQueries=arr(x.queries,'queries').map(q=>{
    obj(q);str(q.id);num(q.epsilon,'epsilon',0);
    return {id:q.id,epsilon:q.epsilon,parts:decimalParts(q.epsilon)};
  });
  const budgetParts=decimalParts(x.budget);
  const scale=Math.max(budgetParts.scale,...inputQueries.map(query=>query.parts.scale));
  const scaled=parts=>parts.coefficient*10n**BigInt(scale-parts.scale);
  const budget=scaled(budgetParts);let spent=0n;
  const rows=inputQueries.map(query=>{
    const epsilon=scaled(query.parts),spentBefore=spent,accepted=spent+epsilon<=budget;
    if(accepted)spent+=epsilon;
    const remaining=budget-spent,overrun=accepted?0n:spentBefore+epsilon-budget;
    return {
      id:query.id,epsilon:query.epsilon,epsilonExact:decimalText(epsilon,scale),
      decision:accepted?'accepted':'rejected',spentBefore:numeric(spentBefore,scale),spentBeforeExact:decimalText(spentBefore,scale),
      spentAfter:numeric(spent,scale),spentAfterExact:decimalText(spent,scale),
      remaining:numeric(remaining,scale),remainingExact:decimalText(remaining,scale),
      overrun:numeric(overrun,scale),overrunExact:decimalText(overrun,scale)
    };
  });
  return {metrics:{budget:x.budget,budgetExact:decimalText(budget,scale),spent:numeric(spent,scale),spentExact:decimalText(spent,scale),remaining:numeric(budget-spent,scale),remainingExact:decimalText(budget-spent,scale),accepted:rows.filter(row=>row.decision==='accepted').length,rejected:rows.filter(row=>row.decision==='rejected').length},rows};
}
