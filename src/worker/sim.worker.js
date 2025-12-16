import { World } from '../sim/world.js';

let world = new World();
let lastSend = 0;
let paused = false;

self.onmessage = (e)=>{
  const { type, data } = e.data;
  if(type==='INIT'){ world.init(data); }
  if(type==='RESET'){ world.reset(data?.seed); }
  if(type==='SETTINGS_UPDATE'){ world.init(data); }
  if(type==='COMMAND') handleCommand(data);
  if(type==='TOGGLE_PAUSE') paused=!paused;
};

function handleCommand(cmd){
  if(cmd.type==='LAUNCH_INTERCEPT'){ const res = world.launch(cmd.uid, cmd.interceptType); postMessage({ type:'EVENT_LOG', items:[{ label:'PVO', text: res.ok?'Пуск успешен':'Пуск спорный: '+(res.reason||'—') }] }); }
}

let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-last)/1000);
  last = now;
  if(!paused){
    let steps = Math.max(1, Math.floor(dt/0.02));
    for(let i=0;i<steps;i++) world.step(0.02);
    lastSend += dt;
    if(lastSend>0.08){
      postMessage({ type:'STATE', data: world.snapshot() });
      lastSend=0;
    }
  }
  setTimeout(()=>loop(performance.now()), 0);
}
loop(performance.now());
