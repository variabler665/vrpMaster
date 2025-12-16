export function drawGrid(ctx, center, scale, radius){
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.strokeStyle = '#0f2a26';
  ctx.lineWidth = 1;
  for(let r=1000; r<radius; r+=1000){
    ctx.beginPath(); ctx.arc(0,0,r*scale,0,Math.PI*2); ctx.stroke();
  }
  ctx.strokeStyle = '#123a33';
  for(let ang=0; ang<360; ang+=15){
    const rad = ang*Math.PI/180;
    const x = Math.cos(rad)*radius*scale;
    const y = Math.sin(rad)*radius*scale;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(x,y); ctx.stroke();
  }
  ctx.restore();
}
