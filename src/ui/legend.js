export function initLegend(toggleButtons){
  toggleButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const panel = document.getElementById(btn.dataset.target);
      panel.classList.toggle('collapsed');
      const body = panel.querySelector('.bd');
      if(body){ body.style.display = panel.classList.contains('collapsed') ? 'none' : 'block'; }
      btn.textContent = panel.classList.contains('collapsed') ? '▸' : '▾';
    });
  });
}
