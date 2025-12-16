const maxLines = 120;
export function pushLog(dom, items){
  if(!items?.length) return;
  const frag = document.createDocumentFragment();
  items.forEach(it=>{
    const div = document.createElement('div');
    div.className='logline';
    div.innerHTML = `<b>${it.label}</b> — ${it.text}`;
    frag.prepend(div);
  });
  dom.prepend(frag);
  while(dom.children.length>maxLines){ dom.lastChild.remove(); }
}
