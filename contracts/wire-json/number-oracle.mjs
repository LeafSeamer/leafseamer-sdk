// 独立V8及BigInt算术对照；不声称这是JS入口扫描器或浏览器验收。
import fs from 'node:fs';
const inputs=JSON.parse(fs.readFileSync(0,'utf8'));
const results=inputs.map(text=>{
  const value=JSON.parse(text);
  const [mantissa,exponent='0']=text.toLowerCase().split('e');
  const [whole,fraction='']=mantissa.replace('-','').split('.');
  const coefficient=BigInt(whole+fraction);
  const power=Number(exponent)-fraction.length;
  const denominator=power<0?10n**BigInt(-power):1n;
  const numerator=power>0?coefficient*10n**BigInt(power):coefficient;
  const integer=numerator%denominator===0n;
  const safe=integer && numerator/denominator<=9007199254740991n;
  const bits=new DataView(new ArrayBuffer(8));bits.setFloat64(0,value,false);
  return {text,integer,safe,finite:Number.isFinite(value),underflow:coefficient!==0n && value===0,
    bits:bits.getBigUint64(0,false).toString(16).padStart(16,'0')};
});
process.stdout.write(JSON.stringify({node:process.version,results}));
