import { threatProfiles } from '../content/profiles.js';
import { eventsCatalog } from '../content/events.js';
import { interceptors } from '../content/missiles.js';

const RADAR_RANGE = 90000;
const CITY = { x:0, y:0 };

function rand(a,b){ return a + Math.random()*(b-a); }
function choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

export class World{
  constructor(seed){
    this.seed = seed || Date.now();
    this.time = 0;
    this.targets = [];
    this.missiles = [];
    this.events = [];
    this.settings = { radarMode:'balanced', difficulty:'EASY' };
    this.spawnTimer = 0;
    this.eventTimer = 6;
  }
  init(settings){ this.settings = { ...this.settings, ...settings }; }
  reset(seed){ this.seed = seed || Date.now(); this.time=0; this.targets=[]; this.missiles=[]; this.events=[]; }

  step(dt){
    this.time += dt;
    this.updateEvents(dt);
    this.spawnTimer -= dt;
    if(this.spawnTimer<=0) this.spawnWave();
    this.targets.forEach(t=>this.updateTarget(t,dt));
    this.targets = this.targets.filter(t=>!t.done);
    this.updateMissiles(dt);
  }

  updateEvents(dt){
    this.eventTimer -= dt;
    if(this.eventTimer<=0){
      const ev = this.pickEvent();
      if(ev){
        const duration = rand(ev.duration[0], ev.duration[1]);
        this.events.push({ ...ev, ttl: duration });
      }
      this.eventTimer = rand(15, 28);
    }
    this.events.forEach(e=>{ e.ttl -= dt; });
    this.events = this.events.filter(e=>e.ttl>0);
  }

  pickEvent(){
    const total = eventsCatalog.reduce((s,e)=>s+e.weight,0);
    let r = Math.random()*total;
    for(const e of eventsCatalog){
      r -= e.weight;
      if(r<=0) return e;
    }
    return eventsCatalog[0];
  }

  spawnWave(){
    const diff = this.settings.difficulty==='NORMAL'?1.1:1;
    const count = Math.max(1, Math.round(rand(1,3)*diff));
    for(let i=0;i<count;i++){
      const profile = this.pickProfile();
      this.targets.push(this.createTarget(profile));
    }
    this.spawnTimer = rand(8,14)/diff;
  }

  pickProfile(){
    const roll = Math.random();
    if(roll>0.92) return threatProfiles.find(p=>p.id==='hyper');
    if(roll>0.75) return choice(threatProfiles.filter(p=>['cruise','fast-uav','glider'].includes(p.id)));
    return choice(threatProfiles.filter(p=>p.id!=='hyper'));
  }

  createTarget(profile){
    const heading = rand(-Math.PI, Math.PI);
    const dist = rand(45000, RADAR_RANGE-2000);
    const pos = [Math.cos(heading)*dist, Math.sin(heading)*dist];
    const speed = rand(...profile.speed);
    const altitude = rand(...profile.altitude);
    const targetHeading = Math.atan2(-pos[1], -pos[0]);
    const segment = { type:'line', duration: rand(8,18), targetHeading };
    const uid = Math.random().toString(36).slice(2,7);
    return {
      uid, profile: profile.id, name: profile.name,
      pos, speed, altitude, heading, targetHeading,
      signature: rand(...profile.signature),
      danger: profile.danger,
      quality: 0.25,
      classification: null,
      age:0,
      behavior: profile.behavior,
      segment,
      accel:0,
      turnRate: profile.maneuver.turnRate * Math.PI/180,
    };
  }

  updateTarget(t,dt){
    t.age += dt;
    this.updateSegment(t,dt);
    const desiredHeading = t.targetHeading;
    const diff = normalizeAngle(desiredHeading - t.heading);
    const maxTurn = t.turnRate*dt;
    if(Math.abs(diff)>maxTurn){ t.heading += Math.sign(diff)*maxTurn; } else { t.heading = desiredHeading; }
    const accelLimit =  t.accel || (5+Math.random()*2);
    const desiredSpeed = clamp(t.speed + rand(-1,1)*accelLimit, t.speed-accelLimit, t.speed+accelLimit);
    t.speed = clamp(desiredSpeed, Math.min(...threatProfiles.find(p=>p.id===t.profile).speed), Math.max(...threatProfiles.find(p=>p.id===t.profile).speed));
    const vx = Math.cos(t.heading)*t.speed/3.6;
    const vy = Math.sin(t.heading)*t.speed/3.6;
    t.pos[0] += vx*dt;
    t.pos[1] += vy*dt;
    t.altitude = clamp(t.altitude + rand(-0.05,0.05)*dt, 0.1, 6);
    t.dist = Math.hypot(t.pos[0]-CITY.x, t.pos[1]-CITY.y)/1000;
    t.inbound = Math.cos(t.heading - Math.atan2(-t.pos[1], -t.pos[0]))>0.4;
    t.quality = clamp(t.quality + 0.2*dt - 0.005*(this.targets.length/5), 0, 1);
    if(t.dist<1){ t.done=true; }
  }

  updateSegment(t,dt){
    t.segment.duration -= dt;
    if(t.segment.duration<=0){
      const p = threatProfiles.find(p=>p.id===t.profile);
      if(t.behavior==='descent') t.altitude = Math.max(0.2, t.altitude-0.05);
      const targetHeading = Math.atan2(-t.pos[1], -t.pos[0]);
      t.segment = { type:'line', duration: rand(6,16), targetHeading: targetHeading + rand(-0.25,0.25) };
      if(p.behavior==='burst' && Math.random()>0.5){ t.speed = Math.max(t.speed, Math.max(...p.speed)); }
    }
  }

  updateMissiles(dt){
    this.missiles.forEach(m=>{ m.ttl-=dt; if(m.ttl<=0) m.done=true;});
    this.missiles = this.missiles.filter(m=>!m.done);
  }

  launch(uid, interceptType){
    const profile = interceptors.find(i=>i.id===interceptType) || interceptors[0];
    const active = this.missiles.filter(m=>m.type===profile.id).length;
    if(active>=profile.maxActive) return { ok:false, reason:'Лимит пусков' };
    this.missiles.push({ uid, type: profile.id, ttl: profile.cooldown });
    const hit = profile.hit;
    const target = this.targets.find(t=>t.uid===uid);
    if(target && target.quality>=profile.qualityReq && target.dist*1000<=profile.range*1000){
      if(Math.random()<hit){ target.done=true; return { ok:true }; }
    }
    return { ok:false, reason:'Пуск без подтверждения' };
  }

  snapshot(){
    const events = this.events.map(e=>({ id:e.id, name:e.name, ttl:e.ttl.toFixed(1), hint:e.hint }));
    const tracks = this.targets.map(t=>({
      uid: t.uid,
      profile: t.profile,
      name: t.name,
      pos:[t.pos[0], t.pos[1]],
      dist: t.dist,
      speed: t.speed,
      heading: t.heading,
      altitude: t.altitude,
      signature: t.signature,
      danger: t.danger,
      quality: t.quality,
      eta: Math.max(0, t.dist/(t.speed/3.6)/60),
      inbound: t.inbound,
      classification: t.classification,
    }));
    return { time:this.time, tracks, missiles:this.missiles, events, settings:this.settings };
  }
}

function clamp(v,a,b){ return Math.min(b, Math.max(a,v)); }
function normalizeAngle(a){ while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; return a; }
