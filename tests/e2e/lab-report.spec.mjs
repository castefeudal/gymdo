import {test,expect} from '@playwright/test';
const pdf=()=>{
 const text='Total testosterone 13.1 nmol/L';
 const stream=`BT /F1 14 Tf 40 750 Td (${text}) Tj ET`;
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
 let body='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(body.length);body+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
 const start=body.length;body+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return Buffer.from(body);
};
test('PDF stays local and extracted suggestions require explicit review and date',async({page})=>{
 const external=[];page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1')&&!request.url().startsWith('data:')&&!request.url().startsWith('blob:'))external.push(request.url());});
 await page.goto('/index.html#labs');await expect(page.locator('[data-report-file]')).toHaveCount(1);
 await page.locator('.lab-import summary').click();await page.locator('[data-report-file]').setInputFiles({name:'report.pdf',mimeType:'application/pdf',buffer:pdf()});
 await page.locator('[data-report-read]').click();await expect(page.locator('[data-report-use]')).toHaveCount(1);await expect(page.locator('.lab-result-entry').filter({has:page.locator('[data-lab-edit]')})).toHaveCount(0);
 await page.locator('[data-report-use]').click();await expect(page.locator('.lab-result-form [name=value]')).toHaveValue('13.1');await expect(page.locator('.lab-result-form [name=date]')).toHaveValue('');expect(external).toEqual([]);
});
test('OCR recognizes a real image locally before offering review',async({page},info)=>{
 test.slow();
 await page.goto('/index.html#labs');await expect(page.locator('[data-report-file]')).toHaveCount(1);
 const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1500;c.height=220;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='black';ctx.font='48px Arial';ctx.fillText('Total testosterone 13.1 nmol/L',40,110);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('.lab-import summary').click();await page.locator('[data-report-ocr]').check();await page.locator('[data-report-file]').setInputFiles({name:'scan.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
 await page.locator('[data-report-read]').click();await expect(page.locator('[data-report-text]')).toHaveValue(/testosterone.*13[.,]1/i,{timeout:90000});await expect(page.locator('[data-report-use]')).toHaveCount(1);
});
