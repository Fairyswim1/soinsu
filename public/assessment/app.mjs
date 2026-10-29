import {VERSION,source,standards,profiles,makeTasks,recordAttempt,report} from './bank.mjs';
const {game}=await (await fetch('./profile.json')).json(),profile=profiles[game],$=s=>document.querySelector(s),key=`math-evidence:${game}:${VERSION}`;
const empty=()=>({schema:1,version:VERSION,game,learnerSession:crypto.randomUUID(),startedAt:new Date().toISOString(),attempts:[],hints:[],hintEvents:[],reviews:{},rounds:{}});
let data;try{const raw=JSON.parse(localStorage.getItem(key));data=raw?.version===VERSION&&Array.isArray(raw.attempts)&&Array.isArray(raw.hints)&&raw.reviews&&raw.rounds?raw:empty();}catch{data=empty();}
data.hintEvents ??= [];
let active=null,queue=[],index=0,selected={},submitted=false;
function save(){try{localStorage.setItem(key,JSON.stringify(data));}catch{$('#storage-warning').hidden=false;$('#storage-warning').textContent='이 브라우저에 저장하지 못했어요. 페이지를 닫기 전에 학습 기록을 파일로 저장해 주세요.';}}
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn){const b=node('button',text);b.type='button';b.onclick=fn;return b;}
document.documentElement.style.setProperty('--accent',profile.color);document.title=`${profile.title} · 성취기준 확인`;$('#title').textContent=profile.title+' · 학습 확인';$('#context').textContent=profile.context;
function selection(){const target=$('#selection');target.replaceChildren();for(const r of report(game,data.attempts,data.reviews)){const card=node('article',undefined,'standard-card');card.append(node('span',r.code,'code'),node('h2',r.text),node('span',r.status,'badge'),node('p',standards[r.code].limit),button('확인 임무 시작',()=>start(r.code)));target.append(card);}}
function start(code){const round=data.rounds[code]||0;queue=makeTasks(game,round).filter(t=>t.code===code);const fresh=queue.findIndex(t=>!data.attempts.some(a=>a.taskId===t.id));index=fresh<0?0:fresh;$('#mission').hidden=false;$('#report').hidden=true;draw();$('#mission-title').focus();}
function svgChart(diagram,points=[]){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 400 400');svg.classList.add('chart');svg.setAttribute('role','img');
 const line=diagram.type==='line',coord=diagram.type==='coordinate',xMin=coord||line?-4:0,xMax=coord||line?4:3,yMin=coord?-4:0,yMax=coord?4:5;
 const px=x=>45+(x-xMin)/(xMax-xMin)*310,py=y=>350-(y-yMin)/(yMax-yMin)*300;
 function add(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;svg.append(e);return e;}
 for(let x=xMin;x<=xMax;x++){add('line',{x1:px(x),x2:px(x),y1:line?193:50,y2:line?207:350,class:'grid'});add('text',{x:px(x),y:line?225:373,'text-anchor':'middle'},x);}
 if(!line)for(let y=yMin;y<=yMax;y++){add('line',{x1:45,x2:355,y1:py(y),y2:py(y),class:'grid'});add('text',{x:30,y:py(y)+4,'text-anchor':'end'},y);}
 add('line',{x1:45,x2:365,y1:line?200:py(0),y2:line?200:py(0),class:'axis'});
 if(!line)add('line',{x1:px(0),x2:px(0),y1:40,y2:350,class:'axis'});
 if(coord){add('text',{x:380,y:py(0)+5},'x');add('text',{x:px(0)+8,y:35},'y');}
 if(diagram.type==='graph'){add('text',{x:355,y:395,'text-anchor':'end'},`시간 (${diagram.context[1]})`);add('text',{x:45,y:27},`${diagram.context[0]} (${diagram.context[2]})`);}
 const ps=diagram.point!==undefined?[line?[diagram.point,0]:diagram.point]:diagram.ys?diagram.ys.map((y,x)=>[x,y]):points.map(s=>s.split(',').map(Number));
 if(diagram.type==='graph'&&ps.length>1)add('polyline',{points:ps.sort((a,b)=>a[0]-b[0]).map(([x,y])=>`${px(x)},${py(y)}`).join(' '),fill:'none',stroke:'var(--accent)','stroke-width':3});
 for(const [x,y]of ps){add('circle',{cx:px(x),cy:line?200:py(y),r:6,class:'dot'});if(diagram.point!==undefined)add('text',{x:px(x)+10,y:(line?200:py(y))-12},'A');}
 svg.setAttribute('aria-label',line?'수직선: 점 A의 위치를 그림에서 읽으세요.':coord?'좌표평면: 점 A의 위치를 그림에서 읽으세요.':'시간에 따른 변화 그래프');
 return {svg,px,py,xMin,xMax,yMin,yMax};
}
function plotField(f,container){
 const wrap=node('div',undefined,'plot-wrap'),board=node('div',undefined,'plot-board'),summary=node('div','','plot-summary');summary.setAttribute('aria-live','polite');selected[f.key]=[];
 const diagram={type:f.mode,context:f.context},chart=svgChart(diagram);board.append(chart.svg);
 const refresh=()=>{const next=svgChart(diagram,selected[f.key]);board.replaceChild(next.svg,board.firstChild);summary.textContent=selected[f.key].length?'선택: '+selected[f.key].map(s=>`(${s})`).join(' · '):'아직 선택한 점이 없어요.';for(const b of board.querySelectorAll('button'))b.setAttribute('aria-pressed',selected[f.key].includes(b.dataset.point));};
 for(let y=chart.yMax;y>=chart.yMin;y--)for(let x=chart.xMin;x<=chart.xMax;x++){
  const point=`${x},${y}`,b=button('●',()=>{let a=selected[f.key];if(a.includes(point))a=a.filter(p=>p!==point);else if(f.single)a=[point];else a=a.filter(p=>p.split(',')[0]!==String(x)).concat(point);selected[f.key]=a;submitted=false;refresh();});b.className='plot-cell';b.dataset.point=point;b.setAttribute('aria-label',f.mode==='graph'?`${x}분, 값 ${y}`:`점 (${x}, ${y})`);b.style.left=chart.px(x)/4+'%';b.style.top=chart.py(y)/4+'%';b.setAttribute('aria-pressed','false');board.append(b);
 }wrap.append(board,summary);container.append(wrap);refresh();
}
function draw(){active=queue[index];submitted=false;selected={};$('#standard-label').textContent=active.code+' · '+standards[active.code].skills[active.skill];$('#progress').textContent=`${index+1} / ${queue.length}`;$('#mission-title').textContent=active.prompt;$('#feedback').textContent='';$('#hint-text').hidden=true;$('#diagram').replaceChildren();if(active.diagram)$('#diagram').append(svgChart(active.diagram).svg);
 const fs=$('#fields');fs.replaceChildren();for(const f of active.fields){const box=node('div',undefined,'field'),label=node('label',f.label);box.append(label);if(f.type==='plot'){plotField(f,box);}else{const input=node(f.type==='choice'?'select':'input');input.id='answer-'+f.key;input.name=f.key;label.htmlFor=input.id;if(f.type==='choice'){input.append(new Option('선택하세요',''));f.options.forEach(v=>input.append(new Option(v,v)));}else{input.type='text';input.autocomplete='off';input.maxLength=150;if(f.type==='number')input.inputMode='decimal';}input.required=true;input.oninput=()=>{submitted=false;};box.append(input);}fs.append(box);}$('#hint').textContent=data.hints.includes(active.id)?'도움말 다시 보기':'도움말 보기';
}
$('#hint').onclick=()=>{if(!data.hints.includes(active.id))data.hints.push(active.id);data.hintEvents.push({taskId:active.id,code:active.code,at:new Date().toISOString()});save();$('#hint-text').hidden=false;$('#hint-text').textContent=active.hint+' 이 과제는 도움 사용으로 기록돼요.';};
$('#answer-form').onsubmit=e=>{e.preventDefault();if(submitted)return;const response=Object.fromEntries(new FormData(e.target));for(const f of active.fields)if(f.type==='plot')response[f.key]=selected[f.key];const a=recordAttempt(active,response,data.attempts,data.hints.includes(active.id));data.attempts.push(a);save();submitted=true;$('#feedback').textContent=a.correct?(a.independent?'혼자 해결했어요. 첫 제출의 수행 증거로 기록했습니다.':'해결했어요. 도움 또는 재시도 후 해결로 기록했습니다.'):'아직 맞지 않는 부분이 있어요: '+a.fields.filter(f=>!f.correct).map(f=>active.fields.find(x=>x.key===f.key).label).join(', ')+'. 답을 고치거나 도움말을 확인해 보세요.';selection();};
$('#skip').onclick=()=>{if(index<queue.length-1){index++;draw();$('#mission-title').focus();}else{data.rounds[active.code]=(data.rounds[active.code]||0)+1;save();showReport();}};
function showReport(){
 $('#report').hidden=false;$('#mission').hidden=true;const target=$('#report-rows');target.replaceChildren();
 for(const r of report(game,data.attempts,data.reviews)){
  const s=standards[r.code],card=node('article',undefined,'report-card');card.append(node('small',r.code),node('h3',r.text),node('span',r.status,'badge'));
  for(const row of r.rows){const line=node('div',undefined,'skill-row');line.append(node('span',row.title),node('span',`${row.checked?'✓':'○'} 독립 ${row.independent}/${row.required} · 오답 ${row.errors} · 도움 후 제출 ${row.assisted}`));card.append(line);}
  card.append(node('p',s.limit,'small'));const review=data.reviews[r.code]||{},response=node('textarea');response.value=review.response||'';response.id='explain-'+r.code;response.maxLength=4000;const label=node('label',s.explain);label.htmlFor=response.id;
  const persist=()=>{data.reviews[r.code]={...data.reviews[r.code],response:response.value};save();};response.oninput=()=>{data.reviews[r.code]={...data.reviews[r.code],verdict:'pending'};persist();};card.append(label,response,button('내 설명 저장',()=>{persist();showReport();selection();}));
  const d=node('details'),summary=node('summary','교사 검토 기록');d.append(summary,node('p','학생의 설명과 아래 제출 과정을 읽고 기록합니다. 교사 신원을 인증하는 기능은 아니며 공식 성적 처리가 아닙니다.','small'),node('p','검토 관점: '+s.rubric,'rubric'));
  const verdict=node('select');verdict.setAttribute('aria-label',r.code+' 설명 검토');verdict.append(new Option('검토 대기','pending'),new Option('설명이 충분함','sufficient'),new Option('보완 필요','needs-work'));verdict.value=review.verdict||'pending';
  const note=node('textarea');note.setAttribute('aria-label',r.code+' 교사 피드백');note.placeholder='판단 근거와 다음 학습 피드백';note.value=review.note||'';note.maxLength=4000;const msg=node('p',review.at?'마지막 검토: '+new Date(review.at).toLocaleString():'','review-status');
  d.append(verdict,note,button('교사 검토 저장',()=>{if(verdict.value!=='pending'&&(!note.value.trim()||!response.value.trim())){msg.textContent='학생 설명과 교사 판단 근거를 모두 남겨 주세요.';return;}data.reviews[r.code]={response:response.value,verdict:verdict.value,note:note.value,at:new Date().toISOString(),evidenceCount:data.attempts.filter(a=>a.code===r.code).length};save();showReport();selection();}),msg);card.append(d);target.append(card);
 }
 const log=$('#attempts');log.replaceChildren();if(!data.attempts.length)log.append(node('p','아직 제출한 과제가 없어요.'));for(const a of data.attempts){const item=node('div',undefined,'attempt');item.append(node('strong',`${a.code} · ${a.correct?'해결':'다시 확인'} · ${a.independent?'독립 첫 제출':a.hinted?'도움 사용':'재시도 또는 오답'}`),node('p',a.prompt),node('p','제출: '+JSON.stringify(a.response)),node('small',new Date(a.at).toLocaleString()+` · ${a.attempt}번째 제출`));log.append(item);}$('#report-title').focus();
}
let exportUrl=null;
$('#records').onclick=showReport;$('#print').onclick=()=>window.print();$('#export').onclick=()=>{const out={...data,source,summary:report(game,data.attempts,data.reviews),rule:'각 요소 서로 다른 2개 과제에서 무도움 첫 제출 성공. 공식 이수 판정 아님.'},json=JSON.stringify(out,null,2);if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=URL.createObjectURL(new Blob([json],{type:'application/json'}));$('#export-text').value=json;$('#download-record').href=exportUrl;$('#download-record').download=game+'-학습기록-'+new Date().toISOString().slice(0,10)+'.json';$('#export-preview').hidden=false;$('#download-record').focus();};
$('#fresh').onclick=()=>{if(!confirm('현재 기록을 먼저 파일로 저장했나요? 이 기기의 현재 학습 기록을 비우고 새 학습자를 시작합니다.'))return;data=empty();if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=null;$('#export-preview').hidden=true;$('#export-text').value='';$('#download-record').removeAttribute('href');save();selection();showReport();};
selection();save();
