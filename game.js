(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let W=innerWidth,H=innerHeight,DPR=1,now=0,last=0,sceneTime=0;
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();
const lanes=[-1.6,0,1.6],keys=new Set();let mode='ready',lane=1,laneFloat=1,jump=0,slide=0,runTime=0,distance=0,tokenCount=0,speed=17,objects=[],spawnAt=24,best=Number(localStorage.getItem('bgn-best')||0),flash=0;
$('best').textContent=String(best).padStart(4,'0')+' m';$('end-best').textContent=String(best).padStart(4,'0')+' m';
function groundY(){return H*.385}
function project(x,y,z){const focal=H*1.02,den=z+5.5;return {x:W*.5+(x-laneCamera())*focal/den,y:groundY()+(1.35-y)*focal/den,s:focal/den}}
function laneCamera(){return (laneFloat-1)*.06}
function poly(points,color,stroke=null,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function line(a,b,color,width=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function background(){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#e88d68');sky.addColorStop(.37,'#f3b77b');sky.addColorStop(.68,'#edc28a');sky.addColorStop(1,'#c9875c');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const sunX=W*.73+Math.sin(sceneTime*.07)*W*.018,sunY=H*.25,r=H*.115;const glow=ctx.createRadialGradient(sunX,sunY,2,sunX,sunY,r*1.9);glow.addColorStop(0,'#fff0bdc9');glow.addColorStop(.32,'#ffe8ae70');glow.addColorStop(1,'#ffe8ae00');ctx.fillStyle=glow;ctx.fillRect(sunX-r*2,sunY-r*2,r*4,r*4);circle(sunX,sunY,r,'#ffe7b0');
 // Far hills and the quiet Irrawaddy haze
 poly([{x:0,y:H*.39},{x:W*.12,y:H*.34},{x:W*.25,y:H*.38},{x:W*.39,y:H*.32},{x:W*.55,y:H*.39},{x:W*.72,y:H*.33},{x:W*.89,y:H*.38},{x:W,y:H*.34},{x:W,y:H*.54},{x:0,y:H*.54}],'#ba795d');
 poly([{x:0,y:H*.43},{x:W*.19,y:H*.4},{x:W*.34,y:H*.435},{x:W*.53,y:H*.39},{x:W*.7,y:H*.43},{x:W*.87,y:H*.395},{x:W,y:H*.42},{x:W,y:H*.55},{x:0,y:H*.55}],'#d09167');
 const horizon=groundY();ctx.fillStyle='#f0c990';ctx.fillRect(0,horizon,W,H*.08);
 // Temple silhouettes
 for(let i=0;i<8;i++){const x=((i*173+42)%W),s=.42+(i%3)*.17,base=H*.425;drawDistantTemple(x,base,s)}
 // Tiny hot-air balloons
 for(let i=0;i<3;i++){let x=((i*W*.39+W*.15+sceneTime*(i%2?2:-1))%W+W)%W,y=H*(.17+i*.055);circle(x,y,5+i%2,'#9b5948aa');poly([{x:x-5,y:y+1},{x:x+5,y:y+1},{x:x+3,y:y+9},{x:x-3,y:y+9}],'#a65f4caa');line({x:x-3,y:y+8},{x:x,y:y+12},'#8d5544aa',.7);line({x:x+3,y:y+8},{x:x,y:y+12},'#8d5544aa',.7)}
}
function drawDistantTemple(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#9d604eaa';ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-16,-9);ctx.lineTo(-9,-12);ctx.lineTo(-7,-23);ctx.lineTo(-2,-30);ctx.lineTo(0,-46);ctx.lineTo(3,-30);ctx.lineTo(9,-23);ctx.lineTo(10,-12);ctx.lineTo(17,-9);ctx.lineTo(20,0);ctx.closePath();ctx.fill();ctx.restore()}
function drawPagoda(x,z,size=1){const base=project(x,0,z),s=base.s*size;if(s<.14)return;const w=1.35*size,h=4.5*size;
 // warm brick tower, stepped cornices, and a slender golden hti
 const P=(xx,yy)=>project(x+xx,yy*size,z);
 poly([P(-w*.54,.18),P(w*.54,.18),P(w*.48,.6),P(-w*.48,.6)],'#9b5942');
 poly([P(-w*.7,.58),P(w*.7,.58),P(w*.83,.79),P(-w*.83,.79)],'#e5b16e');poly([P(-w*.8,.79),P(w*.8,.79),P(w*.56,.94),P(-w*.56,.94)],'#b56e4d');
 poly([P(-w*.48,.93),P(w*.48,.93),P(w*.43,1.43),P(-w*.43,1.43)],'#c47b50');
 for(let t=0;t<3;t++){let y=1.35+t*.68,ww=(.58-t*.105)*size;poly([project(x-ww,y*size,z),project(x+ww,y*size,z),project(x+ww*.83,(y+.15)*size,z),project(x-ww*.83,(y+.15)*size,z)],t===2?'#e1a564':'#a85f42');poly([project(x-ww*1.25,(y+.14)*size,z),project(x+ww*1.25,(y+.14)*size,z),project(x+ww*.78,(y+.27)*size,z),project(x-ww*.78,(y+.27)*size,z)],'#e1b06f')}
 poly([P(-.18,3.35),P(.18,3.35),P(.12,4.05),P(-.12,4.05)],'#aa6242');poly([P(-.2,4.02),P(.2,4.02),P(0,4.38)],'#edbd70');line(P(0,4.35),P(0,4.9),'#efc776',Math.max(.7,s*.055));circle(P(0,4.9).x,P(0,4.9).y,Math.max(1,s*.09),'#ffe3a2');
 poly([P(-.28,.94),P(.28,.94),P(.2,1.22),P(-.2,1.22)],'#5d382f');line(P(-.25,1.24),P(.25,1.24),'#f1ce8d',Math.max(.5,s*.06))}
function drawTree(x,z,seed=0){const p=project(x,0,z),s=p.s*(.65+(seed%4)*.08);if(s<.09)return;const trunkTop=project(x,.75,z);line(p,trunkTop,'#754a36',Math.max(1,s*.24));for(let i=0;i<3;i++){let yy=1.1+i*.58,w=(1.15-i*.22);poly([project(x-w,yy,z),project(x,yy+.82,z),project(x+w,yy,z)],i===0?'#58674a':i===1?'#6c7650':'#838257');poly([project(x-w*.83,yy-.08,z),project(x+w*.83,yy-.08,z),project(x,yy+.18,z)],'#a5a16b')}
}
function drawLandscape(){
 // dusty earth on both sides
 const left=project(-13,0,120),right=project(13,0,120),nearL=project(-13,0,-3),nearR=project(13,0,-3);poly([left,right,nearR,nearL],'#c38b5f');
 // sun-baked road
 const farL=project(-4.15,0,115),farR=project(4.15,0,115),nearRoadL=project(-4.15,0,-3),nearRoadR=project(4.15,0,-3);poly([farL,farR,nearRoadR,nearRoadL],'#bb8059');
  const roadGlow=ctx.createLinearGradient(0,H*.39,0,H);roadGlow.addColorStop(0,'#c38b61');roadGlow.addColorStop(.58,'#ca9167');roadGlow.addColorStop(1,'#c18860');
 poly([project(-3.85,0,115),project(3.85,0,115),project(3.85,0,-3),project(-3.85,0,-3)],roadGlow);
 // faint wheel ruts and scattered paving marks add texture without obscuring hazards
  for(let z=8+((distance*2.08)%15);z<116;z+=15){const fade=Math.min(1,project(0,0,z).s*.18);ctx.globalAlpha=fade;for(const x of [-1.12,1.12]){const a=project(x-.035,0,z),b=project(x+.035,0,z-2.2);line(a,b,'#97664b',Math.max(.45,a.s*.045))}for(const x of [-2.7,-2.25,-1.85,1.85,2.25,2.7]){const p=project(x,0,z-1.1),r=Math.max(.35,p.s*.035);circle(p.x,p.y,r,'#e1ac79')}ctx.globalAlpha=1}
  // track edge lines
 line(project(-3.72,0,115),project(-3.72,0,-3),'#edc28a',2);line(project(3.72,0,115),project(3.72,0,-3),'#edc28a',2);
 // broken lane markers animate toward the runner
 const phase=(distance*1.1)%12;for(let z=3+(12-phase);z<120;z+=12){for(let x of [-.8,.8]){const a=project(x,0,z),b=project(x,0,z-4.1);line(a,b,'#f1c99a',Math.max(.6,a.s*.11))}}
 // tiny scrub flecks on the verge
 for(let i=0;i<34;i++){const z=((i*19+sceneTime*speed*.45)%116)+2,x=(i%2?1:-1)*(4.7+(i*17%43)*.19),p=project(x,0,z),r=Math.max(.5,p.s*.1);circle(p.x,p.y-r,r,i%3?'#8a7950':'#d7a170')}
 // scenery repeats seamlessly
 const travel=(distance*1.25)%38;for(let z=52-travel;z<126;z+=38){drawPagoda(-7.3,z,1.15);drawPagoda(7.5,z+10,.83);drawTree(-5.4,z+18,Math.floor(z));drawTree(5.5,z+1,Math.floor(z+4));drawTree(-9.8,z+29,Math.floor(z+2));drawTree(10,z+24,Math.floor(z+7))}
}
function addWave(){const z=108+Math.random()*20;const pattern=Math.random();if(pattern<.33){const l=Math.floor(Math.random()*3);objects.push({type:'rock',lane:l,z})}else if(pattern<.59){const l=Math.floor(Math.random()*3);objects.push({type:'branch',lane:l,z})}else if(pattern<.81){let blocked=Math.floor(Math.random()*3);for(let l=0;l<3;l++)if(l!==blocked)objects.push({type:'rock',lane:l,z:z+Math.random()*2})}else{const l=Math.floor(Math.random()*3);for(let j=0;j<5;j++)objects.push({type:'token',lane:l,z:z+j*5})}}
function drawObstacle(o){const x=lanes[o.lane],p=project(x,0,o.z),s=p.s;if(s<.06)return;const w=s*.82;
 if(o.type==='token'){const bob=Math.sin(sceneTime*5+o.z)*3,token=project(x,1.18,o.z);ctx.save();ctx.translate(token.x,token.y+bob);ctx.rotate(Math.sin(sceneTime*2+o.z)*.18);const r=Math.max(2,s*.26);ctx.shadowColor='#ffe89b';ctx.shadowBlur=r*1.7;poly([{x:0,y:-r},{x:r*.72,y:0},{x:0,y:r},{x:-r*.72,y:0}],'#ffe29a','#fff6ca',Math.max(1,r*.14));circle(0,0,r*.24,'#c58148');ctx.restore();return}
 if(o.type==='rock'){const top=project(x,.55,o.z),half=w*.72;poly([{x:p.x-half,y:p.y},{x:p.x-half*.8,y:top.y+4*s},{x:p.x-half*.27,y:top.y},{x:p.x+half*.7,y:top.y+2*s},{x:p.x+half,y:p.y}], '#74554a','#a47a5d',Math.max(1,s*.09));poly([{x:p.x-half*.8,y:top.y+4*s},{x:p.x-half*.27,y:top.y},{x:p.x+half*.7,y:top.y+2*s},{x:p.x+half*.3,y:p.y-2*s}], '#a17a5b');line({x:p.x-half*.55,y:p.y-s*.1},{x:p.x+half*.45,y:p.y-s*.12},'#d1a878',Math.max(.7,s*.04));
 }else{const top=project(x,1.52,o.z),half=w*1.08;poly([{x:p.x-half,y:p.y},{x:p.x-half,y:top.y+s*.24},{x:p.x+half,y:top.y+s*.24},{x:p.x+half,y:p.y}], '#583c32');poly([{x:p.x-half*1.25,y:top.y+s*.28},{x:p.x-half*.78,y:top.y-s*.03},{x:p.x+half*.78,y:top.y-s*.03},{x:p.x+half*1.25,y:top.y+s*.28}], '#d39a61');line({x:p.x-half*.75,y:top.y+s*.12},{x:p.x+half*.75,y:top.y+s*.12},'#efcc89',Math.max(1,s*.07));}
}
function drawRunner(){const x=-1.6+laneFloat*1.6,jumpY=jump>0?Math.sin(Math.min(jump/.78,1)*Math.PI)*1.5:0,base=project(x,jumpY,2.1),scale=base.s*1.05,ground=project(x,0,2.1);if(scale<1)return;
 ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#563a2e';ctx.beginPath();ctx.ellipse(ground.x,ground.y,scale*.37,scale*.1,0,0,Math.PI*2);ctx.fill();ctx.restore();
 const cx=base.x,feet=base.y,unit=scale;const sliding=slide>0,bodyH=sliding?.58:1.04,wiggle=mode==='running'?Math.sin(runTime*15)*unit*.12:0;
 // scarf and little running legs
 if(sliding){poly([{x:cx-unit*.36,y:feet-unit*.33},{x:cx+unit*.25,y:feet-unit*.37},{x:cx+unit*.48,y:feet-unit*.1},{x:cx-unit*.06,y:feet}], '#b75f43');line({x:cx-unit*.04,y:feet-unit*.1},{x:cx+unit*.41,y:feet+wiggle},'#543a31',unit*.17)}else{
 line({x:cx-unit*.11,y:feet-unit*.34},{x:cx-unit*.2+wiggle,y:feet},'#533c34',unit*.16);line({x:cx+unit*.11,y:feet-unit*.34},{x:cx+unit*.2-wiggle,y:feet},'#533c34',unit*.16);line({x:cx-unit*.2+wiggle,y:feet},{x:cx-unit*.02+wiggle,y:feet},'#f0d7b6',unit*.09);line({x:cx+unit*.2-wiggle,y:feet},{x:cx+unit*.37-wiggle,y:feet},'#f0d7b6',unit*.09);
 poly([{x:cx-unit*.26,y:feet-unit*.88},{x:cx+unit*.25,y:feet-unit*.88},{x:cx+unit*.3,y:feet-unit*.34},{x:cx-unit*.21,y:feet-unit*.34}], '#b85f43');
 line({x:cx-unit*.23,y:feet-unit*.77},{x:cx-unit*.46+wiggle,y:feet-unit*.49},'#e5b678',unit*.12);line({x:cx+unit*.2,y:feet-unit*.78},{x:cx+unit*.42-wiggle,y:feet-unit*.57},'#e5b678',unit*.12);
 const scarf=project(x-.12,1.03+jumpY,2.1);poly([{x:cx-unit*.18,y:feet-unit*.79},{x:cx+unit*.12,y:feet-unit*.81},{x:cx+unit*.42+wiggle,y:feet-unit*.7},{x:cx+unit*.11,y:feet-unit*.61}], '#e5b77b');circle(scarf.x,feet-unit*1.11,unit*.17,'#d7a878');circle(scarf.x+unit*.025,feet-unit*1.13,unit*.15,'#edc99b');
  // cotton headwrap, bright eyes, and the longyi's woven border
  line({x:cx-unit*.12,y:feet-unit*1.19},{x:cx+unit*.13,y:feet-unit*1.19},'#f0d7b6',unit*.045);circle(cx-unit*.055,feet-unit*1.12,unit*.018,'#543a31');circle(cx+unit*.045,feet-unit*1.12,unit*.018,'#543a31');
  line({x:cx-unit*.18,y:feet-unit*.53},{x:cx+unit*.22,y:feet-unit*.53},'#e8bb7e',unit*.035);line({x:cx-unit*.17,y:feet-unit*.43},{x:cx+unit*.23,y:feet-unit*.43},'#d98b59',unit*.025);
  circle(cx+unit*.21,feet-unit*.72,unit*.045,'#f1cb8e');
 }
 ctx.restore();}
function startRun(){objects=[];lane=1;laneFloat=1;jump=slide=0;distance=0;tokenCount=0;speed=17;runTime=0;spawnAt=8;flash=0;mode='running';hide('start-screen');hide('end-screen');hide('pause-screen');$('distance').innerHTML='0000 <small>m</small>';$('tokens').innerHTML='0 <small>✦</small>'}
function hide(id){$(id).classList.add('hidden')}function show(id){$(id).classList.remove('hidden')}
function endRun(){if(mode!=='running'&&mode!=='paused')return;mode='over';hide('pause-screen');const metres=Math.floor(distance);if(metres>best){best=metres;localStorage.setItem('bgn-best',best);$('best').textContent=String(best).padStart(4,'0')+' m'}$('final-distance').textContent=metres+' m';$('final-tokens').textContent=tokenCount+' sun token'+(tokenCount===1?'':'s');$('end-best').textContent=String(best).padStart(4,'0')+' m';show('end-screen')}
function doAction(a){if(mode!=='running')return;if(a==='left')lane=Math.max(0,lane-1);if(a==='right')lane=Math.min(2,lane+1);if(a==='jump'&&jump<=0&&slide<=0)jump=.01;if(a==='slide'&&jump<=0)slide=.72}
function togglePause(){if(mode==='running'){mode='paused';show('pause-screen')}else if(mode==='paused'){mode='running';hide('pause-screen')}}
$('start').onclick=startRun;$('again').onclick=startRun;$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('quit').onclick=()=>{hide('pause-screen');endRun()};
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','a','d','w','s','A','D','W','S'].includes(e.key))e.preventDefault();if(e.repeat)return;if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')doAction('left');if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')doAction('right');if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W')doAction('jump');if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')doAction('slide');if(e.key==='Escape'||e.key==='p'||e.key==='P')togglePause()});
document.querySelectorAll('.touch-controls button').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();doAction(b.dataset.action)})});let swipeX=0,swipeY=0;canvas.addEventListener('touchstart',e=>{if(e.touches.length){swipeX=e.touches[0].clientX;swipeY=e.touches[0].clientY}},{passive:true});canvas.addEventListener('touchend',e=>{if(!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-swipeX,dy=e.changedTouches[0].clientY-swipeY;if(Math.max(Math.abs(dx),Math.abs(dy))>35)doAction(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy<0?'jump':'slide'))},{passive:true});
function update(dt){sceneTime+=dt;if(mode!=='running')return;runTime+=dt;speed=Math.min(29,17+runTime*.19);distance+=speed*dt*.48;laneFloat+=(lane-laneFloat)*Math.min(1,dt*12);jump=jump>0?jump+dt:0;if(jump>.78)jump=0;slide=Math.max(0,slide-dt);if(distance>=spawnAt){addWave();spawnAt+=9.5+Math.random()*4.5}
 for(const o of objects){o.z-=speed*dt;if(o.type==='token'&&!o.got&&o.z<4.2&&o.z>1.3&&Math.abs(laneFloat-o.lane)<.34){o.got=true;tokenCount++;$('tokens').innerHTML=tokenCount+' <small>✦</small>';flash=.18}if(o.type!=='token'&&!o.hit&&o.z<3.25&&o.z>1.1&&Math.abs(laneFloat-o.lane)<.34){o.hit=true;const safe=o.type==='rock'?jump>.12&&jump<.75:slide>.08;if(!safe){endRun();break}}}objects=objects.filter(o=>o.z>0&&!(o.type==='token'&&o.got));flash=Math.max(0,flash-dt);$('distance').innerHTML=String(Math.floor(distance)).padStart(4,'0')+' <small>m</small>'}
function render(){ctx.clearRect(0,0,W,H);background();drawLandscape();objects.slice().sort((a,b)=>b.z-a.z).forEach(drawObstacle);drawRunner();if(flash>0){ctx.fillStyle=`rgba(255,230,156,${flash*1.1})`;ctx.fillRect(0,0,W,H)}if(mode==='running'&&runTime<4){ctx.fillStyle=`rgba(67,48,36,${Math.max(0,.76-runTime*.22)})`;ctx.font='500 10px "DM Mono", monospace';ctx.textAlign='center';ctx.fillText('DODGE   ·   JUMP   ·   SLIDE',W/2,H*.72)} }
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);render();requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
