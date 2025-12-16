export function beep(level){
  if(!('AudioContext' in window)) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type='triangle';
  osc.frequency.value = level==='warn'?520:340;
  gain.gain.value=0.08;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime+0.12);
}
