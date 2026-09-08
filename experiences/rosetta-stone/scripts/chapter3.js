/* Chapter 3: source artwork and curve-driven, screen-framed 3D. No camera tracking. */
window.Chapter3 = (()=>{
  const K=HMANEClock, imgPath='./assets/images/', W=()=>innerWidth,H=()=>innerHeight;
  const root=document.createElement('main');root.id='c3';root.hidden=true;
  root.innerHTML=`<div id="c3-three" hidden></div><div id="c3-return-bg" hidden style="position:absolute;inset:0;background:#000066;pointer-events:none"></div><div id="c3-frame"><img id="c3-art" alt="Rosetta Stone inscription"></div><img id="c3-second" alt="" hidden><video id="c3-movie" muted playsinline preload="auto" hidden src="./assets/video/glyph-to-3dm-video.mp4"></video><div id="c3-mask" hidden><div></div><div></div><div></div><div></div></div><div id="c3-copy"><h1 id="c3-title"></h1><p id="c3-body"></p><p id="c3-instruction" hidden>TAP THE BUTTONS TO GUESS</p><div id="c3-choices" hidden></div></div><button id="c3-next" hidden>Next</button><button id="c3-audio" hidden aria-label="Hear this sign"><img src="${imgPath}audio-icon.png" alt="">Hear this sign</button><div id="c3-notice" role="status" hidden></div><button id="c3-replay" hidden>Replay animation</button><button id="c3-hint" hidden>Hint?</button><span class="c3-hint-word" id="c3-sacred-hint" hidden>Sacred</span><span class="c3-hint-word" id="c3-writing-hint" hidden>Writing</span><button id="c3-tap" hidden aria-label="Tap the black ink"></button><button id="c3-motion" hidden>Tap to begin</button><div id="c3-verdict" role="status" hidden><img alt=""></div>`;
  document.body.append(root);
  const E=id=>document.getElementById('c3-'+id), picture=E('art'),frame=E('frame'),movie=E('movie');
  const art={sacred:'sacred-hieroglyph.jpg',stela:'stela-zoomed.jpg',line:'hieroglyphic-line.jpg',isolated:'writing-hieroglyph-isolated.png',final:'glyph-to-3d-final-frame.png'};
  const dimensions={sacred:[1708,1317],stela:[960,520],line:[4000,189],isolated:[1019,1543],final:[1149,1368]};
  const regions={writing:[982,112,1702,1198],god:[569,438,983,1164],word:[261,448,532,1164],sacred:[13,131,1002,1214],full:[13,112,1702,1214]};
  // Source references are a 4000×148 crop of the runtime line, offset down by 20 px.
  const lineInitial=[3193,20,4000,168],linePassage=[2861,20,3621,168],lineSacred=[2984,25,3588,168];
  let active=false,beat=0,token=0,rect=null,kind='stela',engine=null,loading=null,motionCleanup=()=>{},audioSource=null,askedAudio=false;
  const cache={};let data;
  const sleep=ms=>new Promise(r=>K.timeout(r,ms));
  async function tween(ms,fn){const start=K.now();return new Promise(resolve=>{function step(){const t=Math.min(1,(K.now()-start)/ms);fn(t);if(t<1)K.frame(step);else resolve();}step();});}
  const ease=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
  async function fade(el,on,ms=250){el.hidden=false;await tween(ms,t=>el.style.opacity=on?t:1-t);if(!on)el.hidden=true;}
  function bounds(el,r){Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});}
  function fit(kind,cy=.5,maxHeight=.8){const [w,h]=dimensions[kind],s=Math.min(W()/w,H()*maxHeight/h);return{x:(W()-w*s)/2,y:H()*cy-h*s/2,w:w*s,h:h*s};}
  function setArt(name,r,border=true){kind=name;rect={...r};frame.hidden=false;picture.src=imgPath+art[name];picture.style.cssText='';bounds(frame,r);frame.style.borderWidth=border?Math.max(3,W()*.012)+'px':'0';frame.style.opacity=1;}
  function setRect(r){rect={...r};bounds(frame,r);}
  async function moveRect(to,ms){const from={...rect};await tween(ms,t=>{const q=ease(t);setRect(Object.fromEntries(Object.keys(from).map(k=>[k,mix(from[k],to[k],q)])));});}
  function plateRegion(box,r=rect){const [iw,ih]=dimensions[kind];return{x:r.x+box[0]/iw*r.w,y:r.y+box[1]/ih*r.h,w:(box[2]-box[0])/iw*r.w,h:(box[3]-box[1])/ih*r.h};}
  function mask(hole){const e=E('mask');e.hidden=false;e.style.opacity=1;const r=hole||{x:0,y:0,w:0,h:0};const x=Math.max(0,r.x),y=Math.max(0,r.y),right=Math.min(W(),r.x+r.w),bottom=Math.min(H(),r.y+r.h);const regions=[{x:0,y:0,w:W(),h:y},{x:0,y:bottom,w:W(),h:H()-bottom},{x:0,y,w:x,h:Math.max(0,bottom-y)},{x:right,y,w:W()-right,h:Math.max(0,bottom-y)}];[...e.children].forEach((p,i)=>bounds(p,regions[i]));}
  function reset(){answering=false;delete root.dataset.phase;token++;K.cancel();motionCleanup();motionCleanup=()=>{};stopAudio();movie.pause();movie.onended=null;movie.onerror=null;E('three').hidden=true;E('second').hidden=true;E('second').style.opacity=1;movie.hidden=true;frame.hidden=false;E('copy').style.cssText='';E('copy').hidden=false;E('title').textContent='';E('body').textContent='';E('title').style.opacity=1;E('title').style.color='';E('title').style.fontSize='';E('return-bg').hidden=true;E('body').style.opacity=1;E('mask').hidden=true;for(const id of ['next','audio','notice','replay','hint','sacred-hint','writing-hint','tap','motion','choices','instruction','verdict']){E(id).hidden=true;E(id).onclick=null;E(id).style.opacity=1;}E('choices').replaceChildren();HMANENav.setBack(null);root.style.background='#000066';}
  async function ready(){if(loading)return loading;loading=(async()=>{await Promise.all(Object.entries(art).map(([key,name])=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{cache[key]=i;resolve();};i.onerror=()=>reject(new Error('Could not load '+name));i.src=imgPath+name;})));const response=await fetch('./assets/data/scribal-animation.json');if(!response.ok)throw Error('Animation data failed to load');data=await response.json();})();try{await loading;}catch(e){loading=null;throw e;}}
  function error(e){console.error(e);E('copy').hidden=false;E('title').textContent='Unable to load this step';E('body').textContent='Please retry. Your place in the chapter is saved.';mask();E('next').textContent='Retry';E('next').hidden=false;E('next').onclick=()=>go(beat);HMANENav.setBack(()=>go(7));}
  async function start(n=1){active=true;root.hidden=false;document.querySelector('#gate').style.display='none';window.HMANELegacy?.retire();await go(n);}
  async function go(n){reset();beat=n;root.dataset.beat=n;E('next').textContent='Next';const epoch=token;try{await ready();if(epoch!==token)return;await beats[n]();}catch(e){if(epoch===token)error(e);}}
  function next(n){E('next').hidden=false;E('next').onclick=()=>go(n);}
  function back(n,audio=false){HMANENav.setBack(typeof n==='number'?()=>go(n):n,audio);}
  function copy(title,body='',top=null,right=false){E('title').textContent=title;E('body').textContent=body;E('copy').hidden=false;const e=E('copy');e.style.top=(top??H()*.53)+'px';e.style.textAlign=right?'right':'center';if(right){const r=plateRegion(regions.writing);const edge=Math.min(W()-16,r.x+r.w);e.style.left=Math.max(16,edge-W()*.78)+'px';e.style.width=(edge-Math.max(16,edge-W()*.78))+'px';}}
  function centeredCopy(title){copy(title);E('copy').style.top='50%';E('copy').style.transform='translateY(-50%)';}
  function explainPlate(){const r=fit('sacred',.375,.35);setArt('sacred',r);return r;}
  function lineCrop(box){kind='line';const width=box[2]-box[0],height=box[3]-box[1],s=Math.min(W()/width,H()*.65/height);rect={x:(W()-width*s)/2,y:(H()-height*s)/2,w:width*s,h:height*s};bounds(frame,rect);frame.style.borderWidth=Math.max(3,W()*.012)+'px';frame.style.opacity=1;frame.hidden=false;picture.src=imgPath+art.line;Object.assign(picture.style,{width:4000*s+'px',height:189*s+'px',left:-box[0]*s+'px',top:-box[1]*s+'px'});}
  function stopAudio(){if(audioSource){try{audioSource.stop();}catch{}audioSource=null;}const a=document.querySelector('#c3-sound');if(a)a.pause();}
  async function playAudio(){const epoch=token;try{let ctx=window.HMANEAudioContext;if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();window.HMANEAudioContext=ctx;}await ctx.resume();if(!playAudio.buffer){const res=await fetch('./assets/audio/HMANE_SHEHAO.m4a');if(!res.ok)throw Error('Sound unavailable');playAudio.buffer=await ctx.decodeAudioData(await res.arrayBuffer());}if(epoch!==token)return;stopAudio();audioSource=ctx.createBufferSource();audioSource.buffer=playAudio.buffer;audioSource.connect(ctx.destination);audioSource.start();E('notice').textContent='This is the sound of the highlighted sign.'+(!askedAudio?' No sound? Check your volume and silent mode.':'');askedAudio=true;}catch(e){E('notice').textContent='Sound unavailable. Please check your connection and try again.';}if(epoch===token){E('notice').hidden=false;K.timeout(()=>E('notice').hidden=true,4000);}}
  const beats={
    async 1(){setArt('stela',window.HMANELegacy?.lastStage()||fit('stela',.2,.4));mask(plateRegion([85,45,890,473]));await sleep(1000);go(2);},
    async 2(){setArt('stela',rect||fit('stela',.2,.4));E('mask').hidden=true;await moveRect(fit('stela',.5,.4),1000);await sleep(1000);go(3);},
    async 3(){const old=fit('stela',.5,.4);setArt('stela',old);const e=E('second');e.src=imgPath+art.stela;e.hidden=false;bounds(e,old);await tween(1000,t=>{const crop=[3508,19,3773,168].map((v,i)=>mix(v,lineInitial[i],ease(t)));lineCrop(crop);const scale=rect.w/(crop[2]-crop[0]);bounds(e,{x:rect.x+(3508-crop[0])*scale,y:rect.y+(19-crop[1])*scale,w:265*scale,h:149*scale});e.style.opacity=1-t;});e.hidden=true;await sleep(1000);go(4);},
    async 4(){await tween(1000,t=>{const q=ease(t);lineCrop(lineInitial.map((v,i)=>mix(v,linePassage[i],q)));});await sleep(1000);go(5);},
    async 5(){lineCrop(linePassage);mask();await sleep(250);centeredCopy('THIS PASSAGE SAYS THAT THE ENTIRE DECREE MUST BE WRITTEN IN THREE DIFFERENT SCRIPTS: HIEROGLYPHIC, DEMOTIC, AND GREEK.');await fade(E('title'),true,500);back('?ch2=10');await sleep(750);next(6);},
    async 6(){
      // Match Chapter 2's 2.5-second exponential zoom and late, registered dissolve.
      const target=fit('sacred',.5,.72),second=E('second');
      second.src=imgPath+art.sacred;second.hidden=false;second.style.opacity=0;
      const startWidth=linePassage[2]-linePassage[0],endWidth=lineSacred[2]-lineSacred[0];
      await tween(2500,t=>{
        const width=startWidth*Math.pow(endWidth/startWidth,t),q=(startWidth-width)/(startWidth-endWidth);
        const crop=linePassage.map((v,i)=>mix(v,lineSacred[i],q));lineCrop(crop);
        // Preserve the source image for the first 60%; fade over the final second.
        const alpha=Math.max(0,(t-.6)/.4),scale=rect.w/(crop[2]-crop[0]);
        const registered={x:rect.x+(lineSacred[0]-crop[0])*scale,y:rect.y+(lineSacred[1]-crop[1])*scale,w:endWidth*scale,h:(lineSacred[3]-lineSacred[1])*scale};
        bounds(second,Object.fromEntries(Object.keys(target).map(k=>[k,mix(registered[k],target[k],ease(alpha))])));
        second.style.opacity=alpha;frame.style.opacity=1-alpha;
      });
      second.hidden=true;setArt('sacred',target);await sleep(1000);go(7);
    },
    async 7(){setArt('sacred',fit('sacred',.5,.72));await moveRect(fit('sacred',.375,.35),1000);await sleep(1000);mask(plateRegion(regions.writing));await fade(E('mask'),true,250);const r=rect;copy('WRITING','This is the hieroglyph for writing. It resembles an ancient Egyptian scribal tool.',r.y+r.h+H()*.05,true);await fade(E('title'),true,250);await fade(E('body'),true,250);back(5,true);await sleep(250);E('audio').onclick=playAudio;await fade(E('audio'),true,250);await sleep(1000);next(8);},
    async 8(){const r=fit('sacred',.375,.35);setArt('sacred',r);const hole=plateRegion(regions.writing);setArt('isolated',hole,false);root.style.background='#000025';const end=fit('isolated',.5,1);const from={...rect};await tween(1500,t=>{const q=ease(t);setRect(Object.fromEntries(Object.keys(from).map(k=>[k,mix(from[k],end[k],q)])));const c=Math.round(255*t),b=Math.round(mix(37,255,t));root.style.background=`rgb(${c},${c},${b})`;});await sleep(1000);go(9);},
    async 9(){const movieToken=token;root.style.background='#fff';frame.hidden=true;const iso=fit('isolated',.5,1);const scale=iso.w/1019*935/608;const vrect={x:iso.x+67*iso.w/1019-196*scale,y:iso.y+245*iso.h/1543-197*scale,w:928*scale,h:1104*scale};bounds(movie,vrect);movie.hidden=false;movie.currentTime=0;movie.loop=false;await new Promise(resolve=>{movie.onended=()=>{if(movieToken===token)resolve();};movie.onerror=()=>{if(movieToken===token)error(new Error('Video unavailable'));};movie.play().catch(()=>{if(movieToken!==token)return;E('motion').textContent='Play animation';E('motion').hidden=false;E('motion').onclick=()=>{E('motion').hidden=true;movie.play().catch(error);};});});movie.hidden=true;const finalScale=vrect.w/1149;setArt('final',{x:vrect.x,y:vrect.y,w:1149*finalScale,h:1368*finalScale},false);await sleep(1000);go(10);},
    async 10(){root.style.background='#D9DDDC';frame.hidden=true;E('three').hidden=false;centeredCopy('Loading scribal kit…');const pendingToken=token;await setup3D();if(pendingToken!==token)return;E('copy').hidden=true;engine.reset();engine.entranceView();engine.showSilhouette();engine.render();mask();centeredCopy('MOVE YOUR PHONE FROM RIGHT TO LEFT.');back(7);await movement();E('copy').hidden=true;E('mask').hidden=true;HMANENav.setBack(null);await engine.enter();await engine.to(2,1500,true);
      root.dataset.phase='identify';root.style.background='#ffffff';engine.background('#ffffff');
      E('mask').hidden=true;copy('EGYPTIAN SCRIBAL KIT','',Math.max(75,H()*.15));
      E('title').style.color='#000066';E('title').style.fontSize='30pt';
      await sleep(1500);
      E('copy').hidden=true;E('title').style.color='';E('title').style.fontSize='';
      root.style.background='#D9DDDC';engine.background('#D9DDDC');
      await engine.to(3,2000,false,true);await engine.to(4,1500);root.dataset.phase='ink';const hole=engine.inkRect();mask(hole);copy('TAP THE BLACK INK.','',Math.max(75,H()*.15));const tap=E('tap');bounds(tap,hole);tap.hidden=false;back(7);await new Promise(resolve=>{tap.onclick=()=>{tap.onclick=null;resolve();};});tap.hidden=true;root.dataset.phase='writing';E('copy').hidden=true;E('mask').hidden=true;HMANENav.setBack(null);await engine.to(5,1500);await engine.to(6,1500,true);for(let i=0;i<6;i++){if(i)await engine.to(6+i*2,1500);await engine.write(i);}root.dataset.phase='finished';await sleep(1000);await beats[11]();},
    async 11(){
      beat=11;root.dataset.beat=11;E('three').hidden=false;
      setArt('sacred',fit('sacred',.5,.72));frame.style.opacity=0;
      const bg=E('return-bg');bg.hidden=false;bg.style.opacity=0;
      // Freeze the completed ink and camera throughout the reveal for comparison.
      await tween(2000,t=>{frame.style.opacity=t;bg.style.opacity=t;});
      E('three').hidden=true;root.style.background='#000066';bg.hidden=true;
      await sleep(1000);go(12);
    },
    async 12(){setArt('sacred',fit('sacred',.5,.72));await moveRect(fit('sacred',.375,.35),1000);await sleep(1000);go(13);},
    async 13(){await reading('god','DIVINE','The glyph means divine.',14,7);E('replay').hidden=false;E('replay').onclick=()=>go(8);},
    async 14(){await reading('word','WORDS','The glyph means words.',15,13);},
    async 15(){await reading('sacred','SACRED','Together, these glyphs mean sacred.',16,14);},
    async 16(){const r=fit('sacred',.5,.30);r.y=Math.max(5,W()*.012);setArt('sacred',r);mask(plateRegion(regions.full));await sleep(500);copy('WHICH SCRIPT DO THESE SIGNS REFER TO?','',r.y+r.h+Math.max(54,H()*.04));await fade(E('title'),true,500);back(15);await sleep(500);E('instruction').hidden=false;E('instruction').style.opacity=0;const choices=E('choices');choices.hidden=false;for(const label of ['HIEROGLYPHIC','DEMOTIC','GREEK']){const b=document.createElement('button');b.textContent=label;b.onclick=()=>answer(label==='HIEROGLYPHIC');choices.append(b);}await fade(choices,true,500);await fade(E('instruction'),true,500);await sleep(1000);hint();}
  };
  async function reading(region,title,body,to,prev){explainPlate();mask(plateRegion(regions[region]));copy(title,body,rect.y+rect.h+H()*.035);E('body').style.opacity=0;await fade(E('title'),true,500);await sleep(500);await fade(E('body'),true,500);back(prev);await sleep(500);await fade(E('next'),true,750);E('next').onclick=()=>go(to);}
  function hint(){const e=E('hint');e.hidden=false;e.style.left=E('copy').offsetLeft+'px';e.style.top=rect.y+rect.h+2+'px';e.onclick=()=>{e.hidden=true;for(const [id,region] of [['sacred-hint','sacred'],['writing-hint','writing']]){const h=E(id),r=plateRegion(regions[region]);h.hidden=false;h.style.left=r.x+r.w/2+'px';h.style.top=rect.y+rect.h+2+'px';}};}
  let answering=false;
  async function answer(correct){if(answering)return;answering=true;E('hint').hidden=E('sacred-hint').hidden=E('writing-hint').hidden=true;const v=E('verdict');v.style.background=correct?'#63a152':'#a32a2a';v.firstChild.src=imgPath+(correct?'answer-correct.png':'answer-incorrect.png');v.firstChild.alt=correct?'Correct':'Try again';v.hidden=false;await sleep(1000);v.hidden=true;answering=false;hint();}
  async function movement(){
    E('motion').hidden=true;root.dataset.phase='motion';
    return new Promise(resolve=>{
      const epoch=token;let done=false,lastTime=null,impulse=0,samples=0,blockedUntil=0;
      const finish=()=>{if(done||K.paused||epoch!==token)return;done=true;motionCleanup();E('motion').hidden=true;E('notice').hidden=true;resolve();};
      const move=e=>{
        if(K.paused||epoch!==token){lastTime=null;impulse=0;samples=0;return;}
        const ax=e.acceleration?.x,ay=e.acceleration?.y;
        if(!Number.isFinite(ax))return;
        const angle=(screen.orientation?.angle??window.orientation??0)*Math.PI/180;
        const x=ax*Math.cos(angle)-(Number.isFinite(ay)?ay:0)*Math.sin(angle),now=K.now();
        const dt=lastTime===null?.02:Math.min(.08,(now-lastTime)/1000);lastTime=now;
        // Positive screen-X is rightward. Suppress its braking phase as well.
        if(x>.4){blockedUntil=now+650;impulse=0;samples=0;return;}
        if(now<blockedUntil)return;
        if(x<-.35){impulse+=x*dt;samples++;if(samples>=3&&impulse<-.045)finish();}
        else{impulse=0;samples=0;}
      };
      window.addEventListener('devicemotion',move);
      motionCleanup=()=>window.removeEventListener('devicemotion',move);
      const unavailable=()=>{if(epoch!==token)return;E('notice').textContent='Motion access is unavailable. Enable motion access in your browser, then try again.';E('notice').hidden=false;};
      if(typeof DeviceMotionEvent==='undefined'){unavailable();return;}
      if(typeof DeviceMotionEvent.requestPermission==='function'){
        E('motion').textContent='Enable motion';E('motion').hidden=false;
        E('motion').onclick=async()=>{
          try{const result=await DeviceMotionEvent.requestPermission();if(epoch!==token)return;
            if(result==='granted'){E('motion').hidden=true;E('notice').hidden=true;lastTime=null;impulse=0;samples=0;}
            else unavailable();
          }catch{unavailable();}
        };
      }
      // No tap-to-start or tilt shortcut: only a leftward movement completes this prompt.
    });
  }
  async function setup3D(){if(engine)return;const THREE=window.AFRAME?.THREE;if(!THREE)throw Error('3D renderer unavailable');const res=await fetch('./assets/models/scribal-implement.glb');if(!res.ok)throw Error('Scribal model unavailable');const buffer=await res.arrayBuffer(),dv=new DataView(buffer);if(dv.getUint32(0,true)!==0x46546c67)throw Error('Invalid scribal model');const jl=dv.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jl))),binary=28+jl;
    // Embedded base-color textures; retain original animation mesh indices.
    const materialMaps={};
    await Promise.all((j.materials||[]).map(async (material,index)=>{
      const info=material.pbrMetallicRoughness?.baseColorTexture;if(!info)return;
      const textureDef=j.textures?.[info.index],source=j.images?.[textureDef?.source];
      if(source?.bufferView===undefined)throw Error('Embedded scribal texture missing');
      const view=j.bufferViews[source.bufferView];
      const url=URL.createObjectURL(new Blob([new Uint8Array(buffer,binary+(view.byteOffset||0),view.byteLength)],{type:source.mimeType||'image/png'}));
      let map;try{map=await new Promise((resolve,reject)=>new THREE.TextureLoader().load(url,resolve,undefined,()=>reject(Error('Scribal texture failed to load'))));}finally{URL.revokeObjectURL(url);}
      map.flipY=false;if('colorSpace' in map)map.colorSpace=THREE.SRGBColorSpace;else map.encoding=THREE.sRGBEncoding;
      const sampler=j.samplers?.[textureDef.sampler]||{};
      const wrap={33071:THREE.ClampToEdgeWrapping,33648:THREE.MirroredRepeatWrapping,10497:THREE.RepeatWrapping};
      const filter={9728:THREE.NearestFilter,9729:THREE.LinearFilter,9984:THREE.NearestMipmapNearestFilter,9985:THREE.LinearMipmapNearestFilter,9986:THREE.NearestMipmapLinearFilter,9987:THREE.LinearMipmapLinearFilter};
      map.wrapS=wrap[sampler.wrapS??10497];map.wrapT=wrap[sampler.wrapT??10497];
      if(sampler.magFilter!==undefined)map.magFilter=filter[sampler.magFilter];
      if(sampler.minFilter!==undefined)map.minFilter=filter[sampler.minFilter];
      const transform=info.extensions?.KHR_texture_transform;
      if(transform){if(transform.offset)map.offset.fromArray(transform.offset);if(transform.scale)map.repeat.fromArray(transform.scale);map.rotation=transform.rotation||0;}
      map.needsUpdate=true;materialMaps[index]=map;
    }));
    const renderer=new THREE.WebGLRenderer({alpha:false,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(W(),H());if('outputColorSpace' in renderer)renderer.outputColorSpace=THREE.SRGBColorSpace;E('three').replaceChildren(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#D9DDDC');scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2));const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(4,3,-3);scene.add(light);
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,30);camera.up.set(0,1,0);const groups={};for(const part of Object.keys(data.pivots)){groups[part]=new THREE.Group();scene.add(groups[part]);}
    const types={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array,5122:Int16Array};
    function accessor(index){const a=j.accessors[index],v=j.bufferViews[a.bufferView],Type=types[a.componentType],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],offset=binary+(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||n*Type.BYTES_PER_ELEMENT;let arr;if(stride===n*Type.BYTES_PER_ELEMENT)arr=new Type(buffer,offset,a.count*n).slice();else{arr=new Type(a.count*n);for(let i=0;i<a.count;i++)arr.set(new Type(buffer,offset+i*stride,n),i*n);}return new THREE.BufferAttribute(arr,n,a.normalized||false);}
    j.meshes.forEach((m,i)=>{const part=data.parts[i];if(!part)return;for(const p of m.primitives){if(p.mode!==undefined&&p.mode!==4)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',accessor(p.attributes.POSITION));if(p.attributes.NORMAL!==undefined)g.setAttribute('normal',accessor(p.attributes.NORMAL));if(p.attributes.TEXCOORD_0!==undefined)g.setAttribute('uv',accessor(p.attributes.TEXCOORD_0));if(p.indices!==undefined)g.setIndex(accessor(p.indices));if(!g.attributes.normal)g.computeVertexNormals();const pivot=data.pivots[part];g.translate(-pivot[0],-pivot[1],-pivot[2]);const mat=j.materials?.[p.material]?.pbrMetallicRoughness||{},color=mat.baseColorFactor||(materialMaps[p.material]?[1,1,1,1]:[.55,.4,.22,1]);const material=new THREE.MeshStandardMaterial({map:materialMaps[p.material]||null,color:new THREE.Color(color[0],color[1],color[2]),roughness:mat.roughnessFactor??.8,metalness:mat.metallicFactor??0,side:THREE.DoubleSide});if(part==='silhouette'){material.color.set('#111111');material.roughness=1;}groups[part].add(new THREE.Mesh(g,material));}});
    const inkGroup=new THREE.Group();scene.add(inkGroup);let current=1,view={cy:0,cz:0,height:1.4},savedEntrance=null;
    let renderW=W(),renderH=H();const render=()=>{if(renderW!==W()||renderH!==H()){renderW=W();renderH=H();renderer.setSize(W(),H(),false);}const h=view.height,w=h*W()/H();camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.position.set(5,view.cy,view.cz);camera.lookAt(0,view.cy,view.cz);camera.updateProjectionMatrix();camera.updateMatrixWorld();scene.updateMatrixWorld(true);renderer.render(scene,camera);};
    function apply(f){for(const [part,g] of Object.entries(groups)){const pose=f[part];if(!pose)continue;g.quaternion.fromArray(pose.q);g.position.fromArray(pose.pivot);}}
    function writingView(){const r=fit('sacred',.5,.72);const span=.745,worldHeight=span*H()/r.w;return{height:worldHeight,cy:.214-(.5-(r.y+1317*.18*r.h/1317)/H())*worldHeight,cz:.509+(r.x+r.w*.025-W()/2)/r.w*span};}
    function fullView(){return{height:2.4,cy:.66,cz:.17};}
    engine={render,background(color){scene.background.set(color);render();},
      reset(){scene.background.set('#D9DDDC');current=1;apply(data.frames['1']);inkGroup.children.slice().forEach(o=>{inkGroup.remove(o);o.geometry.dispose();o.material.dispose();});for(const [p,g] of Object.entries(groups))g.visible=p!=='silhouette';},
      entranceView(){groups.silhouette.visible=true;apply(data.frames['1']);const box=new THREE.Box3().setFromObject(groups.silhouette),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const r=rect||fit('final',.5,1),inkH=r.h*(1250-124)/1368,inkX=r.x+r.w*(237+863)/2/1149,inkY=r.y+r.h*(124+1250)/2/1368;const h=size.y*H()/inkH;view={height:h,cy:center.y-(.5-inkY/H())*h,cz:center.z+(inkX/W()-.5)*h*W()/H()};savedEntrance={...view};},
      showSilhouette(){for(const [p,g] of Object.entries(groups))g.visible=p==='silhouette';},
      async enter(){const f=data.frames['1'];for(const g of Object.values(groups))g.visible=true;const offset=view.height*W()/H()+.7;await tween(1500,t=>{apply(f);for(const [part,g] of Object.entries(groups))if(part!=='silhouette')g.position.z+=offset*(1-ease(t));render();});groups.silhouette.visible=false;current=1;},
      async to(k,duration,changeView=false,spin=false){const f0=data.frames[current],f1=data.frames[k],v0={...view},v1=k===6?writingView():fullView();await tween(duration,t=>{const q=ease(t);for(const [part,g] of Object.entries(groups)){if(part==='silhouette')continue;const a=f0[part],b=f1[part];if(!a||!b)continue;g.position.fromArray(a.pivot).lerp(new THREE.Vector3().fromArray(b.pivot),q);g.quaternion.fromArray(a.q).slerp(new THREE.Quaternion().fromArray(b.q),q);if(spin&&part==='lid')g.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),6*Math.PI*t));}if(changeView)for(const key of Object.keys(view))view[key]=mix(v0[key],v1[key],q);render();});current=k;},
      inkRect(){render();const p=new THREE.Vector3().fromArray(data.baseInk).sub(new THREE.Vector3().fromArray(data.pivots.palette));groups.palette.localToWorld(p);p.project(camera);const size=Math.max(50,Math.min(100,W()*.13));return{x:(p.x+1)*W()/2-size/2,y:(1-p.y)*H()/2-size/2,w:size,h:size};},
      async write(index){const pts=data.strokes[index].points.map(p=>new THREE.Vector3().fromArray(p));const curve=new THREE.Curve();curve.getPoint=t=>{const v=t*(pts.length-1),i=Math.min(pts.length-2,Math.floor(v));return pts[i].clone().lerp(pts[i+1],v-i);};const geom=new THREE.TubeGeometry(curve,256,.0036,6,false),mesh=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({color:0x080808}));geom.setDrawRange(0,0);inkGroup.add(mesh);const start=6+index*2,pose=data.frames[start],nib=new THREE.Vector3().fromArray(data.baseNib).sub(new THREE.Vector3().fromArray(data.pivots.stylus)).applyQuaternion(new THREE.Quaternion().fromArray(pose.stylus.q));await tween(1000,t=>{const point=curve.getPoint(t);groups.stylus.quaternion.fromArray(pose.stylus.q);groups.stylus.position.copy(point).sub(nib);geom.setDrawRange(0,Math.floor(t*256)*6*6);render();});current=start+1;},
      resize(){render();}
    };
  }
  window.addEventListener('resize',()=>{if(!active)return;if(beat===10)engine?.resize();else if([5,7,13,14,15,16].includes(beat))go(beat);});
  return {start,get active(){return active;},get beat(){return beat;}};
})();
