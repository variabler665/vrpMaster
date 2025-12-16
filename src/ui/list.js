import { store } from '../state/store.js';

const dangerOrder = { CRITICAL:0, HIGH:1, MED:2, LOW:3 };

export function initList(dom, dispatch){
  dom.addEventListener('click', e=>{
    const row = e.target.closest('.row');
    if(row){
      const uid = row.dataset.uid;
      store.set({ selected: uid });
      dispatch({ type:'COMMAND', data:{ type:'SELECT', uid }});
    }
  });
}

export function renderList(dom, tracks, metrics){
  const filters = store.state.filters;
  const sorted = [...tracks].sort((a,b)=>{
    const da = dangerOrder[a.danger] ?? 99;
    const db = dangerOrder[b.danger] ?? 99;
    if(da!==db) return da-db;
    return a.dist - b.dist;
  }).filter(t=>{
    if(filters.critical && t.danger!=='CRITICAL') return false;
    if(filters.inbound && !t.inbound) return false;
    if(filters.unknown && t.classification) return false;
    return true;
  });
  dom.innerHTML = sorted.map(t=>{
    const sel = store.state.selected===t.uid ? ' sel' : '';
    return `<div class="row${sel}" data-uid="${t.uid}">
      <div class="mono">${t.uid.slice(0,4)}</div>
      <div>
        <div>${t.name || 'Неизв.'} <span class="pill ${classPill(t.danger)}">${t.danger}</span></div>
        <div class="small">кач: ${(t.quality||0).toFixed(2)} / сигн: ${(t.signature||0).toFixed(2)} / ETA ${(t.eta||0).toFixed(1)}м</div>
      </div>
      <div class="mono">${t.dist.toFixed(1)} км</div>
      <div class="mono">${(t.speed).toFixed(0)} км/ч</div>
    </div>`;
  }).join('');
  metrics.ct = tracks.length;
  metrics.tr = tracks.filter(t=>t.track).length;
}

function classPill(d){
  if(d==='CRITICAL') return 'bad';
  if(d==='HIGH') return 'warn';
  if(d==='LOW') return 'ok';
  return '';
}
