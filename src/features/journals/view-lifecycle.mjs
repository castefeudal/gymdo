/** A failed journal write must not leave an uncommitted memory snapshot behind. */
export function createJournalWriter({read,write,remove,flush,persistent}){
  const pending=new Map();
  const save=(key,value)=>{
    let raw;try{raw=JSON.stringify(value);}catch{return Promise.resolve(false);}
    const previous=read(key);
    const task=(async()=>{
      try{if(write(key,raw)===true){await flush();if(persistent())return true;}}catch{}
      if(read(key)===raw){try{if(previous==null)remove(key);else write(key,previous);await flush();}catch{}}
      return false;
    })();
    pending.set(key,task);task.then(()=>{if(pending.get(key)===task)pending.delete(key);});return task;
  };
  save.pending=key=>pending.get(key)||Promise.resolve();return save;
}
export function beginJournalView(host){
  host.journalController?.abort();
  host.setAttribute?.('aria-busy','false');
  const controller=new AbortController();host.journalController=controller;return controller.signal;
}
const extra=['data-report-text','data-report-ocr','data-report-file','data-lab-result-filter','data-cft-date','data-cft-confirm'];
export function captureJournalDraft(host){
  const fields=[...host.querySelectorAll('input[name],select[name],textarea[name],'+extra.map(key=>'['+key+']').join(','))].map(node=>({
    selector:node.name?'[name="'+CSS.escape(node.name)+'"]':'['+extra.find(key=>node.hasAttribute(key))+']',
    value:node.value,checked:node.checked,files:node.type==='file'?node.files:null,
  }));
  fields.open=[...host.querySelectorAll('details')].map(node=>node.open);return fields;
}
export function restoreJournalDraft(host,draft){
  for(const field of draft){const node=host.querySelector(field.selector);if(!node)continue;
    try{if(node.type==='file'){if(field.files?.length)node.files=field.files;continue;}node.value=field.value;if(node.type==='checkbox')node.checked=field.checked;node.dispatchEvent(new Event('change',{bubbles:true}));}catch{}
  }
  [...host.querySelectorAll('details')].forEach((node,index)=>{if(draft.open?.[index]!=null)node.open=draft.open[index];});
  if(host.querySelector('[data-report-text]')?.value)host.querySelector('[data-report-parse]')?.click();
}
