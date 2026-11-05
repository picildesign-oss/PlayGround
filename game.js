(() => {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const colors = [
    { name:'ရွှေရောင်', top:'#f1c979', mid:'#d99b42', dark:'#8e582d', shine:'#fff0bd' },
    { name:'စိမ်းပြာ', top:'#8dc5a9', mid:'#4e9a80', dark:'#28614f', shine:'#d1f1d8' },
    { name:'အုတ်နီ', top:'#ed9870', mid:'#c95f45', dark:'#813b35', shine:'#ffd0a3' },
    { name:'မိုးပြာ', top:'#9dc3db', mid:'#5d8eaf', dark:'#385a78', shine:'#d5ecf2' },
    { name:'ခရမ်း', top:'#c2a8d5', mid:'#9271ad', dark:'#59436f', shine:'#eee1f6' },
    { name:'သန္တာ', top:'#f2b28f', mid:'#db8068', dark:'#914b45', shine:'#ffe1c1' }
  ];
  // Each depth has two complete sets of three, so the level is always solvable.
  const stacksSeed = [[2,3,4],[2,3,4],[2,3,4],[1,0,5],[1,0,5],[1,0,5]];
  let W=innerWidth, H=innerHeight, DPR=1, stacks=[], tray=[], moves=0, removed=0;
  let particles=[], lastTime=0, time=0, over=false, hits=[];
  const mm = n => String(n).replace(/[0-9]/g, d => '၀၁၂၃၄၅၆၇၈၉'[+d]);
  function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
  addEventListener('resize',resize);resize();
  function reset(){stacks=stacksSeed.map(sequence=>({sequence:sequence.slice(),depth:0,pulse:0}));tray=[];moves=0;removed=0;particles=[];over=false;$('remaining').textContent=mm(18);$('moves').textContent=mm(0);$('result').classList.add('hidden')}
  function poly(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}
  function circle(x,y,r,fill,stroke,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function layout(){const gap=Math.min(108,W*.245),rowGap=Math.min(77,H*.115),cx=W/2,cy=Math.min(H*.535,H-240);return {cx,cy,gap,rowGap,r:Math.min(25,W*.064),trayY:H-111}}
  function backdrop(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#e89b70');sky.addColorStop(.42,'#f3c58d');sky.addColorStop(1,'#d7a170');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const sunX=W*.77,sunY=H*.25,glow=ctx.createRadialGradient(sunX,sunY,5,sunX,sunY,H*.24);glow.addColorStop(0,'#fff1c8b0');glow.addColorStop(1,'#fff1c800');ctx.fillStyle=glow;ctx.fillRect(sunX-H*.25,sunY-H*.25,H*.5,H*.5);circle(sunX,sunY,Math.min(52,H*.09),'#ffe8b5');
    poly([[0,H*.36],[W*.14,H*.31],[W*.28,H*.36],[W*.45,H*.3],[W*.62,H*.36],[W*.8,H*.31],[W,H*.35],[W,H*.63],[0,H*.63]],'#c88461');
    poly([[0,H*.43],[W*.2,H*.39],[W*.42,H*.44],[W*.63,H*.39],[W*.82,H*.43],[W,H*.4],[W,H*.68],[0,H*.68]],'#d69a6b');
    for(let i=0;i<12;i++){const x=((i*137+34)%Math.max(W,1)),base=H*(.42+(i%3)*.008),s=.42+(i%4)*.13;drawTemple(x,base,s)}
    ctx.fillStyle='#edc18a';ctx.fillRect(0,H*.55,W,H*.45);
    for(let i=0;i<24;i++){let x=(i*89+time*4)%W,y=H*(.34+(i*37%52)/100);circle(x,y,1+(i%3)*.4,'#fff0c47a')}
  }
  function drawTemple(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#a65f4c99';ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-16,-9);ctx.lineTo(-10,-12);ctx.lineTo(-8,-23);ctx.lineTo(-3,-29);ctx.lineTo(0,-49);ctx.lineTo(3,-29);ctx.lineTo(9,-23);ctx.lineTo(10,-12);ctx.lineTo(17,-9);ctx.lineTo(20,0);ctx.closePath();ctx.fill();ctx.restore()}
  function drawTile(x,y,stack,index,active,r){
    const lift=stack.pulse>0?Math.sin(stack.pulse*18)*2:0;y-=lift;
    ctx.save();ctx.globalAlpha=active?1:.64;
    // beveled lacquered tile and its thick brick edge
    poly([[x-36,y-14],[x,y-33],[x+36,y-14],[x,y+5]],'#82513c','#f0c77e',1.4);
    poly([[x-36,y-14],[x,y+5],[x,y+13],[x-36,y-6]],'#6c4235','#a9714e',1);
    poly([[x,y+5],[x+36,y-14],[x+36,y-6],[x,y+13]],'#9a6241','#bd8958',1);
    poly([[x-31,y-15],[x,y-30],[x+31,y-15],[x,y-1]],'#d5a367','#f5d69a',.8);
    // lotus-stamped ring around the screw socket
    const sy=y-16;circle(x,sy+3,r+7,'#78503a','#edc783',1.3);circle(x,sy+1,r+3,'#49372e','#c38e55',1);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;circle(x+Math.cos(a)*(r+5),sy+1+Math.sin(a)*(r+5),1.25,'#f3d18e')}
    if(stack.depth<stack.sequence.length){drawScrew(x,sy,colors[stack.sequence[stack.depth]],r,index,active)}
    else{circle(x,sy,r*.72,'#382f2a','#98724d',2);line(x-r*.34,sy,x+r*.34,sy,'#b08a5d',2)}
    // small stack marks tell how many screws remain in this socket
    const left=stack.sequence.length-stack.depth;
    for(let k=0;k<left;k++){circle(x-12+k*7,y+6,1.8,k===0?'#ffe1a0':'#b17c4e')}
    ctx.restore();
  }
  function drawScrew(x,y,c,r,index,active){
    ctx.save();ctx.translate(x,y);const spin=(index*.59+time*.12)%(Math.PI*2);ctx.rotate(spin*.12);
    ctx.shadowColor='#43281955';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
    const g=ctx.createRadialGradient(-r*.34,-r*.42,r*.12,r*.12,r*.18,r*1.2);g.addColorStop(0,c.shine);g.addColorStop(.38,c.top);g.addColorStop(.78,c.mid);g.addColorStop(1,c.dark);
    circle(0,0,r,g,'#f6d69a',2);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    circle(0,0,r*.72,'#ffffff14',c.dark,1.1);
    line(-r*.38,r*.08,r*.38,-r*.08,c.dark,Math.max(3,r*.2));line(-r*.34,r*.01,r*.34,-r*.15,c.shine,Math.max(1,r*.055));
    circle(-r*.42,-r*.43,r*.13,'#fff5d5b8');
    if(!active){ctx.fillStyle='#563a3288';ctx.beginPath();ctx.arc(0,0,r+2,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
  function drawBoard(){
    const L=layout(),{cx,cy,gap,rowGap,r}=L;hits=[];
    const left=cx-gap-51,right=cx+gap+51,top=cy-rowGap/2-50,bottom=cy+rowGap/2+45;
    // temple-roof shaped board foundation
    poly([[left+10,top+15],[cx,top-5],[right-10,top+15],[right,bottom-12],[cx,bottom+12],[left,bottom-12]],'#80513b','#f4d18e',2);
    poly([[left+17,top+16],[cx,top+3],[right-17,top+16],[right-8,bottom-14],[cx,bottom+3],[left+8,bottom-14]],'#bb8152','#eac080',1);
    // engraved sunburst at the center seam
    circle(cx,cy,20,'#9b6848','#dfb679',1);circle(cx,cy,12,'#d7ad71','#f2d89e',1);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;line(cx+Math.cos(a)*13,cy+Math.sin(a)*13,cx+Math.cos(a)*18,cy+Math.sin(a)*18,'#f1d399',1)}
    for(let i=0;i<6;i++){
      const col=i%3,row=Math.floor(i/3),x=cx+(col-1)*gap,y=cy+(row-.5)*rowGap;
      const s=stacks[i],active=s.depth<s.sequence.length;
      // soft platform shadow
      ctx.fillStyle='#59392324';ctx.beginPath();ctx.ellipse(x,y+11,41,20,0,0,Math.PI*2);ctx.fill();
      drawTile(x,y,s,i,active,r);if(active)hits.push({x,y:y-16,r:Math.max(34,r+10),index:i});
    }
    ctx.textAlign='center';ctx.fillStyle='#694831';ctx.font='500 10px Manrope, sans-serif';ctx.fillText('ပုဂံ · ရွှေဝက်အူပဟေဠိ',cx,top-16);
    ctx.font='9px "DM Mono", monospace';ctx.fillStyle='#8c6544';ctx.fillText('အလွှာ '+mm(Math.min(3,Math.floor(removed/6)+1))+' / ၀၃',cx,bottom+28);
  }
  function drawTray(){
    const L=layout(),{cx,trayY}=L,w=Math.min(300,W*.78);ctx.save();
    ctx.shadowColor='#75452925';ctx.shadowBlur=16;ctx.shadowOffsetY=6;
    ctx.beginPath();ctx.roundRect(cx-w/2,trayY-30,w,61,21);ctx.fillStyle='#fff0d9e8';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#fffaf0';ctx.lineWidth=1.5;ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle='#8c6748';ctx.font='10px Manrope, sans-serif';ctx.fillText('စုဆောင်းဗန်း',cx,trayY-39);
    const slotGap=Math.min(73,w/3.3),activeSlots=tray.length;
    for(let i=0;i<3;i++){
      const x=cx+(i-1)*slotGap;circle(x,trayY,19,'#e8cda8','#c5a176',1.2);circle(x,trayY,14,'#f7e7cd','#fff8e9',1);
      if(tray[i]){const color=colors[tray[i].color];circle(x,trayY,11,color.mid,'#fff0c7',1.3);ctx.fillStyle='#fff5da';ctx.font='bold 10px Manrope, sans-serif';ctx.fillText(String(tray[i].count),x,trayY+4)}
      else{circle(x,trayY,3,'#d6b990')}
    }
    ctx.restore();
  }
  function burst(x,y,c){for(let i=0;i<18;i++){const a=Math.PI*2*i/18+Math.random()*.2,s=35+Math.random()*65;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:.65+Math.random()*.35,max:.9,color:c})}}
  function select(index,x,y){
    if(over)return;const s=stacks[index];if(!s||s.depth>=s.sequence.length)return;
    const color=s.sequence[s.depth];s.depth++;s.pulse=.55;moves++;let item=tray.find(t=>t.color===color);
    if(!item){item={color,count:0};tray.push(item)}item.count++;
    if(item.count===3){tray=tray.filter(t=>t!==item);removed+=3;burst(x,y,colors[color].shine);}
    $('moves').textContent=mm(moves);const held=tray.reduce((n,t)=>n+t.count,0);$('remaining').textContent=mm(18-removed-held);
    if(removed===18){finish(true);return}
    if(tray.length===3){finish(false);return}
  }
  function finish(win){over=true;$('result-symbol').textContent=win?'✦':'◌';$('result-title').textContent=win?'အောင်မြင်ပါပြီ':'စဉ်းစားကြည့်ပါ';$('result-copy').textContent=win?`ဝက်အူအားလုံးကို ရှင်းလင်းပြီးပါပြီ။ ရွှေ့မှု ${mm(moves)} ကြိမ်နဲ့ ပုဂံဘုတ်ကို အောင်နိုင်ခဲ့ပါတယ်။`:'ဗန်းမှာ အရောင်မတူတဲ့ ဝက်အူ ၃ ခု ပြည့်သွားပါတယ်။ အစကနေ ပြန်စပြီး အရောင်တူတာတွေကို အရင်စုပါ။';$('result').classList.remove('hidden')}
  canvas.addEventListener('pointerdown',e=>{if(over)return;const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;for(const h of hits){if(Math.hypot(x-h.x,y-h.y)<h.r){select(h.index,h.x,h.y);return}}});
  $('restart').addEventListener('click',reset);$('play-again').addEventListener('click',reset);
  addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')reset()});
  function update(dt){time+=dt;for(const s of stacks)s.pulse=Math.max(0,s.pulse-dt);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}
  function drawEffects(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);circle(p.x,p.y,Math.max(1,4*p.life),p.color)}ctx.globalAlpha=1}
  function frame(t){const dt=Math.min(.04,(t-lastTime)/1000||0);lastTime=t;update(dt);ctx.clearRect(0,0,W,H);backdrop();drawBoard();drawTray();drawEffects();requestAnimationFrame(frame)}
  reset();requestAnimationFrame(frame);
})();
