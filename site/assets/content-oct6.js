(() => {
'use strict';
const $ = (q) => document.querySelector(q);
if (!$('#generative-input-surfaces')) return;
const gap=$('#demo-gap'),dial=$('.demo-dial'),preview=$('.alignment-preview');
function updateGap(value){const n=Math.max(0,Math.min(64,Math.round(Number(value)||0)));gap.value=n;dial.setAttribute('aria-valuenow',String(n));dial.querySelector('b').textContent=n;dial.querySelector('.dial-tick').style.transform=`rotate(${n*6-108}deg)`;preview.style.gap=n+'px';$('#figma-receipt').textContent=`样例已读回：间距 ${n} px · 对象仍为卡片组`}
gap.addEventListener('input',()=>updateGap(gap.value));
document.querySelectorAll('[data-gap-step]').forEach(b=>b.addEventListener('click',()=>updateGap(+gap.value + +b.dataset.gapStep)));
document.querySelectorAll('[data-demo-align]').forEach(b=>b.addEventListener('click',()=>{preview.style.alignItems=b.dataset.demoAlign==='top'?'flex-start':'flex-end';$('#figma-receipt').textContent=`样例已读回：${b.textContent} · 3 项`;}));
dial.addEventListener('keydown',e=>{if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();updateGap(e.key==='Home'?0:e.key==='End'?64:+gap.value+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1));}});
let dialDrag=null;
dial.addEventListener('pointerdown',e=>{dialDrag={y:e.clientY,value:+gap.value};dial.setPointerCapture(e.pointerId);});
dial.addEventListener('pointermove',e=>{if(dialDrag)updateGap(dialDrag.value+(dialDrag.y-e.clientY)/3);});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>dial.addEventListener(t,()=>dialDrag=null));
const text=$('#demo-mail-text'),original=text.value;
$('#demo-voice').addEventListener('click',()=>{text.value='下周请先检查手机版布局，周五再一起确认。';$('#mail-receipt').textContent='已填入演示转写；可以修改，未录音、未发送';$('#demo-mail-review').hidden=true;});
$('#demo-mail-preview').addEventListener('click',()=>{$('#demo-mail-review p').textContent=text.value;$('#demo-mail-review').hidden=false;$('#mail-receipt').textContent='正在检查草稿；本演示不会发送邮件';});
text.addEventListener('input',()=>{$('#demo-mail-review').hidden=true;$('#mail-receipt').textContent='草稿已更改，请重新检查';});
const svg=$('#demo-mask'),paths=$('#mask-paths');let path=null,points=[];
function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
svg.addEventListener('pointerdown',e=>{e.preventDefault();const p=point(e);points=[`M${p.x},${p.y}`];path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('fill','none');path.setAttribute('stroke','#ef9144');path.setAttribute('stroke-opacity','.65');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-width',$('#demo-brush').value);path.setAttribute('d',points[0]+` l.1,.1`);paths.appendChild(path);svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',e=>{if(!path)return;const p=point(e);points.push(`L${p.x},${p.y}`);path.setAttribute('d',points.join(' '));});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>svg.addEventListener(t,()=>{path=null;$('#mask-receipt').textContent='已保留范围草稿；原图与版本不变，未提交处理';}));
$('#demo-mask-region').addEventListener('click',()=>{paths.innerHTML='<rect x="245" y="110" width="156" height="200" rx="8" fill="#ef9144" fill-opacity=".45" stroke="#b56830" stroke-width="3"/>';$('#mask-receipt').textContent='已选择中央区域；未提交处理';});
$('#demo-mask-clear').addEventListener('click',()=>{paths.replaceChildren();$('#mask-receipt').textContent='范围已清除；原图未改动';});
$('#demo-brush').addEventListener('input',e=>$('#brush-value').textContent=e.target.value);
$('#demo-steer-send').addEventListener('click',()=>{$('#agent-receipt').textContent=$('#demo-steer').value.trim()?'样例回执：补充要求已排队，尚未表示当前工具已停止':'请先填写补充要求';});
$('#demo-stop').addEventListener('click',()=>{$('#agent-receipt').textContent='样例回执：当前轮次已停止；已发生的文件改动需要另行检查';$('#demo-stop').disabled=true;});
['#demo-model','#demo-effort'].forEach(q=>$(q).addEventListener('change',()=>{$('#agent-receipt').textContent=`下次执行：${$('#demo-model').value} · ${$('#demo-effort').value}；当前轮次不受影响`;}));
document.querySelectorAll('[data-reset]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.reset==='figma'){updateGap(24);preview.style.alignItems='flex-start';}else if(b.dataset.reset==='mail'){text.value=original;$('#demo-mail-review').hidden=true;$('#mail-receipt').textContent='草稿保留在本页，未发送';}else{$('#demo-stop').disabled=false;$('#demo-model').selectedIndex=0;$('#demo-effort').selectedIndex=0;$('#agent-receipt').textContent='样例正在执行；参数选择只影响下次执行';}}));
})();
