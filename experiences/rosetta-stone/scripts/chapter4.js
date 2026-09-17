/* Chapter 4 — sound matching and progressive cartouche reveals. */
window.Chapter4 = (() => {
  'use strict';
  const K = window.HMANEClock, base = './assets/chapter4/';
  const groups = {
    PT:{count:28,holds:[11,19],slot:3,audio:'Pt',label:'PT'},
    II:{count:23,holds:[11,17],slot:1,audio:'Y',label:'II'},
    S:{count:29,holds:[13,21],slot:0,audio:'S',label:'S'},
    LM:{count:25,holds:[9,16],slot:2,audio:'Lm',label:'LM'}
  };
  const reveals = [
    {id:'eternal',title:'LIVING FOREVER',audio:'Djet',x:.397,w:.141,body:'These signs add “living forever” to the king’s name—a wish for his life and reign to endure.'},
    {id:'ptah',title:'PTAH',audio:'Ptah',x:.270,w:.127,body:'These signs name Ptah, an Egyptian creator god associated with craftspeople. The final group will show his relationship to the king.'},
    {id:'beloved',title:'BELOVED',audio:'Mehr',x:.058,w:.212,body:'These signs mean “beloved.” Together with Ptah’s name, they describe the king as “beloved of Ptah.”'}
  ];
  const root = document.createElement('main'); root.id='c4';root.hidden=true;
  root.innerHTML=`<div id="c4-intro-art" hidden><img alt="Hieroglyphic inscription"></div>
    <section id="c4-stage"><button id="c4-name" class="c4-audio" hidden>♫ &nbsp; HEAR THE PHARAOH’S NAME</button>
    <div id="c4-cartouche" hidden><img id="c4-background" alt="Cartouche surrounding the royal name"><div id="c4-signs"></div><div id="c4-slots"></div><button id="c4-reveal-target" hidden aria-label="Uncover the highlighted glyphs"></button><div id="c4-shimmer" hidden></div></div>
    <p id="c4-direction" hidden>START AT THE RIGHT AND WORK LEFT.</p>
    <section id="c4-copy" aria-live="polite"><h1></h1><p></p></section>
    <button id="c4-pronounce" hidden>PTOLEMY &nbsp; ♫</button><div id="c4-bank" hidden></div></section>
    <button id="c4-next" hidden>NEXT</button><button id="c4-replay" class="c4-audio" hidden aria-label="Replay this phrase">♫ &nbsp; HEAR AGAIN</button>
    <div id="c4-white" hidden></div><img id="c4-fly" alt="Transforming glyph" hidden><span id="c4-script" hidden></span>
    <div id="c4-verdict" role="status" hidden><img alt=""><p></p></div><p id="c4-notice" role="status" hidden></p>`;
  document.body.append(root);
  new ResizeObserver(()=>{const r=document.getElementById('c4-cartouche').getBoundingClientRect();if(r.height)root.style.setProperty('--cart-bottom',r.bottom+'px');}).observe(document.getElementById('c4-cartouche'));
  const E=id=>document.getElementById('c4-'+id), title=E('copy').querySelector('h1'),body=E('copy').querySelector('p');
  let active=false,beat=0,epoch=0,busy=false,selected=null,placed=new Set(),revealed=-1,first=true,loading=null;
  const pending=new Map(),images=new Map(),sounds=new Set();
  const inkBottom={"PT/11": 0.942, "PT/19": 0.942, "II/11": 0.82, "II/17": 0.716, "S/13": 0.838, "S/21": 0.838, "LM/9": 0.618, "LM/16": 0.624};
  const CANCEL=Symbol('cancel');
  const url=p=>base+p;
  const frameURL=(g,n)=>url(`GUESSING GAME/ANIMATION/${g} GLYPH/${n}.png`);
  function delay(ms){const e=epoch;return new Promise((resolve,reject)=>{const key=K.timeout(()=>{pending.delete(key);e===epoch?resolve():reject(CANCEL);},ms);pending.set(key,reject);});}
  async function tween(ms,fn){const e=epoch,start=K.now();while(e===epoch){const t=Math.min(1,(K.now()-start)/ms);fn(t);if(t===1)return;await delay(16);}throw CANCEL;}
  function cancel(){epoch++;for(const [key,reject] of pending){K.clear(key);reject(CANCEL);}pending.clear();}
  function run(fn){Promise.resolve().then(fn).catch(e=>{if(e===CANCEL)return;console.error(e);busy=false;notice('This step could not load. Check your connection and retry.');next('RETRY',()=>go(beat===8?7:beat));});}
  function notice(text){E('notice').textContent=text;E('notice').hidden=false;}
  function preload(src){if(images.has(src))return images.get(src);const promise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(Error('Missing image: '+src));};im.src=src;});images.set(src,promise);return promise;}
  async function ready(){if(!loading){const paths=['cartouche-blank-outline.jpg','hieroglyphic-line-blurred-cartouche.jpg',...reveals.flatMap(r=>[`cartouche-${r.id}-glyphs.jpg`,`UNCOVERING GAME/cartouche-reveal-${r.id}.jpg`])].map(url);paths.push('./assets/images/sacred-hieroglyph.jpg');for(const [g,d] of Object.entries(groups))for(let n=1;n<=d.count;n++)paths.push(frameURL(g,n));loading=Promise.all(paths.map(preload)).catch(e=>{loading=null;throw e;});}await loading;}
  function play(path){const a=document.createElement('audio');a.src=url('AUDIO/'+path+'.m4a');a.preload='auto';root.append(a);sounds.add(a);const done=()=>{sounds.delete(a);a.remove();};a.onended=done;a.onerror=()=>{notice('Audio could not load. Tap again to retry.');done();};a.play().catch(()=>{notice('Sound could not play. Check volume and tap again.');done();});}
  function next(label,fn){E('next').disabled=false;E('next').textContent=label;E('next').hidden=false;E('next').onclick=()=>{E('next').hidden=true;E('next').onclick=null;run(fn);};}
  function copy(h='',p=''){title.textContent=h;body.textContent=p;E('copy').hidden=false;}
  function setBusy(value){busy=value;E('name').disabled=value;document.querySelector('#contents-open').disabled=value;if(value)HMANENav.setBack(null);}
  function stable(back){setBusy(false);HMANENav.setBack(back?()=>go(back):'?ch3=16',!E('replay').hidden);}
  function clean(){root.querySelectorAll('.c4-closing,.c4-crossfade').forEach(e=>e.remove());for(const id of ['intro-art','name','direction','pronounce','bank','next','replay','white','fly','script','verdict','notice','reveal-target','shimmer'])E(id).hidden=true;E('copy').style.opacity=1;title.style.opacity=1;body.style.opacity=1;copy();E('cartouche').classList.remove('c4-bordered');E('slots').replaceChildren();E('bank').replaceChildren();root.dataset.mode='text';}
  function imageSign(src,x,w,cls=''){const im=new Image();im.src=src;im.alt='';im.className='c4-sign '+cls;Object.assign(im.style,{left:x*100+'%',width:w*100+'%'});E('signs').append(im);return im;}
  function drawCartouche(){E('cartouche').hidden=false;E('background').src=url(revealed<0?'cartouche-blank-outline.jpg':`UNCOVERING GAME/cartouche-reveal-${reveals[revealed].id}.jpg`);E('signs').replaceChildren();for(const g of placed)imageSign(frameURL(g,groups[g].count),.538+groups[g].slot*.109,.109,'c4-name-sign');for(let i=0;i<=revealed;i++){const r=reveals[i];imageSign(url(`cartouche-${r.id}-glyphs.jpg`),r.x,r.w);}}
  function lineCrop(box){const el=E('intro-art'),im=el.firstElementChild;el.hidden=false;im.src=url('hieroglyphic-line-blurred-cartouche.jpg');const scale=Math.min(innerWidth/(box[2]-box[0]),innerHeight*.65/(box[3]-box[1]));Object.assign(el.style,{left:'0px',top:(innerHeight-(box[3]-box[1])*scale)/2+'px',width:innerWidth+'px',height:(box[3]-box[1])*scale+'px',opacity:1});Object.assign(im.style,{width:4000*scale+'px',height:189*scale+'px',left:-box[0]*scale+'px',top:-box[1]*scale+'px'});}
  const mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  async function intro(){
    E('cartouche').hidden=true;copy();let el=E('intro-art'),im=el.firstElementChild;el.hidden=false;im.src='./assets/images/sacred-hieroglyph.jpg';const w=Math.min(innerWidth,innerHeight*.72*1708/1317),h=w*1317/1708;
    el.style.cssText=`left:${(innerWidth-w)/2}px;top:${(innerHeight-h)/2}px;width:${w}px;height:${h}px`;im.style.cssText='width:100%;height:100%;left:0;top:0';await delay(1000);
    beat=2;root.dataset.beat=2;const old=im.cloneNode();old.className='c4-crossfade';root.append(old);old.style.cssText=`position:absolute;z-index:2;left:${(innerWidth-w)/2}px;top:${(innerHeight-h)/2}px;width:${w}px;height:${h}px;pointer-events:none`;
    const initial=[2959.5,20,3522.5,168];lineCrop(initial);await tween(1000,t=>{old.style.opacity=1-t;el.style.opacity=t;});old.remove();
    beat=3;root.dataset.beat=3;const target=[230,0,740,189];await tween(4000,t=>lineCrop(initial.map((v,i)=>mix(v,target[i],ease(t)))));
    copy('NAME HIDDEN—CAN YOU UNCOVER IT?');root.dataset.mode='conceal';el.append(E('shimmer'));E('shimmer').hidden=false;await delay(1000);E('shimmer').hidden=true;await delay(1000);copy();
    beat=4;root.dataset.beat=4;const top=parseFloat(el.style.top);await tween(1000,t=>{el.style.top=mix(top,innerHeight*.17,ease(t))+'px';});await delay(500);await go(5);
  }
  function showHiddenCartouche(){E('cartouche').hidden=false;E('background').src=url('hieroglyphic-line-blurred-cartouche.jpg');E('cartouche').classList.add('c4-line-crop');E('signs').replaceChildren();}
  async function introduction(second=false){showHiddenCartouche();root.dataset.mode='intro';copy('CARTOUCHE',second?'We’ve hidden the signs inside this cartouche for you to uncover. First, listen to the king’s name. Then use the sounds of the signs to put it back together.':'A cartouche is an oval frame around a royal name. By matching these names with their Greek spellings, scholars discovered clues to the sounds of hieroglyphs.');
    if(!second){body.style.opacity=0;await tween(500,t=>title.style.opacity=t);await delay(500);await tween(500,t=>body.style.opacity=t);}else await delay(1000);
    stable(second?5:1);next('NEXT',()=>second?go(6):introduction(true));
  }
  function game(){root.dataset.mode='game';E('cartouche').classList.remove('c4-line-crop');E('cartouche').classList.add('c4-bordered');drawCartouche();E('name').hidden=false;E('name').onclick=()=>{if(!busy)play('Ptolemis');};selected=null;copy('','TAP A GLYPH TO HEAR ITS SOUND. THEN CHOOSE ITS PLACE IN THE CARTOUCHE.');E('direction').hidden=!first;
    E('slots').replaceChildren();for(let i=0;i<4;i++){const b=document.createElement('button');b.className='c4-slot';b.dataset.slot=i;b.setAttribute('aria-label',`Name slot ${i+1} from the left`);b.style.left=(.538+i*.109)*100+'%';b.disabled=true;b.onclick=()=>{if(selected&&!busy)run(()=>attempt(i));};E('slots').append(b);}
    if(first)E('slots').lastChild.classList.add('c4-pulse');
    E('bank').hidden=false;E('bank').replaceChildren();for(const g of ['PT','II','S','LM']){const b=document.createElement('button');b.dataset.glyph=g;b.className='c4-glyph';b.setAttribute('aria-label',`Hear ${groups[g].label} glyph sound`);b.disabled=placed.has(g);const im=new Image();im.src=frameURL(g,1);im.alt=g+' glyphs';im.hidden=placed.has(g);b.append(im);b.onclick=()=>select(g);E('bank').append(b);}stable(6);
  }
  function select(g){if(selected||busy||placed.has(g))return;selected=g;first=false;play('glyph sounds/'+groups[g].audio);E('direction').hidden=true;E('bank').querySelectorAll('button').forEach(b=>{b.disabled=true;b.classList.toggle('selected',b.dataset.glyph===g);});E('slots').querySelectorAll('button').forEach((b,i)=>{b.classList.remove('c4-pulse');b.disabled=[...placed].some(k=>groups[k].slot===i);b.classList.toggle('available',!b.disabled);});copy('','TAP THE SLOT WHERE THESE GLYPHS BELONG.');HMANENav.setBack(null);}
  function rect(el){const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}
  function flightRect(a,b,t){const f=E('fly');const r={};for(const k of ['x','y','w','h'])r[k]=mix(a[k],b[k],t);Object.assign(f.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});return r;}
  async function flight(g,a,b,reverse=false){const d=groups[g],fly=E('fly');fly.hidden=false;E('white').hidden=false;const count=d.count;for(let j=0;j<count;j++){const index=reverse?count-1-j:j;fly.src=frameURL(g,index+1);const t=index/(count-1);flightRect(a,b,t);if(!reverse&&d.holds.includes(index+1)){const im=await preload(fly.src),r=flightRect(a,b,t);E('script').textContent=index+1===d.holds[0]?'DEMOTIC':'GREEK';E('script').hidden=false;Object.assign(E('script').style,{left:r.x+r.w/2+'px',top:r.y+r.h*inkBottom[g+'/'+(index+1)]+innerHeight*.035+'px'});await delay(1000);E('script').hidden=true;}
      if(j<count-1){const to=(reverse?index-1:index+1)/(count-1);await tween(1000/12,q=>flightRect(a,b,mix(t,to,q)));}else await delay(1000/12);
    }}
  async function verdict(correct){const v=E('verdict');v.className=correct?'correct':'incorrect';v.querySelector('img').src='./assets/images/answer-'+(correct?'correct':'incorrect')+'.png';v.querySelector('img').alt=correct?'Correct':'Try again';v.querySelector('img').hidden=false;v.querySelector('p').textContent='';v.hidden=false;await delay(1000);v.hidden=true;}
  async function attempt(slot){setBusy(true);beat=8;root.dataset.beat=8;const g=selected,source=E('bank').querySelector(`[data-glyph="${g}"] img`),a=rect(source),sr=rect(E('slots').children[slot]);const side=Math.min(sr.w,sr.h),b={x:sr.x+(sr.w-side)/2,y:sr.y+(sr.h-side)/2,w:side,h:side};E('slots').querySelectorAll('button').forEach(b=>{b.disabled=true;b.classList.remove('available');});source.style.visibility='hidden';await flight(g,a,b);E('white').hidden=true;await delay(500);const correct=groups[g].slot===slot;await verdict(correct);
    if(correct){placed.add(g);E('fly').hidden=true;drawCartouche();}else{await flight(g,a,b,true);E('fly').hidden=true;E('white').hidden=true;}
    source.style.visibility='';selected=null;setBusy(false);if(placed.size===4)await go(9);else{beat=7;root.dataset.beat=7;game();}
  }
  async function revealStep(index){root.dataset.mode='reveal';E('cartouche').classList.add('c4-bordered');drawCartouche();copy(index===0?'TAP TO UNCOVER MORE GLYPHS!':index===2?'TAP TO REVEAL THE FINAL GROUP OF GLYPHS!':'TAP TO REVEAL ANOTHER GROUP OF GLYPHS!');const r=reveals[index],target=E('reveal-target');Object.assign(target.style,{left:r.x*100+'%',width:r.w*100+'%'});target.hidden=false;stable(index===0?7:index+8);target.onclick=()=>{target.onclick=null;run(async()=>{setBusy(true);target.hidden=true;revealed=index;drawCartouche();play(r.audio);copy(r.title);await delay(500);body.textContent=r.body;await tween(500,t=>body.style.opacity=t);E('replay').hidden=false;E('replay').onclick=()=>play(r.audio);await delay(1500);E('next').disabled=true;await tween(500,t=>{E('next').hidden=false;E('next').style.opacity=t;});E('next').disabled=false;stable(index===0?7:index+8);next('NEXT',()=>go(index+10));});};}
  async function go(n){cancel();clean();beat=n;root.dataset.beat=n;setBusy(true);E('cartouche').classList.remove('c4-line-crop');copy('LOADING CHAPTER…');await ready();copy();
    if(n===1){placed.clear();revealed=-1;first=true;await intro();}
    else if(n===5)await introduction();
    else if(n===6){showHiddenCartouche();root.dataset.mode='listen';copy('CARTOUCHE','Ptolemy is the king’s name. Tap the button to hear it.');E('pronounce').hidden=false;E('pronounce').onclick=()=>{play('Ptolemis');next('PLAY!',()=>go(7));};stable(5);}
    else if(n===7){placed.clear();revealed=-1;first=true;game();}
    else if(n>=9&&n<=11){placed=new Set(Object.keys(groups));revealed=n-10;drawCartouche();if(n===9){E('verdict').className='celebrate';E('verdict').querySelector('img').hidden=true;E('verdict').querySelector('p').textContent='YOU’VE SPELLED PTOLEMY’S NAME!';E('verdict').hidden=false;await delay(1500);E('verdict').hidden=true;}await revealStep(n-9);}
    else if(n===12){placed=new Set(Object.keys(groups));revealed=2;drawCartouche();E('cartouche').classList.add('c4-bordered');root.dataset.mode='ending';copy('THE COMPLETE CARTOUCHE','Ptolemy, living forever, beloved of Ptah.');const p=document.createElement('p');p.className='c4-closing';p.textContent='The cartouche holds more than a name: it also expresses wishes for the king’s life and his connection to a god.';E('copy').append(p);stable(11);document.dispatchEvent(new CustomEvent('hmane:chapter-complete',{detail:{chapter:4}}));if(window.Chapter5?.start)next('NEXT',()=>{stop();window.Chapter5.start();});}
  }
  function stop(){cancel();active=false;root.hidden=true;setBusy(false);for(const a of sounds){a.pause();a.remove();}sounds.clear();root.querySelectorAll('.c4-crossfade').forEach(e=>e.remove());}
  function start(n=1){window.Chapter3?.stop?.();window.HMANELegacy?.retire();document.querySelector('#gate').style.display='none';active=true;root.hidden=false;root.querySelectorAll('.c4-closing').forEach(e=>e.remove());run(()=>go([1,5,6,7,9,10,11,12].includes(n)?n:1));}
  window.addEventListener('resize',()=>{if(active&&beat===8){cancel();clean();selected=null;beat=7;root.dataset.beat=7;game();}});
  // Full-document routes make cross-chapter navigation and retries deterministic.
  window.addEventListener('load',()=>{const q=new URLSearchParams(location.search);if(q.get('chapter')==='4'||q.has('ch4'))start(+q.get('ch4')||1);});
  return {start,stop,get active(){return active;},get busy(){return busy;},get beat(){return beat;}};
})();
