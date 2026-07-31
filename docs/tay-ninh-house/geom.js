/* ───────────────────────── 4. 尺寸定义 ─────────────────────────
   第三版布局（房子北移，庭院全部在前院）
   site x∈[0,10]，y∈[0,32]，镇道在 y=0 一侧（南）。局部 lx/ly 以主楼左前外角为原点。

   南 → 北 五段：
     y  0.00 – 14.30   前院 14.30 m   停车 → 菜园果树 → 草坪 → 泳池凉亭
     y 14.30 – 15.50   门廊挑檐 1.20 m
     y 15.50 – 25.10   主楼两层 9.60 m
     y 25.10 – 29.00   后附房单层 3.90 m（厨房 · 洗衣 · 工具房）
     y 29.00 – 32.00   后端服务带 3.00 m（禽舍 · 晾衣 · 堆肥 · 化粪池 · 空调外机）

   气候依据（西宁 11.31°N）：地块逼得 13.5 m 长立面朝正东正西，是热带最差朝向，
   因此把四个卫生间 + 衣帽间全部排在西侧 lx 0.15–1.75 当西晒热缓冲，
   楼梯与走廊排在东侧当东晒热缓冲，卧室夹在中间。 */
const D = {
  plotW:10, plotL:32,
  hx0:0.65, hx1:9.45,        // 主楼左右（宽 8.80，西通道 0.65 / 东通道 0.55）
  hy0:15.50, hy1:25.10,      // 主楼前后（深 9.60）
  ay0:25.10, ay1:29.00,      // 后附房（深 3.90）
  svc0:29.00, svc1:32.00,    // 后端服务带（深 3.00）
  W:0.15, P:0.10,
  FF:0.45, F1:3.75, F2:7.05, RG:8.10,
  ceil1:3.55, ceil2:6.85, annexTop:3.55,
  porch:1.20,                // 门廊进深
  /* Ø2.0 m 中柱式旋转楼梯：净直径 2.00，中柱 Ø0.14，
     16 级 × 每级 22.5° = 360°，踏面外沿宽 0.55，级高 (3.75-0.45)/16 = 0.206 */
  spCx:8.05, spCy:17.85, spR:1.00, spN:16, spCol:0.07
};
const S = (lx,ly)=>[D.hx0+lx, D.hy0+ly];

/* ───────────────────────── 5. 门窗构件 ───────────────────────── */
const FR = 0.055;
function glazing(dir,a,b,z0,z1,v0,v1,out,opts){
  opts = opts||{};
  const vm=(v0+v1)/2, gt=0.008;
  const seg=(u0,u1,w0,w1,zz0,zz1,mm)=> dir==='x'
      ? box(u0,w0,zz0,u1,w1,zz1,mm) : box(w0,u0,zz0,w1,u1,zz1,mm);
  seg(a,a+FR, v0,v1, z0,z1, M.metalDk);
  seg(b-FR,b, v0,v1, z0,z1, M.metalDk);
  seg(a,b, v0,v1, z0,z0+FR, M.metalDk);
  seg(a,b, v0,v1, z1-FR,z1, M.metalDk);
  const n = opts.mull===0 ? 0 : (opts.mull || Math.max(1, Math.round((b-a)/1.05)-1));
  for(let i=1;i<=n;i++){ const u=a+(b-a)*i/(n+1); seg(u-0.028,u+0.028, v0,v1, z0,z1, M.metalDk); }
  if(opts.transom){ const zt=z0+(z1-z0)*opts.transom; seg(a,b, v0,v1, zt-0.028,zt+0.028, M.metalDk); }
  seg(a+FR*0.7,b-FR*0.7, vm-gt,vm+gt, z0+FR*0.7,z1-FR*0.7, M.glass);
  if(opts.screen!==false) seg(a+FR,b-FR, vm-out*0.045-gt, vm-out*0.045+gt, z0+FR,z1-FR, M.screen);
  if(opts.sill!==false){
    const so = out<0 ? [v0-0.07, v0+0.02] : [v1-0.02, v1+0.07];
    seg(a-0.06,b+0.06, so[0],so[1], z0-0.055,z0, M.concrete);
    seg(a,b, v0,v1, z0-0.03,z0, M.slab);
  }
  if(opts.hood){ const ho = out<0 ? [v0-0.16, v0] : [v1, v1+0.16];
    seg(a-0.10,b+0.10, ho[0],ho[1], z1,z1+0.07, M.wallAccent); }
  if(opts.bars){                                   // 一层防盗栅
    for(let u=a+0.16; u<b-0.05; u+=0.16)
      seg(u,u+0.028, out<0?v0-0.09:v1+0.06, out<0?v0-0.062:v1+0.088, z0+0.03,z1-0.03, M.metalDk);
  }
}
function doorway(dir,a,b,z0,z1,v0,v1,out,opts){
  opts = opts||{};
  const vm=(v0+v1)/2;
  const seg=(u0,u1,w0,w1,zz0,zz1,mm)=> dir==='x'
      ? box(u0,w0,zz0,u1,w1,zz1,mm) : box(w0,u0,zz0,w1,u1,zz1,mm);
  seg(a,a+0.05, v0,v1, z0,z1, opts.frameMat||M.woodDk);
  seg(b-0.05,b, v0,v1, z0,z1, opts.frameMat||M.woodDk);
  seg(a,b, v0,v1, z1-0.05,z1, opts.frameMat||M.woodDk);
  if(opts.open) return;
  const lm = opts.leafMat || M.woodLt;
  if(opts.ajar){
    /* 门扇一律朝房间内开：out 指向走廊／室外，取反即为开启方向，走廊净宽不被占用 */
    const w=(b-a)-0.10, t=0.04, sw=opts.ajar, sd = out<0 ? 1 : -1;
    dir==='x' ? box(a+0.05, vm, z0, a+0.05+t, vm+sd*w*sw, z1-0.06, lm)
              : box(vm, a+0.05, z0, vm+sd*w*sw, a+0.05+t, z1-0.06, lm);
  } else {
    seg(a+0.05,b-0.05, vm-0.022,vm+0.022, z0,z1-0.05, lm);
    if(opts.glazed) seg(a+0.22,b-0.22, vm-0.006,vm+0.006, z0+0.95,z1-0.35, M.glass);
    const hu = opts.hinge==='b' ? a+0.16 : b-0.16;
    dir==='x' ? box(hu-0.045,vm-0.075,z0+1.02, hu+0.045,vm+0.075,z0+1.10, M.steel)
              : box(vm-0.075,hu-0.045,z0+1.02, vm+0.075,hu+0.045,z0+1.10, M.steel);
  }
}

/* ───────────────────────── 6. 主体建筑 ───────────────────────── */
const X0=D.hx0, X1=D.hx1, Y0=D.hy0, Y1=D.hy1, AY0=D.ay0, AY1=D.ay1;
const IX0=X0+D.W, IX1=X1-D.W, IY0=Y0+D.W, IY1=Y1-D.W;
const AIY0=AY0+D.W, AIY1=AY1-D.W;
const w=D.W;

group('shell1');
box(X0-0.06, Y0-0.06, 0, X1+0.06, AY1+0.06, D.FF, M.plinth);

/* 外墙洞口：同样一律从平面图数据 FLOORS.wins 生成，平面上开几个窗、多宽，模型就是几个、多宽。
   洞口高度按类型给，不用在平面图上再标一遍：
     普通窗 窗台 0.90 / 过梁下 2.30——坐着看得见院子，站着不晒头；
     高窗 e  窗台 1.55 / 上沿 2.15——卫生间储物间只要通风不要对视；
     落地门 d 0 → 2.55；通道洞口 o 0 → 2.10。 */
const OPENH = { '':[0.90,2.30], e:[1.55,2.15], d:[0.00,2.55], o:[0.00,2.10] };
function shellOpenings(key, blk, lvl, zTop, mat){
  const yF = blk==='a' ? AY0 : Y0, yB = blk==='a' ? AY1 : Y1;
  const H={F:[],B:[],L:[],R:[]};
  (FLOORS[key].wins||[]).filter(q=>(q[3]||'m')===blk).forEach(q=>{
    const k=q[4]||'', h=OPENH[k]||OPENH[''];
    H[q[0]].push({a:q[1], b:q[2], z0:lvl+h[0], z1:lvl+h[1], k:k, side:q[0]});
  });
  const conv = s => H[s].map(o=>({a:(s==='F'||s==='B')?X0+o.a:Y0+o.a,
                                 b:(s==='F'||s==='B')?X0+o.b:Y0+o.b, z0:o.z0, z1:o.z1}));
  /* 后附房的前墙就是主楼的后墙，只砌一道，不然会砌成 0.30 m 的傻墙 */
  if(blk!=='a') wallOpen('x', X0,X1, yF,yF+w, lvl,zTop, mat, conv('F'));
  wallOpen('x', X0,X1, yB-w,yB, lvl,zTop, mat, conv('B'));
  wallOpen('y', yF,yB, X0,X0+w, lvl,zTop, mat, conv('L'));
  wallOpen('y', yF,yB, X1-w,X1, lvl,zTop, mat, conv('R'));
  return {H:H, yF:yF, yB:yB, lvl:lvl};
}
/* 玻璃、纱窗、防盗栅、窗台、遮阳板：一层全部带纱窗 + 防盗栅 + 滴水遮阳板，
   二层带遮阳板不带栅（逃生），落地门不做窗台。 */
function shellGlazing(key, blk, ctx, ground){
  const{H,yF,yB}=ctx;
  const has=(side,a,b)=>(FLOORS[key].doors||[]).some(d=>{
    if(!d.p) return false;
    const R=x=>x*Math.PI/180, e=[d.p[0]+d.r*Math.cos(R(d.a[0])), d.p[1]+d.r*Math.sin(R(d.a[0]))];
    const u0=Math.min((side==='F'||side==='B')?d.p[0]:d.p[1], (side==='F'||side==='B')?e[0]:e[1]);
    return Math.abs(u0-a)<0.12;
  });
  const emit=(side,o)=>{
    const dir=(side==='F'||side==='B')?'x':'y';
    const a=((side==='F'||side==='B')?X0:Y0)+o.a, b=((side==='F'||side==='B')?X0:Y0)+o.b;
    const v = side==='F' ? [yF,yF+w] : side==='B' ? [yB-w,yB] : side==='L' ? [X0,X0+w] : [X1-w,X1];
    const out = (side==='F'||side==='L') ? -1 : 1;
    if(o.k==='o'){                                  // 通道洞口：只做门套，门扇由 planDoors 画
      if(!has(side,o.a,o.b)) doorway(dir, a,b, o.z0,o.z1, v[0],v[1], out, {open:1});
      return;
    }
    const wide=(b-a)>1.30;
    glazing(dir, a,b, o.z0,o.z1, v[0],v[1], out, o.k==='d'
      ? {mull: wide?2:1, transom:0.80, sill:false, bars:0}
      : {mull: o.k==='e'?0:undefined, hood:1, bars: ground?1:0});
  };
  ['F','B','L','R'].forEach(s=>H[s].forEach(o=>emit(s,o)));
}

/* 一层外墙：主楼 + 后附房 */
const CTX1  = shellOpenings('f1','m', D.FF, D.F1,        M.wallOut);
const CTX1a = shellOpenings('f1','a', D.FF, D.annexTop,  M.wallOut);
box(IX0,IY0,D.FF-0.02, IX1,IY1,D.FF, M.floorTile);
box(IX0,AIY0,D.FF-0.02, IX1,AIY1,D.FF, M.floorTile);
group('ceil1'); box(IX0,IY0,D.ceil1, IX1,IY1,D.ceil1+0.03, M.ceil);
group('ceilA'); box(IX0,AIY0,D.annexTop-0.10, IX1,AIY1,D.annexTop-0.07, M.ceil);
group('slab2');
box(X0,Y0,D.F1-0.16, X1,Y1,D.F1, M.slab);
box(IX0,IY0,D.F1, IX1,IY1,D.F1+0.02, M.floorTile);
group('shell1');
(function(){ const a=D.F1-0.26, b=D.F1+0.04, o=0.05, t=0.20;
  box(X0-o,Y0-o,a, X1+o,Y0+t,b, M.wallAccent);
  box(X0-o,Y1-t,a, X1+o,Y1+o,b, M.wallAccent);
  box(X0-o,Y0+t,a, X0+t,Y1-t,b, M.wallAccent);
  box(X1-t,Y0+t,a, X1+o,Y1-t,b, M.wallAccent);
})();

group('shell2');
const CTX2 = shellOpenings('f2','m', D.F1, D.F2, M.wallOut);
group('ceil2'); box(IX0,IY0,D.ceil2, IX1,IY1,D.ceil2+0.03, M.ceil);
group('roof'); box(X0,Y0,D.F2, X1,Y1,D.F2+0.14, M.slab);
group('shell2');

/* 门窗构件：三段外墙的玻璃、纱窗、防盗栅、遮阳板全部按上面生成的洞口配 */
group('glass');
shellGlazing('f1','m', CTX1,  true);
shellGlazing('f1','a', CTX1a, true);
shellGlazing('f2','m', CTX2,  false);
group('shell1');

/* ───────────────────────── 7. 屋面 ───────────────────────── */
group('roof');
(function(){
  const e=D.F2+0.14, ov=0.60, rx=(X0+X1)/2;
  const ex0=X0-ov, ex1=X1+ov, ey0=Y0-ov, ey1=Y1+ov;
  const ry0=Y0+1.6, ry1=Y1-1.6, rz=D.RG;
  const A=[ex0,ey0,e],B=[ex1,ey0,e],C=[ex1,ey1,e],Dd=[ex0,ey1,e];
  const R0=[rx,ry0,rz], R1=[rx,ry1,rz];
  face(A,Dd,R1,R0,M.roofMetal,true);
  face(B,R0,R1,C,M.roofMetal,true);
  tri3(A,R0,B,M.roofMetal,true);
  tri3(C,R1,Dd,M.roofMetal,true);
  face(A,B,C,Dd,M.ceil);
  box(ex0,ey0,e-0.16, ex1,ey0+0.09,e, M.fascia);
  box(ex0,ey1-0.09,e-0.16, ex1,ey1,e, M.fascia);
  box(ex0,ey0,e-0.16, ex0+0.09,ey1,e, M.fascia);
  box(ex1-0.09,ey0,e-0.16, ex1,ey1,e, M.fascia);
  box(ex0-0.10,ey0-0.10,e-0.22, ex1+0.10,ey0-0.02,e-0.06, M.metalDk);
  box(ex0-0.10,ey1+0.02,e-0.22, ex1+0.10,ey1+0.10,e-0.06, M.metalDk);
  cyl(ex0+0.06, ey0+0.2, 0, e-0.2, 0.055,0.055, 8, M.metalDk, false);
  cyl(ex1-0.06, ey1-0.2, 0, e-0.2, 0.055,0.055, 8, M.metalDk, false);
  box(rx-0.11, ry0-0.15, rz-0.05, rx+0.11, ry1+0.15, rz+0.06, M.fascia);
  for(let y=ey0+0.35; y<ey1; y+=0.85){
    box(ex0+0.02, y, e-0.14, X0-0.02, y+0.07, e-0.05, M.woodDk);
    box(X1+0.02, y, e-0.14, ex1-0.02, y+0.07, e-0.05, M.woodDk);
  }
  // 太阳能热水器 + 屋顶水箱
  box(X0+1.20,Y0+7.90,e+0.02, X0+2.80,Y0+9.10,e+0.10, M.metalDk);
  for(let i=0;i<8;i++) cyl(X0+1.35+i*0.19, Y0+8.50, e+0.10, e+0.16, 0.075,0.075, 8, M.panel);
  cyl(X0+2.05,Y0+7.55,e+0.10, e+0.62, 0.30,0.30, 12, M.tank);
  // 楼梯间光井天窗
  box(X0+6.70,Y0+2.40,D.F2+0.10, X0+8.45,Y0+3.90,D.F2+0.16, M.metalDk);
})();
group('glass');
box(X0+6.74,Y0+2.44,D.F2+0.16, X0+8.41,Y0+3.86,D.F2+0.54, M.glass);
group('roof');
box(X0+6.70,Y0+2.40,D.F2+0.54, X0+8.45,Y0+3.90,D.F2+0.62, M.metalDk);

/* 后附房单坡屋面 */
group('roofA');
(function(){ const e0=4.12, e1=3.70, ox=0.45;
  face([X0-ox,AY0-0.10,e0],[X1+ox,AY0-0.10,e0],[X1+ox,AY1+ox,e1],[X0-ox,AY1+ox,e1], M.roofMetal);
  face([X0-ox,AY0-0.10,e0],[X0-ox,AY1+ox,e1],[X1+ox,AY1+ox,e1],[X1+ox,AY0-0.10,e0], M.ceil);
  box(X0-ox,AY0-0.16,e0-0.16, X1+ox,AY0-0.07,e0, M.fascia);
  box(X0-ox,AY1+ox-0.09,e1-0.16, X1+ox,AY1+ox,e1, M.fascia);
  box(X0-ox,AY0-0.10,e0-0.14, X0-ox+0.09,AY1+ox,e0-0.02, M.fascia);
  box(X1+ox-0.09,AY0-0.10,e0-0.14, X1+ox,AY1+ox,e0-0.02, M.fascia);
  box(X0-ox-0.10,AY1+ox,e1-0.20, X1+ox+0.10,AY1+ox+0.09,e1-0.04, M.metalDk);
  for(let y=AY0+0.2;y<AY1+0.3;y+=0.80){
    const t=(y-AY0+0.10)/(AY1+ox-AY0+0.10), z=e0+(e1-e0)*t;
    box(X0-ox+0.02,y,z-0.13, X0,y+0.07,z-0.03, M.woodDk);
    box(X1,y,z-0.13, X1+ox-0.02,y+0.07,z-0.03, M.woodDk); }
})();
group('shell1');

/* ───────────────────────── 8. 门廊 · 阳台 · 遮阳 · 后勤棚 ───────────────────────── */
box(X0,Y0-D.porch,D.ceil1-0.15, X1,Y0,D.ceil1, M.slab);
cyl(X0+0.65, Y0-0.95, 0, D.ceil1-0.15, 0.075,0.075, 10, M.metalDk);
cyl(X1-0.65, Y0-0.95, 0, D.ceil1-0.15, 0.075,0.075, 10, M.metalDk);
// 入户台阶（三级 + 无障碍缓坡）
box(X0+5.55,Y0-1.45,0, X0+7.25,Y0,0.15, M.concrete);
box(X0+5.75,Y0-1.10,0.15, X0+7.05,Y0,0.30, M.concrete);
box(X0+5.90,Y0-0.75,0.30, X0+6.90,Y0,0.45, M.concrete);
face([X0+7.35,Y0-1.45,0],[X0+8.25,Y0-1.45,0],[X0+8.25,Y0,0.45],[X0+7.35,Y0,0.45], M.concrete);
box(X0+7.30,Y0-1.50,0.75, X0+7.38,Y0,0.83, M.steel);   // 缓坡扶手
cyl(X0+7.34,Y0-1.46,0, 0.79, 0.026,0.026, 8, M.steel, false);
cyl(X0+7.34,Y0-0.10,0, 0.79, 0.026,0.026, 8, M.steel, false);
// 客厅外平台
box(X0+0.80,Y0-1.30,0, X0+3.40,Y0,0.30, M.floorTile);
group('shell2');
box(X0+1.60,Y0-D.porch,D.F1-0.16, X0+4.10,Y0,D.F1, M.slab);
box(X0+1.60,Y0-D.porch,D.F1, X0+4.10,Y0,D.F1+0.02, M.floorTile);
(function(){ const zt=D.F1+1.05, a=X0+1.60, b=X0+4.10;
  box(a,Y0-1.24,zt-0.06, b,Y0-1.16,zt+0.02, M.woodLt);
  box(a-0.04,Y0-1.24,zt-0.06, a+0.04,Y0,zt+0.02, M.woodLt);
  box(b-0.04,Y0-1.24,zt-0.06, b+0.04,Y0,zt+0.02, M.woodLt);
  for(let x=a+0.06; x<b-0.04; x+=0.115) box(x,Y0-1.22,D.F1+0.02, x+0.028,Y0-1.18,zt-0.06, M.metalDk);
  box(a,Y0-1.23,D.F1+0.48, b,Y0-1.17,D.F1+0.52, M.metalDk);
})();
// 西南向仿木遮阳格栅（楼梯厅）
for(let x=X0+6.05; x<X1-0.05; x+=0.27)
  box(x, Y0-0.16, D.F1+0.25, x+0.10, Y0-0.04, D.F2-0.05, M.louver);
box(X0+6.00,Y0-0.20,D.F1+0.18, X1, Y0-0.02, D.F1+0.28, M.metalDk);
box(X0+6.00,Y0-0.20,D.F2-0.10, X1, Y0-0.02, D.F2, M.metalDk);
// 二层后阳台栏杆
(function(){ const zt=D.F1+1.05, a=X0+6.50, b=X1;
  box(a,Y1+0.02,zt-0.06, b,Y1+0.10,zt+0.02, M.woodLt);
  for(let x=a+0.06; x<b-0.04; x+=0.115) box(x,Y1+0.04,D.F1+0.02, x+0.028,Y1+0.08,zt-0.06, M.metalDk); })();
group('shell1');
// 后院晾衣棚（后附房出口外）
box(X0+4.90,AY1,2.55, X0+8.10,AY1+1.60,2.68, M.metalDk);
cyl(X0+5.05,AY1+1.45,0, 2.55, 0.06,0.06, 8, M.metalDk, false);
cyl(X0+7.95,AY1+1.45,0, 2.55, 0.06,0.06, 8, M.metalDk, false);
for(let i=0;i<3;i++) box(X0+5.05,AY1+0.45+i*0.36,1.72, X0+7.95,AY1+0.47+i*0.36,1.74, M.steel);
for(let i=0;i<5;i++) box(X0+5.25+i*0.42,AY1+0.42,1.05, X0+5.55+i*0.42,AY1+0.52,1.70, M.cloth);
// 厨房后操作台（户外备菜／洗涮）
box(X0+0.70,AY1+0.05,0, X0+2.60,AY1+0.65,0.86, M.brick);
box(X0+0.65,AY1,0.86, X0+2.65,AY1+0.70,0.92, M.slab);
box(X0+1.35,AY1+0.18,0.78, X0+1.95,AY1+0.55,0.90, M.steel);
cyl(X0+1.65,AY1+0.14,0.92, 1.22, 0.017,0.017, 8, M.steel, false);
// 空调外机（右侧通道，逐层）
for(const yy of [Y0+2.2, Y0+5.6, Y0+8.4, AY0+1.6]){
  box(X1+0.02, yy, 2.35, X1+0.30, yy+0.85, 2.95, M.steel);
  box(X1+0.02, yy+0.10, 0.35, X1+0.06, yy+0.14, 2.35, M.metalDk);
}
for(const yy of [Y0+2.2, Y0+5.6, Y0+8.4])
  box(X1+0.02, yy, D.F1+2.10, X1+0.30, yy+0.85, D.F1+2.70, M.steel);
// 侧通道排水沟盖板
box(X0-0.62,Y0-1.6,0.005, X0-0.10,AY1+1.8,0.05, M.concrete);
box(X1+0.10,Y0-1.6,0.005, X1+0.50,AY1+1.8,0.05, M.concrete);

/* ───────────────────────── 9. 隔墙与内门 ─────────────────────────
   第四版起，隔墙和内门不再手写，全部由平面图数据 FLOORS 生成。
   业主在平面图上审的是哪一道墙、哪一扇门朝哪边开，三维里就是哪一道、朝哪边开。
   以前两套数据各写各的，改了平面忘了改模型，才会出现「图上有门、模型里是堵墙」。 */
const L = (lx,ly)=>[X0+lx, Y0+ly];
function parts(list, z0, z1, m){
  for(const p of list){ const a=L(p[0],p[1]), b=L(p[2],p[3]);
    box(a[0],a[1],z0, b[0],b[1],z1, m||M.wallIn); }
}
/* 找出洞口两侧的墙段，取它的厚度范围。找不到就是外墙上的门，按外墙厚 0.15 处理。 */
function wallSpan(key, axis, u0, u1, pv){
  const ws = FLOORS[key].walls||[];
  for(const w of ws){
    if(axis==='y'){
      if(w[0]<=pv+0.03 && w[2]>=pv-0.03 && (Math.abs(w[1]-u1)<0.03 || Math.abs(w[3]-u0)<0.03))
        return [w[0],w[2]];
    } else {
      if(w[1]<=pv+0.03 && w[3]>=pv-0.03 && (Math.abs(w[0]-u1)<0.03 || Math.abs(w[2]-u0)<0.03))
        return [w[1],w[3]];
    }
  }
  /* 找不到隔墙 → 这扇门开在外墙上。贴到最近的一条外墙面，不要让门套浮在墙外 */
  const edges = axis==='y' ? [[0,1],[8.8,-1]] : [[0,1],[9.6,-1],[13.5,-1]];
  let best=null, bd=1e9;
  for(const[e,s] of edges){ const dd=Math.abs(e-pv); if(dd<bd){ bd=dd; best=[e,s]; } }
  if(bd<0.30) return best[1]>0 ? [best[0], best[0]+0.15] : [best[0]-0.15, best[0]];
  return [pv-0.075, pv+0.075];
}
/* 门：{p,r,a:[起,止]} → 洞口范围 + 门扇开启方向。开启方向直接取自平面图的弧线终点，
   平面图上门往哪边扫，模型里门扇就往哪边转，不可能一个朝里一个朝外。 */
function planDoors(key, lvl, hdr){
  const R=x=>x*Math.PI/180;
  (FLOORS[key].doors||[]).forEach(d=>{
    if(d.o){                                       // 无门扇的门洞
      const[a,b,c,e]=d.o, ax=(c-a)>(e-b);
      if(ax) doorway('x', X0+a,X0+c, lvl,lvl+hdr, Y0+b,Y0+e, 1, {open:1});
      else   doorway('y', Y0+b,Y0+e, lvl,lvl+hdr, X0+a,X0+c, 1, {open:1});
      return;
    }
    const[px,py]=d.p, r=d.r, a0=R(d.a[0]), a1=R(d.a[1]);
    const ex=px+r*Math.cos(a0), ey=py+r*Math.sin(a0);
    const axis = Math.abs(Math.cos(a0))>0.5 ? 'x' : 'y';
    const ext = /外开/.test(d.n||'');
    if(axis==='x'){
      const u0=Math.min(px,ex), u1=Math.max(px,ex);
      const[v0,v1]=wallSpan(key,'x',u0,u1,py);
      const sd = Math.sin(a1)>0 ? 1 : -1;
      doorway('x', X0+u0,X0+u1, lvl,lvl+hdr, Y0+v0,Y0+v1, sd>0?-1:1,
              {ajar:0.80, leafMat: ext?M.woodDk:M.woodLt, glazed: ext?1:0});
    } else {
      const u0=Math.min(py,ey), u1=Math.max(py,ey);
      const[v0,v1]=wallSpan(key,'y',u0,u1,px);
      const sd = Math.cos(a1)>0 ? 1 : -1;
      doorway('y', Y0+u0,Y0+u1, lvl,lvl+hdr, X0+v0,X0+v1, sd>0?-1:1,
              {ajar:0.80, leafMat: ext?M.woodDk:M.woodLt, glazed: ext?1:0});
    }
  });
}
group('part1');
/* 一层：主楼段到 ceil1，后附房段到 annexTop（局部 ly ≥ 9.60 的就是后附房） */
const W1=FLOORS.f1.walls;
parts(W1.filter(w=>w[3]<=9.62), D.FF, D.ceil1);
parts(W1.filter(w=>w[1]>=9.58), D.FF, D.annexTop-0.10);
planDoors('f1', D.FF, 2.15);
// 湿区墙砖（四面 12 mm 贴面，不是实心体块）
function wetLining(x0,y0,x1,y1,z0,h){
  const t=0.012;
  box(x0,y0,z0, x1,y0+t,z0+h, M.wetTile);
  box(x0,y1-t,z0, x1,y1,z0+h, M.wetTile);
  box(x0,y0+t,z0, x0+t,y1-t,z0+h, M.wetTile);
  box(x1-t,y0+t,z0, x1,y1-t,z0+h, M.wetTile);
  box(x0,y0,z0, x1,y1,z0+0.008, M.wetTile);   // 防水地砖
}
/* 所有 t:'wet' 的房间自动贴砖到 1.85 m，不用一间一间手写坐标 */
function wetRooms(key, lvl){
  (FLOORS[key].rooms||[]).filter(r=>r.t==='wet').forEach(r=>{ const[a,b,c,d]=r.r;
    wetLining(X0+a+0.03, Y0+b+0.03, X0+c-0.03, Y0+d-0.03, lvl, 1.85); });
}
wetRooms('f1', D.FF);

group('part2');
const W2=FLOORS.f2.walls;
parts(W2, D.F1, D.ceil2);
planDoors('f2', D.F1, 2.10);
wetRooms('f2', D.F1);

/* ───────────────────────── 10. 旋转楼梯（Ø2.0 m 中柱式钢结构） ─────────────────────────
   为什么用旋转梯：U 型梯占 7.7 m²，Ø2.0 旋转梯只占 3.1 m²，省下 4.6 m² 全部还给卧室。
   代价（已如实告知业主）：踏面外沿 0.55 m、内沿 0.11 m，搬大件家具困难，老人上下不便，
   所以一楼保留一间带无障碍卫生间的适老卧室，老人日常完全不用碰这部楼梯。

   几何：16 级 × 22.5° = 360°（一整圈），级高 (3.75−0.45)/16 = 0.206 m，
   净直径 2.00 m，中柱 Ø0.14 m 钢管，踏板 40 mm 硬木，外沿栏杆高 0.95 m。
   走 2×0.206+0.55×2π×(2/3)/16… 直接按外沿走步 0.26 m 校核：舒适。 */
group('part1');
(function(){
  const cx=D.spCx, cy=D.spCy, R=D.spR, n=D.spN, rc=D.spCol;
  const rise=(D.F1-D.FF)/n, a0=-Math.PI/2;      // 起步朝南（对着玄关）
  const dA=2*Math.PI/n;
  // 中柱
  cyl(cx,cy,0, D.F1+1.05, rc,rc, 16, M.steel);
  for(let i=0;i<n;i++){
    const z=D.FF+i*rise, a1=a0+i*dA, a2=a1+dA*0.92;
    // 扇形踏板：内沿贴中柱，外沿到 R
    const seg=6;
    for(let k=0;k<seg;k++){
      const b1=a1+(a2-a1)*k/seg, b2=a1+(a2-a1)*(k+1)/seg;
      const p=(r,a)=>[cx+r*Math.cos(a), cy+r*Math.sin(a)];
      const i1=p(rc,b1), i2=p(rc,b2), o1=p(R,b1), o2=p(R,b2);
      const zt=z+0.04;
      face([i1[0],i1[1],zt],[o1[0],o1[1],zt],[o2[0],o2[1],zt],[i2[0],i2[1],zt], M.woodDk);      // 面
      face([i2[0],i2[1],z],[o2[0],o2[1],z],[o1[0],o1[1],z],[i1[0],i1[1],z], M.metalDk);         // 底
      face([o1[0],o1[1],z],[o1[0],o1[1],zt],[o2[0],o2[1],zt],[o2[0],o2[1],z], M.woodDk);        // 外沿
      if(k===0)     face([i1[0],i1[1],z],[o1[0],o1[1],z],[o1[0],o1[1],zt],[i1[0],i1[1],zt], M.woodDk);
      if(k===seg-1) face([o2[0],o2[1],z],[i2[0],i2[1],z],[i2[0],i2[1],zt],[o2[0],o2[1],zt], M.woodDk);
    }
    // 外沿栏杆立柱 + 扶手段
    const am=(a1+a2)/2, px=cx+(R-0.045)*Math.cos(am), py=cy+(R-0.045)*Math.sin(am);
    cyl(px,py, z+0.04, z+0.95, 0.014,0.014, 6, M.metalDk, false);
    const h1=[cx+(R-0.045)*Math.cos(a1), cy+(R-0.045)*Math.sin(a1), z+0.95],
          h2=[cx+(R-0.045)*Math.cos(a1+dA), cy+(R-0.045)*Math.sin(a1+dA), z+rise+0.95];
    // 螺旋扶手：斜置薄带，两面都发一次，避免从内侧看穿
    const w=0.028;
    const q0=[h1[0]-w,h1[1]-w,h1[2]], q1=[h2[0]-w,h2[1]-w,h2[2]],
          q2=[h2[0]+w,h2[1]+w,h2[2]+0.05], q3=[h1[0]+w,h1[1]+w,h1[2]+0.05];
    face(q0,q1,q2,q3, M.woodLt);
    face(q0,q1,q2,q3, M.woodLt, true);
  }
  // 二层到达平台（补齐最后一级到楼板）
  group('part2');
  // 梯井护栏：沿开洞边一圈，只在到达口留缺（到达口朝南，即 a0 方向）
  const RG2=R+0.12;
  for(let i=0;i<26;i++){
    const a=a0+0.55 + (2*Math.PI-1.10)*i/25;
    const px=cx+RG2*Math.cos(a), py=cy+RG2*Math.sin(a);
    cyl(px,py, D.F1, D.F1+0.92, 0.014,0.014, 6, M.metalDk, false);
    if(i<25){ const a2=a0+0.55 + (2*Math.PI-1.10)*(i+1)/25;
      const q=[cx+RG2*Math.cos(a2), cy+RG2*Math.sin(a2)];
      box(Math.min(px,q[0])-0.028, Math.min(py,q[1])-0.028, D.F1+0.92,
          Math.max(px,q[0])+0.028, Math.max(py,q[1])+0.028, D.F1+1.00, M.woodLt); }
  }
  group('part1');
})();

/* ───────────────────────── 11. 家具与设备 ───────────────────────── */
/* 供第 11 节末尾的坐标包装使用的原始别名（函数声明已提升，可在此处取引用） */
const _box=box, _cyl=cyl, _bed=bed, _nightstand=nightstand, _wardrobe=wardrobe,
      _sofa=sofa, _table=table, _chair=chair, _wc=wc, _basin=basin, _shower=shower,
      _bathtub=bathtub, _bathCabinet=bathCabinet, _kitchenRun=kitchenRun, _fridge=fridge,
      _washer=washer, _tvUnit=tvUnit, _rug=rug, _ceilLamp=ceilLamp, _ceilFan=ceilFan,
      _acUnit=acUnit, _plantPot=plantPot;
function bed(cx,cy,w,l,z,dir,m1,m2){
  const h=0.30, x0=cx-w/2, x1=cx+w/2, y0=cy-l/2, y1=cy+l/2;
  box(x0+0.04,y0+0.04,z, x1-0.04,y1-0.04,z+h, M.woodDk);
  box(x0,y0,z+h, x1,y1,z+h+0.26, m1||M.fabricW);
  const hb=0.62;
  if(dir==='n') box(x0,y1-0.08,z, x1,y1,z+h+hb, M.woodLt);
  if(dir==='s') box(x0,y0,z, x1,y0+0.08,z+h+hb, M.woodLt);
  if(dir==='w') box(x0,y0,z, x0+0.08,y1,z+h+hb, M.woodLt);
  if(dir==='e') box(x1-0.08,y0,z, x1,y1,z+h+hb, M.woodLt);
  const bz=z+h+0.26;
  if(dir==='n'||dir==='s'){ const dy0 = dir==='n'? y0 : y0+l*0.32;
    box(x0+0.02,dy0,bz, x1-0.02,dy0+l*0.68,bz+0.09, m2||M.fabric); }
  else { const dx0 = dir==='w'? x0 : x0+w*0.32;
    box(dx0,y0+0.02,bz, dx0+w*0.68,y1-0.02,bz+0.09, m2||M.fabric); }
  const pz=bz+0.02, pw=Math.min(0.30,w*0.22);
  const P=(px,py)=>ball(px,py,pz+0.05, pw,0.19,0.065,10,M.fabricW);
  if(dir==='n'){ P(cx-w*0.22,y1-0.32); if(w>1.35) P(cx+w*0.22,y1-0.32); }
  if(dir==='s'){ P(cx-w*0.22,y0+0.32); if(w>1.35) P(cx+w*0.22,y0+0.32); }
  if(dir==='w'){ P(x0+0.32,cy-l*0.18); P(x0+0.32,cy+l*0.18); }
  if(dir==='e'){ P(x1-0.32,cy-l*0.18); P(x1-0.32,cy+l*0.18); }
}
function nightstand(cx,cy,z){
  box(cx-0.21,cy-0.19,z, cx+0.21,cy+0.19,z+0.50, M.woodDk);
  box(cx-0.05,cy-0.20,z+0.30, cx+0.05,cy-0.19,z+0.34, M.steel);
  cyl(cx,cy,z+0.50, z+0.56, 0.11,0.09, 10, M.metalDk);
  cyl(cx,cy,z+0.56, z+0.74, 0.02,0.02, 6, M.metalDk, false);
  ball(cx,cy,z+0.83, 0.11,0.11,0.09, 10, M.lamp);
}
function wardrobe(x0,y0,x1,y1,z,h,ax){
  box(x0,y0,z, x1,y1,z+h, M.woodLt);
  const n = ax==='x' ? Math.max(2,Math.round((x1-x0)/0.55)) : Math.max(2,Math.round((y1-y0)/0.55));
  for(let i=1;i<n;i++){ const t=i/n;
    if(ax==='x') box(x0+(x1-x0)*t-0.008,y0-0.006,z+0.02, x0+(x1-x0)*t+0.008,y1+0.006,z+h-0.02, M.woodDk);
    else box(x0-0.006,y0+(y1-y0)*t-0.008,z+0.02, x1+0.006,y0+(y1-y0)*t+0.008,z+h-0.02, M.woodDk); }
  for(let i=0;i<n;i++){ const t=(i+0.86)/n;
    if(ax==='x') box(x0+(x1-x0)*t-0.02,y0-0.028,z+h*0.48, x0+(x1-x0)*t+0.02,y0-0.008,z+h*0.62, M.steel);
    else box(x0-0.028,y0+(y1-y0)*t-0.02,z+h*0.48, x0-0.008,y0+(y1-y0)*t+0.02,z+h*0.62, M.steel); }
}
function sofa(cx,cy,w,d,z,facing){
  const x0=cx-w/2,x1=cx+w/2,y0=cy-d/2,y1=cy+d/2;
  box(x0,y0,z, x1,y1,z+0.34, M.fabric);
  box(x0,y0,z+0.34, x1,y1,z+0.40, M.fabricW);
  const bk=0.42;
  if(facing==='s') box(x0,y1-0.20,z, x1,y1,z+0.40+bk, M.fabric);
  if(facing==='n') box(x0,y0,z, x1,y0+0.20,z+0.40+bk, M.fabric);
  if(facing==='e') box(x0,y0,z, x0+0.20,y1,z+0.40+bk, M.fabric);
  if(facing==='w') box(x1-0.20,y0,z, x1,y1,z+0.40+bk, M.fabric);
  if(facing==='s'||facing==='n'){ box(x0,y0,z, x0+0.16,y1,z+0.56, M.fabric); box(x1-0.16,y0,z, x1,y1,z+0.56, M.fabric); }
  else { box(x0,y0,z, x1,y0+0.16,z+0.56, M.fabric); box(x0,y1-0.16,z, x1,y1,z+0.56, M.fabric); }
  for(let i=0;i<2;i++){ const px=cx+(i?0.28:-0.28)*w;
    ball(px, facing==='s'?y1-0.26:y0+0.26, z+0.52, 0.16,0.07,0.12, 8, M.fabricW); }
}
function table(cx,cy,w,l,z,h,m){
  box(cx-w/2,cy-l/2,z+h-0.05, cx+w/2,cy+l/2,z+h, m||M.woodLt);
  const ix=w/2-0.10, iy=l/2-0.10;
  for(const s of [[-1,-1],[1,-1],[-1,1],[1,1]])
    box(cx+s[0]*ix-0.035,cy+s[1]*iy-0.035,z, cx+s[0]*ix+0.035,cy+s[1]*iy+0.035,z+h-0.05, m||M.woodDk);
}
function chair(cx,cy,z,rot,m){
  const s=0.21, mm=m||M.woodLt;
  box(cx-s,cy-s,z+0.42, cx+s,cy+s,z+0.47, mm);
  for(const q of [[-1,-1],[1,-1],[-1,1],[1,1]])
    box(cx+q[0]*(s-0.03)-0.022,cy+q[1]*(s-0.03)-0.022,z, cx+q[0]*(s-0.03)+0.022,cy+q[1]*(s-0.03)+0.022,z+0.42, M.woodDk);
  if(rot==='n') box(cx-s,cy+s-0.05,z+0.47, cx+s,cy+s,z+0.92, mm);
  else if(rot==='s') box(cx-s,cy-s,z+0.47, cx+s,cy-s+0.05,z+0.92, mm);
  else if(rot==='e') box(cx+s-0.05,cy-s,z+0.47, cx+s,cy+s,z+0.92, mm);
  else box(cx-s,cy-s,z+0.47, cx-s+0.05,cy+s,z+0.92, mm);
}
function wc(cx,cy,z,dir){
  const d = dir==='n'?[0,1]:dir==='s'?[0,-1]:dir==='w'?[-1,0]:[1,0];
  const bx=cx-d[0]*0.06, by=cy-d[1]*0.06;
  box(bx-0.19,by-0.19,z, bx+0.19,by+0.19,z+0.20, M.ceramic);
  ball(bx,by,z+0.30, 0.20,0.24,0.10, 10, M.ceramic);
  box(bx+d[0]*0.20-0.19, by+d[1]*0.20-0.19, z, bx+d[0]*0.20+0.19, by+d[1]*0.20+0.19, z+0.72, M.ceramic);
  box(bx+d[0]*0.20-0.10, by+d[1]*0.20-0.10, z+0.72, bx+d[0]*0.20+0.10, by+d[1]*0.20+0.10, z+0.76, M.steel);
}
function basin(cx,cy,z,dir,w,twin){
  w = w||0.62;
  const d = dir==='n'?[0,1]:dir==='s'?[0,-1]:dir==='w'?[-1,0]:[1,0];
  const ax = Math.abs(d[0])>0.5;
  const hw = ax?0.26:w/2, hl = ax?w/2:0.26;
  box(cx-hw,cy-hl,z+0.74, cx+hw,cy+hl,z+0.82, M.slab);
  box(cx-hw+0.05,cy-hl+0.05,z+0.30, cx+hw-0.05,cy+hl-0.05,z+0.74, M.woodDk);   // 储物柜
  for(let i=1;i<3;i++){ const t=i/3;
    if(ax) box(cx-hw+0.04,cy-hl+(2*hl)*t-0.007,z+0.34, cx+hw-0.04,cy-hl+(2*hl)*t+0.007,z+0.70, M.woodLt);
    else   box(cx-hw+(2*hw)*t-0.007,cy-hl+0.04,z+0.34, cx-hw+(2*hw)*t+0.007,cy+hl-0.04,z+0.70, M.woodLt); }
  const bowls = twin?2:1;
  for(let i=0;i<bowls;i++){
    const off = bowls===1?0:(i?1:-1)*(ax?hl*0.45:hw*0.45);
    const bx = ax?cx:cx+off, by = ax?cy+off:cy;
    ball(bx,by,z+0.80, hw*0.55,hl*0.55*(bowls===1?1:0.6),0.09, 10, M.ceramic);
    cyl(bx-d[0]*0.19, by-d[1]*0.19, z+0.82, z+1.04, 0.018,0.018, 8, M.steel, false);
    box(bx-d[0]*0.19-0.02, by-d[1]*0.19-0.02, z+1.02, bx-d[0]*0.19+d[0]*0.14+0.02, by-d[1]*0.19+d[1]*0.14+0.02, z+1.06, M.steel);
  }
  const mz0=z+1.15, mz1=z+1.90;
  if(ax){ box(cx-d[0]*0.24, cy-hl+0.05, mz0, cx-d[0]*0.24+d[0]*0.03, cy+hl-0.05, mz1, M.mirror);
          box(cx-d[0]*0.26, cy-hl+0.02, mz1, cx-d[0]*0.26+d[0]*0.16, cy+hl-0.02, mz1+0.06, M.lamp); }
  else  { box(cx-hw+0.05, cy-d[1]*0.24, mz0, cx+hw-0.05, cy-d[1]*0.24+d[1]*0.03, mz1, M.mirror);
          box(cx-hw+0.02, cy-d[1]*0.26, mz1, cx+hw-0.02, cy-d[1]*0.26+d[1]*0.16, mz1+0.06, M.lamp); }
}
function shower(x0,y0,x1,y1,z,openDir){
  box(x0,y0,z, x1,y1,z+0.06, M.ceramic);
  const h=1.95;
  if(openDir==='x') box(x0,y1-0.012,z, x1,y1+0.012,z+h, M.glass);
  else box(x1-0.012,y0,z, x1+0.012,y1,z+h, M.glass);
  const sx=x0+0.16, sy=y0+0.16;
  cyl(sx,sy,z+0.30, z+2.05, 0.016,0.016, 8, M.steel, false);
  box(sx-0.09,sy-0.09,z+2.02, sx+0.09,sy+0.09,z+2.07, M.steel);
  box(sx-0.05,sy-0.05,z+1.10, sx+0.05,sy+0.05,z+1.24, M.steel);
  box(x1-0.30,y1-0.06,z+1.05, x1-0.06,y1-0.02,z+1.09, M.steel);   // 毛巾杆
}
function bathtub(x0,y0,x1,y1,z){
  box(x0,y0,z, x1,y1,z+0.55, M.ceramic);
  box(x0+0.08,y0+0.08,z+0.12, x1-0.08,y1-0.08,z+0.56, M.wetTile);
  const ax=(x1-x0)>(y1-y0);
  const fx = ax?x0+0.16:(x0+x1)/2, fy = ax?(y0+y1)/2:y0+0.16;
  cyl(fx,fy,z+0.55, z+0.78, 0.02,0.02, 8, M.steel, false);
  box(fx-0.02,fy-0.02,z+0.74, fx+(ax?0.16:0.02),fy+(ax?0.02:0.16),z+0.78, M.steel);
}
function bathCabinet(x0,y0,x1,y1,z,h){
  box(x0,y0,z, x1,y1,z+h, M.woodLt);
  const n=Math.max(2,Math.round(h/0.45));
  for(let i=1;i<n;i++) box(x0-0.006,y0-0.006,z+h*i/n-0.008, x1+0.006,y1+0.006,z+h*i/n+0.008, M.woodDk);
}
function kitchenRun(x0,y0,x1,y1,z,opts){
  opts=opts||{};
  box(x0,y0,z, x1,y1,z+0.86, M.woodLt);
  box(x0-0.02,y0-0.02,z+0.86, x1+0.02,y1+0.02,z+0.92, M.slab);
  const ax=(x1-x0)>(y1-y0);
  const n=Math.max(2, Math.round((ax?(x1-x0):(y1-y0))/0.60));
  for(let i=1;i<n;i++){ const t=i/n;
    if(ax) box(x0+(x1-x0)*t-0.008, y0-0.006, z+0.05, x0+(x1-x0)*t+0.008, y1+0.006, z+0.84, M.woodDk);
    else box(x0-0.006, y0+(y1-y0)*t-0.008, z+0.05, x1+0.006, y0+(y1-y0)*t+0.008, z+0.84, M.woodDk); }
  for(let i=0;i<n;i++){ const t=(i+0.5)/n;
    if(ax) box(x0+(x1-x0)*t-0.09, y0-0.026, z+0.66, x0+(x1-x0)*t+0.09, y0-0.008, z+0.70, M.steel);
    else box(x0-0.026, y0+(y1-y0)*t-0.09, z+0.66, x0-0.008, y0+(y1-y0)*t+0.09, z+0.70, M.steel); }
  if(opts.splash) box(x0,y0,z+0.92, ax?x1:x0+0.03, ax?y0+0.03:y1, z+1.45, M.wetTile);
  if(opts.upper){ const uz=z+1.45, ud=0.34;
    if(ax) box(x0,y0,uz, x1,y0+ud,uz+0.72, M.woodLt);
    else box(x0,y0,uz, x0+ud,y1,uz+0.72, M.woodLt);
    const m=Math.max(2, Math.round((ax?(x1-x0):(y1-y0))/0.55));
    for(let i=1;i<m;i++){ const t=i/m;
      if(ax) box(x0+(x1-x0)*t-0.008,y0+ud-0.006,uz+0.02, x0+(x1-x0)*t+0.008,y0+ud+0.006,uz+0.70, M.woodDk);
      else box(x0+ud-0.006,y0+(y1-y0)*t-0.008,uz+0.02, x0+ud+0.006,y0+(y1-y0)*t+0.008,uz+0.70, M.woodDk); } }
  if(opts.sink){ const s=opts.sink;
    box(s[0]-0.28,s[1]-0.21,z+0.86, s[0]+0.28,s[1]+0.21,z+0.90, M.steel);
    box(s[0]-0.25,s[1]-0.18,z+0.74, s[0]+0.25,s[1]+0.18,z+0.87, M.steel);
    cyl(s[0], s[1]+(opts.sinkBack||-0.26), z+0.92, z+1.26, 0.018,0.018, 8, M.steel, false);
    box(s[0]-0.02,s[1]+(opts.sinkBack||-0.26)-0.02,z+1.22, s[0]+0.02,s[1]+(opts.sinkBack||-0.26)+0.20,z+1.26, M.steel); }
  if(opts.hob){ const h=opts.hob;
    box(h[0]-0.32,h[1]-0.26,z+0.90, h[0]+0.32,h[1]+0.26,z+0.94, M.metalDk);
    for(const q of [[-0.16,0],[0.16,0]]) cyl(h[0]+q[0],h[1]+q[1],z+0.94, z+0.965, 0.085,0.085, 10, M.steel);
    box(h[0]-0.36,h[1]-0.28,z+1.52, h[0]+0.36,h[1]+0.28,z+1.64, M.steel);
    box(h[0]-0.17,h[1]-0.13,z+1.64, h[0]+0.17,h[1]+0.13,z+2.24, M.steel); }
}
function fridge(x0,y0,x1,y1,z){
  box(x0,y0,z, x1,y1,z+1.82, M.steel);
  box(x0-0.008,y0-0.008,z+1.16, x1+0.008,y1+0.008,z+1.18, M.metalDk);
  box(x0+0.06,y0-0.032,z+1.26, x0+0.10,y0-0.008,z+1.66, M.metalDk);
  box(x0+0.06,y0-0.032,z+0.55, x0+0.10,y0-0.008,z+1.02, M.metalDk);
}
function washer(cx,cy,z){
  box(cx-0.30,cy-0.30,z, cx+0.30,cy+0.30,z+0.86, M.steel);
  box(cx-0.22,cy-0.325,z+0.28, cx+0.22,cy-0.30,z+0.72, M.metalDk);
  box(cx-0.28,cy-0.325,z+0.78, cx+0.28,cy-0.30,z+0.84, M.metalDk);
}
function tvUnit(cx,cy,z,dir,wd){
  const ax = dir==='n'||dir==='s';
  const hw = ax? wd/2:0.22, hl = ax?0.22:wd/2;
  box(cx-hw,cy-hl,z, cx+hw,cy+hl,z+0.42, M.woodDk);
  const tz=z+0.62, th=0.60;
  if(ax) box(cx-wd*0.34, cy-0.03, tz, cx+wd*0.34, cy+0.03, tz+th, M.metalDk);
  else   box(cx-0.03, cy-wd*0.34, tz, cx+0.03, cy+wd*0.34, tz+th, M.metalDk);
}
function rug(cx,cy,wd,l,z){ box(cx-wd/2,cy-l/2,z+0.002, cx+wd/2,cy+l/2,z+0.014, M.fabric); }
function ceilLamp(cx,cy,z,r){ cyl(cx,cy,z-0.10, z-0.02, r||0.19, (r||0.19)*0.75, 12, M.lamp);
  cyl(cx,cy,z-0.02, z, 0.02,0.02, 6, M.metalDk, false); }
function acUnit(cx,cy,z,dir){                     // 壁挂空调室内机
  const ax = dir==='n'||dir==='s';
  if(ax) box(cx-0.52,cy-0.11,z, cx+0.52,cy+0.11,z+0.30, M.white||M.ceramic);
  else   box(cx-0.11,cy-0.52,z, cx+0.11,cy+0.52,z+0.30, M.ceramic);
}
function plantPot(cx,cy,z,h){
  cyl(cx,cy,z, z+h*0.34, h*0.20,h*0.16, 10, M.brick);
  cyl(cx,cy,z+h*0.30, z+h*0.52, 0.025,0.025, 6, M.bark, false);
  ball(cx,cy,z+h*0.76, h*0.30,h*0.30,h*0.28, 10, M.foliage);
  ball(cx-h*0.16,cy+h*0.10,z+h*0.60, h*0.20,h*0.20,h*0.18, 8, M.foliage2);
}
function ceilFan(cx,cy,z){
  cyl(cx,cy,z-0.30, z-0.06, 0.035,0.035, 8, M.metalDk, false);
  cyl(cx,cy,z-0.38, z-0.28, 0.10,0.13, 10, M.metalDk);
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2, dx=Math.cos(a), dy=Math.sin(a);
    box(cx+dx*0.10-Math.abs(dy)*0.09, cy+dy*0.10-Math.abs(dx)*0.09,
        z-0.35, cx+dx*0.72+Math.abs(dy)*0.09, cy+dy*0.72+Math.abs(dx)*0.09, z-0.32, M.woodDk); }
  ball(cx,cy,z-0.46, 0.10,0.10,0.08, 10, M.lamp);
}

/* —— 室内布置 ——
   第四版起，家具不再手写世界坐标。上面第 9 节的墙和门已经从 FLOORS 生成，
   这里家具同样从 FLOORS[key].furn 生成：平面图上画的是哪一件、在哪个位置，
   三维里就摆哪一件、在哪个位置。业主在平面图上审过的东西，不可能在三维里变样。
   平面局部坐标 (lx,ly) → 世界坐标 (X0+lx, Y0+ly)。 */
(function(){
  /* 家具朝向：取矩形中心到房间中心的方向，家具背靠最近的那面墙。
     床头、沙发靠背、马桶水箱、洗手台镜子都按这个方向摆，不会出现背对房间的怪事。 */
  function roomOf(key, r){
    const cx=(r[0]+r[2])/2, cy=(r[1]+r[3])/2;
    return (FLOORS[key].rooms||[]).find(q=>{
      const[a,b,c,d]=q.r; return cx>=a-0.02&&cx<=c+0.02&&cy>=b-0.02&&cy<=d+0.02; });
  }
  /* 家具贴着哪面墙：比较四边到所在房间四边的距离，最小的那边就是背靠的墙，
     返回家具「正面」朝向（n=朝北/y 增大，s=朝南，e=朝东/x 增大，w=朝西）。 */
  function facing(rm, r){
    if(!rm) return 'n';
    const[a,b,c,d]=r, [A,B,C,Dd]=rm.r;
    /* 背靠西墙就朝东，背靠南墙就朝北——床头永远贴墙，沙发靠背永远贴墙 */
    const dist={ e:a-A, w:C-c, n:b-B, s:Dd-d };
    let best='n', bv=1e9;
    for(const k in dist) if(dist[k]<bv){ bv=dist[k]; best=k; }
    return best;
  }
  const H = {                       // 无专用模型的柜体高度（按名字判断）
    '电视柜':0.48, '矮鞋柜 h1.2':1.20, '凳':0.45, '衣柜':2.15, '通高衣柜':2.30,
    '书桌':0.75, '长书桌':0.76, '抽屉':0.85, '洗衣机×2':0.86, '洗涤池':0.85
  };
  function place(key, lvl, ceil, tag){
    group(tag);
    const F=FLOORS[key], Z=lvl+0.02;
    (F.furn||[]).forEach(f=>{
      const r=f.r, x0=X0+r[0], y0=Y0+r[1], x1=X0+r[2], y1=Y0+r[3];
      const cx=(x0+x1)/2, cy=(y0+y1)/2, w=x1-x0, l=y1-y0;
      const rm=roomOf(key,r), fc=facing(rm,r), t=f.t, n=f.n||'';
      switch(t){
        case 'bed':      bed(cx,cy,w,l,Z, fc, M.fabricW, M.fabric); break;
        case 'sofa':     sofa(cx,cy,w,l,Z, fc); break;
        case 'table':    table(cx,cy,w,l,Z, l<0.75?0.42:0.75, l<0.75?M.woodDk:M.woodLt); break;
        case 'chair':    chair(cx,cy,Z, fc); break;
        case 'wc':       wc(cx,cy,Z, fc); break;
        case 'basin':    basin(cx,cy,Z, fc, Math.max(w,l)); break;
        case 'shower':   shower(x0,y0,x1,y1,Z, w>l?'x':'y'); break;
        case 'wet':      wetFloor(x0,y0,x1,y1,Z); break;
        case 'tub':      bathtub(x0,y0,x1,y1,Z); break;
        case 'sink':     break;                    // 水槽随台面一起做，见下
        case 'stove':    break;                    // 灶台同上
        case 'fridge':   fridge(x0,y0,x1,y1,Z); break;
        case 'shelf':    shelving(x0,y0,x1,y1,Z, 2.05); break;
        case 'counter':  counterRun(key,f,Z); break;
        default:         cabinet(x0,y0,x1,y1,Z, H[n]!==undefined?H[n]:0.80, n); break;
      }
    });
    lighting(key, ceil, Z);
  }
  /* 台面：厨房那三段 counter 要带水槽、灶、上柜和挡水；餐厅半岛只做台面不做上柜 */
  function counterRun(key,f,Z){
    const r=f.r, x0=X0+r[0], y0=Y0+r[1], x1=X0+r[2], y1=Y0+r[3];
    const F=FLOORS[key];
    const inside=(q)=> q[0]>=r[0]-0.10&&q[2]<=r[2]+0.10&&q[1]>=r[1]-0.10&&q[3]<=r[3]+0.10;
    const sk=(F.furn||[]).find(q=>q.t==='sink'&&inside(q.r));
    const hb=(F.furn||[]).find(q=>q.t==='stove'&&inside(q.r));
    const wall = (r[0]<0.30||r[2]>8.50||r[1]<0.30||r[3]>9.30);   // 贴外墙的才有上柜
    const o={};
    if(sk) o.sink=[X0+(sk.r[0]+sk.r[2])/2, Y0+(sk.r[1]+sk.r[3])/2];
    if(hb) o.hob =[X0+(hb.r[0]+hb.r[2])/2, Y0+(hb.r[1]+hb.r[3])/2];
    if(wall){ o.splash=1; if(!sk||hb) o.upper=1; }
    kitchenRun(x0,y0,x1,y1,Z,o);
  }
  function cabinet(x0,y0,x1,y1,z,h,n){
    if(/衣柜/.test(n)) return wardrobe(x0,y0,x1,y1,z,h,(x1-x0)>(y1-y0)?'x':'y');
    if(/电视柜/.test(n)){ tvUnit((x0+x1)/2,(y0+y1)/2,z,(y1-y0)<(x1-x0)?'n':'e',x1-x0); return; }
    if(/洗衣机/.test(n)){ const n2=Math.max(1,Math.round((x1-x0)/0.62));
      for(let i=0;i<n2;i++) washer(x0+(x1-x0)*(i+0.5)/n2, (y0+y1)/2, z); return; }
    box(x0,y0,z, x1,y1,z+h, M.woodLt);
    if(h>0.60){                                    // 柜门分格 + 拉手，免得看着像一块砖
      const ax=(x1-x0)>(y1-y0), n2=Math.max(2,Math.round((ax?x1-x0:y1-y0)/0.55));
      for(let i=1;i<n2;i++){ const t=i/n2;
        if(ax) box(x0+(x1-x0)*t-0.007,y0-0.005,z+0.02, x0+(x1-x0)*t+0.007,y1+0.005,z+h-0.02, M.woodDk);
        else   box(x0-0.005,y0+(y1-y0)*t-0.007,z+0.02, x1+0.005,y0+(y1-y0)*t+0.007,z+h-0.02, M.woodDk); }
    }
    if(/书桌|长书桌/.test(n)) box(x0+0.04,y0+0.04,z+h-0.05, x1-0.04,y1-0.04,z+h, M.woodDk);
  }
  function shelving(x0,y0,x1,y1,z,h){
    const ax=(x1-x0)>(y1-y0), n=Math.max(3,Math.round(h/0.45));
    box(x0,y0,z, x1,y1,z+0.04, M.woodDk);
    for(let i=1;i<=n;i++) box(x0,y0,z+h*i/n-0.02, x1,y1,z+h*i/n, M.woodDk);
    if(ax){ box(x0,y0,z, x0+0.03,y1,z+h, M.woodDk); box(x1-0.03,y0,z, x1,y1,z+h, M.woodDk); }
    else  { box(x0,y0,z, x1,y0+0.03,z+h, M.woodDk); box(x0,y1-0.03,z, x1,y1,z+h, M.woodDk); }
    for(let i=0;i<n;i++){                           // 随手码几个箱子，储物间空着不真实
      if((i*7)%3===0) continue;
      const t=(i+0.5)/n, u0=ax?x0+(x1-x0)*0.12:x0+0.05, u1=ax?x0+(x1-x0)*0.42:x1-0.05;
      box(u0, ax?y0+0.05:y0+(y1-y0)*0.15, z+h*i/n, u1, ax?y1-0.05:y0+(y1-y0)*0.55, z+h*i/n+h/n*0.62, i%2?M.cloth:M.brick);
    }
  }
  function wetFloor(x0,y0,x1,y1,z){                 // 无隔断淋浴区：找坡 + 地漏 + 花洒 + 玻璃挡板
    box(x0,y0,z, x1,y1,z+0.012, M.wetTile);
    cyl((x0+x1)/2,(y0+y1)/2, z+0.010, z+0.018, 0.05,0.05, 10, M.steel);
    const sx=x0+0.18, sy=y0+0.18;
    cyl(sx,sy,z+0.30, z+2.05, 0.016,0.016, 8, M.steel, false);
    box(sx-0.09,sy-0.09,z+2.02, sx+0.09,sy+0.09,z+2.07, M.steel);
    box(sx-0.05,sy-0.05,z+1.10, sx+0.05,sy+0.05,z+1.24, M.steel);
    if((x1-x0)>(y1-y0)) box(x0,y1-0.010,z, x0+(x1-x0)*0.45,y1+0.010,z+1.40, M.glass);
    else                box(x1-0.010,y0,z, x1+0.010,y0+(y1-y0)*0.45,z+1.40, M.glass);
  }
  /* 灯与风扇：每个房间按面积配吸顶灯，卧室客厅另加吊扇，卧室外墙上加空调内机。
     数量不是随手写的——热带自然通风房间，吊扇是把 28 ℃ 拉到体感 26 ℃ 的关键设备。 */
  function lighting(key, ceil, Z){
    (FLOORS[key].rooms||[]).forEach(rm=>{
      const[a,b,c,d]=rm.r, cx=X0+(a+c)/2, cy=Y0+(b+d)/2, w=c-a, l=d-b, A=w*l;
      const nx = w>3.6?2:1, ny = l>3.8?2:1;
      for(let i=0;i<nx;i++) for(let j=0;j<ny;j++){
        const px = X0+a + w*(i+0.5)/nx, py = Y0+b + l*(j+0.5)/ny;
        ceilLamp(px,py, ceil, A>14?0.24:A>7?0.18:0.13);
      }
      if(rm.t==='bed'||rm.t==='live'){
        ceilFan(cx, cy + (l>3.2?l*0.22:0), ceil);
        const wallN = (b<0.30);                    // 贴南外墙的房间把空调挂在南墙
        acUnit(cx, Y0+(wallN?b+0.18:d-0.18), Z+2.25, 'n');
      }
    });
  }
  place('f1', D.FF,  D.ceil1, 'furn1');
  place('f2', D.F1,  D.ceil2, 'furn2');
})();

/* ───────────────────────── 12. 场地 · 地形 · 分区铺装 ───────────────────────── */
group('site');
const FIELD=-0.55, ROAD=-0.15;
const field2 = mat('农田A',[62,92,42],.97,3), field3 = mat('农田B',[86,106,52],.97,3),
      field4 = mat('农田C',[70,98,50],.97,3);
face([-90,-90,FIELD],[110,-90,FIELD],[110,120,FIELD],[-90,120,FIELD], M.grass);
[[-52,4,-2,34,field2],[12,-4,46,26,field3],[-46,36,20,72,field4],[22,30,64,74,field2],
 [-40,-40,4,-10,field3],[14,-46,58,-8,field4],[-88,-20,-52,40,field4],[48,10,92,60,field3]]
 .forEach(f=>face([f[0],f[1],FIELD+0.01],[f[2],f[1],FIELD+0.01],[f[2],f[3],FIELD+0.01],[f[0],f[3],FIELD+0.01], f[4]));
box(-1.2,-8.0,FIELD, 11.2,0,ROAD, M.asphalt);
box(-1.2,-0.35,ROAD, 11.2,0,ROAD+0.02, M.concrete);
box(0,0,FIELD, 10,32,0, M.plinth, 'top');
/* 场地面：绕开泳池与鱼池开口 */
const POOL=[0.85,7.70,4.35,14.20], POND=[6.10,12.10,8.40,14.00];
[[0,0,10,7.70],[0,7.70,0.85,14.20],[4.35,7.70,6.10,14.20],[8.40,7.70,10,14.20],
 [6.10,7.70,8.40,12.10],[6.10,14.00,8.40,14.20],[0,14.20,10,32]]
 .forEach(r=>face([r[0],r[1],0],[r[2],r[1],0],[r[2],r[3],0],[r[0],r[3],0], M.grass));
const pave=(x0,y0,x1,y1,m)=>box(x0,y0,0.005, x1,y1,0.038, m||M.concrete);

/* ═══ 前院：南 → 北 = 停车 → 菜园果树 → 草坪 → 泳池凉亭 → 入户 ═══
   排序理由：泳池贴着房子，从客厅落地窗直接看到水面，孩子游泳大人在厅里看得见；
   离路 7.7 m，是院子里最私密的一段；泵房与管线紧贴主楼，比放到路边省约 $260。
   菜园放最外侧，日照最好（南向无遮挡），也方便从大门直接搬肥料进出。 */

/* ① 停车带 y 0.20–3.30 */
pave(0.35,0.20,9.65,3.30);
for(let x=1.9;x<9.6;x+=1.9) box(x,0.20,0.005, x+0.05,3.30,0.040, M.slab);   // 分格缝
box(0.60,0.60,0.038, 5.30,2.55,0.045, M.slab);                              // 车位画线底
box(5.70,0.60,0.038, 7.10,2.10,0.045, M.slab);                              // 摩托车位

/* ② 菜园带 y 3.50–6.30：四条砌边高畦 + 堆肥 + 爬藤棚架 */
box(0.36,3.44,0, 6.24,6.45,0.32, M.soil);              // 菜园客土（畦由第 18 节砌）
pave(6.60,3.50,9.65,6.30, M.gravel);                    // 菜园东侧碎石工作面
box(8.90,3.70,0, 9.55,4.50,0.72, M.woodDk);             // 堆肥箱（禽粪 + 菜叶）
box(8.86,4.66,0, 9.59,4.72,1.85, M.metalDk);            // 工具挂架立杆
box(8.86,4.66,1.75, 9.59,5.50,1.85, M.metalDk);

/* ③ 草坪过渡带 y 6.30–7.40：汀步穿过 */
for(let y=6.40;y<7.35;y+=0.46) box(6.95,y,0.005, 7.95,y+0.32,0.042, M.slab);
for(let y=6.40;y<7.35;y+=0.46) box(2.10,y,0.005, 3.10,y+0.32,0.042, M.slab);

/* ④ 泳池 · 凉亭 · 锦鲤池带 y 7.40–14.30 */
pave(0.35,7.20,0.85,14.30, M.floorTile);                // 池边（西）
pave(4.35,7.20,5.45,14.30, M.floorTile);                // 池边（东，1.10 m 走边）
pave(0.85,7.20,4.35,7.70, M.floorTile);                 // 池边（南）
pave(0.85,14.20,4.35,14.30, M.floorTile);               // 池边（北，接门廊）
pave(5.45,7.40,9.65,12.00, M.floorTile);                // 凉亭区
pave(5.45,12.00,6.10,14.30, M.floorTile);
pave(8.40,12.00,9.65,14.30, M.floorTile);
pave(6.10,14.00,8.40,14.30, M.floorTile);

/* ⑤ 两侧通道（沿房子，兼排水与果树带） */
pave(0.06,14.30,0.62,29.00, M.gravel);
pave(9.50,14.30,9.94,29.00, M.gravel);

/* ⑥ 后端服务带 y 29.00–32.00：禽舍 · 晾衣 · 堆肥 · 化粪池 · 空调外机
   放在这里的理由：紧贴厨房后门，喂鸡倒垃圾不用绕房子；从前院完全看不见；
   雨季西南风由前院吹向后端，气味顺风带走，不会回到泳池那一侧。 */
pave(0.35,29.00,9.65,32.00);
box(6.40,29.05,0, 9.65,31.87,0.05, M.sandy);            // 禽舍垫沙
box(4.70,29.30,0, 6.10,30.30,0.02, M.concrete);         // 化粪池盖板
box(0.40,30.60,0, 0.46,31.90,2.30, M.metalDk);          // 晾衣杆立柱
box(4.20,30.60,0, 4.26,31.90,2.30, M.metalDk);
for(let i=0;i<3;i++) box(0.40,30.75+i*0.42,2.05, 4.26,30.79+i*0.42,2.09, M.steel);
box(0.40,29.20,0, 1.90,29.95,0.85, M.woodDk);           // 农具/饲料柜

/* 排水明沟：全场地环通，坡向路边市政沟 */
box(0.06,3.4,0.005, 0.30,31.4,0.045, M.concrete);
box(0.10,3.4,0.02, 0.26,31.4,0.05, M.metalDk);
box(9.70,3.4,0.005, 9.94,31.4,0.045, M.concrete);
box(9.74,3.4,0.02, 9.90,31.4,0.05, M.metalDk);

/* ───────────────────────── 13. 围墙 · 大门 · 门口细部 ───────────────────────── */
function pillar(cx,cy,h,lamp){
  box(cx-0.17,cy-0.17,0, cx+0.17,cy+0.17,h, M.brick);
  box(cx-0.21,cy-0.21,h, cx+0.21,cy+0.21,h+0.09, M.concrete);
  if(lamp){ box(cx-0.08,cy-0.08,h+0.09, cx+0.08,cy+0.08,h+0.14, M.metalDk);
    box(cx-0.10,cy-0.10,h+0.14, cx+0.10,cy+0.10,h+0.34, M.lamp);
    box(cx-0.12,cy-0.12,h+0.34, cx+0.12,cy+0.12,h+0.40, M.metalDk); }
}
function wallRun(dir,u0,u1,v,h){
  const t=0.06;
  if(dir==='x'){ box(u0,v-t,0, u1,v+t,h, M.brick); box(u0,v-0.10,h, u1,v+0.10,h+0.07, M.concrete); }
  else { box(v-t,u0,0, v+t,u1,h, M.brick); box(v-0.10,u0,h, v+0.10,u1,h+0.07, M.concrete); }
}
const WH=1.90;
wallRun('x',0,1.05,0,WH); wallRun('x',5.35,6.65,0,WH); wallRun('x',7.85,10,0,WH);
wallRun('y',0.30,12.4,0,WH); wallRun('y',0.30,12.4,10,WH);
pillar(0.12,0.12,WH,0); pillar(1.20,0.10,WH+0.15,1); pillar(5.20,0.10,WH+0.15,1);
pillar(6.80,0.10,WH,1); pillar(7.70,0.10,WH,1); pillar(9.88,0.12,WH,0);
for(let y=3.0;y<12.4;y+=3.0){ pillar(0.10,y,WH,0); pillar(9.90,y,WH,0); }
for(let y=12.4;y<32;y+=2.4){ box(0.04,y,0,0.14,y+0.10,1.80, M.metalDk); box(9.86,y,0,9.96,y+0.10,1.80, M.metalDk); }
for(let x=0.1;x<10;x+=2.4) box(x,31.88,0, x+0.10,31.98,1.80, M.metalDk);
for(const z of [0.20,0.92,1.68]){
  box(0.02,12.4,z, 0.09,32,z+0.06, M.mesh); box(9.91,12.4,z, 9.98,32,z+0.06, M.mesh);
  box(0,31.91,z, 10,31.98,z+0.06, M.mesh); }
group('yard');
box(0.13,12.6,0, 0.52,31.7,0.95, M.hedge); box(9.48,12.6,0, 9.87,31.7,0.95, M.hedge);
box(0.52,31.52,0, 9.48,31.91,0.95, M.hedge);
group('site');
// 车行门（推拉，带地轨与导向轮）
box(1.22,-0.02,0, 5.18,0.02,0.06, M.steel);
box(1.25,-0.05,0.08, 5.15,0.05,0.20, M.metalDk);
box(1.25,-0.05,1.55, 5.15,0.05,1.70, M.metalDk);
for(let x=1.32;x<5.12;x+=0.155) box(x,-0.035,0.20, x+0.045,0.035,1.55, M.metalDk);
for(let x=1.32;x<5.12;x+=0.62) box(x-0.02,-0.05,0.78, x+0.10,0.05,0.92, M.louver);
cyl(1.30,0.00,0.02, 0.08, 0.055,0.055, 8, M.steel); cyl(5.10,0.00,0.02, 0.08, 0.055,0.055, 8, M.steel);
// 人行门
box(6.86,-0.04,0.05, 7.64,0.04,0.14, M.metalDk);
box(6.86,-0.04,1.62, 7.64,0.04,1.72, M.metalDk);
for(let x=6.92;x<7.60;x+=0.135) box(x,-0.03,0.14, x+0.04,0.03,1.62, M.metalDk);
box(7.52,-0.075,0.92, 7.60,0.075,1.02, M.steel);
// 门牌 / 信箱 / 门铃 / 监控
box(6.95,0.16,1.05, 7.55,0.20,1.27, M.steel);
box(5.42,0.14,1.00, 5.72,0.30,1.34, M.metalDk);
box(5.44,0.10,1.26, 5.70,0.16,1.30, M.steel);
box(6.66,0.12,1.28, 6.76,0.20,1.42, M.metalDk);
box(5.16,0.06,2.12, 5.28,0.20,2.24, M.metalDk);
// 庭院地灯
for(const p of [[6.42,1.0],[6.42,2.6],[6.42,4.2],[8.28,1.0],[8.28,2.6],[8.28,4.2]]){
  cyl(p[0],p[1],0.03, 0.62, 0.035,0.035, 8, M.metalDk, false);
  box(p[0]-0.07,p[1]-0.07,0.62, p[0]+0.07,p[1]+0.07,0.70, M.lamp); }
// 门口大盆栽
for(const p of [[6.40,0.62],[8.32,0.62]]){
  cyl(p[0],p[1],0.03, 0.46, 0.30,0.26, 12, M.brick);
  ball(p[0],p[1],0.86, 0.42,0.42,0.40, 12, M.foliage);
  ball(p[0]-0.2,p[1]+0.16,0.68, 0.26,0.26,0.24, 10, M.foliage2); }
// 摩托车
(function(){ const x=8.95,y=2.1;
  box(x-0.05,y-0.85,0.02, x+0.05,y-0.25,0.62, M.tyre);
  box(x-0.05,y+0.25,0.02, x+0.05,y+0.85,0.62, M.tyre);
  box(x-0.10,y-0.60,0.28, x+0.10,y+0.60,0.46, M.metalDk);
  box(x-0.14,y-0.10,0.46, x+0.14,y+0.42,0.70, M.carBody);
  box(x-0.16,y+0.10,0.70, x+0.16,y+0.50,0.82, M.fabric);
  box(x-0.30,y-0.62,0.78, x+0.30,y-0.56,0.84, M.steel);
  cyl(x,y-0.58,0.46, 0.80, 0.035,0.035, 8, M.steel, false); })();

/* ───────────────────────── 14. 汽车 ───────────────────────── */
group('yard');
(function(){ const x0=1.55,x1=6.15,y0=0.70,y1=2.55, z=0.038;
  box(x0,y0,z+0.26, x1,y1,z+0.78, M.carBody);
  box(x0+0.18,y0+0.05,z+0.20, x1-0.18,y1-0.05,z+0.30, M.carBody);
  box(x0+1.05,y0+0.09,z+0.78, x1-0.95,y1-0.09,z+1.28, M.carBody);
  box(x0+1.12,y0+0.06,z+0.84, x1-1.02,y1-0.06,z+1.20, M.carGlass);
  for(const p of [[x0+0.72,y0+0.02],[x1-0.62,y0+0.02],[x0+0.72,y1-0.24],[x1-0.62,y1-0.24]]){
    box(p[0]-0.30,p[1],z, p[0]+0.30,p[1]+0.22,z+0.60, M.tyre);
    box(p[0]-0.17,p[1]-0.012,z+0.13, p[0]+0.17,p[1]+0.232,z+0.47, M.steel); }
  box(x0-0.02,y0+0.12,z+0.52, x0+0.04,y0+0.42,z+0.66, M.lamp);
  box(x0-0.02,y1-0.42,z+0.52, x0+0.04,y1-0.12,z+0.66, M.lamp); })();

/* ───────────────────────── 15. 泳池与配套 ───────────────────────── */
function swimRing(cx,cy,z,R,r,m){
  const n=14;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2;
    ball(cx+Math.cos(a)*R, cy+Math.sin(a)*R, z, r,r,r*0.8, 6, m); }
}
(function(){
  const px0=POOL[0],py0=POOL[1],px1=POOL[2],py1=POOL[3], dp0=-0.95, dp1=-1.45;
  box(px0-0.22,py0-0.22,dp1, px0,py1+0.22,0, M.poolTile);
  box(px1,py0-0.22,dp1, px1+0.22,py1+0.22,0, M.poolTile);
  box(px0,py0-0.22,dp1, px1,py0,0, M.poolTile);
  box(px0,py1,dp1, px1,py1+0.22,0, M.poolTile);
  face([px0,py0,dp0],[px1,py0,dp0],[px1,py1,dp1],[px0,py1,dp1], M.poolTile);
  // 水线深色饰带
  for(const s of [[px0,py0-0.02,px1,py0+0.02],[px0,py1-0.02,px1,py1+0.02],
                  [px0-0.02,py0,px0+0.02,py1],[px1-0.02,py0,px1+0.02,py1]])
    box(s[0],s[1],-0.30, s[2],s[3],-0.18, M.metalDk);
  const cop=(a,b,c,d)=>box(a,b,0, c,d,0.09, M.slab);
  cop(px0-0.42,py0-0.42,px1+0.42,py0-0.22); cop(px0-0.42,py1+0.22,px1+0.42,py1+0.42);
  cop(px0-0.42,py0-0.42,px0-0.22,py1+0.42); cop(px1+0.22,py0-0.42,px1+0.42,py1+0.42);
  for(let i=0;i<3;i++) box(px0+0.05,py0+0.05+i*0.32, -0.22-i*0.24, px0+1.20,py0+0.37+i*0.32, -0.22-i*0.24+0.06, M.poolTile);
  cyl(px0+1.40,py0+0.30,0.02, 0.95, 0.028,0.028, 8, M.steel, false);
  cyl(px0+1.40,py0+0.85,0.02, 0.95, 0.028,0.028, 8, M.steel, false);
  box(px0+1.37,py0+0.30,0.90, px0+1.43,py0+0.85,0.96, M.steel);
  box(px1-0.28,py1-0.60,-0.24, px1-0.02,py1-0.10,-0.02, M.metalDk);   // 撇沫器
  group('water');
  face([px0,py0,-0.10],[px1,py0,-0.10],[px1,py1,-0.10],[px0,py1,-0.10], M.water);
  group('yard');
  swimRing(1.85,9.50,-0.05, 0.36,0.09, M.ringFloat);
  swimRing(3.30,12.40,-0.05, 0.30,0.08, M.lotusFl);
  box(1.10,13.20,-0.06, 2.30,13.32,0.02, M.ringFloat);                 // 浮条
  /* 水泵与砂缸放池子北端、紧贴门廊：到机房管长 <2 m，比放路边省约 $260；
     离一层卧室 8 m 以上，做吸音箱后夜间泳池过滤不影响睡眠 */
  box(4.95,13.35,0.038, 5.38,14.15,0.78, M.metalDk);
  for(let i=0;i<5;i++) box(4.93,13.45+i*0.14,0.20, 4.97,13.55+i*0.14,0.66, M.steel);  // 吸音百叶
  cyl(4.80,12.55,0.038, 2.30, 0.035,0.035, 8, M.steel, false);         // 户外冲脚淋浴
  box(4.66,12.47,2.22, 4.94,12.67,2.28, M.steel);
  for(const yy of [9.10,10.60]){                                        // 躺椅
    box(4.47,yy,0.30, 5.15,yy+0.62,0.36, M.fabricW);
    box(4.99,yy,0.36, 5.15,yy+0.62,0.74, M.fabricW);
    for(const q of [[4.53,yy+0.05],[5.09,yy+0.05],[4.53,yy+0.55],[5.09,yy+0.55]])
      cyl(q[0],q[1],0.038, 0.30, 0.022,0.022, 6, M.steel, false); }
  box(4.53,11.45,0.038, 5.11,11.95,0.46, M.rattan);                    // 边几
  cyl(4.80,8.40,0.038, 2.25, 0.035,0.035, 8, M.steel, false);          // 遮阳伞
  cyl(4.80,8.40,2.05, 2.30, 1.20,0.06, 12, M.cloth);
  box(4.45,7.30,0.038, 5.17,7.90,1.55, M.rattan);                      // 毛巾架/储物
})();

/* ───────────────────────── 16. 凉亭（配桌椅长凳灯扇） ───────────────────────── */
(function(){
  const x0=5.85,x1=9.15,y0=8.10,y1=11.40, ph=2.55, rz=3.42;
  box(x0,y0,0.03, x1,y1,0.17, M.floorTile);
  for(const p of [[x0+0.20,y0+0.20],[x1-0.20,y0+0.20],[x0+0.20,y1-0.20],[x1-0.20,y1-0.20]]){
    box(p[0]-0.10,p[1]-0.10,0.17, p[0]+0.10,p[1]+0.10,ph, M.woodDk);
    box(p[0]-0.13,p[1]-0.13,0.17, p[0]+0.13,p[1]+0.13,0.32, M.concrete); }
  box(x0+0.06,y0+0.10,ph, x1-0.06,y0+0.30,ph+0.17, M.woodDk);
  box(x0+0.06,y1-0.30,ph, x1-0.06,y1-0.10,ph+0.17, M.woodDk);
  box(x0+0.10,y0+0.06,ph, x0+0.30,y1-0.06,ph+0.17, M.woodDk);
  box(x1-0.30,y0+0.06,ph, x1-0.10,y1-0.06,ph+0.17, M.woodDk);
  const e=ph+0.17, ex0=x0-0.45,ex1=x1+0.45,ey0=y0-0.45,ey1=y1+0.45, rx=(x0+x1)/2;
  const R0=[rx,y0+0.85,rz], R1=[rx,y1-0.85,rz];
  face([ex0,ey0,e],[ex0,ey1,e],R1,R0,M.roofTile,true);
  face([ex1,ey1,e],[ex1,ey0,e],R0,R1,M.roofTile,true);
  tri3([ex0,ey0,e],R0,[ex1,ey0,e],M.roofTile,true);
  tri3([ex1,ey1,e],R1,[ex0,ey1,e],M.roofTile,true);
  face([ex0,ey0,e],[ex1,ey0,e],[ex1,ey1,e],[ex0,ey1,e],M.woodLt);
  box(rx-0.11,y0+0.65,rz-0.05, rx+0.11,y1-0.65,rz+0.06, M.fascia);
  for(let y=ey0+0.4;y<ey1;y+=0.55){ box(ex0+0.02,y,e-0.11, x0,y+0.06,e-0.02, M.woodDk);
    box(x1,y,e-0.11, ex1-0.02,y+0.06,e-0.02, M.woodDk); }
  // 茶桌 + 四椅 + 两长凳
  table(7.70,22.85,1.10,0.75,0.17,0.74,M.woodLt);
  chair(6.95,22.85,0.17,'e',M.rattan); chair(8.45,22.85,0.17,'w',M.rattan);
  chair(7.70,22.20,0.17,'n',M.rattan); chair(7.70,23.50,0.17,'s',M.rattan);
  box(6.30,23.95,0.17, 9.10,24.35,0.20, M.woodLt);          // 长凳
  for(const bx of [6.50,7.70,8.90]) box(bx-0.06,24.02,0.17, bx+0.06,24.28,0.17, M.woodDk);
  for(const bx of [6.50,7.70,8.90]) box(bx-0.06,24.02,0.17, bx+0.06,24.28,0.36, M.woodDk);
  box(6.30,23.95,0.36, 9.10,24.35,0.42, M.woodLt);
  box(6.30,21.55,0.17, 6.70,23.60,0.20, M.woodLt);
  for(const by of [21.75,22.55,23.35]) box(6.36,by-0.06,0.17, 6.64,by+0.06,0.36, M.woodDk);
  box(6.30,21.55,0.36, 6.70,23.60,0.42, M.woodLt);
  // 茶具
  cyl(7.55,22.85,0.91, 1.02, 0.09,0.07, 10, M.ceramic);
  for(const q of [[7.90,22.68],[7.90,23.02],[8.05,22.85]]) cyl(q[0],q[1],0.91, 0.955, 0.045,0.045, 8, M.ceramic);
  // 吊灯 + 吊扇
  cyl(rx-0.55,22.85,ph+0.05, ph+0.14, 0.02,0.02, 6, M.metalDk, false);
  ball(rx-0.55,22.85,ph-0.10, 0.15,0.15,0.14, 10, M.lamp);
  ceilFan(rx+0.45,23.60,ph+0.10);
  box(9.10,21.35,0.17, 9.30,21.75,1.05, M.metalDk);         // 户外插座柱
})();

/* ───────────────────────── 17. 锦鲤池（下沉景观 + 荷花） ───────────────────────── */
(function(){
  const x0=POND[0],y0=POND[1],x1=POND[2],y1=POND[3], d=-0.95;
  face([x0,y0,d],[x1,y0,d],[x1,y1,d],[x0,y1,d], M.rock);
  box(x0-0.14,y0-0.14,d, x0,y1+0.14,0, M.rock);
  box(x1,y0-0.14,d, x1+0.14,y1+0.14,0, M.rock);
  box(x0,y0-0.14,d, x1,y0,0, M.rock);
  box(x0,y1,d, x1,y1+0.14,0, M.rock);
  // 自然置石压边
  for(const r of [[x0-0.18,y0-0.10,0.30],[x0-0.10,y1+0.06,0.26],[x1+0.14,y0+0.30,0.28],
                  [x1+0.06,y1+0.02,0.30],[x0+0.70,y0-0.22,0.24],[x0+1.60,y1+0.20,0.26],
                  [x1-0.40,y0-0.20,0.22]])
    ball(r[0],r[1],0.03, r[2],r[2]*0.85,r[2]*0.60, 8, M.rock);
  group('water');
  face([x0,y0,-0.12],[x1,y0,-0.12],[x1,y1,-0.12],[x0,y1,-0.12], M.pondWater);
  group('yard');
  // 荷花：荷叶 + 花 + 立叶
  for(const lp of [[6.75,26.05,0.26],[7.35,26.55,0.30],[8.05,26.15,0.24],
                   [7.65,27.10,0.28],[6.90,27.05,0.22],[8.30,26.85,0.26]])
    cyl(lp[0],lp[1],-0.12,-0.095, lp[2],lp[2], 12, M.lotusPad);
  for(const fl of [[7.05,26.35],[7.95,26.75]]){
    cyl(fl[0],fl[1],-0.12, 0.20, 0.022,0.022, 6, M.veg, false);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2;
      ball(fl[0]+Math.cos(a)*0.075, fl[1]+Math.sin(a)*0.075, 0.245, 0.055,0.055,0.085, 6, M.lotusFl); }
    ball(fl[0],fl[1],0.265, 0.05,0.05,0.06, 6, M.lotusFl); }
  for(const st of [[6.60,26.80],[8.35,26.35]]){
    cyl(st[0],st[1],-0.12, 0.34, 0.02,0.02, 6, M.veg, false);
    cyl(st[0],st[1],0.32, 0.35, 0.20,0.20, 10, M.lotusPad); }
  // 跌水置石 + 过滤箱
  box(8.55,27.55,0.05, 8.95,28.10,0.80, M.rock);
  box(8.60,27.42,0.60, 8.90,27.60,0.70, M.rock);
  group('water');
  box(8.66,27.44,0.18, 8.84,27.58,0.64, M.pondWater);
  group('yard');
  box(9.05,27.65,0.038, 9.55,28.35,0.62, M.metalDk);
  // 锦鲤与金鱼
  for(const f of [[6.95,26.30,0.16,M.ringFloat],[7.60,26.90,0.18,M.fabricW],
                  [8.15,26.45,0.14,M.tomato],[7.20,27.05,0.13,M.ringFloat]])
    ball(f[0],f[1],-0.30, f[2],f[2]*0.36,f[2]*0.30, 8, f[3]);
})();

/* ───────────────────────── 18. 菜园（真实作物） ───────────────────────── */
function crop(kind,x,y,s){
  s = s||1;
  if(kind==='tomato'){                                   // 番茄：支架 + 红果
    cyl(x,y,0.32, 0.32+1.05*s, 0.016,0.012, 6, M.bark, false);
    for(let i=0;i<4;i++) ball(x+(i%2?0.10:-0.10)*s, y+(i<2?0.08:-0.08)*s, 0.45+i*0.20*s, 0.15*s,0.15*s,0.13*s, 7, M.veg);
    for(const f of [[0.10,0.05,0.62],[-0.09,-0.06,0.82],[0.07,-0.08,1.02]])
      ball(x+f[0]*s,y+f[1]*s,0.32+f[2]*s, 0.045*s,0.045*s,0.045*s, 6, M.tomato);
  } else if(kind==='eggplant'){                          // 茄子：灌丛 + 紫果
    for(let i=0;i<3;i++) ball(x+(i-1)*0.13*s, y+((i%2)-0.5)*0.12*s, 0.50+i*0.10*s, 0.19*s,0.19*s,0.16*s, 7, M.veg);
    for(const f of [[0.14,-0.06],[-0.13,0.08]])
      ball(x+f[0]*s,y+f[1]*s,0.46*s+0.30, 0.045*s,0.045*s,0.10*s, 6, M.eggplant);
  } else if(kind==='onion'){                             // 洋葱：鳞茎 + 管叶
    ball(x,y,0.36, 0.09*s,0.09*s,0.075*s, 8, M.onionB);
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2;
      cyl(x+Math.cos(a)*0.03*s, y+Math.sin(a)*0.03*s, 0.38, 0.38+0.34*s, 0.016*s,0.008*s, 5, M.veg, false); }
  } else if(kind==='scallion'){                          // 大葱：直立管叶
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2;
      cyl(x+Math.cos(a)*0.025*s, y+Math.sin(a)*0.025*s, 0.32, 0.32+0.46*s, 0.014*s,0.007*s, 5, M.veg, false); }
    ball(x,y,0.35, 0.045*s,0.045*s,0.05*s, 6, M.fabricW);
  } else if(kind==='garlic'){                            // 大蒜：扁平带叶
    for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+0.5;
      box(x+Math.cos(a)*0.02*s-0.012*s, y+Math.sin(a)*0.02*s-0.012*s, 0.32,
          x+Math.cos(a)*0.09*s+0.012*s, y+Math.sin(a)*0.09*s+0.012*s, 0.32+0.32*s, M.veg); }
  } else if(kind==='bokchoy'){                           // 小白菜：莲座
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2;
      ball(x+Math.cos(a)*0.10*s, y+Math.sin(a)*0.10*s, 0.36, 0.085*s,0.085*s,0.10*s, 6, M.veg); }
    ball(x,y,0.39, 0.07*s,0.07*s,0.09*s, 6, M.fabricW);
  } else if(kind==='radish'){                            // 萝卜：露肩 + 叶簇
    ball(x,y,0.345, 0.065*s,0.065*s,0.05*s, 8, M.radishR);
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2;
      ball(x+Math.cos(a)*0.09*s, y+Math.sin(a)*0.09*s, 0.44, 0.075*s,0.075*s,0.11*s, 6, M.veg); }
  } else if(kind==='chili'){
    for(let i=0;i<3;i++) ball(x, y+((i%2)-0.5)*0.10*s, 0.48+i*0.11*s, 0.15*s,0.15*s,0.13*s, 7, M.veg);
    for(const f of [[0.09,0.04],[-0.08,-0.05]]) ball(x+f[0]*s,y+f[1]*s,0.72, 0.028*s,0.028*s,0.075*s, 6, M.tomato);
  }
}
(function(){
  const bx0=0.42, bx1=6.18, rows=[[3.62,4.32],[4.50,5.20],[5.38,6.08]];
  const plan=[['tomato','eggplant'],['bokchoy','radish'],['scallion','onion']];
  rows.forEach((r,ri)=>{
    box(bx0,r[0]-0.06,0.32, bx1,r[0],0.46, M.brick);
    box(bx0,r[1],0.32, bx1,r[1]+0.06,0.46, M.brick);
    box(bx0-0.06,r[0]-0.06,0.32, bx0,r[1]+0.06,0.46, M.brick);
    box(bx1,r[0]-0.06,0.32, bx1+0.06,r[1]+0.06,0.46, M.brick);
    box(bx0,r[0],0.32, bx1,r[1],0.40, M.soil);
    const mid=(r[0]+r[1])/2;
    for(let i=0;i<9;i++){ const x=bx0+0.42+i*0.62;
      crop(x < 3.2 ? plan[ri][0] : plan[ri][1], x, mid-0.16, 1);
      crop(x < 3.2 ? plan[ri][0] : plan[ri][1], x, mid+0.16, 0.9); }
  });
  // 第四畦：大蒜 + 辣椒（靠禽舍一侧）
  box(bx0,6.20,0.32, bx1,6.36,0.40, M.soil);
  for(let i=0;i<12;i++) crop(i<6?'garlic':'chili', bx0+0.40+i*0.46, 6.28, 0.9);
  // 爬藤棚架（苦瓜/丝瓜）
  for(let i=0;i<5;i++){ const x=0.55+i*1.42;
    cyl(x,3.58,0.46, 2.20, 0.035,0.030, 6, M.bark, false);
    cyl(x,6.32,0.46, 2.20, 0.035,0.030, 6, M.bark, false); }
  box(0.50,3.55,2.15, 6.15,3.61,2.20, M.bark);
  box(0.50,6.29,2.15, 6.15,6.35,2.20, M.bark);
  for(let i=0;i<5;i++){ const x=0.55+i*1.42; box(x-0.02,3.58,2.17, x+0.02,6.32,2.20, M.bark); }
  for(let i=0;i<24;i++){ const x=0.6+(i%12)*0.48, y=i<12?3.60:6.30;
    ball(x,y,1.80+((i*7)%5)*0.09, 0.17,0.11,0.15, 6, M.veg); }
  // 工具与堆肥
  box(0.40,27.70,0.005, 1.30,3.35,0.78, M.woodDk);
  cyl(1.70,2.95,0.005, 0.44, 0.20,0.20, 10, M.metalDk);
  box(2.10,27.75,0.005, 2.20,27.85,1.45, M.bark);
  box(2.35,27.75,0.005, 2.45,27.85,1.42, M.bark);
})();

/* ───────────────────────── 19. 禽舍（真实笼舍 + 活动场） ───────────────────────── */
(function(){
  const rx0=6.40, ry0=29.05, rx1=9.65, ry1=31.87;
  // 活动场围网
  for(let x=rx0;x<=rx1;x+=0.72) box(x,ry0,0.05, x+0.07,ry0+0.07,1.55, M.metalDk);
  for(let y=ry0;y<=ry1;y+=0.72){ box(rx0,y,0.05, rx0+0.07,y+0.07,1.55, M.metalDk); }
  for(const z of [0.18,0.80,1.44]){
    box(rx0,ry0+0.02,z, rx1,ry0+0.06,z+0.05, M.metalDk);
    box(rx0+0.02,ry0,z, rx0+0.06,ry1,z+0.05, M.metalDk); }
  group('glass');                                     // 网片走透明通道，才看得见笼内
  box(rx0,ry0+0.03,0.05, rx1,ry0+0.05,1.55, M.wire);
  box(rx0+0.03,ry0,0.05, rx0+0.05,ry1,1.55, M.wire);
  group('yard');
  // 遮阳顶（一半）
  face([rx0-0.05,ry0-0.05,1.72],[rx1+0.05,ry0-0.05,1.72],[rx1+0.05,ry0+1.45,1.60],[rx0-0.05,ry0+1.45,1.60], M.roofMetal);
  // 架空鸡笼 ×2（镀锌网 + 支腿 + 产蛋箱 + 栖架）
  for(let k=0;k<2;k++){
    const cx0=6.62+k*1.48, cy0=30.35, cx1=cx0+1.24, cy1=cy0+1.30, cz=0.55;
    for(const p of [[cx0+0.06,cy0+0.06],[cx1-0.06,cy0+0.06],[cx0+0.06,cy1-0.06],[cx1-0.06,cy1-0.06]])
      box(p[0]-0.045,p[1]-0.045,0.05, p[0]+0.045,p[1]+0.045,cz, M.metalDk);
    box(cx0,cy0,cz, cx1,cy1,cz+0.05, M.steel);        // 网底托盘
    box(cx0,cy0,cz+0.90, cx1,cy1,cz+0.95, M.roofMetal);
    group('glass');
    for(const s of [[cx0,cy0,cx1,cy0+0.04],[cx0,cy1-0.04,cx1,cy1],
                    [cx0,cy0,cx0+0.04,cy1],[cx1-0.04,cy0,cx1,cy1]])
      box(s[0],s[1],cz+0.05, s[2],s[3],cz+0.90, M.wire);
    group('yard');
    for(const s of [[cx0,cy0,cx1,cy0+0.05],[cx0,cy1-0.05,cx1,cy1]])
      for(const zz of [cz+0.05,cz+0.46,cz+0.86]) box(s[0],s[1],zz, s[2],s[3],zz+0.05, M.metalDk);
    box(cx0+0.10,cy1-0.02,cz+0.18, cx0+0.62,cy1+0.34,cz+0.62, M.woodDk);   // 产蛋箱
    box(cx0+0.12,cy1+0.02,cz+0.62, cx0+0.60,cy1+0.32,cz+0.66, M.woodLt);
    cyl(cx0+0.30,cy0+0.65,cz+0.34, cz+0.38, 0.025,0.025, 6, M.bark);        // 栖架
    box(cx0+0.16,cy0+0.60,cz+0.34, cx1-0.16,cy0+0.70,cz+0.38, M.bark);
    box(cx1-0.55,cy0-0.03,cz+0.10, cx1-0.12,cy0+0.02,cz+0.55, M.metalDk);   // 笼门
  }
  // 鸭舍（低棚 + 饮水池）
  box(8.55,29.20,0.05, 9.60,30.20,0.95, M.woodDk);
  face([8.48,29.13,1.18],[9.66,29.13,1.18],[9.66,30.27,1.02],[8.48,30.27,1.02], M.roofMetal);
  box(8.70,29.17,0.05, 9.10,29.23,0.62, M.metalDk);
  cyl(7.05,29.40,0.05, 0.20, 0.42,0.44, 14, M.concrete);
  group('water');
  cyl(7.05,29.40,0.17, 0.185, 0.36,0.36, 14, M.pondWater);
  group('yard');
  // 料槽与饮水器
  box(6.60,29.80,0.05, 7.55,30.00,0.22, M.metalDk);
  cyl(7.90,29.70,0.05, 0.32, 0.15,0.13, 10, M.steel);
  cyl(7.90,29.70,0.32, 0.46, 0.10,0.06, 10, M.steel);
  // 家禽
  const bird=(x,y,m,big)=>{ const s=big?1.15:1;
    ball(x,y,0.24*s, 0.13*s,0.18*s,0.145*s, 8, m);
    ball(x,y-0.15*s,0.37*s, 0.07*s,0.07*s,0.08*s, 6, m);
    box(x-0.02,y-0.24*s,0.35*s, x+0.02,y-0.17*s,0.39*s, M.lamp);
    box(x-0.03,y-0.02,0.02, x-0.01,y+0.02,0.13*s, M.lamp);
    box(x+0.01,y-0.02,0.02, x+0.03,y+0.02,0.13*s, M.lamp); };
  bird(6.85,30.55,M.hen); bird(7.45,29.95,M.hen); bird(8.25,30.70,M.hen);
  bird(6.70,31.20,M.fabricW); bird(7.90,31.05,M.hen);
  bird(7.30,29.05,M.duckW,1); bird(6.75,28.98,M.duckW,1); bird(8.05,29.30,M.duckW,1);
})();

/* ───────────────────────── 20. 树木与果园 ───────────────────────── */
function tree(x,y,h,r,kind){
  if(kind==='banana'){
    cyl(x,y,0, h*0.52, 0.13,0.09, 8, M.bark);
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+0.4, dx=Math.cos(a), dy=Math.sin(a);
      const b=h*0.50, t=h*0.95, L=r*1.5;
      face([x-dy*0.10,y+dx*0.10,b],[x+dy*0.10,y-dx*0.10,b],
           [x+dx*L+dy*0.30, y+dy*L-dx*0.30, t-r*0.30],
           [x+dx*L-dy*0.30, y+dy*L+dx*0.30, t-r*0.30], M.banana); }
    for(let i=0;i<5;i++) ball(x+0.10,y+0.10,h*0.48-i*0.09, 0.10,0.10,0.07, 6, M.veg);
    return;
  }
  if(kind==='papaya'){
    cyl(x,y,0, h*0.72, 0.10,0.07, 8, M.bark);
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, dx=Math.cos(a), dy=Math.sin(a);
      ball(x+dx*r*0.6, y+dy*r*0.6, h*0.72+0.06, r*0.42,r*0.42,0.10, 6, M.foliage); }
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+0.3;
      ball(x+Math.cos(a)*0.16, y+Math.sin(a)*0.16, h*0.60, 0.10,0.10,0.14, 6, M.veg); }
    return;
  }
  if(kind==='coconut'){                      // 椰子：高干 + 羽状叶 + 果串
    cyl(x,y,0, h*0.80, 0.20,0.13, 10, M.bark);
    for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, dx=Math.cos(a), dy=Math.sin(a);
      const b=h*0.79, L=r*1.9, dz=(i%2)?0.35:0.05;
      face([x-dy*0.10,y+dx*0.10,b],[x+dy*0.10,y-dx*0.10,b],
           [x+dx*L+dy*0.22, y+dy*L-dx*0.22, b+dz-r*0.55],
           [x+dx*L-dy*0.22, y+dy*L+dx*0.22, b+dz-r*0.55], M.frond); }
    for(const q of [[0.16,0.10],[-0.14,0.12],[0.05,-0.17]])
      ball(x+q[0],y+q[1],h*0.76, 0.11,0.11,0.13, 7, M.woodDk);
    return;
  }
  if(kind==='pomegranate'){                  // 石榴：矮丛 + 红果
    cyl(x,y,0, h*0.30, 0.09,0.07, 8, M.bark);
    ball(x,y,h*0.62, r,r*0.94,h*0.36, 12, M.foliage);
    ball(x+r*0.42,y-r*0.28,h*0.50, r*0.50,r*0.48,h*0.22, 10, M.foliage2);
    for(const f of [[0.44,0.20,0.60],[-0.38,0.30,0.55],[0.10,-0.46,0.66],[-0.20,-0.30,0.48]])
      ball(x+f[0]*r,y+f[1]*r,h*f[2], 0.055,0.055,0.06, 7, M.tomato);
    return;
  }
  if(kind==='acerola'){                      // 西印度樱桃（sơ ri）：小乔木 + 红果
    cyl(x,y,0, h*0.34, 0.08,0.06, 8, M.bark);
    ball(x,y,h*0.66, r,r*0.95,h*0.34, 12, M.foliage2);
    ball(x-r*0.36,y+r*0.30,h*0.52, r*0.48,r*0.46,h*0.20, 10, M.foliage);
    for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, rr=r*(0.55+0.35*((i*7)%3)/3);
      ball(x+Math.cos(a)*rr, y+Math.sin(a)*rr, h*(0.52+0.20*((i*5)%3)/3), 0.04,0.04,0.042, 6, M.tomato); }
    return;
  }
  if(kind==='jackfruit'){                    // 波罗蜜：干生果
    cyl(x,y,0, h*0.40, 0.14,0.10, 8, M.bark);
    ball(x,y,h*0.70, r,r*0.95,h*0.34, 12, M.foliage);
    ball(x+r*0.40,y+r*0.30,h*0.55, r*0.52,r*0.50,h*0.20, 10, M.foliage2);
    for(const f of [[0.16,0.10,0.30],[-0.14,0.12,0.44]])
      ball(x+f[0],y+f[1],h*f[2], 0.13,0.13,0.20, 8, M.veg);
    return;
  }
  const th=h*0.42;
  cyl(x,y,0, th, r*0.16, r*0.11, 8, M.bark);
  for(let i=0;i<3;i++){ const a=i/3*Math.PI*2+0.7;
    cyl(x+Math.cos(a)*r*0.22, y+Math.sin(a)*r*0.22, th*0.72, th+h*0.16, 0.055,0.04, 6, M.bark, false); }
  ball(x, y, th+h*0.30, r, r*0.92, h*0.30, 12, M.foliage);
  ball(x+r*0.42, y-r*0.30, th+h*0.20, r*0.55, r*0.52, h*0.20, 10, M.foliage2);
  ball(x-r*0.40, y+r*0.34, th+h*0.24, r*0.52, r*0.50, h*0.19, 10, M.foliage2);
  ball(x+r*0.10, y+r*0.16, th+h*0.46, r*0.55, r*0.52, h*0.18, 10, M.foliage);
  if(kind==='mango') for(const f of [[0.40,0.24,0.34],[-0.34,0.30,0.28],[0.12,-0.42,0.32]])
    ball(x+f[0]*r,y+f[1]*r,th+h*f[2], 0.06,0.06,0.085, 7, M.onionB);
}
group('yard');
/* 果树全部沿两侧边界种，只占 0.5 m 边条，树冠向院内挑出遮荫——
   这样「果树区」不额外吃掉一整块地，草坪和果树共用同一片地面，是真实庭院的做法。
   树种按西宁气候筛过：椰子、芒果、波罗蜜、香蕉、木瓜、番石榴、西印度樱桃都能结果；
   温带甜樱桃与柿子需要 400–1000 小时 7°C 以下低温春化，西宁全年无此条件，已剔除。 */
// 西边界果树带（自南向北）
tree(0.42,4.60,3.10,0.58,'papaya');
tree(0.42,6.90,3.00,0.56,'papaya');
tree(0.38,9.60,4.40,1.05,'jackfruit');              // 矮化波罗蜜
tree(0.40,12.60,3.90,1.15,'mango');
// 东边界果树带
/* 房子两侧的通道只有 0.65 m（西）和 0.55 m（东），第三版在这里种了六棵果树——
   这是错的：香蕉、木瓜、波罗蜜的树冠半径都在 0.55 m 以上，种下去树冠直接压在外墙上，
   叶子常年贴墙会让墙面长期潮湿发霉，根系还会顶坏散水。这两条通道的用途是排水沟 +
   检修通道 + 穿堂风的进风口，本来就不该种树。第四版全部去掉，果树只留在前院和后端。 */
tree(9.58,4.40,2.60,0.85,'acerola');                // 西印度樱桃（替代无法结果的甜樱桃）
tree(9.62,6.60,3.20,0.90,'banana');
tree(9.60,12.90,2.55,0.95,'pomegranate');
// 院内两株遮荫大树
tree(7.10,13.30,2.45,0.85,'acerola');               // 锦鲤池东北，给凉亭下午遮荫
tree(2.10,3.10,4.30,1.45,'mango');                  // 停车位北侧，给车遮荫
// 后端服务带：椰子放最北角，离泳池 22 m，落果砸不到人
tree(0.55,31.20,9.20,2.20,'coconut');
tree(9.55,30.90,2.70,0.60,'papaya');
// 远景农田树（地块外）
[[-4.6,4.0,5.4,1.7],[-3.4,26.0,4.6,1.4],[13.8,5.0,5.0,1.6],[12.6,29.5,4.2,1.3],
 [-6.4,35.6,4.8,1.5],[15.5,19.0,4.4,1.4],[-8.6,11.0,4.0,1.25],[14.2,-6.0,4.6,1.5],
 [-5.2,-5.0,4.2,1.35]].forEach(t=>tree(t[0],t[1],t[2],t[3],'mango'));
// 草坪灌木与庭院灯
for(const p of [[5.70,7.90],[9.30,7.60],[5.60,13.60],[9.35,13.90]])
  ball(p[0],p[1],0.30, 0.40,0.40,0.30, 10, M.hedge);
for(const p of [[5.60,9.20],[5.60,12.30],[9.45,8.30],[9.45,13.60],[5.60,3.40],[9.45,3.40]]){
  cyl(p[0],p[1],0.04, 0.58, 0.033,0.033, 8, M.metalDk, false);
  box(p[0]-0.07,p[1]-0.07,0.58, p[0]+0.07,p[1]+0.07,0.66, M.lamp); }
