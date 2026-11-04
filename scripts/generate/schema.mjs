const dialect='https://json-schema.org/draft/2020-12/schema';
const escape=s=>s.replaceAll('~','~0').replaceAll('/','~1');
export function derive(source) {
  const derived=structuredClone(source),integerPaths=[],rewrites=[];
  const stack=[[derived,'']];let nodes=0;
  while(stack.length) {
    const [node,path]=stack.pop();
    if(++nodes>262144)throw new Error('schema_budget');
    if(typeof node==='boolean')continue;
    if(!node || typeof node!=='object' || Array.isArray(node))throw new Error('schema_invalid');
    if(Object.hasOwn(node,'xRawInteger'))throw new Error('reserved_keyword');
    if(Object.hasOwn(node,'$schema')) {
      if(![dialect,dialect+'#'].includes(node.$schema))throw new Error('dialect');
      node.$schema=dialect;
    }
    for(const key of ['$ref','$dynamicRef'])if(Object.hasOwn(node,key) && (typeof node[key]!=='string'||!node[key].startsWith('#')))
      throw new Error('external_reference');
    const types=Array.isArray(node.type)?node.type:[node.type];
    if(types.includes('integer')) {
      integerPaths.push(path+'/type');
      // 同一union中的number保留近似语义；其他成功分支仍由Ajv正常选择。
      if(!types.includes('number'))node.xRawInteger=true;
    }
    for(const key of ['$defs','properties','patternProperties','dependentSchemas'])
      for(const [name,value] of Object.entries(node[key]??{}))stack.push([value,path+'/'+key+'/'+escape(name)]);
    for(const key of ['allOf','anyOf','oneOf','prefixItems'])
      for(const [i,value] of (node[key]??[]).entries())stack.push([value,path+'/'+key+'/'+i]);
    for(const key of ['items','contains','additionalProperties','unevaluatedProperties','unevaluatedItems','propertyNames','not','if','then','else','contentSchema'])
      if(Object.hasOwn(node,key))stack.push([node[key],path+'/'+key]);
    // Ajv跳过properties中的__proto__名称；等价迁移到精确pattern保留该数据字段的约束。
    if(node.properties && Object.hasOwn(node.properties,'__proto__')) {
      const pattern='^__proto__$(?![\\s\\S])',value=node.properties.__proto__;
      node.patternProperties??={};
      const target=path+'/patternProperties/'+escape(pattern),collision=Object.hasOwn(node.patternProperties,pattern);
      node.patternProperties[pattern]=collision?{allOf:[node.patternProperties[pattern],value]}:value;
      delete node.properties.__proto__;
      rewrites.push({source:path+'/properties/__proto__',derived:target+(collision?'/allOf/1':'')});
      if(collision)rewrites.push({source:target,derived:target+'/allOf/0'});
    }
  }
  return derived;
}
