const dangerColors = { CRITICAL:'#ff5b7a', HIGH:'#ffd36a', MED:'#22f3b6', LOW:'#8cffb1' };

export function drawTracks(ctx, center, scale, tracks){
  ctx.save();
  ctx.translate(center.x, center.y);
  for(const t of tracks){
    const x = t.pos[0]*scale;
    const y = t.pos[1]*scale;
    ctx.strokeStyle = dangerColors[t.danger] || '#22f3b6';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x + Math.cos(t.heading)*14, y + Math.sin(t.heading)*14); ctx.stroke();
    if(t.path){
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      const [px,py] = [t.pos[0]*scale, t.pos[1]*scale];
      ctx.moveTo(px,py);
      ctx.lineTo(px + Math.cos(t.heading)*t.speed*0.15, py + Math.sin(t.heading)*t.speed*0.15);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
