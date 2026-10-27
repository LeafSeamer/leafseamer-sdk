import {execute} from './suite.mjs';
const output=document.getElementById('result'),violations=[];
document.addEventListener('securitypolicyviolation',event=>violations.push({directive:event.effectiveDirective,blocked_uri:event.blockedURI}));
try {
  const mode=location.pathname.slice(1),isolated=mode==='isolated';
  if(!['plain','isolated'].includes(mode))throw new Error('unknown_mode');
  let evalBlocked=false;try{Function('globalThis.__forbiddenEval=true')();}catch{evalBlocked=true;}
  const script=document.createElement('script');script.textContent='globalThis.__forbiddenInline=true';document.body.append(script);
  await new Promise(resolve=>setTimeout(resolve,30));
  if(!evalBlocked||globalThis.__forbiddenEval||globalThis.__forbiddenInline)throw new Error('csp_not_enforced');
  const page=await execute(isolated);
  const worker=new Worker('/worker.mjs',{type:'module'});
  let workerResult;
  try {
    workerResult=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('worker_timeout')),120000);
      worker.onmessage=event=>{clearTimeout(timer);resolve(event.data);};
      worker.onerror=()=>{clearTimeout(timer);reject(new Error('worker_failure'));};
      worker.postMessage({isolated});
    });
  } finally {worker.terminate();}
  if(!workerResult.all_passed)throw new Error(workerResult.error);
  const report={all_passed:true,mode,user_agent:navigator.userAgent,eval_blocked:true,inline_blocked:true,
    csp_violations:violations,page,worker:workerResult};
  const response=await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
  if(!response.ok)throw new Error('report_save_failed');
  output.textContent=JSON.stringify({all_passed:true,mode,page_checks:page.cases_passed,worker_checks:workerResult.result.cases_passed,
    skipped_per_context:page.skipped_shared_buffer_checks,eval_blocked:true,inline_blocked:true},null,2);
  document.title='PASS — '+mode+' 完整解码验收';
}catch(e){output.textContent='FAIL: '+e.message;document.title='FAIL — 完整解码验收';
  await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({all_passed:false,error:String(e.message)})});}
