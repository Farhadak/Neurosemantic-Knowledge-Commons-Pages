'use strict';
const data=window.GRAPH_DATA,$=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
let zoom=1,tx=0,ty=0,positions={},nodeEls=new Map(),edgeEls=[],activeNodes=[],activeEdges=[];
function el(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e}
function layout(nodes,edges){
 const p={},degree={};nodes.forEach(n=>degree[n.id]=0);edges.forEach(e=>{degree[e.source]++;degree[e.target]++});
 nodes.forEach((n,i)=>{const angle=i*2.39996323,r=50+Math.sqrt(i)*45;p[n.id]={x:600+Math.cos(angle)*r,y:365+Math.sin(angle)*r,vx:0,vy:0,degree:degree[n.id]}});
 for(let t=0;t<500;t++){
  const force={};nodes.forEach(n=>force[n.id]={x:(600-p[n.id].x)*.003,y:(365-p[n.id].y)*.003});
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const a=p[nodes[i].id],b=p[nodes[j].id];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+.1,d=Math.sqrt(d2),f=6800/d2;
   force[nodes[i].id].x+=dx/d*f;force[nodes[i].id].y+=dy/d*f;force[nodes[j].id].x-=dx/d*f;force[nodes[j].id].y-=dy/d*f;
  }
  for(const e of edges){const a=p[e.source],b=p[e.target],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=(d-155)*.012;force[e.source].x+=dx/d*f;force[e.source].y+=dy/d*f;force[e.target].x-=dx/d*f;force[e.target].y-=dy/d*f}
  for(const n of nodes){const a=p[n.id];a.vx=(a.vx+force[n.id].x)*.72;a.vy=(a.vy+force[n.id].y)*.72;a.x+=a.vx;a.y+=a.vy}
 }
 if(nodes.length){const xs=nodes.map(n=>p[n.id].x),ys=nodes.map(n=>p[n.id].y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;const scale=Math.min(1.7,870/Math.max(1,Math.max(...xs)-Math.min(...xs)),570/Math.max(1,Math.max(...ys)-Math.min(...ys)));for(const n of nodes){p[n.id].x=600+(p[n.id].x-cx)*scale;p[n.id].y=355+(p[n.id].y-cy)*scale}}
 return p;
}
function transform(){$('#scene').setAttribute('transform',`translate(${tx} ${ty}) scale(${zoom})`)}
function updatePositions(){for(const[id,g]of nodeEls){const p=positions[id];g.setAttribute('transform',`translate(${p.x} ${p.y})`)}for(const{e,line}of edgeEls){const a=positions[e.source],b=positions[e.target];line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y)}}
function highlight(id){const near=new Set([id]);for(const e of activeEdges){if(e.source===id)near.add(e.target);if(e.target===id)near.add(e.source)}for(const[key,g]of nodeEls)g.classList.toggle('dim',!!id&&!near.has(key));for(const{e,line}of edgeEls){const on=e.source===id||e.target===id;line.classList.toggle('dim',!!id&&!on);line.classList.toggle('highlight',!!id&&on)}const n=activeNodes.find(n=>n.id===id);$('#selected').textContent=n?`${n.title} · ${n.type} · ${near.size-1} linked notes`:'Hover or focus on a node to see its full title and highlight connected notes.'}
function search(){const q=$('#search').value.trim().toLowerCase();let count=0;for(const n of activeNodes){const match=!q||`${n.id} ${n.title} ${n.type}`.toLowerCase().includes(q),g=nodeEls.get(n.id);g.classList.toggle('dim',!match);g.classList.toggle('match',!!q&&match);if(match)count++}$('#status').textContent=`${activeNodes.length} notes · ${activeEdges.length} ${$('#mode').value==='typed'?'typed relations':'note links'}${q?` · ${count} search matches`:''}. Discussion edition.`}
function render(){const scene=$('#scene');scene.replaceChildren();nodeEls=new Map();edgeEls=[];const typed=$('#mode').value==='typed',portal=$('#portal').value;activeNodes=data.nodes.filter(n=>(!typed||n.core)&&(!portal||n.portals.includes(portal)));const ids=new Set(activeNodes.map(n=>n.id));activeEdges=(typed?data.edges:data.links).filter(e=>ids.has(e.source)&&ids.has(e.target));positions=layout(activeNodes,activeEdges);
 for(const e of activeEdges){const line=el('line',{class:'edge'});line.append(el('title',{},`${e.source} — ${e.label} — ${e.target}`));scene.append(line);edgeEls.push({e,line})}
 const list=$('#note-list');list.replaceChildren();
 for(const n of activeNodes){const g=el('a',{href:n.url,target:'_top',class:'node','data-id':n.id,'aria-label':n.title,tabindex:0});g.append(el('title',{},`${n.title} (${n.type})`));g.append(el('circle',{r:6+Math.sqrt(positions[n.id].degree)*2}));const label=el('text',{x:0,y:25,'text-anchor':'middle'});const words=n.title.split(' ');let lines=[''];for(const w of words){if((lines.at(-1)+' '+w).length>31)lines.push(w);else lines[lines.length-1]+=' '+w}lines.slice(0,3).forEach((s,i)=>label.append(el('tspan',{x:0,dy:i?16:0},s.trim())));g.append(label);g.onmouseenter=()=>highlight(n.id);g.onmouseleave=()=>{highlight(null);search()};g.onfocus=()=>highlight(n.id);g.onblur=()=>{highlight(null);search()};scene.append(g);nodeEls.set(n.id,g);const li=document.createElement('li'),a=document.createElement('a');a.href=n.url;a.target='_top';a.textContent=n.title;li.append(a);list.append(li)}updatePositions();transform();labels();search();}
function labels(){for(const g of nodeEls.values())g.classList.toggle('no-label',!$('#labels').checked)}
$('#search').oninput=search;$('#portal').onchange=render;$('#mode').onchange=render;$('#labels').onchange=labels;
function changeZoom(next,center={x:600,y:370}){next=Math.max(.3,Math.min(4,next));tx=center.x-(center.x-tx)*next/zoom;ty=center.y-(center.y-ty)*next/zoom;zoom=next;transform()}
$('#in').onclick=()=>changeZoom(zoom*1.2);$('#out').onclick=()=>changeZoom(zoom/1.2);$('#reset').onclick=()=>{zoom=1;tx=ty=0;$('#search').value='';render()};
const svg=$('#graph');let drag=null,suppressClick=false;function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;const a=e.target.closest('[data-id]'),p=point(e);drag={node:a?.getAttribute('data-id'),start:p,last:p,tx,ty,moved:false,pointer:e.pointerId};});
svg.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>4&&!drag.moved){drag.moved=true;svg.setPointerCapture(e.pointerId)}if(!drag.moved)return;if(drag.node){const n=positions[drag.node];n.x+=(p.x-drag.last.x)/zoom;n.y+=(p.y-drag.last.y)/zoom;updatePositions()}else{tx=drag.tx+p.x-drag.start.x;ty=drag.ty+p.y-drag.start.y;transform()}drag.last=p});
svg.addEventListener('pointerup',()=>{suppressClick=!!drag?.moved;drag=null});svg.addEventListener('pointercancel',()=>{drag=null;suppressClick=false});svg.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false}},true);
svg.addEventListener('wheel',e=>{e.preventDefault();changeZoom(zoom*(e.deltaY>0?.9:1.1),point(e))},{passive:false});render();
