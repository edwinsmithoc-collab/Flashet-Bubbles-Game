'use strict';
/* Flashet Bubbles — bubble shooter. Codi propi, sense dependències. */
const $=s=>document.querySelector(s);
const NLEV=200; // 200 niveles! más de 100, con trampas después
// ---------- i18n ----------
const TX={
ca:{play:'Jugar',album:'Àlbum',map:'Mapa',level:'Nivell',score:'Punts',shots:'Tirs',credits:'Crèdits',
 g_clear:'Neteja-ho tot',g_score:'Fes {n} punts',g_drop:'Fes caure {n}',
 gd_clear:'Fes petar totes les bombolles!',gd_score:'Aconsegueix {n} punts!',gd_drop:'Fes caure {n} bombolles penjades!',
 start:'Som-hi!',win:'Nivell superat!',lose:'Oh, no!',lose_s:'Se t\'han acabat els tirs.',lose_l:'Les bombolles han arribat a baix!',
 retry:'Torna-hi',next:'Següent',mapb:'Mapa',dev:'Revelant la foto…',devd:'Foto nova a l\'àlbum!',photo:'Foto',lic:'Llicència',
 tip:'Arrossega per apuntar · deixa anar per disparar · toca la bombolla de la dreta per canviar',
 combo:'Combo x{n}!',drop:'Cauen {n}!',bomb:'Flash bomba!',rain:'Arc de Sant Martí!',film:'Rodet de pel·lícula!',
 bombd:'Esclata tot el voltant',raind:'Fa parella amb qualsevol color',filmd:'Esborra tota la fila',
 desc:'Atenció: el sostre baixa!',special:'Bombolla especial!',sound:'So',on:'Sí',off:'No',pause:'Pausa',resume:'Continua',
 locked:'Guanya nivells per revelar fotos',got:'{n}/{m} fotos',best:'Rècord',newrec:'Nou rècord!',close:'Tanca',music:'Música',
 credintro:'Fotos reals de Catalunya de Wikimedia Commons amb llicències lliures. Música i sons generats en directe.'},
es:{play:'Jugar',album:'Álbum',map:'Mapa',level:'Nivel',score:'Puntos',shots:'Tiros',credits:'Créditos',
 g_clear:'Límpialo todo',g_score:'Haz {n} puntos',g_drop:'Tira {n}',
 gd_clear:'¡Explota todas las burbujas!',gd_score:'¡Consigue {n} puntos!',gd_drop:'¡Haz caer {n} burbujas colgadas!',
 start:'¡Vamos!',win:'¡Nivel superado!',lose:'¡Oh, no!',lose_s:'Te has quedado sin tiros.',lose_l:'¡Las burbujas han llegado abajo!',
 retry:'Reintentar',next:'Siguiente',mapb:'Mapa',dev:'Revelando la foto…',devd:'¡Foto nueva en el álbum!',photo:'Foto',lic:'Licencia',
 tip:'Arrastra para apuntar · suelta para disparar · toca la burbuja de la derecha para cambiar',
 combo:'¡Combo x{n}!',drop:'¡Caen {n}!',bomb:'¡Flash bomba!',rain:'¡Arcoíris!',film:'¡Rollo de película!',
 bombd:'Explota todo alrededor',raind:'Combina con cualquier color',filmd:'Borra toda la fila',
 desc:'¡Atención: el techo baja!',special:'¡Burbuja especial!',sound:'Sonido',on:'Sí',off:'No',pause:'Pausa',resume:'Continuar',
 locked:'Gana niveles para revelar fotos',got:'{n}/{m} fotos',best:'Récord',newrec:'¡Nuevo récord!',close:'Cerrar',music:'Música',
 credintro:'Fotos reales de Cataluña de Wikimedia Commons con licencias libres. Música y sonidos generados en directo.'}};
// ---------- save ----------
const SKEY='flashetBubbles.v1';
let S={lang:'ca',snd:1,stars:{},best:{},album:[]};
try{Object.assign(S,JSON.parse(localStorage.getItem(SKEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(SKEY,JSON.stringify(S))}catch(e){}};
const t=(k,o)=>{let s=(TX[S.lang]||TX.ca)[k]||k;if(o)for(const q in o)s=s.replace('{'+q+'}',o[q]);return s};
function applyLang(){document.documentElement.lang=S.lang;document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));
 $('#bLang').textContent=S.lang==='ca'?'🌐 Català':'🌐 Castellano';$('#bSnd').textContent=(S.snd?'🔊 ':'🔇 ')+t('sound');}
// ---------- audio ----------
let AC=null,master=null,musG=null,sfxG=null;
function audio(){if(AC)return AC;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.connect(AC.destination);
 musG=AC.createGain();musG.gain.value=.16;musG.connect(master);sfxG=AC.createGain();sfxG.gain.value=.5;sfxG.connect(master);master.gain.value=S.snd?1:0;}catch(e){}return AC}
function unlock(){const a=audio();if(a&&a.state==='suspended')a.resume();voUnlock();}
function tone(f,d,type='sine',v=.3,when=0,dest,slide){if(!AC||!S.snd)return;const t0=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);
 if(slide)o.frequency.exponentialRampToValueAtTime(slide,t0+d);g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+.008);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g);g.connect(dest||sfxG);o.start(t0);o.stop(t0+d+.05)}
let noiseBuf=null;function noise(d,v=.2,when=0,fq=3000,dest){if(!AC||!S.snd)return;if(!noiseBuf){noiseBuf=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const c=noiseBuf.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1}
 const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),t0=AC.currentTime+when;s.buffer=noiseBuf;f.type='bandpass';f.frequency.value=fq;g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);s.connect(f);f.connect(g);g.connect(dest||sfxG);s.start(t0);s.stop(t0+d)}
const SFX={
 shoot(){noise(.12,.35,0,5000);tone(900,.12,'square',.08,0,0,300)},
 flash(){noise(.25,.25,0,8000);tone(2400,.08,'sine',.12)},
 pop(i=0){const f=520*Math.pow(1.06,Math.min(i,24));tone(f,.09,'sine',.25,0,0,f*1.8);noise(.04,.12,0,2500)},
 stick(){tone(220,.08,'triangle',.18,0,0,140)},
 bounce(){tone(660,.05,'triangle',.08)},
 drop(){tone(700,.35,'triangle',.15,0,0,180)},
 swap(){tone(500,.06,'sine',.15);tone(750,.07,'sine',.15,.05)},
 boom(){noise(.6,.6,0,900);tone(120,.4,'sine',.5,0,0,40)},
 win(){[523,659,784,1046,1318].forEach((f,i)=>tone(f,.3,'triangle',.22,i*.11))},
 lose(){[392,349,311,262].forEach((f,i)=>tone(f,.35,'sawtooth',.08,i*.18))},
 star(i){tone(880*Math.pow(1.25,i),.25,'sine',.25)},
 desc(){tone(160,.3,'square',.1,0,0,90);noise(.3,.2,0,400)}};
// procedural cheerful music: I–V–vi–IV with arpeggio, bass, hats
const MUS={on:false,step:0,next:0,timer:null,bpm:118};
const PROG=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]];const mid=m=>440*Math.pow(2,(m-69)/12);
const MEL=[0,2,4,2,7,4,2,4, 0,2,4,7,9,7,4,2];
function musTick(){if(!AC||!MUS.on)return;const spb=60/MUS.bpm/2;while(MUS.next<AC.currentTime+.25){const s=MUS.step,w=MUS.next-AC.currentTime,ch=PROG[Math.floor(s/16)%4];
 if(S.snd){if(s%8===0)tone(mid(ch[0]-24),spb*3.5,'triangle',.35,w,musG);if(s%8===4)tone(mid(ch[0]-17),spb*3,'triangle',.25,w,musG);
 tone(mid(ch[s%3]+12),spb*.9,'sine',.12,w,musG);if(s%2===0)noise(.03,.05,w,9000,musG);if(s%4===2)noise(.08,.07,w,1800,musG);
 if(s%2===0&&Math.floor(s/32)%2===1){const n=MEL[(s/2)%16];tone(mid(72+n),spb*1.6,'square',.035,w,musG)}}
 MUS.step++;MUS.next+=spb;}}
function musicStart(){audio();if(!AC||MUS.on)return;MUS.on=true;MUS.next=AC.currentTime+.1;MUS.timer=setInterval(musTick,60)}
// ---------- voices (kid voices from Flashet project, MP3) ----------
const VO={el:null,last:0,unl:0};
function voEl(){if(!VO.el){VO.el=new Audio();VO.el.preload='auto'}return VO.el}
function voUnlock(){if(VO.unl)return;VO.unl=1;const e=voEl();e.src='assets/voice/'+S.lang+'/f_photo.mp3';e.volume=0;const p=e.play();if(p)p.then(()=>{e.pause();e.volume=1}).catch(()=>{e.volume=1})}
function say(id,force){if(!S.snd)return;const n=performance.now();if(!force&&n-VO.last<2500)return;VO.last=n;const e=voEl();e.volume=1;e.src='assets/voice/'+S.lang+'/'+id+'.mp3';e.play().catch(()=>{})}
// ---------- screens ----------
function show(id){document.querySelectorAll('.scr').forEach(s=>s.classList.toggle('on',s.id==='scr-'+id));G.running=id==='game';if(id==='map')buildMap();if(id==='album')buildAlbum();if(id==='cred')buildCred();if(id==='game')resize()}
function modal(html){$('#mcard').innerHTML=html;$('#modal').classList.remove('hide');$('#mcard').style.animation='none';void $('#mcard').offsetWidth;$('#mcard').style.animation=''}
function closeModal(){$('#modal').classList.add('hide')}
// ---------- levels ----------
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const COLS=10,R=16,D=32,RH=R*Math.sqrt(3),W=COLS*D+R,H=600,LENSY=H-78,DEAD=LENSY-46;

// Iconos relacionados con fotos y la tienda Photo & Shop
const PHOTO_SHOP_ICONS = [
  '📷', '📸', '🖼️', '🎞️', '🛍️', '🎁', '📍', '⛪', '🏔️', '🏰', '🏖️', '🌉',
  '📷', '🖼️', '📸', '🛍️', '🎁', '🎞️', '📍', '📷', '🖼️', '📸'
];
const PAL=[['#ff4d6d','#ffb3c1','#a3002a'],['#ffc93c','#fff2b0','#c27c00'],['#3ec46d','#bff5cf','#14783a'],['#3fa7ff','#c7e6ff','#0b5bb5'],['#a96bff','#e3d1ff','#5b1fb8'],['#ff8a3d','#ffd5b0','#b04800']];
function levelDef(i){
  const r=rng(i*7919+31);
  let rows, cols, shots, desc, specials, trap=false;
  if(i < 100){
    rows=Math.min(5+Math.floor(i/4),11);
    cols=Math.min(3+Math.floor((i+2)/7),6);
    shots=Math.round(rows*COLS/2.3)+10-Math.min(8,Math.floor(i/6))+(i<3?8:0);
    desc=Math.max(5,11-Math.floor(i/5));
    specials=i<2?0:1+(i%4===0);
  } else {
    // ¡TRAMPAS Y DIFICULTADES! niveles 100-199
    trap=true;
    const extra = i - 100;
    rows=Math.min(7+Math.floor(extra/5),13);
    cols=Math.min(4+Math.floor(extra/8),6);
    shots=Math.max(15, Math.round(rows*COLS/3.2) - Math.floor(extra/10));
    desc=Math.max(3, 7 - Math.floor(extra/15)); // techo baja más rápido
    specials=2 + Math.floor(extra/20);
    // más clump, más colores difíciles
  }
  const goal=['clear','drop','score'][i%3===0?0:(i%3===1?1:2)];
  const shape=i<2?0:Math.floor(r()*6);
  return{i,rows,cols,goal,shape,shots,desc,target:goal==='drop'?Math.round(4+rows*1.6+i/3):goal==='score'?Math.round(rows*COLS*16/50)*50:0,seed:i*131+7,clump:.45+Math.min(.35,i*.008)+(trap?.15:0),specials,trap};
}
function shapeOK(s,r,c,rows){switch(s){case 1:return Math.abs(c-4.5)<=5-r*0.35||r<2;case 2:return(c%3!==2)||r<2;case 3:return Math.abs(c-4.5)+Math.abs(r-rows/2)*1.2<6||r===0;case 4:return!(r>1&&r<rows-1&&c>2&&c<7);case 5:return (r+c)%4!==3||r===0;default:return true}}
// ---------- game state ----------
const G={running:false,lv:null,grid:[],ceil:0,cur:null,nxt:null,shots:0,score:0,dropped:0,combo:0,since:0,moving:null,parts:[],falls:[],texts:[],aim:null,aiming:false,state:'idle',
 fl:{sq:0,sqv:0,tilt:0,bounce:0,flash:0,hap:0},specQ:[],shake:0,popped:0,t:0,ghost:null,path:null,bgParts:[]};
const cv=$('#cv'),cx=cv.getContext('2d');let SC=1,DPR=1;
function resize(){const st=$('#stage'),w=st.clientWidth,h=st.clientHeight;if(!w||!h)return;SC=Math.min(w/W,h/H);DPR=Math.min(window.devicePixelRatio||1,3);
 cv.style.width=W*SC+'px';cv.style.height=H*SC+'px';cv.width=Math.round(W*SC*DPR);cv.height=Math.round(H*SC*DPR)}
addEventListener('resize',resize);
const cellX=(r,c)=>R+c*D+(r&1?R:0),topY=()=>4+G.ceil*RH,cellY=r=>topY()+r*RH+R;
const valid=(r,c)=>r>=0&&c>=0&&c<COLS-(r&1?0:0)&&!(r&1&&c>=COLS)&&!(r&1&&c===COLS-1&&false);
// odd rows shifted right: last cell x = R+9*D+R = W - R OK
function nb(r,c){const o=r&1?[[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]:[[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];return o.map(([a,b])=>[r+a,c+b]).filter(([a,b])=>a>=0&&b>=0&&b<COLS)}
const get=(r,c)=>G.grid[r]?G.grid[r][c]:null;
function setc(r,c,v){while(G.grid.length<=r)G.grid.push(new Array(COLS).fill(null));G.grid[r][c]=v}
function eachB(f){for(let r=0;r<G.grid.length;r++)for(let c=0;c<COLS;c++)if(G.grid[r][c])f(r,c,G.grid[r][c])}
function countB(){let n=0;eachB(()=>n++);return n}
function colorsPresent(){const s=new Set();eachB((r,c,b)=>{if(b.t==='n')s.add(b.c)});return[...s]}
function startLevel(i){const L=levelDef(i),rr=rng(L.seed);G.lv=L;G.grid=[];G.ceil=0;G.score=0;G.dropped=0;G.combo=0;G.since=0;G.shots=L.shots;G.moving=null;G.parts=[];G.falls=[];G.texts=[];G.state='play';G.specQ=[];G.popped=0;
 for(let r=0;r<L.rows;r++)for(let c=0;c<COLS;c++){if(!shapeOK(L.shape,r,c,L.rows))continue;let col;const up=get(r-1,c),lf=get(r,c-1);
  if(lf&&rr()<L.clump)col=lf.c;else if(up&&rr()<L.clump*.8)col=up.c;else col=Math.floor(rr()*L.cols);setc(r,c,{c:col,t:'n',s:0})}
 while(G.grid.length<L.rows)G.grid.push(new Array(COLS).fill(null));
 dropFloating(true);
 const types=['bomb','rain','film'];for(let k=0;k<L.specials;k++)G.specQ.push(types[(i+k)%3]);
 G.cur=newBubble();G.nxt=newBubble();G.fl.bounce=1;updHud();show('game');
 const gk={clear:'gd_clear',drop:'gd_drop',score:'gd_score'}[L.goal];
 modal(`<div class="goalcard"><h3>${t('level')} ${i+1}</h3><img src="assets/img/flashet.png" alt=""><p style="font-size:20px;font-weight:800">${t(gk,{n:L.target})}</p>
 <div class="sp"><span>🎯 ${L.shots} ${t('shots').toLowerCase()}</span><span>⬇ ${L.desc}</span></div>${L.trap?'<p style="color:#e0581f;font-weight:800;margin:6px 0">⚠️ ¡NIVEL TRAMPA! Más difícil, techo rápido y menos tirs!</p>':''}<p style="font-size:12px;opacity:.75">${t('tip')}</p>
 <div class="sp"><span>⚡ ${t('bombd')}</span><span>🌈 ${t('raind')}</span><span>🎞 ${t('filmd')}</span></div>
 <div class="cbtns"><button class="big" id="goBtn">${t('start')}</button></div></div>`);
 $('#goBtn').onclick=()=>{unlock();musicStart();closeModal();say('f_jump2',1)};}
function newBubble(){const cs=colorsPresent();const c=cs.length?cs[Math.floor(Math.random()*cs.length)]:Math.floor(Math.random()*G.lv.cols);return{c,t:'n'}}
function updHud(){const L=G.lv;$('#hLvl').textContent=L.i+1;$('#hScore').textContent=G.score;$('#hShots').textContent=G.shots;$('.hb.shots').classList.toggle('low',G.shots<=5);
 let p=0,lab;if(L.goal==='clear'){const n=countB();G._tot=G._tot||n;G._tot=Math.max(G._tot,n);p=1-n/Math.max(1,G._tot);lab=t('g_clear')}else if(L.goal==='drop'){p=G.dropped/L.target;lab=t('g_drop',{n:L.target})+' · '+Math.min(G.dropped,L.target)}else{p=G.score/L.target;lab=t('g_score',{n:L.target})}
 $('#hGoalT').textContent=lab;$('#hProg').style.width=Math.min(100,p*100)+'%'}
// ---------- physics / trajectory ----------
function lens(){return{x:W/2,y:LENSY}}
function simulate(ang,maxLen=2400){const p=lens();let x=p.x,y=p.y,dx=Math.cos(ang),dy=-Math.sin(ang);const pts=[{x,y}];let len=0;const st=3;
 while(len<maxLen){x+=dx*st;y+=dy*st;len+=st;if(x<R){x=2*R-x;dx=-dx;pts.push({x,y,b:1})}else if(x>W-R){x=2*(W-R)-x;dx=-dx;pts.push({x,y,b:1})}
  if(y<=topY()+R){pts.push({x,y});return{pts,hit:snapCell(x,y)}}
  if(hitAny(x,y)){pts.push({x,y});return{pts,hit:snapCell(x,y)}}}
 return{pts,hit:null}}
function hitAny(x,y){const r0=Math.max(0,Math.floor((y-topY())/RH)-1);for(let r=r0;r<Math.min(G.grid.length,r0+3);r++)for(let c=0;c<COLS;c++){if(!G.grid[r][c])continue;const ex=cellX(r,c)-x,ey=cellY(r)-y;if(ex*ex+ey*ey<(D*.82)**2)return true}return false}
function snapCell(x,y){let best=null,bd=1e9;const rg=Math.round((y-topY()-R)/RH);for(let r=Math.max(0,rg-1);r<=rg+1;r++)for(let c=0;c<COLS;c++){if(get(r,c))continue;
 const attached=r===0||nb(r,c).some(([a,b])=>get(a,b));if(!attached)continue;const ex=cellX(r,c)-x,ey=cellY(r)-y,d=ex*ex+ey*ey;if(d<bd){bd=d;best={r,c}}}return best}
function clampAng(a){return Math.max(.14,Math.min(Math.PI-.14,a))}
// ---------- input ----------
function evPos(e){const b=cv.getBoundingClientRect();return{x:(e.clientX-b.left)/SC,y:(e.clientY-b.top)/SC}}
function inSwap(p){const dx=p.x-(W-42),dy=p.y-(H-40);return dx*dx+dy*dy<30*30}
function setAim(p){const l=lens();let a=Math.atan2(-(p.y-l.y),p.x-l.x);if(p.y>l.y-6)a=p.x<l.x?Math.PI-.14:.14;G.aim=clampAng(a)}
cv.addEventListener('pointerdown',e=>{e.preventDefault();unlock();musicStart();if(G.state!=='play')return;const p=evPos(e);if(inSwap(p)||(Math.abs(p.x-W/2)<34&&p.y>LENSY-20)){swap();return}
 G.aiming=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}setAim(p)});
cv.addEventListener('pointermove',e=>{if(!G.aiming)return;e.preventDefault();setAim(evPos(e))});
const endAim=e=>{if(!G.aiming)return;G.aiming=false;if(e.type==='pointercancel'){G.aim=null;return}shoot(G.aim);};
cv.addEventListener('pointerup',endAim);cv.addEventListener('pointercancel',endAim);
document.addEventListener('touchmove',e=>{if(e.target===cv)e.preventDefault()},{passive:false});
function swap(){if(G.moving||!G.nxt)return;[G.cur,G.nxt]=[G.nxt,G.cur];G.fl.sqv=-.25;SFX.swap();G._swapA=1}
function shoot(a){if(G.state!=='play'||G.moving||a==null||G.shots<=0)return;const l=lens();G.moving={x:l.x,y:l.y,dx:Math.cos(a),dy:-Math.sin(a),b:G.cur};G.shots--;G.aimOut=a;
 G.cur=G.nxt;G.nxt=G.specQ.length&&Math.random()<.5?{c:0,t:G.specQ.shift()}:newBubble();G.aim=null;
 G.fl.sqv=.55;G.fl.flash=1;G.fl.tilt+= (a-Math.PI/2)*-.3;SFX.shoot();SFX.flash();const f=$('#flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');
 for(let k=0;k<14;k++){const an=Math.random()*6.28,sp=60+Math.random()*160;G.parts.push({x:l.x,y:l.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,l:.35,m:.35,col:'#fff8d0',r:2+Math.random()*3})}
 if(G.moving.b.t!=='n')say('f_photo');updHud()}
function stepMoving(dt){const m=G.moving;let dist=900*dt;const st=4;while(dist>0){const s=Math.min(st,dist);dist-=s;m.x+=m.dx*s;m.y+=m.dy*s;
 if(m.x<R){m.x=2*R-m.x;m.dx=-m.dx;SFX.bounce()}else if(m.x>W-R){m.x=2*(W-R)-m.x;m.dx=-m.dx;SFX.bounce()}
 if(m.y<=topY()+R||hitAny(m.x,m.y)){land(m);return}}}
function land(m){G.moving=null;let cell=snapCell(m.x,m.y);if(!cell){cell={r:0,c:Math.max(0,Math.min(COLS-1,Math.round((m.x-R)/D)))}}
 const b={...m.b,s:.6};setc(cell.r,cell.c,b);SFX.stick();
 nb(cell.r,cell.c).forEach(([a,c])=>{const q=get(a,c);if(q)q.s=.25});resolve(cell.r,cell.c)}
function group(r,c,col){const seen=new Set([r+','+c]),out=[[r,c]],st=[[r,c]];while(st.length){const[a,b]=st.pop();for(const[x,y]of nb(a,b)){const k=x+','+y;if(seen.has(k))continue;seen.add(k);const q=get(x,y);if(q&&(q.t==='n'&&q.c===col)){out.push([x,y]);st.push([x,y])}}}return out}
function resolve(r,c){const b=get(r,c);let kill=[],label=null;
 if(b.t==='bomb'){eachB((a,d)=>{const ex=cellX(a,d)-cellX(r,c),ey=cellY(a)-cellY(r);if(ex*ex+ey*ey<(D*2.3)**2)kill.push([a,d])});label=t('bomb');SFX.boom();G.shake=12;flashScreen();}
 else if(b.t==='film'){for(let d=0;d<COLS;d++)if(get(r,d))kill.push([r,d]);label=t('film');SFX.boom();G.shake=6;flashScreen();}
 else if(b.t==='rain'){const set=new Map();for(const[a,d]of nb(r,c)){const q=get(a,d);if(q&&q.t==='n'&&!set.has(q.c))set.set(q.c,[a,d])}
  for(const[col,[a,d]]of set){const g=group(a,d,col);if(g.length>=2)kill.push(...g)}if(kill.length){kill.push([r,c]);label=t('rain')}else{b.t='n';b.c=set.size?[...set.keys()][0]:0}}
 else{const g=group(r,c,b.c);if(g.length>=3)kill=g}
 const uniq=new Map();kill.forEach(([a,d])=>uniq.set(a+','+d,[a,d]));kill=[...uniq.values()];
 G.since++;
 if(kill.length){G.combo++;const mult=Math.max(1,G.combo);let pts=0;kill.sort((p,q)=>q[0]-p[0]).forEach(([a,d],k)=>{const q=get(a,d);popFx(a,d,q,k);G.grid[a][d]=null;pts+=10*mult});
  const dropped=dropFloating(false);pts+=dropped*30*mult+(dropped>3?dropped*dropped*5:0);G.dropped+=dropped;G.score+=pts;G.popped+=kill.length;
  addText(cellX(r,c),cellY(r),'+'+pts,mult>1?'#ff4d6d':'#5a3a1f');G.fl.hap=1;
  if(label)toast(label);else if(dropped>=4)toast(t('drop',{n:dropped}));else if(G.combo>=3)toast(t('combo',{n:G.combo}));
  if(kill.length+dropped>=8||G.combo===4){G.specQ.push(['bomb','rain','film'][Math.floor(Math.random()*3)]);setTimeout(()=>toast('✨ '+t('special')),900);say('f_perfect')}
  else if(kill.length+dropped>=5)say(Math.random()<.5?'p_jump1':'f_jump1');
 }else{G.combo=0}
 if(G.since>=G.lv.desc){G.since=0;G.ceil++;G.shake=8;SFX.desc();toast('⬇ '+t('desc'))}
 // ensure current/next colour still exists
 const cs=colorsPresent();if(cs.length){if(G.cur.t==='n'&&!cs.includes(G.cur.c))G.cur.c=cs[Math.floor(Math.random()*cs.length)];if(G.nxt.t==='n'&&!cs.includes(G.nxt.c))G.nxt.c=cs[Math.floor(Math.random()*cs.length)]}
 updHud();checkEnd()}
function dropFloating(silent){const seen=new Set(),st=[];for(let c=0;c<COLS;c++)if(get(0,c)){seen.add('0,'+c);st.push([0,c])}
 while(st.length){const[a,b]=st.pop();for(const[x,y]of nb(a,b)){const k=x+','+y;if(!seen.has(k)&&get(x,y)){seen.add(k);st.push([x,y])}}}
 let n=0;eachB((r,c,b)=>{if(!seen.has(r+','+c)){if(!silent){G.falls.push({x:cellX(r,c),y:cellY(r),vx:(Math.random()-.5)*120,vy:-60-Math.random()*120,b,l:2});}G.grid[r][c]=null;n++}});
 if(n&&!silent)setTimeout(()=>SFX.drop(),120);return n}
function popFx(r,c,b,k){const x=cellX(r,c),y=cellY(r),col=b.t==='n'?PAL[b.c][0]:(b.t==='bomb'?'#fff36b':b.t==='film'?'#444':'#ff6bd6');setTimeout(()=>SFX.pop(k),k*35);
 for(let i=0;i<9;i++){const an=Math.random()*6.28,sp=80+Math.random()*220;G.parts.push({x,y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-40,l:.6+Math.random()*.4,m:1,col:b.t==='rain'?PAL[i%6][0]:col,r:2+Math.random()*3.5,g:1})}
 G.parts.push({x,y,ring:1,l:.35,m:.35,col,r:R})}
function addText(x,y,s,col){G.texts.push({x,y,s,col,l:1.1})}
function toast(s){const e=$('#toast');e.textContent=s;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}
function flashScreen(){const f=$('#flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go')}
function checkEnd(){const L=G.lv,n=countB();let won=false;if(n===0)won=true;else if(L.goal==='drop'&&G.dropped>=L.target)won=true;else if(L.goal==='score'&&G.score>=L.target)won=true;
 if(won){G.state='won';setTimeout(win,700);return}
 let lowest=0;eachB(r=>lowest=Math.max(lowest,r));if(n&&cellY(lowest)+R>DEAD){G.state='lost';setTimeout(()=>lose('l'),600);return}
 if(G.shots<=0){G.state='lost';setTimeout(()=>lose('s'),600)}}
// ---------- win / lose / polaroid ----------
function win(){const L=G.lv,bonus=G.shots*50;G.score+=bonus;const ratio=G.shots/L.shots,stars=ratio>=.35?3:ratio>=.15?2:1;
 const prevS=S.stars[L.i]||0;S.stars[L.i]=Math.max(prevS,stars);const rec=G.score>(S.best[L.i]||0);if(rec)S.best[L.i]=G.score;
 const hasPhoto = L.i < PHOTOS.length;
 let photoHtml = '';
 if(hasPhoto){
   const ph=PHOTOS[L.i],isNew=!S.album.includes(ph.id);if(isNew)S.album.push(ph.id);
   photoHtml = polaroid(ph,true);
 }
 save();updHud();
 SFX.win();say('f_win',1);G.fl.bounce=1;confetti();
 modal(`<h3>${t('win')}</h3><div class="stars">${[0,1,2].map(k=>`<i class="${k<stars?'on':''}" style="animation-delay:${.3+k*.3}s">⭐</i>`).join('')}</div>
 <div>${t('score')}: <b>${G.score}</b> ${bonus?`<small>(+${bonus} 🎯)</small>`:''} ${rec?`· <b style="color:#e0581f">${t('newrec')}</b>`:''}</div>
 ${photoHtml}${hasPhoto?'<div class="devtxt" id="devT">'+t('dev')+'</div>':(L.trap?'<p style="color:#e0581f;font-weight:800">¡Has superado un nivel trampa! 🔥</p>':'')}
 <div class="cbtns"><button id="wMap">${t('mapb')}</button><button id="wRe">${t('retry')}</button>${L.i+1<NLEV?`<button class="big" id="wNext">${t('next')} ›</button>`:''}</div>`);
 [0,1,2].forEach(k=>{if(k<stars)setTimeout(()=>SFX.star(k),300+k*300)});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const p=document.querySelector('#mcard .polbig');if(p)p.classList.add('dev')}));
 setTimeout(()=>{const d=$('#devT');if(d){d.textContent='📷 '+t('devd');say('p_perfect',1)}},3400);
 $('#wMap').onclick=()=>{closeModal();show('map')};$('#wRe').onclick=()=>{closeModal();startLevel(L.i)};if($('#wNext'))$('#wNext').onclick=()=>{closeModal();startLevel(L.i+1)}}
function polaroid(ph,dev){return`<div class="polbig${dev?'':' dev'}" data-photo="${ph.id}"><div class="ph"><img src="assets/photos/${ph.id}.webp" alt="${esc(ph.name)}"></div><div class="cap">${esc(ph.name)}</div></div>
 <div class="credit">${t('photo')}: ${esc(ph.author)} · ${esc(ph.lic)} · <a href="${ph.url}" target="_blank" rel="noopener">Wikimedia Commons</a></div>`}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function lose(k){SFX.lose();say('f_hurt',1);modal(`<h3>${t('lose')}</h3><img src="assets/img/flashet.png" style="width:120px;transform:rotate(-14deg) scaleY(.9)" alt=""><p>${t(k==='l'?'lose_l':'lose_s')}</p><p>${t('score')}: <b>${G.score}</b></p>
 <div class="cbtns"><button id="lMap">${t('mapb')}</button><button class="big" id="lRe">${t('retry')}</button></div>`);$('#lMap').onclick=()=>{closeModal();show('map')};$('#lRe').onclick=()=>{closeModal();startLevel(G.lv.i)}}
function confetti(){for(let i=0;i<70;i++)G.parts.push({x:Math.random()*W,y:-10-Math.random()*60,vx:(Math.random()-.5)*80,vy:60+Math.random()*120,l:2.5,m:2.5,col:PAL[i%6][0],r:3+Math.random()*3,g:.3,sq:1})}
// ---------- rendering ----------
const IMG=new Image();IMG.src='assets/img/flashet.png';const LX=.567,LY=.41,FH=118;
const SPR={};function bubSprite(key){if(SPR[key])return SPR[key];const s=document.createElement('canvas'),sz=Math.ceil(D*3);s.width=s.height=sz;const g=s.getContext('2d'),k=sz/D,c=sz/2,r=R*k*.96;
 if(key.startsWith('n')){const p=PAL[+key.slice(1)];const gr=g.createRadialGradient(c-r*.35,c-r*.4,r*.1,c,c,r);gr.addColorStop(0,p[1]);gr.addColorStop(.45,p[0]);gr.addColorStop(1,p[2]);g.fillStyle=gr;g.beginPath();g.arc(c,c,r,0,7);g.fill()}
 else if(key==='rain'){const cols=PAL.map(p=>p[0]);for(let i=0;i<6;i++){g.fillStyle=cols[i];g.beginPath();g.moveTo(c,c);g.arc(c,c,r,i*Math.PI/3,(i+1)*Math.PI/3);g.fill()}const gr=g.createRadialGradient(c,c,0,c,c,r);gr.addColorStop(0,'#fffc');gr.addColorStop(.5,'#fff3');gr.addColorStop(1,'#0003');g.fillStyle=gr;g.beginPath();g.arc(c,c,r,0,7);g.fill()}
 else if(key==='bomb'){const gr=g.createRadialGradient(c-r*.3,c-r*.3,r*.1,c,c,r);gr.addColorStop(0,'#fff');gr.addColorStop(.5,'#ffe45c');gr.addColorStop(1,'#d98a00');g.fillStyle=gr;g.beginPath();g.arc(c,c,r,0,7);g.fill();
  g.fillStyle='#fff';g.strokeStyle='#8a5200';g.lineWidth=k*1.2;g.beginPath();const q=r/12;[[2,-9],[-5,1],[0,1],[-2,9],[5,-1],[0,-1]].forEach(([x,y],i)=>i?g.lineTo(c+x*q,c+y*q):g.moveTo(c+x*q,c+y*q));g.closePath();g.fill();g.stroke()}
 else if(key==='film'){const gr=g.createRadialGradient(c-r*.3,c-r*.3,r*.1,c,c,r);gr.addColorStop(0,'#777');gr.addColorStop(1,'#151515');g.fillStyle=gr;g.beginPath();g.arc(c,c,r,0,7);g.fill();
  g.fillStyle='#f4e3c3';g.fillRect(c-r*.8,c-r*.38,r*1.6,r*.76);g.fillStyle='#222';for(let i=-3;i<=3;i++){g.fillRect(c+i*r*.22-r*.06,c-r*.33,r*.12,r*.12);g.fillRect(c+i*r*.22-r*.06,c+r*.21,r*.12,r*.12)}g.fillStyle='#ffb13d';g.fillRect(c-r*.55,c-r*.14,r*1.1,r*.28)}
 g.fillStyle='#ffffffb0';g.beginPath();g.ellipse(c-r*.35,c-r*.42,r*.3,r*.18,-.6,0,7);g.fill();g.strokeStyle='#0002';g.lineWidth=k;g.beginPath();g.arc(c,c,r-k*.5,0,7);g.stroke();
 return SPR[key]=s}
const bKey=b=>b.t==='n'?'n'+b.c:b.t;
function drawB(b,x,y,sc=1){
  const s=bubSprite(bKey(b)),sz=D*1.5*sc*(1+(b.s||0)*.18);
  cx.drawImage(s,x-sz/2*(1+(b.s||0)*.1),y-sz/2,sz*(1+(b.s||0)*.1),sz*(1-(b.s||0)*.05));
  // Cositas dentro relacionadas con fotos y la tienda
  if(b.t==='n'){
    const iconIdx = (Math.floor(x/10) + Math.floor(y/10) + (b.c||0)*3) % PHOTO_SHOP_ICONS.length;
    const icon = PHOTO_SHOP_ICONS[iconIdx];
    cx.save();
    cx.globalAlpha = 0.85;
    cx.font = Math.round(sz*0.38) + 'px system-ui';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(icon, x, y + sz*0.02);
    cx.restore();
  }
}
function render(){const ctx=cx;ctx.setTransform(DPR*SC,0,0,DPR*SC,0,0);ctx.clearRect(0,0,W,H);
 let sx=0,sy=0;if(G.shake>0){sx=(Math.random()-.5)*G.shake;sy=(Math.random()-.5)*G.shake}ctx.save();ctx.translate(sx,sy);
 // === ANIMACIONES DIVERTIDAS Y CHULAS EN EL FONDO ===
 if(G.bgParts.length < 40){
   for(let i=G.bgParts.length;i<40;i++){
     G.bgParts.push({
       x: Math.random()*W, y: Math.random()*H,
       vx: (Math.random()-.5)*20, vy: -10 - Math.random()*30,
       r: 4 + Math.random()*8, col: PAL[Math.floor(Math.random()*PAL.length)][0],
       emoji: ['😊','😂','🤩','🎉','✨','🫧','🎈','⭐','🔥','💎','🦄','🐱'][Math.floor(Math.random()*12)],
       rot: Math.random()*6, vr: (Math.random()-.5)*2, life: 1
     });
   }
 }
 for(const p of G.bgParts){
   ctx.save();
   ctx.globalAlpha = 0.35 + Math.sin(G.t + p.x)*0.15;
   ctx.translate(p.x, p.y);
   ctx.rotate(p.rot);
   ctx.font = p.r*2.2 + 'px system-ui';
   ctx.textAlign = 'center';
   ctx.fillText(p.emoji, 0, 0);
   ctx.restore();
 }
 // backdrop: film-strip ceiling + deadline
 const ty=topY();ctx.fillStyle='#3b2616';ctx.fillRect(0,0,W,ty);ctx.fillStyle='#f4e3c3';for(let x=4;x<W;x+=16)ctx.fillRect(x,Math.max(0,ty-10),8,6);
 ctx.strokeStyle='#e0581f55';ctx.setLineDash([6,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,DEAD);ctx.lineTo(W,DEAD);ctx.stroke();ctx.setLineDash([]);
 // grid
 for(let r=0;r<G.grid.length;r++)for(let c=0;c<COLS;c++){const b=G.grid[r][c];if(!b)continue;const wob=b.t!=='n'?Math.sin(G.t*4+c)*1.5:0;drawB(b,cellX(r,c),cellY(r)+wob)}
 // aim guide
 if(G.aiming&&G.aim!=null&&G.state==='play'&&!G.moving){const sim=simulate(G.aim);const col=G.cur.t==='n'?PAL[G.cur.c][0]:'#fff';let acc=(G.t*40)%14;
  ctx.fillStyle=col;let pv=sim.pts[0];for(let i=1;i<sim.pts.length;i++){const p=sim.pts[i],dx=p.x-pv.x,dy=p.y-pv.y,L=Math.hypot(dx,dy);let d=acc;while(d<L){const k=d/L;ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(pv.x+dx*k,pv.y+dy*k,3.2,0,7);ctx.fill();d+=14}acc=d-L;pv=p}
  ctx.globalAlpha=1;if(sim.hit){ctx.globalAlpha=.4;drawB(G.cur,cellX(sim.hit.r,sim.hit.c),cellY(sim.hit.r));ctx.globalAlpha=1}G.ghost=sim.hit}
 // falling
 for(const f of G.falls){ctx.globalAlpha=Math.min(1,f.l);drawB(f.b,f.x,f.y)}ctx.globalAlpha=1;
 if(G.moving)drawB(G.moving.b,G.moving.x,G.moving.y);
 // Flashet
 drawFlashet(ctx);
 // next bubble + swap
 ctx.save();ctx.translate(W-42,H-40);ctx.fillStyle='#fff7eadd';ctx.beginPath();ctx.arc(0,0,27,0,7);ctx.fill();ctx.strokeStyle='#b9824b';ctx.lineWidth=2.5;ctx.stroke();
 ctx.strokeStyle='#b9824b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,22,-2.6,-.6);ctx.stroke();ctx.restore();
 if(G.nxt)drawB(G.nxt,W-42,H-40,.82);ctx.fillStyle='#5a3a1f';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('⇄',W-42,H-8);
 // particles
 for(const p of G.parts){ctx.globalAlpha=Math.max(0,p.l/p.m);if(p.ring){ctx.strokeStyle=p.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+(1-p.l/p.m)*1.2),0,7);ctx.stroke()}else if(p.sq){ctx.fillStyle=p.col;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.l*6);ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore()}else{ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()}}
 ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='900 20px system-ui';for(const x of G.texts){ctx.globalAlpha=Math.min(1,x.l*2);ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.strokeText(x.s,x.x,x.y);ctx.fillStyle=x.col;ctx.fillText(x.s,x.x,x.y)}ctx.globalAlpha=1;
 ctx.restore()}
function drawFlashet(ctx){const f=G.fl,l=lens(),w=FH*IMG.naturalWidth/(IMG.naturalHeight||1);const idle=Math.sin(G.t*3.2);
 const tiltT=(G.aiming&&G.aim!=null)?(G.aim-Math.PI/2)*-.35:Math.sin(G.t*1.3)*.04;f.tilt+=(tiltT-f.tilt)*.18;
 const sq=f.sq,bo=f.bounce>0?Math.abs(Math.sin(f.bounce*Math.PI*3))*f.bounce*18:0;
 ctx.save();ctx.translate(l.x,l.y-bo+idle*1.5);ctx.rotate(f.tilt);ctx.scale(1+sq*.22+idle*.01,1-sq*.25-idle*.01);
 // shadow
 ctx.save();ctx.rotate(-f.tilt);ctx.fillStyle='#0002';ctx.beginPath();ctx.ellipse(0,FH*(1-LY)-4+bo,w*.35,6,0,0,7);ctx.fill();ctx.restore();
 if(IMG.complete&&IMG.naturalWidth)ctx.drawImage(IMG,-w*LX,-FH*LY,w,FH);
 // current bubble sits in the lens
 if(G.cur&&!G.moving&&G.state!=='won'){ctx.globalAlpha=.92;drawB(G.cur,0,0,.66);ctx.globalAlpha=1}
 if(f.flash>0){const r=20+(1-f.flash)*70;const gr=ctx.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,`rgba(255,255,240,${f.flash})`);gr.addColorStop(.4,`rgba(255,240,170,${f.flash*.6})`);gr.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.strokeStyle=`rgba(255,255,255,${f.flash})`;ctx.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4+.2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.4,Math.sin(a)*r*.4);ctx.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);ctx.stroke()}}
 ctx.restore()}
let last=performance.now();
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;G.t+=dt;if(G.running){update(dt);render()}requestAnimationFrame(loop)}
function update(dt){const f=G.fl;f.sqv+=(-f.sq*180-f.sqv*14)*dt;f.sq+=f.sqv*dt*6;f.flash=Math.max(0,f.flash-dt*3.2);f.bounce=Math.max(0,f.bounce-dt*.8);G.shake=Math.max(0,G.shake-dt*30);
 // animaciones de fondo
 for(const p of G.bgParts){
   p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
   if(p.y < -30){ p.y = H + 20; p.x = Math.random()*W; }
   if(p.x < -30 || p.x > W+30) p.vx *= -1;
 }
 if(G.moving)stepMoving(dt);
 eachB((r,c,b)=>{if(b.s)b.s=Math.max(0,b.s-dt*3)});
 for(const p of G.parts){p.l-=dt;if(!p.ring){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.g)p.vy+=500*p.g*dt;p.vx*=.98}}G.parts=G.parts.filter(p=>p.l>0);
 for(const q of G.falls){q.vy+=900*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.y>H-20&&q.vy>0){q.vy*=-.35;q.l-=.8;if(q.l>0){for(let i=0;i<4;i++)G.parts.push({x:q.x,y:q.y,vx:(Math.random()-.5)*200,vy:-Math.random()*200,l:.4,m:.4,col:PAL[q.b.c||0][0],r:2,g:1})}}}G.falls=G.falls.filter(q=>q.l>0&&q.y<H+40);
 for(const x of G.texts){x.l-=dt;x.y-=30*dt}G.texts=G.texts.filter(x=>x.l>0)}
requestAnimationFrame(loop);
// ---------- map ----------
function buildMap(){const P=$('#mapPath'),step=96,h=NLEV*step+140;P.innerHTML='';P.style.height=h+'px';const wd=Math.min(420,$('#mapScroll').clientWidth||360);
 const unlocked=n=>n===0||S.stars[n-1]>0;let cur=0;for(let i=0;i<NLEV;i++)if(unlocked(i))cur=i;
 const pos=i=>({x:wd/2+Math.sin(i*.9)*wd*.3,y:h-80-i*step});
 let d='';for(let i=0;i<NLEV;i++){const p=pos(i);d+=(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)}
 P.insertAdjacentHTML('beforeend',`<svg class="trail" width="${wd}" height="${h}"><path d="${d}" fill="none" stroke="#fff8" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#c98a4a" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/></svg>`);
 let tot=0;for(let i=0;i<NLEV;i++){const p=pos(i),st=S.stars[i]||0;tot+=st;const lk=!unlocked(i),b=document.createElement('button');b.className='node'+(lk?' lock':'')+(i===cur?' cur':'');b.style.left=p.x+'px';b.style.top=p.y+'px';
  b.innerHTML=(lk?'🔒':(i+1))+`<span class="st">${'⭐'.repeat(st)}</span>`+(i < PHOTOS.length && S.album.includes(PHOTOS[i].id)?`<img class="ph" src="assets/photos/${PHOTOS[i].id}.webp" alt="">`:'')+(i>=100?'<span style="position:absolute;font-size:10px;color:#e0581f">⚠</span>':'');b.dataset.lv=i;
  b.onclick=()=>{if(lk)return;unlock();startLevel(i)};P.appendChild(b)}
 const cp=pos(cur);P.insertAdjacentHTML('beforeend',`<img class="mapHero" src="assets/img/flashet.png" style="left:${cp.x}px;top:${cp.y}px" alt="">`);
 $('#mapStars').textContent='⭐ '+tot+'/'+NLEV*3;setTimeout(()=>{$('#mapScroll').scrollTop=cp.y-$('#mapScroll').clientHeight/2},0)}
// ---------- album ----------
function buildAlbum(){const g=$('#albGrid');g.innerHTML='';$('#albCount').textContent=t('got',{n:S.album.length,m:PHOTOS.length});
 PHOTOS.forEach((ph,i)=>{const has=S.album.includes(ph.id),d=document.createElement('div');d.className='pol';d.style.setProperty('--r',((i*37%9)-4)+'deg');
  d.innerHTML=has?`<div class="im" style="background-image:url(assets/photos/${ph.id}.webp)"></div><p>${esc(ph.name)}</p>`:`<div class="im">?</div><p>${t('level')} ${i+1}</p>`;
  if(has)d.onclick=()=>{modal(`${polaroid(ph,false)}<div class="cbtns"><button id="pc">${t('close')}</button></div>`);$('#pc').onclick=closeModal};g.appendChild(d)});
 if(!S.album.length)g.insertAdjacentHTML('afterbegin',`<p style="grid-column:1/-1;text-align:center;font-weight:700">${t('locked')}</p>`)}
function buildCred(){$('#credList').innerHTML=`<p><b>${t('credintro')}</b></p>`+PHOTOS.map(p=>`<p>📷 <b>${esc(p.name)}</b> — ${esc(p.author)} — ${esc(p.lic)} — <a href="${p.url}" target="_blank" rel="noopener">Commons</a></p>`).join('')+
 `<p>Flashet: personatge original del projecte Flashet. Veus infantils: Piper TTS. Música i sons: Web Audio procedural.</p>`}
// ---------- wiring ----------
$('#bPlay').onclick=()=>{unlock();musicStart();say('f_jump1',1);show('map')};
$('#bAlbum').onclick=()=>show('album');$('#mapAlbum').onclick=()=>show('album');$('#bCred').onclick=()=>show('cred');
$('#mapBack').onclick=()=>show('title');$('#albBack').onclick=()=>show(G._from||'title');$('#credBack').onclick=()=>show('title');
$('#gBack').onclick=()=>{G.state='idle';closeModal();show('map')};
$('#bLang').onclick=()=>{S.lang=S.lang==='ca'?'es':'ca';save();applyLang()};
$('#bSnd').onclick=()=>{S.snd=S.snd?0:1;save();audio();if(master)master.gain.value=S.snd?1:0;applyLang();if(S.snd){unlock();musicStart()}};
$('#titleHero').onclick=()=>{unlock();say('f_photo',1);SFX.flash()};
document.addEventListener('visibilitychange',()=>{if(AC){if(document.hidden)AC.suspend();else if(S.snd)AC.resume()}});
applyLang();
// ---------- test hooks (automation) ----------
window.FB={G,S,startLevel,levelDef,simulate,lens,SC:()=>SC,
 // best angle (radians) that lands next to a same-colour group of >=2 (i.e. pops), via the real trajectory sim
 findShot(){let best=null,bs=0;for(let a=.15;a<Math.PI-.15;a+=.01){const s=simulate(a);if(!s.hit)continue;const{r,c}=s.hit;if(G.cur.t!=='n')return a;
  setc(r,c,{c:G.cur.c,t:'n'});const n=group(r,c,G.cur.c).length;G.grid[r][c]=null;const sc=n>=3?n*10+r:0;if(sc>bs){bs=sc;best=a}}return best},
 toClient(a){const l=lens(),b=cv.getBoundingClientRect(),d=140;return{x:b.left+(l.x+Math.cos(a)*d)*SC,y:b.top+(l.y-Math.sin(a)*d)*SC}},
 lensClient(){const l=lens(),b=cv.getBoundingClientRect();return{x:b.left+l.x*SC,y:b.top+(l.y-60)*SC}}};
