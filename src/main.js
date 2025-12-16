import { drawGrid } from './render/grid.js';
import { drawTracks } from './render/tracks.js';
import { initList, renderList } from './ui/list.js';
import { initLegend } from './ui/legend.js';
import { pushLog } from './ui/log.js';
import { store } from './state/store.js';
import { beep } from './audio.js';
import { interceptors } from './content/missiles.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const listDom = document.getElementById('list');
const logDom = document.getElementById('log');
const radarModeSelect = document.getElementById('radarMode');
const dotSys = document.getElementById('dotSys');
const dotThreat = document.getElementById('dotThreat');
const hint = document.getElementById('hint');

let snap = { tracks:[], events:[], time:0 };
let worker;
let center={x:0,y:0};
let scale=1/300; // meters to pixels

function setup(){
  resize();
  window.addEventListener('resize', resize);
  worker = new Worker('./src/worker/sim.worker.js', { type:'module' });
  worker.onmessage = (e)=>{ handleMessage(e.data); };
  worker.postMessage({ type:'INIT', data:{ difficulty: store.state.difficulty } });
  initList(listDom, dispatch);
  initLegend([...document.querySelectorAll('.toggle')]);
  radarModeSelect.innerHTML = ['balanced','range','low'].map(m=>`<option value="${m}">${labelMode(m)}</option>`).join('');
  radarModeSelect.addEventListener('change', ()=>{
    store.set({ radarMode: radarModeSelect.value });
    dispatch({ type:'SETTINGS_UPDATE', data:{ radarMode: radarModeSelect.value } });
  });
  document.getElementById('filterCritical').addEventListener('change', e=>{ store.setFilter('critical', e.target.checked); });
  document.getElementById('filterInbound').addEventListener('change', e=>{ store.setFilter('inbound', e.target.checked); });
  document.getElementById('filterUnknown').addEventListener('change', e=>{ store.setFilter('unknown', e.target.checked); });
  document.getElementById('btnPause').addEventListener('click', ()=>dispatch({ type:'TOGGLE_PAUSE' }));
  document.getElementById('btnClassify').addEventListener('click', ()=>commandSelected('CLASSIFY'));
  document.getElementById('btnAlert').addEventListener('click', ()=>commandSelected('ALERT'));
  document.getElementById('btnPatrol').addEventListener('click', ()=>commandSelected('ASSIGN_PATROL'));
  document.getElementById('btnIntercept').addEventListener('click', ()=>commandSelected('LAUNCH_INTERCEPT','std'));
  requestAnimationFrame(render);
}

function dispatch(msg){ worker.postMessage(msg); }

function commandSelected(type, extra){
  if(!store.state.selected) return;
  dispatch({ type:'COMMAND', data:{ type, uid: store.state.selected, interceptType: extra }});
}

function handleMessage(msg){
  if(msg.type==='STATE'){
    snap = msg.data;
    updateUI();
  }
  if(msg.type==='EVENT_LOG') pushLog(logDom, msg.items);
}

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  center = { x: canvas.width/2, y: canvas.height/2 };
}

function render(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  drawGrid(ctx, center, scale, 90000);
  drawTracks(ctx, center, scale, snap.tracks||[]);
  requestAnimationFrame(render);
}

function updateUI(){
  const metrics = { ct:0,tr:0 };
  renderList(listDom, snap.tracks||[], metrics);
  document.getElementById('ct').textContent = metrics.ct;
  document.getElementById('tr').textContent = metrics.tr;
  document.getElementById('simTime').textContent = formatTime(snap.time||0);
  document.getElementById('rng').textContent = '90';
  document.getElementById('wind').textContent = windHint();
  document.getElementById('sam').textContent = (snap.missiles||[]).length;
  document.getElementById('pat').textContent = '3';
  dotThreat.className = 'dot warn';
  if((snap.events||[]).length){
    pushLog(logDom, snap.events.map(e=>({ label:e.name, text:e.hint })));
  }
}

function windHint(){
  const gust = (snap.events||[]).find(e=>e.id==='wind-gust');
  return gust?`порывы ${(+gust.ttl).toFixed(0)}с`: 'спокойно';
}

function labelMode(m){ return m==='range'?'Дальность': m==='low'?'Низковысотный':'Сбалансированный'; }
function formatTime(t){ const h=Math.floor(t/3600); const m=Math.floor((t%3600)/60); const s=Math.floor(t%60); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }

setup();
