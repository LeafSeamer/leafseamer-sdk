import * as validators from "./test-validators.mjs";
export class WireError extends Error {
  constructor(stage,reason,offset) { super(reason); this.stage=stage; this.reason=reason; this.offset=offset; }
  public() { return {stage:this.stage,reason_code:this.reason,...(this.offset===undefined?{}:{byte_offset:this.offset})}; }
}
const compiled=new WeakMap();
const schemas=new Map();
for(const name of ["DW01","DW02","DW03","DW04","DW05","DW06","DW07","DW08","DW09","DW10","DW11","DW12","DW13","DW14","DW15","DW16","DW17","DW18","DW19","DW20","DW21","DW22","DW23","DW24","DW25","DW26","DW27","DW28","DW29","DW30","one_of_integer","nullable","raw_nested","prototype","string_length","unique_objects","date_valid","date_invalid","anything","integer"]){const handle=Object.freeze({name});schemas.set(name,handle);compiled.set(handle,validators[name]);}
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
