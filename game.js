import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
const screens = ['menu','setup','legal','game'];
const introScreen = $('introScreen');
const introVideo = $('introVideo');
const themeAudio = $('themeAudio');
let musicOn = true;
function show(id){screens.forEach(s=>$(s).classList.toggle('hidden',s!==id));}
function finishIntro(){introScreen.classList.add('hidden');show('menu');}
$('playIntroBtn').addEventListener('click', async () => {
  try { themeAudio.volume = 0.62; await themeAudio.play(); await introVideo.play(); $('playIntroBtn').textContent = '▶ INTRO PLAYING'; $('playIntroBtn').disabled = true; }
  catch (err) { $('playIntroBtn').textContent = 'TAP AGAIN TO START'; }
});
$('skipIntroBtn').addEventListener('click', async () => {
  try { themeAudio.volume = 0.62; await themeAudio.play(); } catch (err) {}
  introVideo.pause(); finishIntro();
});
introVideo.addEventListener('ended', finishIntro);
$('soundBtn').addEventListener('click', () => {
  musicOn = !musicOn; themeAudio.muted = !musicOn;
  $('soundBtn').textContent = musicOn ? '🔊 MUSIC ON' : '🔇 MUSIC OFF';
  $('soundBtn').setAttribute('aria-label', musicOn ? 'Mute music' : 'Enable music');
});
const legal = {
 terms: `<h3>Entertainment and Political Disclaimer</h3><p>SANSAD FIGHT is a fictional game created purely for entertainment and humour. It is not intended to insult, disrespect, defame, target or hurt any political party, leader, public figure, community or individual.</p><p>Any characters or situations inspired by public figures are fictional, exaggerated and presented in a gaming context. The game does not promote, support or oppose any political party, ideology or organisation. Please do not take this game seriously.</p><p>This is an independent project and is not affiliated with, endorsed by or officially connected to any political party or government organisation.</p><h3>Use of the Game</h3><p>Do not use the game to harass, threaten or target real people. All battles are fictional cartoon gameplay. Game content may be updated as development continues.</p><h3>Ownership</h3><p>Original game code, branding, artwork and audio belong to their respective creators or licensors. Third-party assets remain subject to their own licences.</p><h3>Disclaimer</h3><p>The game is provided for entertainment. Availability and performance may vary by device and browser.</p>`,
 privacy: `<h3>Privacy Policy — Prototype</h3><p>This early browser prototype does not ask you to create an account and does not intentionally collect personal information or send gameplay data to a game server.</p><p>The Instagram link opens Instagram externally. That service has its own privacy policy. GitHub Pages and your browser may process basic technical information as part of hosting and loading this website.</p><p>If future versions add accounts, analytics, online play or other data collection, this policy must be updated before those features launch.</p><p>Contact the developer through the published project channel for privacy questions.</p>`
};
$('startBtn').onclick=()=>show('setup');
$('termsBtn').onclick=()=>openLegal('TERMS & CONDITIONS',legal.terms);
$('privacyBtn').onclick=()=>openLegal('PRIVACY POLICY',legal.privacy);
$('creditsBtn').onclick=()=>openLegal('CREDITS',`<p><b>SANSAD FIGHT</b><br>Created and developed by Mohd Jaun Rizvi<br>Instagram: @jaunrizviii</p><p>Independent fictional parody game. Not affiliated with any political organisation.</p>`);
function openLegal(title,html){$('legalTitle').textContent=title;$('legalText').innerHTML=html;show('legal')}
$('legalBack').onclick=()=>show('menu');$('backBtn').onclick=()=>show('menu');
$('mode').onchange=()=>{$('movehint').textContent=$('mode').value==='local'?'P1: A/D · W jump · F punch · G kick | P2: ←/→ · ↑ jump · K punch · L kick':'P1: A/D move · W jump · F punch · G kick'};
let scene,camera,renderer,clock, fighters=[],keys={},running=false,timeLeft=99,arenaFloor,raf,mode='cpu';
function makeFighter(x,color,name){
 const group=new THREE.Group();
 const mat=new THREE.MeshStandardMaterial({color,roughness:.72});
 const skin=new THREE.MeshStandardMaterial({color:0xd69b72});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.72,5,10),mat);body.position.y=1.15;group.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),skin);head.position.y=1.95;group.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.35,14,8),new THREE.MeshStandardMaterial({color:0x29201b}));hair.scale.y=.55;hair.position.set(0,2.12,0);group.add(hair);
 for(let s of [-1,1]){let leg=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.48,4,8),mat);leg.position.set(s*.2,.35,0);group.add(leg);let arm=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.48,4,8),skin);arm.position.set(s*.48,1.25,0);arm.rotation.z=s*.25;group.add(arm);}
 group.position.x=x;group.userData={name,hp:100,attack:0,vy:0,ground:true,baseColor:color};scene.add(group);return group;
}
function startGame(){
 mode=$('mode').value;try{if(musicOn){themeAudio.play().catch(()=>{});}}catch(e){}timeLeft=99;$('timer').textContent='99';$('result').classList.add('hidden');
 $('name1').textContent=$('fighter1').value.toUpperCase();$('name2').textContent=(mode==='cpu'?'CPU: ':'P2: ')+$('fighter2').value.toUpperCase();
 if(renderer){cancelAnimationFrame(raf);renderer.dispose();$('stage').innerHTML='';}
 scene=new THREE.Scene();scene.background=new THREE.Color(0x9ac8e9);scene.fog=new THREE.Fog(0x9ac8e9,18,45);
 camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.set(0,5.2,11);camera.lookAt(0,1.1,0);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('stage').appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0x667080,2));
 let sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-4,9,6);sun.castShadow=true;scene.add(sun);
 const floorMat=new THREE.MeshStandardMaterial({color:0x777d82,roughness:1});
 arenaFloor=new THREE.Mesh(new THREE.PlaneGeometry(40,24),floorMat);arenaFloor.rotation.x=-Math.PI/2;arenaFloor.receiveShadow=true;scene.add(arenaFloor);
 const back=new THREE.Mesh(new THREE.BoxGeometry(24,5,.5),new THREE.MeshStandardMaterial({color:0xc4b18a}));back.position.set(0,2.4,-5);scene.add(back);
 for(let i=0;i<9;i++){let col=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.7,.8),new THREE.MeshStandardMaterial({color:i%2?0xe6e0d2:0x9aabbb}));col.position.set(-10+i*2.5,1.35,-4.2);scene.add(col);}
 fighters=[makeFighter(-2,0x2455a6,$('fighter1').value),makeFighter(2,0xb83a35,$('fighter2').value)];
 fighters[0].rotation.y=.25;fighters[1].rotation.y=Math.PI-.25;
 for(const f of fighters){f.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}})}
 resize();window.addEventListener('resize',resize);clock=new THREE.Clock();running=true;show('game');loop();
}
function resize(){if(!renderer||!camera)return;let w=$('stage').clientWidth,h=$('stage').clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
function damage(target,amount){target.userData.hp=Math.max(0,target.userData.hp-amount);$('health'+(target===fighters[0]?2:1)).style.width=target.userData.hp+'%';if(target.userData.hp<=0)finish(target===fighters[0]?'PLAYER 2 WINS!':'PLAYER 1 WINS!');}
function attack(index,type){if(!running)return;let f=fighters[index],enemy=fighters[1-index];let d=Math.abs(f.position.x-enemy.position.x);if(d<2.5){damage(enemy,type==='super'?22:type==='kick'?13:type==='grab'?16:9);f.position.x+=index===0?.12:-.12;}f.userData.attack=.18;}
function move(index,dir){if(!running)return;let f=fighters[index];f.position.x=THREE.MathUtils.clamp(f.position.x+dir*.13,-5,5);f.rotation.y=index===0?(dir>=0?0:Math.PI):(dir>=0?Math.PI:0);}
function jump(index){let f=fighters[index];if(f.userData.ground){f.userData.vy=.19;f.userData.ground=false;}}
function loop(){if(!running)return;raf=requestAnimationFrame(loop);let dt=Math.min(clock.getDelta(),.04);
 timeLeft-=dt;if(timeLeft<=0){timeLeft=0;finish(fighters[0].userData.hp>=fighters[1].userData.hp?'PLAYER 1 WINS!':'PLAYER 2 WINS!')} $('timer').textContent=Math.ceil(timeLeft);
 if(keys.a)move(0,-1);if(keys.d)move(0,1);if(keys.w)jump(0);if(keys.ArrowLeft)move(1,-1);if(keys.ArrowRight)move(1,1);if(keys.ArrowUp)jump(1);
 for(let i=0;i<2;i++){let f=fighters[i];if(!f.userData.ground){f.userData.vy-=.009;f.position.y+=f.userData.vy;if(f.position.y<=0){f.position.y=0;f.userData.vy=0;f.userData.ground=true;}}if(f.userData.attack>0)f.userData.attack-=dt;}
 if(mode==='cpu'&&Math.random()<.025){let cpu=fighters[1],p=fighters[0];if(Math.abs(cpu.position.x-p.position.x)>1.6)move(1,cpu.position.x>p.position.x?-1:1);else attack(1,Math.random()<.5?'punch':'kick');}
 renderer.render(scene,camera);
}
function finish(msg){running=false;$('resultText').textContent=msg;$('result').classList.remove('hidden');}
$('fightBtn').onclick=startGame;
$('exitBtn').onclick=()=>{running=false;show('menu')};
$('againBtn').onclick=startGame;$('menuBtn').onclick=()=>{running=false;show('menu')};
window.addEventListener('keydown',e=>{keys[e.key]=true;let k=e.key.toLowerCase();if(k==='f')attack(0,'punch');if(k==='g')attack(0,'kick');if(k==='h')attack(0,'grab');if(k==='j')attack(0,'super');if(e.key==='k')attack(1,'punch');if(e.key==='l')attack(1,'kick');});
window.addEventListener('keyup',e=>keys[e.key]=false);
document.querySelectorAll('[data-key]').forEach(b=>{let k=b.dataset.key==='left'?'a':b.dataset.key==='right'?'d':'w';b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();attack(0,b.dataset.action)}));
show('menu');