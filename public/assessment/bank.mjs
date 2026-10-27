// Curated alignment only. Original curriculum/textbook files are never distributed.
export const VERSION='2026.10.27.1';
export const source={title:'교육부 고시 제2022-33호 [별책8] 수학과 교육과정',sha256:'a11706f7c7a8e0aa650a4d08549895ff10f7920b1bee7b2c2f4ce79ad3795ac8',assessmentPages:[53,54,55]};
export const standards={
 '9수01-01':{text:'소인수분해의 뜻을 알고, 자연수를 소인수분해 할 수 있다.',page:39,skills:{meaning:'소수만의 곱인지 판단',factor:'자연수를 소수의 곱으로 분해',power:'반복된 소인수를 지수로 표현'},explain:'소인수분해를 어디까지 해야 완성인지, 1을 넣지 않는 이유를 예와 함께 설명해 보세요.',rubric:'소수만을 인수로 사용함 / 원래 수와 곱이 같음 / 1은 소수가 아님을 설명',limit:'소인수분해 범위만 확인합니다. 최대공약수·최소공배수는 별도 기준입니다.'},
 '9수01-02':{text:'소인수분해를 이용하여 최대공약수와 최소공배수를 구할 수 있다.',page:39,skills:{gcd:'소인수분해로 최대공약수 구하기',lcm:'소인수분해로 최소공배수 구하기'},explain:'공통 소인수의 지수를 최대공약수에서는 작게, 최소공배수에서는 크게 선택하는 이유를 설명해 보세요.',rubric:'최대공약수는 모든 수를 나누는 공통 소인수 / 최소공배수는 모든 수의 소인수가 필요함 / 지수 선택과 연결',limit:'교육과정 해설에 따라 자연수의 소인수분해 과정으로 확인합니다. 막대·시계의 활용 문제나 전투 점수는 판정 근거로 삼지 않습니다.'},
 '9수01-04':{text:'정수와 유리수의 대소 관계를 판단할 수 있다.',page:39,skills:{integer:'음수·0·양의 정수 비교',rational:'분수·소수와 음의 유리수 비교'},explain:'음수끼리 비교할 때와 분수·소수를 비교할 때 사용한 방법을 예와 함께 적어 보세요.',rubric:'수직선의 오른쪽 수가 큼 / 음수의 절댓값과 순서 구별 / 분수와 소수를 같은 표현으로 비교',limit:'자연수 스테이지는 선수학습입니다. 사칙계산과 유리수 개념 전체를 평가한 것은 아닙니다.'},
 '9수01-09':{text:'실수의 대소 관계를 판단하고 설명할 수 있다.',page:39,skills:{real:'유리수와 무리수 및 음의 제곱근 비교'},explain:'방금 비교한 제곱근과 유리수의 대소 관계를 제곱, 수직선 또는 근삿값으로 설명해 보세요. 음수가 있을 때 순서를 주의하세요.',rubric:'비교 대상이 명확함 / 제곱·근삿값·수직선 중 타당한 근거 / 음수 부호를 올바르게 처리',limit:'중1 범위를 넘어서는 확장입니다. 실수 비교만 다루며 제곱근 성질·무리수 개념 전체의 도달을 주장하지 않습니다.'},
 '9수02-05':{text:'순서쌍과 좌표를 이해하고, 그 편리함을 인식할 수 있다.',page:40,skills:{read:'좌표평면에서 순서쌍 읽기',plot:'순서쌍을 좌표평면에 표시',line:'수직선에서 좌표 읽기'},explain:'구조 위치를 “저기” 대신 순서쌍으로 전달하면 어떤 점이 편리한가요? x와 y의 순서를 바꾸었을 때의 예도 써 보세요.',rubric:'기준점·축·순서를 공유하면 위치를 정확히 전달 / 순서를 바꾸면 다른 위치가 될 수 있음을 예로 설명',limit:'좌표의 편리함은 서술과 교사 검토로 확인합니다. 항로 게임의 승리만으로 이 부분을 자동 판정하지 않습니다.'},
 '9수02-06':{text:'다양한 상황을 그래프로 나타내고, 주어진 그래프를 해석할 수 있다.',page:40,skills:{interpret:'변화 그래프를 읽고 해석',represent:'상황의 자료를 그래프로 표현'},explain:'내가 그린 그래프의 가로·세로축이 무엇인지와 증가·감소·일정한 구간을 설명하세요. 반복되는 파도 그래프로 다음 상황을 예상할 때 필요한 조건도 적어 보세요.',rubric:'축·단위·점의 의미 / 구간의 증가·감소 해석 / 반복이 유지된다는 가정과 예측의 한계',limit:'수위·이동거리·기온 상황을 표본으로 확인합니다. 모든 그래프 유형의 숙달이나 공식적인 이수 여부를 보증하지 않습니다.'}
};
export const profiles={
 'soinsu':{title:'넘버 브레이크',codes:['9수01-01'],color:'#8a4dd1',context:'소수 타일을 연결한 뒤, 새로운 수를 혼자 분해해 보세요.'},
 'moon-clockwork':{title:'달빛 시계공방',codes:['9수01-02'],color:'#986b22',context:'전투에서 만든 장치의 원리를 소인수분해 과정으로 확인해 보세요.'},
 'forest':{title:'넘버 트레일',codes:['9수01-04','9수01-09'],color:'#237650',context:'숫자 길에서 사용한 비교 전략을 확인해 보세요. 실수 비교는 중1 이후의 확장입니다.'},
 'starlight-post':{title:'별빛 항로: 폭풍 구조대',codes:['9수02-05','9수02-06'],color:'#226eb0',context:'구조 위치를 직접 표시하고 관측 자료를 그래프로 그려 보세요.'}
};
const field=(key,label,expected,type='text',extra={})=>({key,label,expected,type,...extra});
const choice=(key,label,expected,options)=>field(key,label,expected,'choice',{options});
export function prime(n){if(!Number.isInteger(n)||n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true;}
export function factors(n){const r=[];for(let p=2;p<=n;p++)while(n%p===0){r.push(p);n/=p;}return r;}
export function parseFactors(s){
 const terms=String(s).trim().replaceAll('×','*').replaceAll('·','*').replaceAll(' ','').split('*');let out=[];
 if(!terms.length||terms.length>32)return null;
 for(const t of terms){const m=t.match(/^(\d+)(?:\^(\d+))?$/);if(!m)return null;const p=Number(m[1]),e=Number(m[2]??1);if(p>1000||!prime(p)||e<1||e>12)return null;out.push(...Array(e).fill(p));}return out;
}
export function checkField(f,value){
 if(f.type==='factor'){const a=parseFactors(value);return !!a&&a.reduce((a,b)=>a*b,1)===f.expected;}
 if(f.type==='plot'){if(!Array.isArray(value))return false;return [...new Set(value)].sort().join('|')===[...f.expected].sort().join('|');}
 if(f.type==='number'){const t=String(value??'').trim();return /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)&&Number(t)===f.expected;}
 return String(value??'').trim()===String(f.expected);
}
export function grade(task,response){const fields=task.fields.map(f=>({key:f.key,correct:checkField(f,response[f.key])}));return {correct:fields.every(f=>f.correct),fields};}
export function makeTasks(game,round=0){
 round=((round%3)+3)%3; // Reusing an exhausted form never creates fresh independent evidence.
 const tasks=[];const add=(code,skill,v,prompt,fields,hint,diagram=null)=>tasks.push({id:`${VERSION}:${game}:${round}:${skill}:${v}`,code,skill,variant:v,round,prompt,fields,hint,diagram});
 const codes=profiles[game].codes;
 for(let v=0;v<3;v++){
  const k=(round*3+v)%9;
  if(codes.includes('9수01-01')){
   const n=[18,20,28,45,50,63,44,75,98][k],fs=factors(n),good=fs.join(' × '),bad=`${fs[0]} × ${n/fs[0]}`,opts=[good,bad,`1 × ${good}`];
   add('9수01-01','meaning',v,`${n}의 소인수분해로 완성된 식을 고르세요.`,[choice('answer','완성된 소인수분해',good,opts.slice(v).concat(opts.slice(0,v)))],'곱이 같아도 인수에 합성수나 1이 남아 있으면 소인수분해로 완성된 식이 아니에요.');
   const target=[40,54,84,90,108,150,56,72,180][k];
   add('9수01-01','factor',v,`${target}를 소수의 곱으로 분해하세요.`,[field('answer','소수의 곱 (예: 2*2*3 또는 2^2*3)',target,'factor')],'2, 3, 5, 7 같은 소수로 나누고 몫이 1이 될 때까지 이어가세요.');
   const a=2+k%3,b=1+(k+1)%3;
   add('9수01-01','power',v,`${Array(a).fill(2).concat(Array(b).fill(3)).join(' × ')} = 2^a × 3^b. 지수 a, b를 쓰세요.`,[field('a','a',a,'number'),field('b','b',b,'number')],'같은 소인수가 곱해진 횟수가 지수예요.');
  }
  if(codes.includes('9수01-02'))for(const skill of ['gcd','lcm']){
   const pairs=[[18,30],[24,40],[25,14],[36,54],[45,60],[8,27],[20,35],[28,42],[16,24]], [a,b]=pairs[k];
   let g=a,h=b;while(h)[g,h]=[h,g%h];
   const isG=skill==='gcd',method=isG?'공통 소인수의 작은 지수':'모든 소인수의 큰 지수';
   add('9수01-02',skill,v,`${a}, ${b}를 각각 소인수분해한 뒤 ${isG?'최대공약수':'최소공배수'}를 구하세요.`,[
    field('fa',`${a}의 소인수분해`,a,'factor'),field('fb',`${b}의 소인수분해`,b,'factor'),choice('method','분해 결과에서 선택할 방법',method,['모든 소인수의 큰 지수','공통 소인수의 작은 지수','두 수를 더하기']),field('answer',isG?'최대공약수':'최소공배수',isG?g:a*b/g,'number')
   ],'각 수를 소수의 곱으로 바꿔 비교하세요. 최대공약수는 공통 부분, 최소공배수는 모두를 포함하는 최소한의 부분을 사용해요. 공통 소인수가 없으면 최대공약수는 1이에요.');
  }
  if(codes.includes('9수01-04')){
   const pairs=[[-5,-2],[0,-7],[3,-1],[-8,-4],[-6,0],[2,-3],[-9,-1],[-4,0],[5,0]], [a,b]=pairs[k];
   add('9수01-04','integer',v,`${a} □ ${b} 에 들어갈 기호를 고르세요.`,[choice('answer','비교 기호',a<b?'<':'>',['<','=','>'])],'수직선에서 오른쪽에 있는 수가 더 커요. 음수는 절댓값이 클수록 왼쪽에 있어요.');
   const rat=[['-3/4','-0.7','<'],['2/3','0.6','>'],['-1/2','-0.5','='],['-5/4','-1.2','<'],['3/4','0.7','>'],['-3/2','-1.5','='],['-1/4','-0.2','<'],['4/5','0.75','>'],['-2/5','-0.4','=']][k];
   add('9수01-04','rational',v,`${rat[0]} □ ${rat[1]} 에 들어갈 기호를 고르세요.`,[choice('answer','유리수 비교 기호',rat[2],['<','=','>'])],'분수와 소수를 같은 표현으로 바꾸거나 수직선에 놓고 비교하세요.');
  }
  if(codes.includes('9수01-09')){
   const items=[['√2','1.5','<'],['-√5','-2','<'],['√10','3','>'],['√3','1.8','<'],['-√8','-2.5','<'],['√7','2.6','>'],['√6','2.5','<'],['-√3','-1.7','<'],['√5','2.2','>']][k];
   add('9수01-09','real',v,`${items[0]} □ ${items[1]} 에 들어갈 기호를 고르세요. (중1 이후 확장)`,[choice('answer','실수 비교 기호',items[2],['<','=','>'])],'양수는 제곱해서 비교할 수 있어요. 둘 다 음수라면 절댓값의 순서와 원래 수의 순서를 구별하세요.');
  }
  if(codes.includes('9수02-05')){
   const points=[[-2,3],[3,-2],[0,-3],[-3,-1],[2,0],[-1,2],[1,-3],[0,2],[-3,0]],p=points[k],t=points[(k+2)%9];
   add('9수02-05','read',v,'관측소 A의 좌표를 순서대로 입력하세요.',[field('x','x좌표',p[0],'number'),field('y','y좌표',p[1],'number')],'가로축이 x, 세로축이 y예요. 원점에서의 방향과 거리를 읽으세요.',{type:'coordinate',point:p});
   add('9수02-05','plot',v,`구조 위치 (${t.join(', ')})를 지도에 표시하세요. 가로축 x, 세로축 y, 한 칸은 1입니다.`,[field('points','지도에서 점 하나 선택',[t.join(',')],'plot',{mode:'coordinate',single:true})],'x만큼 가로로 이동한 뒤 y만큼 세로로 이동하세요.');
   const x=[-3,2,0,-2,3,-1,1,-4,4][k];
   add('9수02-05','line',v,'수직선의 점 A가 나타내는 좌표를 입력하세요.',[field('answer','수직선의 좌표',x,'number')],'0을 기준으로 왼쪽은 음수, 오른쪽은 양수예요.',{type:'line',point:x});
  }
  if(codes.includes('9수02-06')){
   const datasets=[[1,3,3,2],[2,1,4,3],[1,2,4,4],[3,2,1,2],[1,4,2,3],[2,3,1,4],[4,2,3,1],[1,2,3,2],[3,1,2,4]],ys=datasets[k],contexts=[['저수조의 물 높이','분','m'],['출발점에서 떨어진 거리','분','km'],['실험 상자의 기온','분','℃']],c=contexts[v];
   const trend=ys[2]>ys[1]?'증가':ys[2]<ys[1]?'감소':'일정';
   add('9수02-06','interpret',v,`${c[0]}의 변화를 보고 2분의 값과 1분부터 2분 사이의 변화를 읽으세요.`,[field('value',`2분의 값 (${c[2]})`,ys[2],'number'),choice('trend','1분 → 2분 변화',trend,['증가','감소','일정'])],'가로축의 시각에서 위로 올라가 그래프의 세로축 값을 읽으세요.',{type:'graph',ys,context:c});
   const y2=datasets[(k+3)%9];
   add('9수02-06','represent',v,`${c[0]}: 0, 1, 2, 3분의 측정값은 차례로 ${y2.join(', ')} ${c[2]}입니다. 각 시각에 점을 하나씩 놓아 그래프를 완성하세요.`,[field('points','시간별 측정값 표시',y2.map((y,x)=>`${x},${y}`),'plot',{mode:'graph',context:c})],'가로축에 시각, 세로축에 측정값을 놓으세요. 같은 시각의 점을 다시 선택하면 높이를 바꿀 수 있어요.');
  }
 }
 return tasks;
}
export function recordAttempt(task,response,history=[],hinted=false){
 const graded=grade(task,response),previous=history.filter(a=>a.taskId===task.id);
 return {taskId:task.id,code:task.code,skill:task.skill,round:task.round,variant:task.variant,version:VERSION,at:new Date().toISOString(),prompt:task.prompt,response:structuredClone(response),...graded,hinted,attempt:previous.length+1,independent:graded.correct&&!hinted&&previous.length===0};
}
export function report(game,attempts,reviews={}){return profiles[game].codes.map(code=>{
 const s=standards[code],rows=Object.entries(s.skills).map(([skill,title])=>{
  const a=attempts.filter(a=>a.code===code&&a.skill===skill&&a.version===VERSION);
  const count=new Set(a.filter(a=>a.independent).map(a=>a.taskId)).size;
  return {skill,title,independent:count,required:2,checked:count>=2,attempts:a.length,errors:a.filter(a=>!a.correct).length,assisted:a.filter(a=>a.hinted).length};
 });
 const observed=rows.every(r=>r.checked),any=rows.some(r=>r.attempts),review=reviews[code];
 const reviewed=review?.verdict==='sufficient'&&review?.response?.trim()&&review?.note?.trim()&&review.evidenceCount===attempts.filter(a=>a.code===code).length;
 return {code,text:s.text,rows,observed,status:!any?'아직 확인하지 않음':!observed?'추가 확인 필요':reviewed?'확인 과제 충족 · 교사 검토 기록 있음':'독립 수행 확인 · 설명 검토 대기',reviewed:!!reviewed,limit:s.limit};
});}
