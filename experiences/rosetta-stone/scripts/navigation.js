/* Shared presentation clock. Library/AR timers are deliberately not intercepted. */
window.HMANEClock = (() => {
  let id=0, tasks=new Map(), paused=false, pausedAt=0, elapsedPause=0, frozen=[], media=[], reasons=new Set();
  const now=()=> (paused?pausedAt:performance.now())-elapsedPause;
  const raf=window.requestAnimationFrame.bind(window);
  function tick(){
    if(!paused){const t=now(); for(const [key,task] of [...tasks]) if(t>=task.due){tasks.delete(key);task.fn(t);}}
    raf(tick);
  }
  raf(tick);
  return {now,get paused(){return paused;},
    timeout(fn,ms=0){const key=++id;tasks.set(key,{fn,due:now()+ms});return key;},
    clear(key){tasks.delete(key);},
    frame(fn){const key=++id;tasks.set(key,{fn,due:now()+1});return key;},
    cancel(){tasks.clear();},
    pause(reason="menu"){reasons.add(reason);if(paused)return;pausedAt=performance.now();paused=true;frozen=document.getAnimations().filter(a=>a.playState==='running');frozen.forEach(a=>a.pause());media=[...document.querySelectorAll('video,audio')].filter(m=>!m.paused);media.forEach(m=>m.pause());window.HMANEAudioContext?.suspend();},
    resume(reason="menu"){reasons.delete(reason);if(!paused||reasons.size)return;elapsedPause+=performance.now()-pausedAt;paused=false;frozen.forEach(a=>{try{a.play();}catch{}});media.forEach(m=>m.play().catch(()=>{}));window.HMANEAudioContext?.resume();frozen=[];media=[];}
  };
})();
window.HMANENav = (()=>{
  let destination=null,menu=false,returnFocus=null;
  const root=document.createElement('div');root.id='experience-nav';root.innerHTML=`<button id="contents-open" aria-label="Open contents" aria-expanded="false" aria-controls="contents-panel">☰</button><button id="experience-back" hidden>Back</button><div id="hm-progress" aria-hidden="true"><div class="hp-track"><div class="hp-fill"></div><div class="hp-dot"></div></div><div class="hp-label"></div></div><div id="hm-callout" aria-hidden="true"><b>Menu</b>Start over or jump to a chapter</div><section id="contents-panel" role="dialog" aria-modal="true" aria-label="Contents" hidden><button id="contents-close" aria-label="Close contents">×</button><h2>Contents</h2><div id="chapter-list"></div></section>`;document.body.append(root);
  const panel=root.querySelector('section'),open=root.querySelector('#contents-open'),back=root.querySelector('#experience-back');
  function close(){if(!menu)return;menu=false;panel.hidden=true;open.setAttribute('aria-expanded','false');HMANEClock.resume();returnFocus?.focus();}
  function openMenu(){menu=true;returnFocus=document.activeElement;HMANEClock.pause();panel.hidden=false;open.setAttribute('aria-expanded','true');root.querySelector('#contents-close').focus();}
  function navigate(search){HMANEClock.cancel();document.querySelectorAll('audio,video').forEach(m=>m.pause());const u=new URL(location.href);u.search=search;u.hash='';location.assign(u.href);}
  const chapterLabels = [
    'CHAPTER 1: THREE SCRIPTS, ONE STONE',
    'CHAPTER 2: WHAT THE STONE SAYS',
    'CHAPTER 3: THE SCRIBE’S TOOLKIT',
    'CHAPTER 4: DECODING THE PHARAOH’S NAME',
    'CHAPTER 5: BACK TO THE STONE'
  ];
  /* Round 3 (visitor testing): an explicit way back to the beginning. */
  {const b=document.createElement('button');b.textContent='START OVER';b.className='start-over';b.onclick=()=>{close();navigate('');};root.querySelector('#chapter-list').append(b);}
  for(let i=1;i<=5;i++){const b=document.createElement('button');b.textContent=chapterLabels[i-1];b.dataset.chapter=i;b.onclick=()=>{close();if(i===3&&!window.Chapter4?.active&&!window.Chapter5?.active)window.Chapter3.start();else navigate(i===1?'':i===3?'?ch3=1':'?chapter='+i);};root.querySelector('#chapter-list').append(b);}
  open.onclick=openMenu;root.querySelector('#contents-close').onclick=close;back.onclick=()=>{const dest=destination;if(typeof dest==='function')dest();else if(dest)navigate(dest);};
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const list=[...panel.querySelectorAll('button')];const i=list.indexOf(document.activeElement);e.preventDefault();list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}});
  function setBack(dest,audio=false){destination=dest;back.hidden=!dest;back.classList.toggle('above-audio',audio);}

  /* ---- Round 3: progress bar ("CHAPTER X OF 5") and menu callout ----
     The bar sits top-left, opposite the menu button. Gold up to a dot at the middle of
     the current chapter; the rest of the track is green on dark backgrounds and navy
     where the live camera is behind it. It steps aside whenever a picture/thumbnail
     reaches into the top-left corner, and comes back when the picture is gone. */
  const prog=root.querySelector('#hm-progress'),calloutEl=root.querySelector('#hm-callout');
  let calloutUntil=0;
  function callout(ms=4500){calloutUntil=performance.now()+ms;}
  const shown=el=>{for(let e=el;e&&e!==document.body;e=e.parentElement){if(e.hidden)return false;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<0.05)return false;}return true;};
  const hits=(r,b)=>r.width>60&&r.height>60&&r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top;
  function pictureUnder(b){
    for(const el of document.querySelectorAll('img,canvas,#still-win')){
      if(el.closest('#experience-nav,#gate,a-scene,#ar-wrap'))continue;
      if(el.tagName==='CANVAS'&&el.closest('a-scene'))continue;
      if(hits(el.getBoundingClientRect(),b)&&shown(el))return true;
    }return false;
  }
  function cameraUnder(b){for(const v of document.querySelectorAll('video')){if(v.readyState>=2&&hits(v.getBoundingClientRect(),b)&&shown(v))return true;}return false;}
  function updateProgress(ch){
    const gate=document.getElementById('gate'),gateUp=gate&&getComputedStyle(gate).display!=='none'&&+getComputedStyle(gate).opacity>0.05;
    const now=performance.now(),showCallout=gateUp?!!gate?.classList.contains('ready'):now<calloutUntil;
    calloutEl.classList.toggle('on',showCallout);open.classList.toggle('hm-pulse',showCallout);
    if(!ch||gateUp||showCallout||menu){prog.classList.remove('on');return;}
    const f=((ch-0.5)/5*100)+'%';prog.querySelector('.hp-fill').style.width=f;prog.querySelector('.hp-dot').style.left=f;
    prog.querySelector('.hp-label').textContent='CHAPTER '+ch+' OF 5';
    const b=prog.getBoundingClientRect();
    const box={left:0,top:0,right:Math.max(b.right,innerWidth*0.6),bottom:Math.max(b.bottom,56)};
    prog.classList.toggle('on',!pictureUnder(box));
    prog.classList.toggle('on-light',cameraUnder(box));
  }
  window.setInterval(()=>{
    const cur=window.Chapter5?.active?5:window.Chapter4?.active?4:window.Chapter3?.active?3:window.HMANELegacy?(HMANELegacy.state().beat>=20?2:HMANELegacy.state().beat>=1?1:0):0;
    try{updateProgress(cur);}catch{}
    if(window.Chapter5?.active){root.style.visibility='visible';root.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',b.dataset.chapter==='5'?'true':'false'));return;}
    if(window.Chapter4?.active){root.style.visibility=window.Chapter4.busy?'hidden':'visible';root.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',b.dataset.chapter==='4'?'true':'false'));return;}
    if(!window.HMANELegacy)return;
    const info=HMANELegacy.state();const active=window.Chapter3?.active;
    const verdict=parseFloat(getComputedStyle(document.querySelector('#answer')).opacity)>.05||document.querySelector('#c3-verdict:not([hidden])');root.style.visibility=verdict?'hidden':'visible';
    const ch=active?3:info.beat>=20?2:1;root.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',+b.dataset.chapter===ch?'true':'false'));
    if(active)return;
    if(window.HMANELegacy.viewerOpen?.()){setBack(null);return;} // Round 3: the zoom viewer has its own EXIT ZOOM button
    const map={4:'?beat=2',5:'?beat=4',6:'?beat=5',27:'?beat=6',28:'?ch2=7',29:'?ch2=8',30:'?ch2=9'};
    const stable=info.beat!==30||[...document.querySelectorAll('.c2-btn')].some(b=>+getComputedStyle(b).opacity>.9);
    setBack(stable?map[info.beat]:null,info.beat===28);
  },100);
  return {setBack,navigate,close,callout};
})();

document.addEventListener("visibilitychange",()=>{if(document.hidden)HMANEClock.pause("hidden");else HMANEClock.resume("hidden");});
