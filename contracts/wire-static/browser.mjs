import {run} from './runtime-tests.mjs';
const target=document.getElementById('result'),violations=[];
document.addEventListener('securitypolicyviolation',e=>violations.push({directive:e.effectiveDirective,blocked_uri:e.blockedURI}));
try {
  let evalBlocked=false;
  try{Function('globalThis.__forbiddenEval=true')();}catch{evalBlocked=true;}
  const script=document.createElement('script');script.textContent='globalThis.__forbiddenInline=true';document.body.append(script);
  await new Promise(r=>setTimeout(r,30));
  if(!evalBlocked||globalThis.__forbiddenEval||globalThis.__forbiddenInline)throw new Error('CSP未禁止动态代码和内联脚本');
  const [cases,contractCases]=await Promise.all(['cases.json','contract-cases.json'].map(async n=>{
    const response=await fetch('/preview/'+n,{cache:'no-store'});if(!response.ok)throw new Error('夹具读取失败');return response.json();
  }));
  const result=await run(cases,contractCases);
  const report={...result,user_agent:navigator.userAgent,eval_blocked:evalBlocked,inline_blocked:!globalThis.__forbiddenInline,
    csp_violations:violations,location_origin:location.origin};
  const response=await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
  if(!response.ok)throw new Error('报告保存失败');
  target.textContent=JSON.stringify({all_passed:true,cases_passed:result.cases_passed,eval_blocked:true,inline_blocked:true},null,2);
  document.title='PASS — LeafSeamer 静态校验验收';
} catch(e) {
  target.textContent='FAIL: '+e.message;document.title='FAIL — LeafSeamer 静态校验验收';
  await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({all_passed:false,error:e.message,user_agent:navigator.userAgent})});
}
