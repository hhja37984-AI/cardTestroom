(()=>{
"use strict";
const KEY="cardTestroom_roulette_v1";
const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const CATEGORIES=[
  {id:"straight",name:"단일 숫자",odds:35},
  {id:"split",name:"인접 2칸 (Split)",odds:17},
  {id:"street",name:"가로 3칸 (Street)",odds:11},
  {id:"corner",name:"네 모서리 (Corner)",odds:8},
  {id:"six",name:"두 줄 6칸 (Six line)",odds:5},
  {id:"red",name:"빨강",odds:1},{id:"black",name:"검정",odds:1},
  {id:"odd",name:"홀수",odds:1},{id:"even",name:"짝수",odds:1},
  {id:"low",name:"1–18",odds:1},{id:"high",name:"19–36",odds:1},
  {id:"dozen1",name:"1–12",odds:2},{id:"dozen2",name:"13–24",odds:2},{id:"dozen3",name:"25–36",odds:2},
  {id:"col1",name:"첫째 열",odds:2},{id:"col2",name:"둘째 열",odds:2},{id:"col3",name:"셋째 열",odds:2}
];
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number(Number(n).toFixed(2)).toLocaleString("ko-KR");
const color=n=>n===0?"green":RED.has(n)?"red":"black";
const fresh=()=>({players:[{id:1,name:"A",bankroll:100,bets:[]}],nextId:2,history:[],last:null,phase:"betting"});
let s;
try{s=JSON.parse(localStorage.getItem(KEY))||fresh();if(!Array.isArray(s.players)||!Array.isArray(s.history))s=fresh()}catch{s=fresh()}
s.players.forEach(p=>{p.bankroll=Number(p.bankroll??100);p.bets=Array.isArray(p.bets)?p.bets:[]});
if(s.phase==="spinning")s.phase="betting";
let spinning=false,angle=0,ballAngle=0,timeout=0;
const save=()=>localStorage.setItem(KEY,JSON.stringify(s));
const note=t=>{const el=$("roulette-alert");el.textContent=t;el.hidden=!t};
function cells(b){
 const a=Number(b.anchor);
 if(b.type==="straight")return [a];
 if(b.type==="split")return [a,Number(b.second)];
 if(b.type==="street")return [a,a+1,a+2];
 if(b.type==="corner")return [a,a+1,a+3,a+4];
 if(b.type==="six")return Array.from({length:6},(_,i)=>a+i);
 if(b.type==="red")return [...RED];
 if(b.type==="black")return Array.from({length:36},(_,i)=>i+1).filter(n=>!RED.has(n));
 if(b.type==="odd")return Array.from({length:18},(_,i)=>i*2+1);
 if(b.type==="even")return Array.from({length:18},(_,i)=>i*2+2);
 if(b.type==="low")return Array.from({length:18},(_,i)=>i+1);
 if(b.type==="high")return Array.from({length:18},(_,i)=>i+19);
 if(b.type.startsWith("dozen")){const k=Number(b.type.slice(-1));return Array.from({length:12},(_,i)=>(k-1)*12+i+1)}
 if(b.type.startsWith("col")){const k=Number(b.type.slice(-1));return Array.from({length:12},(_,i)=>3*i+k)}
 return [];
}
function validBet(b){
 const a=Number(b.anchor),v=Number(b.second);
 if(b.type==="straight")return Number.isInteger(a)&&a>=0&&a<=36;
 if(b.type==="split")return Number.isInteger(a)&&Number.isInteger(v)&&a>=1&&v<=36&&v>=1&&a!==v&&(Math.abs(a-v)===3||(Math.abs(a-v)===1&&Math.ceil(a/3)===Math.ceil(v/3)));
 if(b.type==="street")return a>=1&&a<=34&&a%3===1;
 if(b.type==="corner")return a>=1&&a<=32&&a%3!==0;
 if(b.type==="six")return a>=1&&a<=31&&a%3===1;
 return CATEGORIES.some(t=>t.id===b.type);
}
function label(b){const t=CATEGORIES.find(x=>x.id===b.type)?.name||b.type;if(b.type==="straight")return b.anchor+"번";if(b.type==="split")return b.anchor+" / "+b.second;if(["street","corner","six"].includes(b.type))return t+" ("+cells(b).join(", ")+")";return t}
function wheelSVG(){
 const sz=320,c=160,R=141,ri=108,n=ORDER.length,step=360/n;
 const xy=(r,degrees)=>[c+r*Math.cos(degrees*Math.PI/180),c+r*Math.sin(degrees*Math.PI/180)];
 let slices="";
 ORDER.forEach((num,i)=>{
  const a=-90+(i-.5)*step,b=a+step,aa=xy(R,a),bb=xy(R,b),ai=xy(ri,a),bi=xy(ri,b);
  const path="M"+aa.join(" ")+" A"+R+" "+R+" 0 0 1 "+bb.join(" ")+" L"+bi.join(" ")+" A"+ri+" "+ri+" 0 0 0 "+ai.join(" ")+" Z";
  const [tx,ty]=xy(125,-90+i*step);
  const fill=color(num)==="red"?"#ab4144":color(num)==="green"?"#28734e":"#222726";
  slices+='<path d="'+path+'" fill="'+fill+'" stroke="#bda478" stroke-width=".65"/><text x="'+tx.toFixed(2)+'" y="'+ty.toFixed(2)+'" text-anchor="middle" dominant-baseline="central" fill="#fff5db" font-size="10" font-weight="700" transform="rotate('+(-90+i*step+90)+','+tx.toFixed(2)+','+ty.toFixed(2)+')">'+num+'</text>';
 });
 return '<svg id="roulette-wheel" viewBox="0 0 320 320" role="img" aria-label="유럽식 룰렛 휠과 공"><circle cx="160" cy="160" r="156" fill="#65442e" stroke="#d4ae70" stroke-width="5"/><circle cx="160" cy="160" r="147" fill="#1c2c24" stroke="#9d794d" stroke-width="3"/><g id="roulette-rotor">'+slices+'<circle cx="160" cy="160" r="103" fill="#5e422e" stroke="#d0ae74" stroke-width="3"/><circle cx="160" cy="160" r="82" fill="#204b39" stroke="#b99965" stroke-width="4"/><circle cx="160" cy="160" r="49" fill="#385e49" stroke="#b99965" stroke-width="3"/><circle cx="160" cy="160" r="23" fill="#c7a36c" stroke="#765432" stroke-width="2"/><circle cx="160" cy="160" r="10" fill="#f1d59e"/></g><g id="roulette-ball-track"><circle cx="160" cy="35" r="7.5" fill="#fffdf1" stroke="#959b92" stroke-width="2"/></g><path d="M160 2 L151 17 L169 17 Z" fill="#f4daa0" stroke="#6c4a29" stroke-width="1.5"/></svg>';
}
function renderTable(){
 const order=[];for(let row=0;row<3;row++)for(let col=0;col<12;col++)order.push(3*(col+1)-row);
 $("roulette-grid").innerHTML='<button class="r-zero" data-number="0">0</button><div class="r-numbers">'+order.map(n=>'<button class="r-number r-'+color(n)+'" data-number="'+n+'">'+n+'</button>').join("")+'</div>';
}
function render(){
 $("roulette-players").innerHTML=s.players.map(p=>'<div class="r-player"><div class="r-player-head"><input aria-label="참가자 이름" data-rename="'+p.id+'" maxlength="32" value="'+escape(p.name)+'"><strong>'+money(p.bankroll)+' chips</strong></div><div class="r-player-controls"><label>잔액 수정 <input type="number" step="0.5" data-balance="'+p.id+'" value="'+p.bankroll+'"></label><button data-remove-player="'+p.id+'" class="ghost">참가자 삭제</button></div><div class="r-bet-list">'+(p.bets.length?p.bets.map((b,i)=>'<div class="r-bet"><span>'+escape(label(b))+' · '+money(b.amount)+'칩</span>'+(s.phase==="betting"?'<button data-delete-bet="'+p.id+':'+i+'" aria-label="베팅 삭제">×</button>':'')+'</div>').join(""):'<small class="hint">아직 베팅이 없습니다.</small>')+'</div></div>').join("");
 $("roulette-player-choice").innerHTML=s.players.map(p=>'<option value="'+p.id+'">'+escape(p.name)+'</option>').join("");
 const last=s.last;
 $("roulette-result").innerHTML=last?'<span class="r-result-number r-'+color(last.number)+'">'+last.number+'</span><div><strong>'+({red:"빨강",black:"검정",green:"초록"})[color(last.number)]+' · '+last.number+'번</strong><div class="hint">'+escape(last.summary)+'</div></div>':'<span class="r-result-number">?</span><div><strong>결과 대기 중</strong><div class="hint">베팅 후 회전하거나 결과를 지정하세요.</div></div>';
 $("roulette-history").innerHTML=s.history.length?s.history.slice(-10).reverse().map(h=>'<span class="r-history-chip r-'+color(h.number)+'" title="'+escape(h.summary)+'">'+h.number+'</span>').join(""):'<span class="hint">기록 없음</span>';
 $("roulette-copytext").value=report();
 $("roulette-spin").disabled=spinning||s.phase==="settled";
 $("roulette-add-bet").disabled=spinning||s.phase==="settled";
 $("roulette-next").disabled=spinning||s.phase!=="settled";
 $("roulette-override").disabled=spinning;
 $("roulette-status").textContent=spinning?"공이 굴러가는 중...":s.phase==="settled"?"정산 완료 · 다음 판을 시작할 수 있습니다.":"베팅 접수 중";
 document.querySelectorAll("#roulette-players input, #roulette-players button").forEach(el=>el.disabled=spinning);
 if(spinning)$("roulette-copytext").value="회전 중입니다. 종료 후 결과를 복사하세요.";
}
function report(){
 const lines=["[유럽식 룰렛 · "+(s.phase==="settled"?"정산 완료":"베팅 중")+"]"];
 if(s.last)lines.push("결과: "+s.last.number+" ("+({red:"빨강",black:"검정",green:"초록"})[color(s.last.number)]+")");
 s.players.forEach(p=>{lines.push(p.name+": 잔액 "+money(p.bankroll)+"칩"+(p.bets.length?" / 베팅 "+p.bets.map(b=>label(b)+" "+money(b.amount)+"칩").join(", "):""));if(s.last){const line=s.last.results.find(x=>x.id===p.id);if(line)lines.push("  정산: "+(line.profit>=0?"+":"")+money(line.profit)+"칩"+(line.wins.length?" / 당첨 "+line.wins.join(", "):" / 당첨 없음"))}});
 return lines.join("\n");
}
function formTargets(){
 const type=$("roulette-bet-type").value;
 const show=["straight","split","street","corner","six"].includes(type);
 $("roulette-anchor-wrap").hidden=!show;
 $("roulette-second-wrap").hidden=type!=="split";
 $("roulette-anchor-label").textContent=type==="straight"?"선택 숫자":type==="split"?"첫 숫자":"시작 숫자";
 $("roulette-bet-odds").textContent="순이익 배당 "+CATEGORIES.find(t=>t.id===type).odds+":1";
}
function addBet(){
 if(s.phase!=="betting"||spinning)return;
 const p=s.players.find(x=>x.id===Number($("roulette-player-choice").value)),b={type:$("roulette-bet-type").value,anchor:Number($("roulette-anchor").value),second:Number($("roulette-second").value),amount:Number($("roulette-amount").value)};
 if(!p||!validBet(b)){note("선택한 베팅 위치가 유효하지 않습니다. 인접 숫자와 줄 시작 위치를 확인하세요.");return}
 if(!Number.isFinite(b.amount)||b.amount<=0){note("0보다 큰 칩 금액을 입력하세요.");return}
 if(b.amount>p.bankroll){note("보유 칩보다 많이 베팅할 수 없습니다.");return}
 p.bankroll=Number((p.bankroll-b.amount).toFixed(2));p.bets.push(b);save();note("");render();
}
function settlement(number){
 const results=s.players.map(p=>{
  let profit=0,wins=[];
  p.bets.forEach(b=>{if(cells(b).includes(number)){const payout=b.amount*(CATEGORIES.find(t=>t.id===b.type).odds+1);p.bankroll=Number((p.bankroll+payout).toFixed(2));profit+=payout-b.amount;wins.push(label(b))}else profit-=b.amount});
  return {id:p.id,profit:Number(profit.toFixed(2)),wins};
 });
 const summary=results.map(x=>{const p=s.players.find(p=>p.id===x.id);return p.name+" "+(x.profit>=0?"+":"")+money(x.profit)+"칩"}).join(" · ");
 s.last={number,summary,results};s.history.push({number,summary});if(s.history.length>50)s.history.shift();s.phase="settled";save();render();
}
function spin(){
 if(spinning||s.phase!=="betting")return;
 const chosen=$("roulette-manual").value;
 const result=chosen===""?Math.floor(Math.random()*37):Number(chosen);
 if(!Number.isInteger(result)||result<0||result>36){note("0~36 중 결과를 선택하세요.");return}
 note("");spinning=true;render();
 const idx=ORDER.indexOf(result),step=360/37;
 const endMod=((-(idx*step)%360)+360)%360;
 const curMod=((angle%360)+360)%360;
 const offset=(endMod-curMod+360)%360;
 angle=angle+360*5+offset;
 ballAngle-=360*7;
 const rotor=$("roulette-rotor"),ball=$("roulette-ball-track");
 rotor.style.transition="transform 4600ms cubic-bezier(.12,.65,.20,1)";
 ball.style.transition="transform 4400ms cubic-bezier(.08,.4,.16,1)";
 rotor.style.transformOrigin="160px 160px";ball.style.transformOrigin="160px 160px";
 rotor.style.transform="rotate("+angle+"deg)";
 ball.style.transform="rotate("+ballAngle+"deg)";
 timeout=setTimeout(()=>{spinning=false;settlement(result)},4700);
}
function nextRound(){if(spinning)return;s.players.forEach(p=>p.bets=[]);s.phase="betting";s.last=null;$("roulette-manual").value="";note("");save();render()}
function init(){
 $("roulette-wheel-holder").innerHTML=wheelSVG();
 renderTable();
 $("roulette-bet-type").innerHTML=CATEGORIES.map(c=>'<option value="'+c.id+'">'+c.name+'</option>').join("");
 $("roulette-manual").innerHTML='<option value="">무작위 굴림</option>'+Array.from({length:37},(_,n)=>'<option value="'+n+'">'+n+'번 · '+({red:"빨강",black:"검정",green:"초록"})[color(n)]+'</option>').join("");
 $("roulette-bet-type").addEventListener("change",formTargets);
 document.querySelector("#roulette-grid").addEventListener("click",e=>{const btn=e.target.closest("[data-number]");if(!btn)return;$("roulette-bet-type").value="straight";$("roulette-anchor").value=btn.dataset.number;formTargets();note(btn.dataset.number+"번이 선택됐습니다. 베팅 금액을 확인하고 추가하세요.")});
 $("roulette-add-bet").addEventListener("click",addBet);
 $("roulette-spin").addEventListener("click",spin);
 $("roulette-next").addEventListener("click",nextRound);
 $("roulette-copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(report());note("RP용 결과를 복사했습니다.")}catch{note("복사가 차단됐습니다. 아래 텍스트를 길게 눌러 복사하세요.")}});
 $("roulette-add-player").addEventListener("click",()=>{if(spinning||s.phase!=="betting"){note("다음 판에서 참가자를 추가하세요.");return}const id=s.nextId++;s.players.push({id,name:String.fromCharCode(65+(s.players.length%26)),bankroll:100,bets:[]});save();render()});
 $("roulette-players").addEventListener("click",e=>{
  const del=e.target.closest("[data-delete-bet]");if(del){if(s.phase!=="betting")return;const [id,i]=del.dataset.deleteBet.split(":").map(Number),p=s.players.find(x=>x.id===id);if(!p)return;const b=p.bets.splice(i,1)[0];if(b)p.bankroll=Number((p.bankroll+b.amount).toFixed(2));save();render();return}
  const rm=e.target.closest("[data-remove-player]");if(rm){if(s.phase!=="betting")return;if(s.players.length<2){note("참가자는 최소 한 명이 필요합니다.");return}const p=s.players.find(p=>p.id===Number(rm.dataset.removePlayer));if(p.bets.length){note("베팅 중인 참가자는 베팅을 취소한 뒤 삭제하세요.");return}s.players=s.players.filter(x=>x!==p);save();render()}
 });
 $("roulette-players").addEventListener("change",e=>{if(spinning||s.phase!=="betting")return;const id=e.target.dataset.rename||e.target.dataset.balance,p=s.players.find(x=>x.id===Number(id));if(!p)return;if(e.target.dataset.rename)p.name=e.target.value.trim().slice(0,32)||"참가자";else if(e.target.dataset.balance!==undefined){const n=Number(e.target.value);if(!Number.isFinite(n)||n<0){note("잔액은 0 이상으로 설정하세요.");render();return}p.bankroll=Number(n.toFixed(2))}save();render()});
 formTargets();render();save();
}
init();
})();