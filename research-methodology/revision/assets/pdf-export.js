/* PDF pages are drawn locally to high-resolution canvases, preserving Unicode
   browser text and the student's diagram. No answer content is sent to a server.
   Pages use raster text for consistent appearance, so PDF text is not selectable. */
(()=>{
'use strict';
const W=595.28,H=841.89,SCALE=2.5,M=44,CONTENT=W-2*M,BOTTOM=H-58;
const colors={navy:'#102e49',ink:'#263b4b',muted:'#5d7182',line:'#d9e2e9',pale:'#f1f6fa',gold:'#a87316'};
function yieldUI(){return new Promise(resolve=>setTimeout(resolve,0))}
async function generate(state,{incomplete=false}={}){
 if(!window.PDFLib)throw Error('The local PDF library did not load. Keep the assets folder with this page.');
 const {PDFDocument}=window.PDFLib, pdf=await PDFDocument.create(),api=window.RM_WORKSPACE;
 pdf.setTitle('BPMNK3143 Chapters 1–5 Revision — '+state.student.matric);pdf.setAuthor(state.student.name);pdf.setSubject('Student revision answers');
 const date=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kuala_Lumpur',day:'2-digit',month:'short',year:'numeric'}).format(new Date());
 let canvas,ctx,y=0,title='',pages=[],pageCounter=0;
 function font(size=11,bold=false){ctx.font=`${bold?'bold ':''}${size}px Arial,Helvetica,sans-serif`;ctx.textBaseline='alphabetic'}
 function lineText(text,x,baseline,size=11,bold=false,color=colors.ink){font(size,bold);ctx.fillStyle=color;ctx.fillText(text,x,baseline)}
 function lines(text,width,size=11,bold=false){font(size,bold);const result=[];const paragraphs=String(text||'').replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n');for(const p of paragraphs){if(!p){result.push('');continue}let line='';const words=p.split(/(\s+)/u);for(const word of words){if(ctx.measureText(line+word).width<=width){line+=word;continue}if(line.trim())result.push(line.trimEnd());line='';if(ctx.measureText(word).width<=width){line=word.trimStart();continue}for(const ch of Array.from(word)){if(ctx.measureText(line+ch).width>width&&line){result.push(line);line=''}line+=ch}}result.push(line.trimEnd())}return result;}
 function savePage(){if(canvas)pages.push(canvas)}
 function newPage(continued=false){savePage();pageCounter++;if(pageCounter>150)throw Error('This response is too long to export at once. Save a draft and ask your lecturer for help.');canvas=document.createElement('canvas');canvas.width=Math.round(W*SCALE);canvas.height=Math.round(H*SCALE);ctx=canvas.getContext('2d');ctx.scale(SCALE,SCALE);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);lineText('BPMNK3143 · BUSINESS RESEARCH METHODOLOGY',M,29,8.5,true,colors.navy);lineText('CHAPTERS 1–5 · RESEARCH APPLICATION & EXAM REVISION',M,43,8, false,colors.muted);ctx.strokeStyle=colors.line;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(M,53);ctx.lineTo(W-M,53);ctx.stroke();
  const info=`${state.student.name} · ${state.student.matric} · ${state.student.class}`;const header=lines(info,CONTENT,9);header.forEach((s,i)=>lineText(s,M,70+i*12,9,false,colors.muted));y=84+header.length*12;
  if(incomplete){lineText('INCOMPLETE — PERSONAL REVIEW COPY',M,y,9,true,'#a92f25');y+=18}
  const headings=lines(title+(continued?' (continued)':''),CONTENT,18,true);headings.forEach(s=>{lineText(s,M,y,18,true,colors.navy);y+=24});y+=7;
 }
 function need(h){if(y+h>BOTTOM)newPage(true)}
 function paragraph(text,{size=11,lineHeight=16,bold=false,color=colors.ink,space=11}={}){const all=lines(text||'[Not answered]',CONTENT,size,bold);for(const s of all){need(lineHeight+3);lineText(s,M,y+size,size,bold,color);y+=lineHeight}y+=space;}
 function field(label,value){need(52);paragraph(label,{size:10.5,lineHeight:15,bold:true,color:colors.navy,space:5});paragraph(value.trim()||'[Not answered]',{size:11.5,lineHeight:17,space:16});}
 function table(headers,rows){const widths=[CONTENT*.22,CONTENT*.39,CONTENT*.39],pad=8,lh=15;
  const header=()=>{need(45);let x=M;headers.forEach((h,i)=>{ctx.fillStyle=colors.navy;ctx.fillRect(x,y,widths[i],29);lineText(h,x+pad,y+18,9,true,'#fff');x+=widths[i]});y+=29;};header();
  for(const row of rows){const cellLines=row.map((v,i)=>lines(v.trim()||'[Not answered]',widths[i]-2*pad,10.5));let offset=0,max=Math.max(...cellLines.map(a=>a.length));while(offset<max){if(y+35>BOTTOM){newPage(true);header()}const count=Math.min(max-offset,Math.max(1,Math.floor((BOTTOM-y-2*pad)/lh))),rh=count*lh+2*pad;let x=M;cellLines.forEach((ls,i)=>{ctx.fillStyle=offset?'#f7fafc':'#fff';ctx.fillRect(x,y,widths[i],rh);ctx.strokeStyle=colors.line;ctx.lineWidth=.5;ctx.strokeRect(x,y,widths[i],rh);ls.slice(offset,offset+count).forEach((s,j)=>lineText(s,x+pad,y+pad+11+j*lh,10.5));x+=widths[i]});y+=rh;offset+=count;if(offset<max){newPage(true);header()}}}y+=18;}
 function framework(){const diagramHeight=Math.max(190,...state.nodes.map(n=>api.coordinates(n).y+130)),h=CONTENT*diagramHeight/900;need(h+50);paragraph('b. Labelled framework',{bold:true,size:11,color:colors.navy,space:4});const origin=y;ctx.save();ctx.translate(M,origin);ctx.scale(CONTENT/900,CONTENT/900);ctx.fillStyle='#fbfcfe';ctx.fillRect(0,0,900,diagramHeight);ctx.strokeStyle=colors.line;ctx.lineWidth=1.5;ctx.strokeRect(0,0,900,diagramHeight);
  state.edges.forEach(edge=>{const a=state.nodes.find(n=>n.id===edge.from),b=state.nodes.find(n=>n.id===edge.to);if(!a||!b)return;const p=api.endpoints(a,b),angle=Math.atan2(p.ty-p.sy,p.tx-p.sx);ctx.strokeStyle='#1769aa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(p.tx,p.ty);ctx.stroke();ctx.fillStyle='#1769aa';ctx.beginPath();ctx.moveTo(p.tx,p.ty);ctx.lineTo(p.tx-15*Math.cos(angle-.45),p.ty-15*Math.sin(angle-.45));ctx.lineTo(p.tx-15*Math.cos(angle+.45),p.ty-15*Math.sin(angle+.45));ctx.closePath();ctx.fill();});
  state.nodes.forEach((node,i)=>{const c=api.coordinates(node);ctx.fillStyle='#edf4fa';ctx.strokeStyle='#789ab7';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(c.x,c.y,c.w,c.h,12);ctx.fill();ctx.stroke();let words=api.labelLines(node.label);if(words.length>3)words=[...words.slice(0,2),words[2].slice(0,-1)+'…'];ctx.font='19px Arial';ctx.textAlign='center';ctx.fillStyle=colors.navy;words.forEach((s,j)=>ctx.fillText(s,c.x+130,c.y+42-(words.length-1)*11+j*22));ctx.font='14px Arial';ctx.fillStyle=colors.muted;ctx.fillText(`${i+1} · ${node.role}`,c.x+130,c.y+82)});ctx.restore();y+=h+15;
  if(!state.nodes.length)paragraph('[Framework not supplied]',{color:'#a92f25'});
  need(43);paragraph('Full variable labels and arrows',{size:10,bold:true,color:colors.muted,space:4});state.nodes.forEach((n,i)=>paragraph(`${i+1}. ${n.label||'[Unlabelled]'} — ${n.role}`,{size:10,lineHeight:14,space:4}));state.edges.forEach(edge=>{const a=state.nodes.find(n=>n.id===edge.from),b=state.nodes.find(n=>n.id===edge.to);paragraph(`${a?.label||'[Unlabelled]'} → ${b?.label||'[Unlabelled]'}`,{size:10,lineHeight:14,space:3})});y+=12;
 }
 for(let qi=0;qi<api.activity.questions.length;qi++){const q=api.activity.questions[qi];title=`Question ${qi+1} · ${q.title}`;newPage();paragraph(q.chapter,{size:9,color:colors.muted,space:14});
  if(q.id==='q2'){table(['Hallmark','Case weakness','Practical improvement'],[[state.answers.q2h1,state.answers.q2w1,state.answers.q2i1],[state.answers.q2h2,state.answers.q2w2,state.answers.q2i2]])}
  else for(let i=0;i<q.fields.length;i++){if(q.id==='q5'&&i===3)framework();const f=q.fields[i];field(f.label,state.answers[f.id]);}
  await yieldUI();
 }
 savePage();
 for(let i=0;i<pages.length;i++){const c=pages[i],context=c.getContext('2d');context.save();context.setTransform(SCALE,0,0,SCALE,0,0);context.strokeStyle=colors.line;context.lineWidth=.6;context.beginPath();context.moveTo(M,H-43);context.lineTo(W-M,H-43);context.stroke();context.font='8px Arial';context.fillStyle=colors.muted;context.fillText(`${state.student.matric} · Generated ${date}`,M,H-27);context.textAlign='right';context.fillText(`Page ${i+1} of ${pages.length}`,W-M,H-27);context.restore();const img=await pdf.embedPng(c.toDataURL('image/png'));const page=pdf.addPage([W,H]);page.drawImage(img,{x:0,y:0,width:W,height:H});await yieldUI();}
 const bytes=await pdf.save();api.download(new Blob([bytes],{type:'application/pdf'}),`BPMNK3143_Revision_${api.safeName()}${incomplete?'_INCOMPLETE':''}.pdf`);
 return {pages:pages.length,bytes:bytes.length};
}
window.RM_PDF={generate};
})();
