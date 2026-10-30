export function log(level:'info'|'warn'|'error',event:string,details:Record<string,unknown>={}) {
  console[level]('[Unifield]', {time:new Date().toISOString(),event,...details});
}
export class PortalError extends Error { override name='PortalError'; }
export async function getJson<T>(url:string,timeoutMs=15000):Promise<T> {
  const started=performance.now();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  // Log the endpoint category, never the registration, owner, documents or notes.
  const source=url.split('/')[2];
  log('info','api.request.started',{source});
  try {
    const response=await fetch(url,{signal:controller.signal});
    const requestId=response.headers.get('X-Request-ID');
    log(response.ok?'info':'warn','api.response',{source,status:response.status,requestId,durationMs:Math.round(performance.now()-started)});
    if(!response.ok){
      const message=response.status===400?'Enter a valid vehicle registration number.':response.status===404?'No vehicle record exists for this registration number.':`The vehicle service is unavailable. Please try again.${requestId?' Reference: '+requestId:''}`;
      throw new PortalError(message);
    }
    try{return await response.json() as T;}catch{throw new PortalError('The server returned an unreadable response. Please retry.');}
  }catch(error){
    log('error','api.request.failed',{source,errorType:error instanceof Error?error.name:'Unknown',durationMs:Math.round(performance.now()-started)});
    if(error instanceof PortalError)throw error;
    throw new PortalError(controller.signal.aborted?'The request timed out. Please try again.':'Unable to connect to the server. Check your connection and retry.');
  }finally{clearTimeout(timeout);}
}
