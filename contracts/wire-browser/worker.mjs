import {execute} from './suite.mjs';
self.onmessage=async event=>{
  try {
    let blocked=false;try{Function('return 1')();}catch{blocked=true;}
    if(!blocked)throw new Error('worker_dynamic_codegen_allowed');
    const result=await execute(event.data.isolated);
    self.postMessage({all_passed:true,result,eval_blocked:true,user_agent:navigator.userAgent});
  } catch(e){self.postMessage({all_passed:false,error:String(e.message)});}
};
