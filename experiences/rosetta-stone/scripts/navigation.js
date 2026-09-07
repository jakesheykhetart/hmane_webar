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
  const root=document.createElement('div');root.id='experience-nav';root.innerHTML=`<button id="contents-open" aria-label="Open contents" aria-expanded="false" aria-controls="contents-panel">☰</button><button id="experience-back" hidden>Back</button><section id="contents-panel" role="dialog" aria-modal="true" aria-label="Contents" hidden><button id="contents-close" aria-label="Close contents">×</button><h2>Contents</h2><div id="chapter-list"></div></section>`;document.body.append(root);
  const panel=root.querySelector('section'),open=root.querySelector('#contents-open'),back=root.querySelector('#experience-back');
  function close(){if(!menu)return;menu=false;panel.hidden=true;open.setAttribute('aria-expanded','false');HMANEClock.resume();returnFocus?.focus();}
  function openMenu(){menu=true;returnFocus=document.activeElement;HMANEClock.pause();panel.hidden=false;open.setAttribute('aria-expanded','true');root.querySelector('#contents-close').focus();}
  function navigate(search){HMANEClock.cancel();document.querySelectorAll('audio,video').forEach(m=>m.pause());const u=new URL(location.href);u.search=search;u.hash='';location.assign(u.href);}
  for(let i=1;i<=5;i++){const b=document.createElement('button');b.textContent=`Chapter ${i}`;b.dataset.chapter=i;if(i>3)b.setAttribute('aria-disabled','true');else b.onclick=()=>{close();if(i===3)window.Chapter3.start();else navigate(i===1?'':'?chapter=2');};root.querySelector('#chapter-list').append(b);}
  open.onclick=openMenu;root.querySelector('#contents-close').onclick=close;back.onclick=()=>{const dest=destination;if(typeof dest==='function')dest();else if(dest)navigate(dest);};
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const list=[...panel.querySelectorAll('button')];const i=list.indexOf(document.activeElement);e.preventDefault();list[(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();}});
  function setBack(dest,audio=false){destination=dest;back.hidden=!dest;back.classList.toggle('above-audio',audio);}
  window.setInterval(()=>{
    if(!window.HMANELegacy)return;
    const info=HMANELegacy.state();const active=window.Chapter3?.active;
    const verdict=parseFloat(getComputedStyle(document.querySelector('#answer')).opacity)>.05||document.querySelector('#c3-verdict:not([hidden])');root.style.visibility=verdict?'hidden':'visible';
    const ch=active?3:info.beat>=20?2:1;root.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',+b.dataset.chapter===ch?'true':'false'));
    if(active)return;
    const map={4:'?beat=2',5:'?beat=4',6:'?beat=5',27:'?beat=6',28:'?ch2=7',29:'?ch2=8',30:'?ch2=9'};
    const stable=info.beat!==30||[...document.querySelectorAll('.c2-btn')].some(b=>+getComputedStyle(b).opacity>.9);
    setBack(stable?map[info.beat]:null,info.beat===28);
  },100);
  return {setBack,navigate,close};
})();

document.addEventListener("visibilitychange",()=>{if(document.hidden)HMANEClock.pause("hidden");else HMANEClock.resume("hidden");});
