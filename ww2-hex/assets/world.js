/* Landfall: WWII - world builder.
   Turns a land/sea raster (hand-traced default map OR a random one) into a graph of
   territories (land zones) and sea zones. The world wraps left <-> right.
   Pure JS, no DOM: works in a browser (window.LFWorld) and in node (module.exports). */
(function(root){
'use strict';

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// ---------------------------------------------------------------- binary heap
function hpush(h,k,v){ let i=h.k.length; h.k.push(k); h.v.push(v); while(i>0){ const p=(i-1)>>1; if(h.k[p]<=k) break; h.k[i]=h.k[p]; h.v[i]=h.v[p]; i=p; } h.k[i]=k; h.v[i]=v; }
function hpop(h){ h.rk=h.k[0]; h.rv=h.v[0]; const lk=h.k.pop(), lv=h.v.pop(), n=h.k.length;
  if(n>0){ let i=0; for(;;){ let c=2*i+1; if(c>=n) break; if(c+1<n&&h.k[c+1]<h.k[c]) c++; if(h.k[c]>=lk) break; h.k[i]=h.k[c]; h.v[i]=h.v[c]; i=c; } h.k[i]=lk; h.v[i]=lv; } }

// ---------------------------------------------------------------- raster helpers (x wraps, y does not)
function decodeRLE(W,H,s){
  const out=new Uint8Array(W*H); let p=0; const re=/([a-g])(\d+)/g; let m;
  while((m=re.exec(s))){ const v=m[1].charCodeAt(0)-97, n=+m[2]; out.fill(v,p,p+n); p+=n; }
  return out;
}
// geodesic (Dijkstra) flood fill. Seeds compete; stepping onto a cell of another colour class costs extra.
function flood(W,H,pass,cellCls,seeds,penalty){
  const N=W*H, dist=new Float64Array(N).fill(Infinity), zid=new Int16Array(N).fill(-1), zcls={}, h={k:[],v:[]};
  for(const s of seeds){ const c=s.y*W+s.x; if(dist[c]>0){ dist[c]=0; zid[c]=s.zone; zcls[s.zone]=s.cls; hpush(h,0,c); } }
  while(h.k.length){
    hpop(h); const d=h.rk, c=h.rv; if(d>dist[c]) continue;
    const x=c%W, y=(c-x)/W, zone=zid[c], cl=zcls[zone];
    for(let dy=-1;dy<=1;dy++){ const ny=y+dy; if(ny<0||ny>=H) continue;
      for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue;
        const nx=(x+dx+W)%W, nc=ny*W+nx; if(!pass[nc]) continue;
        let step=(dx&&dy)?1.4142:1; if(penalty&&cellCls[nc]!==cl) step+=penalty;
        const nd=d+step; if(nd<dist[nc]){ dist[nc]=nd; zid[nc]=zone; hpush(h,nd,nc); } } }
  }
  return zid;
}
function snap(W,H,pass,x,y,maxR){ // nearest passable cell to (x,y)
  x=Math.max(0,Math.min(W-1,Math.round(x))); y=Math.max(0,Math.min(H-1,Math.round(y)));
  if(pass[y*W+x]) return [x,y];
  for(let r=1;r<=maxR;r++){ let best=null,bd=1e9;
    for(let dy=-r;dy<=r;dy++){ const ny=y+dy; if(ny<0||ny>=H) continue;
      for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue; const nx=(x+dx+W)%W; if(pass[ny*W+nx]){ const d=dx*dx+dy*dy; if(d<bd){ bd=d; best=[nx,ny]; } } } }
    if(best) return best; }
  return null;
}
function components(W,H,mask){ // 4-connected, wraps in x. returns array of Int32Array cell lists
  const seen=new Uint8Array(W*H), comps=[];
  for(let s=0;s<W*H;s++){ if(!mask[s]||seen[s]) continue; const st=[s], cells=[]; seen[s]=1;
    while(st.length){ const c=st.pop(); cells.push(c); const x=c%W, y=(c-x)/W;
      const nb=[y*W+(x+1)%W, y*W+(x+W-1)%W]; if(y>0) nb.push(c-W); if(y<H-1) nb.push(c+W);
      for(const n of nb) if(mask[n]&&!seen[n]){ seen[n]=1; st.push(n); } }
    comps.push(Int32Array.from(cells)); }
  return comps;
}
const wrapD=(d,W)=>{ if(d>W/2) return d-W; if(d<-W/2) return d+W; return d; };

// ---------------------------------------------------------------- assemble a world from a zone-id raster
// zones: [{kind:'land'|'sea', name, ...extra}]  zid: Int16Array  land: Uint8Array(0/1)  links:[[nameA,nameB]]
function assemble(W,H,zid,zones,land,links,cuts){
  const N=W*H;
  // drop zones with no cells, re-index
  const cnt=new Int32Array(zones.length); for(let i=0;i<N;i++) if(zid[i]>=0) cnt[zid[i]]++;
  const remap=new Int16Array(zones.length).fill(-1); const Z=[];
  zones.forEach((z,i)=>{ if(cnt[i]>0){ remap[i]=Z.length; Z.push(Object.assign({},z,{id:Z.length})); } });
  for(let i=0;i<N;i++) if(zid[i]>=0) zid[i]=remap[zid[i]];
  const NZ=Z.length;
  // any still-unlabelled cell: nearest labelled neighbour (BFS)
  { const q=[]; for(let i=0;i<N;i++) if(zid[i]>=0) q.push(i);
    for(let qi=0;qi<q.length;qi++){ const c=q[qi], x=c%W, y=(c-x)/W; const nb=[y*W+(x+1)%W, y*W+(x+W-1)%W]; if(y>0) nb.push(c-W); if(y<H-1) nb.push(c+W);
      for(const n of nb) if(zid[n]<0){ zid[n]=zid[c]; q.push(n); } } }
  // cells per zone
  const lists=Z.map(()=>[]); for(let i=0;i<N;i++) lists[zid[i]].push(i);
  Z.forEach((z,i)=>{ z.cells=Int32Array.from(lists[i]); z.area=z.cells.length; });
  // circular-mean x, unwrapped bbox, centroid
  for(const z of Z){
    let sx=0,sy=0,cy=0; for(const c of z.cells){ const x=c%W; const a=x/W*2*Math.PI; sx+=Math.cos(a); sy+=Math.sin(a); cy+=(c-x)/W; }
    let ref=Math.atan2(sy,sx)/(2*Math.PI)*W; if(ref<0) ref+=W;
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,mx=0;
    for(const c of z.cells){ const x=c%W, y=(c-x)/W, ux=ref+wrapD(x-ref,W); if(ux<x0)x0=ux; if(ux>x1)x1=ux; if(y<y0)y0=y; if(y>y1)y1=y; mx+=ux; }
    z.bx0=Math.floor(x0); z.bx1=Math.floor(x1); z.by0=y0; z.by1=y1; z.cx=mx/z.cells.length; z.cy=cy/z.cells.length; z.ref=ref;
  }
  // distance to nearest zone border (for anchors)
  const bd=new Int16Array(N).fill(-1), q=[];
  for(let i=0;i<N;i++){ const x=i%W, y=(i-x)/W, z=zid[i];
    const r=y*W+(x+1)%W, l=y*W+(x+W-1)%W; let b=zid[r]!==z||zid[l]!==z; if(!b&&y>0) b=zid[i-W]!==z; if(!b&&y<H-1) b=zid[i+W]!==z;
    if(b){ bd[i]=0; q.push(i); } }
  for(let qi=0;qi<q.length;qi++){ const c=q[qi], x=c%W, y=(c-x)/W; const nb=[y*W+(x+1)%W, y*W+(x+W-1)%W]; if(y>0) nb.push(c-W); if(y<H-1) nb.push(c+W);
    for(const n of nb) if(bd[n]<0){ bd[n]=bd[c]+1; q.push(n); } }
  for(const z of Z){ let best=-1,bs=-1e9;
    for(const c of z.cells){ const x=c%W, y=(c-x)/W, ux=z.ref+wrapD(x-z.ref,W); const s=bd[c]*100-((ux-z.cx)**2+(y-z.cy)**2)*0.01; if(s>bs){ bs=s; best=c; } }
    const ax=best%W, ay=(best-ax)/W; z.ax=ax; z.ay=ay; z.depth=bd[best]; }
  // adjacency by shared cell edges (4-neighbourhood)
  const adjSet=Z.map(()=>new Map());
  const link=(a,b,w)=>{ if(a===b) return; adjSet[a].set(b,(adjSet[a].get(b)||0)+w); adjSet[b].set(a,(adjSet[b].get(a)||0)+w); };
  for(let i=0;i<N;i++){ const x=i%W, y=(i-x)/W, z=zid[i]; const r=zid[y*W+(x+1)%W]; if(r!==z) link(z,r,1); if(y<H-1){ const d=zid[i+W]; if(d!==z) link(z,d,1); } }
  const byName={}; Z.forEach(z=>{ byName[z.name]=z.id; });
  for(const [a,b] of (links||[])){ if(byName[a]===undefined||byName[b]===undefined) continue; link(byName[a],byName[b],1); }
  for(const [a,b] of (cuts||[])){ if(byName[a]===undefined||byName[b]===undefined) continue; adjSet[byName[a]].delete(byName[b]); adjSet[byName[b]].delete(byName[a]); }
  Z.forEach((z,i)=>{ z.adj=[...adjSet[i].keys()].sort((p,q2)=>p-q2); z.border=adjSet[i]; });
  Z.forEach(z=>{ z.seaAdj=z.adj.filter(n=>Z[n].kind==='sea'); z.coastal=z.kind==='land'&&z.seaAdj.length>0; });
  // all-pairs hop distance
  const dist=new Uint8Array(NZ*NZ).fill(255);
  for(let s=0;s<NZ;s++){ const d=dist.subarray(s*NZ,(s+1)*NZ); d[s]=0; const qq=[s];
    for(let qi=0;qi<qq.length;qi++){ const c=qq[qi]; for(const n of Z[c].adj) if(d[n]===255){ d[n]=d[c]+1; qq.push(n); } } }
  return {W,H,NZ,Z,zid,land,dist,byName};
}

// ---------------------------------------------------------------- DEFAULT WORLD (hand traced from the painted board)
function buildDefault(D){
  const W=D.W,H=D.H,N=W*H;
  const cls=decodeRLE(W,H,D.rle);
  const sx=(x)=>(x-D.src.x0)/D.src.s, sy=(y)=>(y-D.src.y0)/D.src.s;
  const zones=[];
  D.land.forEach(l=>zones.push({kind:'land',name:l.n,terr:l.t||'P',val:l.val,owner:l.own,cap:l.cap===undefined?-1:l.cap,cls:l.c,sx:l.x,sy:l.y,more:l.more||[]}));
  const nLand=zones.length;
  D.sea.forEach(s=>zones.push({kind:'sea',name:s.n,terr:'S',val:0,owner:-1,cap:-1,cls:0,sx:s.x,sy:s.y}));
  // forced island blobs
  const forced=new Int16Array(N).fill(-1);
  for(const b of (D.blobs||[])){ const zi=zones.findIndex(z=>z.name===b.z); if(zi<0) continue;
    for(const [bx,by,rx,ry] of b.e){ const cx=sx(bx), cy=sy(by), rX=Math.max(1.5,rx/D.src.s), rY=Math.max(1.5,ry/D.src.s);
      for(let y=Math.floor(cy-rY-1);y<=Math.ceil(cy+rY+1);y++) for(let x=Math.floor(cx-rX-1);x<=Math.ceil(cx+rX+1);x++){
        if(y<0||y>=H||x<0||x>=W) continue; const dx=(x-cx)/rX, dy=(y-cy)/rY; if(dx*dx+dy*dy<=1){ const c=y*W+x; cls[c]=zones[zi].cls||6; forced[c]=zi; } } } }
  // land flood
  const landPass=new Uint8Array(N); for(let i=0;i<N;i++) landPass[i]=cls[i]!==0?1:0;
  const seeds=[];
  for(let i=0;i<nLand;i++){ const z=zones[i];
    for(const [px,py] of [[z.sx,z.sy]].concat(z.more)){ const p=snap(W,H,landPass,sx(px),sy(py),30); if(!p){ console.warn('no land near seed',z.name); continue; } seeds.push({x:p[0],y:p[1],zone:i,cls:z.cls}); } }
  let zid=flood(W,H,landPass,cls,seeds,8);
  for(let i=0;i<N;i++) if(forced[i]>=0) zid[i]=forced[i];
  // stray land: big ones become their own islands, tiny ones become sea
  const stray=new Uint8Array(N); for(let i=0;i<N;i++) stray[i]=(landPass[i]&&zid[i]<0)?1:0;
  let nIsl=0;
  for(const comp of components(W,H,stray)){
    if(comp.length>=60){ const zi=zones.length; zones.push({kind:'land',name:'Isle '+(++nIsl),terr:'P',val:1,owner:-1,cap:-1,cls:6}); for(const c of comp) zid[c]=zi; }
    else for(const c of comp){ cls[c]=0; landPass[c]=0; } }
  // sea flood
  const seaPass=new Uint8Array(N); for(let i=0;i<N;i++) seaPass[i]=landPass[i]?0:1;
  const sseeds=[];
  for(let i=nLand;i<zones.length;i++){ const z=zones[i]; if(z.kind!=='sea'||z.sx===undefined) continue; const p=snap(W,H,seaPass,sx(z.sx),sy(z.sy),30); if(!p){ console.warn('no sea near seed',z.name); continue; } sseeds.push({x:p[0],y:p[1],zone:i,cls:0}); }
  const sz=flood(W,H,seaPass,cls,sseeds,0);
  for(let i=0;i<N;i++) if(seaPass[i]) zid[i]=sz[i];
  const land=new Uint8Array(N); for(let i=0;i<N;i++) land[i]=landPass[i];
  return assemble(W,H,zid,zones,land,D.links,D.cuts);
}

// ---------------------------------------------------------------- RANDOM WORLD
const SYL_A=['Kar','Vel','Dor','Mar','Sal','Tir','Ber','Nor','Ost','Zan','Lun','Per','Ald','Cas','Vor','Hal','Bran','Cor','Dun','Eld','Fen','Gal','Hav','Ith','Jor','Kel','Lor','Mor','Nar','Ob','Pol','Quen','Rav','Sol','Tar','Ul','Vik','Wen','Yar','Zor'];
const SYL_B=['ia','land','mark','stan','burg','ova','ara','enia','mere','gard','heim','wick','dale','ria','nia','topia','mont','shire'];
const SEA_A=['Grey','Iron','Cold','Storm','Silver','Black','Pale','Deep','Long','Broken','Lost','Amber','Salt','Cinder','Ghost','Wide'];
const SEA_B=['Sea','Ocean','Gulf','Strait','Deep','Reach'];

function pnoise(rnd,gw,gh){ // value noise, periodic in x
  const g=[]; for(let i=0;i<gw;i++){ g[i]=[]; for(let j=0;j<=gh;j++) g[i][j]=rnd(); }
  return (u,v)=>{ const x=u*gw, y=v*gh, i=Math.floor(x), j=Math.min(gh-1,Math.floor(y)), fx=x-i, fy=y-j;
    const sx=fx*fx*(3-2*fx), sy=fy*fy*(3-2*fy), i0=i%gw, i1=(i+1)%gw;
    const a=g[i0][j]*(1-sx)+g[i1][j]*sx, b=g[i0][j+1]*(1-sx)+g[i1][j+1]*sx; return a*(1-sy)+b*sy; };
}
function poisson(W,H,cand,rnd,minD,tries,existing){
  const pts=existing?existing.slice():[]; const md2=minD*minD;
  for(let t=0;t<tries&&cand.length;t++){
    const c=cand[Math.floor(rnd()*cand.length)], x=c%W, y=(c-x)/W; let ok=true;
    for(const p of pts){ const dx=wrapD(x-p[0],W), dy=y-p[1]; if(dx*dx+dy*dy<md2){ ok=false; break; } }
    if(ok) pts.push([x,y]); }
  return pts;
}

function buildRandom(seed,P){
  const rnd=mulberry32(seed>>>0), W=(P&&P.W)||800, H=(P&&P.H)||435, N=W*H;
  const G=(P&&P.gw)||[5,11,23], n1=pnoise(rnd,G[0],Math.max(2,G[0]>>1)), n2=pnoise(rnd,G[1],6), n3=pnoise(rnd,G[2],12), nE=pnoise(rnd,9,6), nF=pnoise(rnd,13,8);
  const hgt=new Float32Array(N);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const u=x/W, v=y/H; let n=n1(u,v)*0.5+n2(u,v)*0.3+n3(u,v)*0.2;
    const lat=Math.abs(v-0.5)*2; n-=Math.max(0,lat-0.78)*1.8; hgt[y*W+x]=n; }
  const sorted=Float32Array.from(hgt).sort(); const thr=sorted[Math.floor(N*(1-((P&&P.frac)||0.34)))];
  let land=new Uint8Array(N); for(let i=0;i<N;i++) land[i]=hgt[i]>=thr?1:0;
  // tidy: fill small lakes, drop small specks
  for(const comp of components(W,H,land.map(v=>1-v))){ if(comp.length<150&&comp.every(c=>{ const y=(c/W)|0; return y>0&&y<H-1; })) for(const c of comp) land[c]=1; }
  for(const comp of components(W,H,land)){ if(comp.length<260) for(const c of comp) land[c]=0; }
  const landCells=[], seaCells=[]; for(let i=0;i<N;i++) (land[i]?landCells:seaCells).push(i);
  const cls=new Uint8Array(N); for(let i=0;i<N;i++) cls[i]=land[i]?1:0;
  // land seeds
  let minD=(P&&P.minD)||40, lp;
  for(let attempt=0;attempt<4;attempt++){ lp=poisson(W,H,landCells,rnd,minD,9000); if(lp.length>=38) break; minD*=0.82; }
  // each landmass gets at least one seed
  const haveSeed=new Set(); lp.forEach(p=>haveSeed.add(p[1]*W+p[0]));
  for(const comp of components(W,H,land)){ if(!comp.some(c=>haveSeed.has(c))){ let sx=0,sy=0; for(const c of comp){ sx+=c%W; sy+=(c/W)|0; } const p=snap(W,H,land,sx/comp.length,sy/comp.length,60); if(p) lp.push(p); } }
  // sea seeds
  let sp, sMin=72; for(let attempt=0;attempt<4;attempt++){ sp=poisson(W,H,seaCells,rnd,sMin,9000); if(sp.length>=24) break; sMin*=0.82; }
  const seaHave=new Set(); sp.forEach(p=>seaHave.add(p[1]*W+p[0]));
  const seaMask=land.map(v=>1-v);
  for(const comp of components(W,H,seaMask)){ if(!comp.some(c=>seaHave.has(c))){ let sx=0,sy=0; for(const c of comp){ sx+=c%W; sy+=(c/W)|0; } const p=snap(W,H,seaMask,sx/comp.length,sy/comp.length,60); if(p) sp.push(p); } }
  // names
  const used=new Set(), pickName=(A,B)=>{ for(let t=0;t<50;t++){ const n=A[Math.floor(rnd()*A.length)]+(B===SEA_B?' ':'')+B[Math.floor(rnd()*B.length)]; if(!used.has(n)){ used.add(n); return B===SEA_B?n:n; } } return A[0]+B[0]+used.size; };
  const zones=[];
  lp.forEach(p=>{ const e=nE(p[0]/W,p[1]/H)*0.65+nF(p[0]/W*1.7%1,p[1]/H*1.7%1)*0.35, f=nF(p[0]/W,p[1]/H);
    zones.push({kind:'land',name:pickName(SYL_A,SYL_B),terr:e>0.62?'M':(f>0.58?'F':'P'),val:1+Math.floor(rnd()*3),owner:-1,cap:-1,cls:1}); });
  const nLand=zones.length;
  sp.forEach(p=>zones.push({kind:'sea',name:pickName(SEA_A,SEA_B),terr:'S',val:0,owner:-1,cap:-1,cls:0}));
  const seeds=lp.map((p,i)=>({x:p[0],y:p[1],zone:i,cls:1}));
  const zid=flood(W,H,land,cls,seeds,0);
  const sseeds=sp.map((p,i)=>({x:p[0],y:p[1],zone:nLand+i,cls:0}));
  const sz=flood(W,H,seaMask,cls,sseeds,0);
  for(let i=0;i<N;i++) if(!land[i]) zid[i]=sz[i];
  const world=assemble(W,H,zid,zones,land,[]);
  assignNations(world,rnd);
  return world;
}

// nations: 0 USA, 1 UK, 2 USSR, 3 Germany/Italy, 4 Japan
function assignNations(world,rnd){
  const Z=world.Z, W=world.W, landZ=Z.filter(z=>z.kind==='land');
  const quota={0:7,1:4,2:8,3:7,4:5};
  // land-graph edges: shared border = 1, across one sea zone = 3
  const edges=Z.map(()=>new Map());
  for(const z of landZ){ for(const n of z.adj){ if(Z[n].kind==='land') edges[z.id].set(n,1); else for(const m of Z[n].adj){ if(Z[m].kind==='land'&&m!==z.id&&!edges[z.id].has(m)) edges[z.id].set(m,3); } } }
  for(const z of landZ){ for(const s1 of z.adj){ if(Z[s1].kind!=='sea') continue; for(const s2 of Z[s1].adj){ if(Z[s2].kind!=='sea') continue; for(const m of Z[s2].adj){ if(Z[m].kind==='land'&&m!==z.id&&!edges[z.id].has(m)) edges[z.id].set(m,6); } } } }
  const big=landZ.filter(z=>z.area>=700).sort((a,b)=>b.area-a.area); const pool=big.length>=8?big:landZ;
  const caps=[]; const dd=(a,b)=>{ const dx=wrapD(a.cx-b.cx,W), dy=a.cy-b.cy; return Math.hypot(dx,dy); };
  caps.push(pool[Math.floor(rnd()*Math.min(8,pool.length))]);
  while(caps.length<5){ const sc=pool.filter(z=>!caps.includes(z)).map(z=>({z,s:Math.min(...caps.map(c=>dd(z,c)))})).sort((a,b)=>b.s-a.s); if(!sc.length) break; caps.push(sc[Math.floor(rnd()*Math.min(3,sc.length))].z); }
  const order=[3,2,0,1,4]; const own=new Map(); const nations={};
  order.forEach((n,i)=>{ const c=caps[i]; if(!c) return; own.set(c.id,n); c.cap=n; nations[n]=[c.id]; });
  for(let round=0;round<12;round++){ let any=false;
    for(const n of order){ if(!nations[n]||nations[n].length>=quota[n]) continue;
      // cheapest unowned zone reachable from this nation's set
      const d=new Map(); const pq=nations[n].map(z=>[0,z]); nations[n].forEach(z=>d.set(z,0)); let best=null;
      while(pq.length){ pq.sort((a,b)=>a[0]-b[0]); const [c,z]=pq.shift(); if(c>d.get(z)) continue; if(!own.has(z)&&c>0){ best=z; break; }
        for(const [m,w] of edges[z]){ const nc=c+w; if(nc<=12&&(!d.has(m)||nc<d.get(m))){ d.set(m,nc); pq.push([nc,m]); } } }
      if(best!==null){ own.set(best,n); nations[n].push(best); any=true; } }
    if(!any) break; }
  for(const n of order){ if(!nations[n]) continue; // tiny nations take the nearest free land, connected or not
    while(nations[n].length<4){ const c=Z[nations[n][0]]; let best=null,bd=1e9; for(const z of landZ){ if(own.has(z.id)) continue; const d=Math.hypot(wrapD(z.cx-c.cx,W),z.cy-c.cy); if(d<bd){ bd=d; best=z; } } if(!best) break; own.set(best.id,n); nations[n].push(best.id); } }
  for(const z of landZ){ const n=own.has(z.id)?own.get(z.id):-1; z.owner=n; z.val=n>=0?(z.cap>=0?9+Math.floor(rnd()*4):2+Math.floor(rnd()*3)):1+Math.floor(rnd()*2); }
}

// terrain styles for Custom Battles / Random World
const PRESETS={random:{gw:[5,11,23],frac:0.34,minD:40},continents:{gw:[2,5,12],frac:0.36,minD:42},islands:{gw:[4,9,20],frac:0.28,minD:38},archipelago:{gw:[6,14,30],frac:0.21,minD:32}};
const api={PRESETS,mulberry32,decodeRLE,flood,assemble,buildDefault,buildRandom,components,wrapD};
if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.LFWorld=api;
})(typeof window!=='undefined'?window:globalThis);
