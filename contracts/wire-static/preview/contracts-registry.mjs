import * as validators from "./contracts-validators.mjs";
export class WireError extends Error {
  constructor(stage,reason,offset) { super(reason); this.stage=stage; this.reason=reason; this.offset=offset; }
  public() { return {stage:this.stage,reason_code:this.reason,...(this.offset===undefined?{}:{byte_offset:this.offset})}; }
}
const compiled=new WeakMap();
const schemas=new Map();
for(const name of ["selection","client_frame","server_frame","snapshot_manifest","snapshot_page"]){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}
export function getSchema(name){const handle=schemas.get(name);if(!handle)throw new WireError("schema","unregistered_model");return handle;}
export function isSchema(handle) { return compiled.has(handle); }
export function validateValue(handle,value,numbers) {
  const validate=compiled.get(handle);
  if(!validate)throw new WireError('input','trusted_configuration');
  let ok;
  try { ok=validate.call({numbers},value); }
  catch { throw new WireError('schema','schema_execution'); }
  if(ok)return;
  for(const error of validate.errors??[]) {
    const token=numbers.get(error.instancePath);
    if(token && (error.keyword==='xRawInteger'||error.keyword==='type' &&
        (error.params.type==='integer'||Array.isArray(error.params.type)&&error.params.type.includes('integer')))) {
      if(!token.integer)throw new WireError('schema','raw_integer',token.start);
      if(!token.safe)throw new WireError('schema','integer_range',token.start);
    }
  }
  throw new WireError('schema','schema_rejected');
}
