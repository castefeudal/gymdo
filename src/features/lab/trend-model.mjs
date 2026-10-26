import { labCanonicalValue } from './results-model.mjs';
export function labChange(current, previous) {
  if (!current || !previous || current.marker !== previous.marker || !current.laboratory?.trim() || !current.method?.trim() || current.laboratory !== previous.laboratory || current.method !== previous.method) return null;
  const before = current.unit === previous.unit ? previous.value : labCanonicalValue(previous);
  const after = current.unit === previous.unit ? current.value : labCanonicalValue(current);
  if (before == null || after == null || !Number.isFinite(before) || !Number.isFinite(after)) return null;
  const canonicalDelta = after - before;
  const factor = current.unit === previous.unit ? 1 : (labCanonicalValue({ ...current, value: 1 }) ?? 0);
  if (!factor) return null;
  return { absolute: canonicalDelta / factor, relative: before > 0 ? canonicalDelta / before * 100 : null };
}
export function labTrend(rows,marker){
  const groups=new Map();
  for(const row of rows.filter(row=>row.marker===marker)){
    const value=labCanonicalValue(row),unit=value==null?row.unit:'canonical';
    // Missing provenance cannot establish that two assays are comparable.
    const key=JSON.stringify([row.laboratory,row.method,unit,(!row.laboratory?.trim()||!row.method?.trim())?row.id:null]);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({...row,plotValue:value??row.value});
  }
  return [...groups.values()].map(group=>group.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)));
}
// Vermeulen binding-equilibrium approximation; ISSAM constants. Inputs SI.
export function freeTestosterone(total,shbg,albumin){
  if(![total,shbg,albumin].every(Number.isFinite)||total<=0||total>150||shbg<=0||shbg>300||albumin<10||albumin>70)return null;
  const T=total*1e-9,S=shbg*1e-9,N=1+36000*albumin/69000,a=1e9*N,b=N+1e9*(S-T);
  const F=2*T/(b+Math.sqrt(b*b+4*a*T));
  return Number.isFinite(F)&&F>0?F*1e12:null;
}
