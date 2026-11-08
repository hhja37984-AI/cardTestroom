(()=>{
const scroller=document.getElementById("game-slides");
if(!scroller)return;
let ticking=false;
scroller.addEventListener("scroll",()=>{
 if(ticking)return;ticking=true;
 requestAnimationFrame(()=>{
  const page=Math.min(1,Math.max(0,Math.round(scroller.scrollLeft/Math.max(1,scroller.clientWidth))));
  document.querySelectorAll(".pager-dot").forEach((dot,i)=>dot.classList.toggle("current",i===page));ticking=false;
 });
},{passive:true});
})();