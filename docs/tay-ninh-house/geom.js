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
  spCx:7.55, spCy:17.75, spR:1.00, spN:16, spCol:0.07
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

/* 一层外墙洞口（局部 lx 换算：X0+lx） */
wallOpen('x', X0,X1, Y0,Y0+w, D.FF,D.F1, M.wallOut, [
  {a:X0+1.00, b:X0+3.20, z0:0.50, z1:3.05},        // 客厅推拉门
  {a:X0+5.90, b:X0+6.90, z0:D.FF, z1:2.75}         // 入户门
]);
wallOpen('y', Y0,Y1, X0,X0+w, D.FF,D.F1, M.wallOut, [
  {a:Y0+1.60, b:Y0+3.20, z0:1.20, z1:2.95},        // 客厅侧窗
  {a:Y0+5.20, b:Y0+6.50, z0:1.35, z1:2.95},        // 餐厅侧窗
  {a:Y0+7.70, b:Y0+8.90, z0:1.55, z1:2.55}         // 卫4 高窗
]);
wallOpen('y', Y0,Y1, X1-w,X1, D.FF,D.F1, M.wallOut, [
  {a:Y0+2.30, b:Y0+3.60, z0:1.35, z1:2.95},        // 楼梯窗
  {a:Y0+5.80, b:Y0+6.90, z0:1.70, z1:2.60},        // 公厕高窗
  {a:Y0+7.90, b:Y0+8.90, z0:1.55, z1:2.55}         // 储物窗
]);
wallOpen('x', X0,X1, Y1-w,Y1, D.FF,D.F1, M.wallOut, [
  {a:X0+1.40, b:X0+3.00, z0:1.35, z1:2.75},        // 次卧4 后窗
  {a:X0+5.45, b:X0+6.30, z0:D.FF, z1:2.55}         // 走廊 → 后附房
]);
/* 后附房外墙 */
wallOpen('y', AY0,AY1, X0,X0+w, D.FF,D.annexTop, M.wallOut, [
  {a:AY0+0.70, b:AY0+2.60, z0:1.30, z1:2.75}       // 厨房大窗（操作台上方）
]);
wallOpen('y', AY0,AY1, X1-w,X1, D.FF,D.annexTop, M.wallOut, [
  {a:AY0+0.50, b:AY0+1.40, z0:1.55, z1:2.55},      // 洗衣房窗
  {a:AY0+2.30, b:AY0+3.10, z0:1.75, z1:2.55}       // 淋浴间高窗
]);
wallOpen('x', X0,X1, AY1-w,AY1, D.FF,D.annexTop, M.wallOut, [
  {a:X0+0.80, b:X0+1.80, z0:D.FF, z1:2.55},        // 厨房后门（通后院操作台）
  {a:X0+3.20, b:X0+4.60, z0:1.30, z1:2.55},        // 厨房后窗
  {a:X0+5.45, b:X0+6.30, z0:D.FF, z1:2.55},        // 走廊 → 后院 主通道
  {a:X0+7.10, b:X0+8.00, z0:D.FF, z1:2.55}         // 泳池淋浴间外门
]);
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
wallOpen('x', X0,X1, Y0,Y0+w, D.F1,D.F2, M.wallOut, [
  {a:X0+2.00, b:X0+3.60, z0:4.15, z1:6.55},        // 主卧阳台门
  {a:X0+6.20, b:X0+7.60, z0:4.55, z1:6.35}         // 楼梯厅窗
]);
wallOpen('y', Y0,Y1, X0,X0+w, D.F1,D.F2, M.wallOut, [
  {a:Y0+0.60, b:Y0+1.70, z0:5.05, z1:6.25},        // 衣帽间高窗
  {a:Y0+2.60, b:Y0+3.90, z0:4.95, z1:6.25},        // 主卫窗
  {a:Y0+4.90, b:Y0+6.20, z0:4.95, z1:6.25},        // 卫1 窗
  {a:Y0+7.50, b:Y0+8.80, z0:4.95, z1:6.25}         // 卫2 窗
]);
wallOpen('y', Y0,Y1, X1-w,X1, D.F1,D.F2, M.wallOut, [
  {a:Y0+2.30, b:Y0+3.60, z0:4.65, z1:6.25},        // 楼梯井采光
  {a:Y0+5.80, b:Y0+7.40, z0:4.55, z1:6.25}         // 二层起居窗
]);
wallOpen('x', X0,X1, Y1-w,Y1, D.F1,D.F2, M.wallOut, [
  {a:X0+2.20, b:X0+3.30, z0:4.65, z1:6.25},        // 次卧2 后窗
  {a:X0+6.60, b:X0+8.10, z0:4.15, z1:6.35}         // 后阳台门
]);
group('ceil2'); box(IX0,IY0,D.ceil2, IX1,IY1,D.ceil2+0.03, M.ceil);
group('roof'); box(X0,Y0,D.F2, X1,Y1,D.F2+0.14, M.slab);
group('shell2');

/* 门窗构件 */
group('glass');
glazing('x', X0+1.00,X0+3.20, 0.50,3.05, Y0,Y0+w, -1, {mull:2, transom:0.82});
glazing('y', Y0+1.60,Y0+3.20, 1.20,2.95, X0,X0+w, -1, {hood:1, bars:1});
glazing('y', Y0+5.20,Y0+6.50, 1.35,2.95, X0,X0+w, -1, {hood:1, bars:1});
glazing('y', Y0+7.70,Y0+8.90, 1.55,2.55, X0,X0+w, -1, {mull:0, bars:1});
glazing('y', Y0+2.30,Y0+3.60, 1.35,2.95, X1-w,X1, 1, {hood:1, bars:1});
glazing('y', Y0+5.80,Y0+6.90, 1.70,2.60, X1-w,X1, 1, {mull:0, bars:1});
glazing('y', Y0+7.90,Y0+8.90, 1.55,2.55, X1-w,X1, 1, {mull:0, bars:1});
glazing('x', X0+1.40,X0+3.00, 1.35,2.75, Y1-w,Y1, 1, {hood:1, bars:1});
glazing('y', AY0+0.70,AY0+2.60, 1.30,2.75, X0,X0+w, -1, {hood:1, bars:1});
glazing('y', AY0+0.50,AY0+1.40, 1.55,2.55, X1-w,X1, 1, {mull:0, bars:1});
glazing('y', AY0+2.30,AY0+3.10, 1.75,2.55, X1-w,X1, 1, {mull:0});
glazing('x', X0+3.20,X0+4.60, 1.30,2.55, AY1-w,AY1, 1, {hood:1, bars:1});
glazing('x', X0+2.00,X0+3.60, 4.15,6.55, Y0,Y0+w, -1, {mull:1, transom:0.80, sill:false});
glazing('x', X0+6.20,X0+7.60, 4.55,6.35, Y0,Y0+w, -1, {hood:1});
glazing('y', Y0+0.60,Y0+1.70, 5.05,6.25, X0,X0+w, -1, {mull:0});
glazing('y', Y0+2.60,Y0+3.90, 4.95,6.25, X0,X0+w, -1, {hood:1});
glazing('y', Y0+4.90,Y0+6.20, 4.95,6.25, X0,X0+w, -1, {hood:1});
glazing('y', Y0+7.50,Y0+8.80, 4.95,6.25, X0,X0+w, -1, {hood:1});
glazing('y', Y0+2.30,Y0+3.60, 4.65,6.25, X1-w,X1, 1, {hood:1});
glazing('y', Y0+5.80,Y0+7.40, 4.55,6.25, X1-w,X1, 1, {hood:1});
glazing('x', X0+2.20,X0+3.30, 4.65,6.25, Y1-w,Y1, 1, {mull:0, hood:1});
glazing('x', X0+6.60,X0+8.10, 4.15,6.35, Y1-w,Y1, 1, {mull:1, transom:0.80, sill:false});
group('shell1');
doorway('x', X0+5.90,X0+6.90, D.FF,2.75, Y0,Y0+w, -1, {leafMat:M.woodDk, ajar:0.82});
doorway('x', X0+5.45,X0+6.30, D.FF,2.55, Y1-w,Y1, 1, {open:1});
doorway('x', X0+0.80,X0+1.80, D.FF,2.55, AY1-w,AY1, 1, {leafMat:M.woodDk, glazed:1});
doorway('x', X0+5.45,X0+6.30, D.FF,2.55, AY1-w,AY1, 1, {leafMat:M.woodDk, glazed:1});
doorway('x', X0+7.10,X0+8.00, D.FF,2.55, AY1-w,AY1, 1, {leafMat:M.woodDk});

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

/* ───────────────────────── 9. 隔墙与内门 ───────────────────────── */
const L = (lx,ly)=>[X0+lx, Y0+ly];
function parts(list, z0, z1, m){
  for(const p of list){ const a=L(p[0],p[1]), b=L(p[2],p[3]);
    box(a[0],a[1],z0, b[0],b[1],z1, m||M.wallIn); }
}
group('part1');
/* 一层：客厅/餐厅 开放；次卧4、卫4 在西后；走廊贯通至后院 */
parts([
  [5.25,0.15,5.35,1.60],[5.25,2.55,5.35,4.60],       // 客厅|玄关（2.55-1.60 为宽开口）
  [5.25,4.70,5.35,5.60],[5.25,6.45,5.35,7.05],       // 餐厅|走廊（门 5.60-6.45）
  [0.15,7.05,1.75,7.15],[2.60,7.05,5.25,7.15],       // 餐厅|次卧4（门 1.75-2.60）
  [1.75,7.15,1.85,7.60],[1.75,8.40,1.85,9.45],       // 次卧4|卫4（门 7.60-8.40）
  [5.25,7.15,5.35,8.30],[5.25,9.10,5.35,9.45],       // 次卧4|走廊（门 8.30-9.10）
  [6.40,1.70,6.50,5.40],                              // 走廊|楼梯（楼梯由玄关直接进）
  [6.40,5.50,6.50,5.90],[6.40,6.70,6.50,7.30],       // 走廊|公厕（门 5.90-6.70）
  [6.40,7.40,6.50,7.90],[6.40,8.70,6.50,9.45],       // 走廊|储物（门 7.90-8.70）
  [6.50,5.40,8.65,5.50],                              // 楼梯|公厕
  [6.50,7.30,8.65,7.40]                               // 公厕|储物
], D.FF, D.ceil1);
parts([
  [5.25,9.75,5.35,10.75],[5.25,11.55,5.35,13.35],     // 厨房|后走廊（门洞 10.75-11.55）
  [6.40,9.75,6.50,10.15],[6.40,10.95,6.50,12.05],     // 后走廊|洗衣（门 10.15-10.95）
  [6.40,12.85,6.50,13.35],                            // 后走廊|淋浴更衣（门 12.05-12.85）
  [6.50,11.55,8.65,11.65]                             // 洗衣|淋浴
], D.FF, D.annexTop-0.10);
// 湿区墙砖（四面 12 mm 贴面，不是实心体块）
function wetLining(x0,y0,x1,y1,z0,h){
  const t=0.012;
  box(x0,y0,z0, x1,y0+t,z0+h, M.wetTile);
  box(x0,y1-t,z0, x1,y1,z0+h, M.wetTile);
  box(x0,y0+t,z0, x0+t,y1-t,z0+h, M.wetTile);
  box(x1-t,y0+t,z0, x1,y1-t,z0+h, M.wetTile);
  box(x0,y0,z0, x1,y1,z0+0.008, M.wetTile);   // 防水地砖
}
wetLining(X0+0.18,Y0+7.18, X0+1.78,Y0+9.42, D.FF, 1.85);   // 卫4
wetLining(X0+6.52,Y0+5.52, X0+8.62,Y0+7.28, D.FF, 1.85);   // 公厕
wetLining(X0+6.52,AY0+2.28, X0+8.62,AY0+3.92, D.FF, 1.85); // 泳池淋浴更衣
// 内门
doorway('x', X0+1.60,X0+2.55, D.FF,2.55, Y0+0.15,Y0+0.15, -1, {open:1});   // 占位（客厅无门）
doorway('y', Y0+5.60,Y0+6.45, D.FF,2.55, X0+5.25,X0+5.35, 1, {ajar:0.9});  // 餐厅
doorway('y', Y0+8.30,Y0+9.10, D.FF,2.55, X0+5.25,X0+5.35, 1, {ajar:0.60}); // 次卧4
doorway('x', X0+1.75,X0+2.60, D.FF,2.55, Y0+7.05,Y0+7.15, -1, {open:1});
doorway('y', Y0+7.60,Y0+8.40, D.FF,2.45, X0+1.75,X0+1.85, -1, {ajar:0.72});// 卫4
doorway('y', Y0+5.90,Y0+6.70, D.FF,2.45, X0+6.40,X0+6.50, -1, {ajar:0.75});// 公厕
doorway('y', Y0+7.90,Y0+8.70, D.FF,2.45, X0+6.40,X0+6.50, -1, {ajar:0.8}); // 储物
doorway('y', AY0+1.15,AY0+1.95, D.FF,2.45, X0+5.25,X0+5.35, 1, {open:1});  // 厨房宽门洞
doorway('y', AY0+0.55,AY0+1.35, D.FF,2.45, X0+6.40,X0+6.50, -1, {ajar:0.78});// 洗衣
doorway('y', AY0+2.45,AY0+3.25, D.FF,2.45, X0+6.40,X0+6.50, -1, {ajar:0.72});// 淋浴

group('part2');
/* 二层：三间卧室全部开门在走廊上 */
parts([
  [1.75,0.15,1.85,0.90],[1.75,1.70,1.85,2.90],        // 主卧|衣帽间（门洞 0.90-1.70）
  [1.75,3.70,1.85,4.30],                              // 主卧|主卫（门 2.90-3.70）
  [0.15,2.15,1.75,2.25],                              // 衣帽间|主卫
  [1.85,4.30,5.25,4.40],                              // 主卧|次卧1
  [1.75,4.40,1.85,5.20],[1.75,6.00,1.85,6.90],        // 次卧1|卫1（门 5.20-6.00）
  [0.15,6.90,5.25,7.00],                              // 次卧1|次卧2
  [1.75,7.00,1.85,7.20],[1.75,8.00,1.85,9.45],        // 次卧2|卫2（门 7.20-8.00）
  [5.25,0.15,5.35,1.70],
  [5.25,1.70,5.35,2.60],[5.25,3.40,5.35,4.30],        // 主卧门 2.60-3.40
  [5.25,4.40,5.35,5.20],[5.25,6.00,5.35,6.90],        // 次卧1门 5.20-6.00
  [5.25,7.00,5.35,7.80],[5.25,8.60,5.35,9.45],        // 次卧2门 7.80-8.60
  [6.40,1.70,6.50,5.40],
  [6.40,5.50,6.50,6.25],[6.40,7.05,6.50,7.80],        // 走廊|起居·书房（门 6.25-7.05）
  [6.40,7.90,6.50,8.20],[6.40,9.00,6.50,9.45],        // 走廊|后阳台（门洞 8.20-9.00）
  [6.50,5.40,8.65,5.50],
  [6.50,7.80,8.65,7.90]
], D.F1, D.ceil2);
wetLining(X0+0.18,Y0+2.28, X0+1.72,Y0+4.27, D.F1, 1.85);   // 主卫
wetLining(X0+0.18,Y0+4.43, X0+1.72,Y0+6.87, D.F1, 1.85);   // 卫1
wetLining(X0+0.18,Y0+7.03, X0+1.72,Y0+9.42, D.F1, 1.85);   // 卫2
doorway('y', Y0+2.60,Y0+3.40, D.F1,D.F1+2.10, X0+5.25,X0+5.35, 1, {ajar:0.9});
doorway('y', Y0+5.20,Y0+6.00, D.F1,D.F1+2.10, X0+5.25,X0+5.35, 1, {ajar:0.88});
doorway('y', Y0+7.80,Y0+8.60, D.F1,D.F1+2.10, X0+5.25,X0+5.35, 1, {ajar:0.88});
doorway('y', Y0+0.90,Y0+1.70, D.F1,D.F1+2.10, X0+1.75,X0+1.85, -1, {open:1});    // 衣帽间（无门扇）
doorway('y', Y0+2.90,Y0+3.70, D.F1,D.F1+2.10, X0+1.75,X0+1.85, -1, {ajar:0.72}); // 主卫
doorway('y', Y0+5.20,Y0+6.00, D.F1,D.F1+2.10, X0+1.75,X0+1.85, -1, {ajar:0.72}); // 卫1
doorway('y', Y0+7.20,Y0+8.00, D.F1,D.F1+2.10, X0+1.75,X0+1.85, -1, {ajar:0.72}); // 卫2
doorway('y', Y0+6.25,Y0+7.05, D.F1,D.F1+2.10, X0+6.40,X0+6.50, -1, {ajar:0.85}); // 起居·书房
doorway('y', Y0+8.20,Y0+9.00, D.F1,D.F1+2.10, X0+6.40,X0+6.50, -1, {open:1});    // 后阳台

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
   下面这一整块家具坐标是按「主楼前墙 y = 5.60」那一版世界坐标写的。
   第三版把房子整体北移到 y = 15.50，与其把几百个数字逐个改（极易改错），
   不如在这里套一层坐标包装：把每个摆放函数的 y 参数统一 +FY。
   房子将来再挪，只需要改 D.hy0，家具会跟着走。 */
(function(){
const FY = D.hy0 - 5.60;
const box=(x0,y0,z0,x1,y1,z1,m,sk)=>_box(x0,y0+FY,z0,x1,y1+FY,z1,m,sk);
const cyl=(cx,cy,z0,z1,r0,r1,sg,m,cap)=>_cyl(cx,cy+FY,z0,z1,r0,r1,sg,m,cap);
const bed=(cx,cy,w,l,z,d,m1,m2)=>_bed(cx,cy+FY,w,l,z,d,m1,m2);
const nightstand=(cx,cy,z)=>_nightstand(cx,cy+FY,z);
const wardrobe=(x0,y0,x1,y1,z,h,d)=>_wardrobe(x0,y0+FY,x1,y1+FY,z,h,d);
const sofa=(cx,cy,w,d,z,f)=>_sofa(cx,cy+FY,w,d,z,f);
const table=(cx,cy,w,d,z,h,m)=>_table(cx,cy+FY,w,d,z,h,m);
const chair=(cx,cy,z,d,m)=>_chair(cx,cy+FY,z,d,m);
const wc=(cx,cy,z,d)=>_wc(cx,cy+FY,z,d);
const basin=(cx,cy,z,d,w,t)=>_basin(cx,cy+FY,z,d,w,t);
const shower=(x0,y0,x1,y1,z,o)=>_shower(x0,y0+FY,x1,y1+FY,z,o);
const bathtub=(x0,y0,x1,y1,z)=>_bathtub(x0,y0+FY,x1,y1+FY,z);
const bathCabinet=(x0,y0,x1,y1,z,h)=>_bathCabinet(x0,y0+FY,x1,y1+FY,z,h);
const kitchenRun=(x0,y0,x1,y1,z,o)=>_kitchenRun(x0,y0+FY,x1,y1+FY,z,o);
const fridge=(x0,y0,x1,y1,z)=>_fridge(x0,y0+FY,x1,y1+FY,z);
const washer=(cx,cy,z)=>_washer(cx,cy+FY,z);
const tvUnit=(cx,cy,z,d,w)=>_tvUnit(cx,cy+FY,z,d,w);
const rug=(cx,cy,w,l,z)=>_rug(cx,cy+FY,w,l,z);
const ceilLamp=(cx,cy,z,r)=>_ceilLamp(cx,cy+FY,z,r);
const ceilFan=(cx,cy,z)=>_ceilFan(cx,cy+FY,z);
const acUnit=(cx,cy,z,d)=>_acUnit(cx,cy+FY,z,d);
const plantPot=(cx,cy,z,h)=>_plantPot(cx,cy+FY,z,h);
group('furn1');
const Z1=D.FF+0.02;
// 客厅 x 0.80–5.90, y 5.75–10.20
rug(3.10,8.35,3.20,2.30,Z1);
sofa(3.10,9.75,2.90,0.95,Z1,'s');
sofa(1.35,8.30,0.95,1.85,Z1,'e');
table(3.05,8.30,1.25,0.68,Z1,0.42,M.woodDk);
tvUnit(3.10,6.15,Z1,'n',2.10);
plantPot(5.55,6.20,Z1,1.40);
acUnit(3.10,5.95,Z1+2.25,'n');
ceilLamp(3.10,8.20,D.ceil1,0.26);
ceilFan(3.10,9.60,D.ceil1);
// 餐厅 x 0.80–5.90, y 10.30–12.65
table(3.20,11.45,1.70,0.95,Z1,0.75,M.woodLt);
chair(2.10,11.10,Z1,'e'); chair(2.10,11.80,Z1,'e');
chair(4.30,11.10,Z1,'w'); chair(4.30,11.80,Z1,'w');
chair(2.85,10.55,Z1,'n'); chair(3.55,10.55,Z1,'n');
chair(2.85,12.35,Z1,'s'); chair(3.55,12.35,Z1,'s');
ceilLamp(3.20,11.45,D.ceil1,0.17); ceilLamp(2.45,11.45,D.ceil1,0.17); ceilLamp(3.95,11.45,D.ceil1,0.17);
wardrobe(0.85,12.05,2.10,12.60,Z1,0.92,'x');
// 次卧4（适老客房）x 2.50–5.90, y 12.75–15.05
bed(4.05,13.85,1.55,2.00,Z1,'e',M.fabricW,M.fabric);
nightstand(4.05,14.95,Z1);
wardrobe(2.55,14.05,3.15,15.00,Z1,2.15,'y');
box(4.95,12.80,Z1, 5.85,13.40,Z1+0.74, M.woodLt);
chair(5.40,13.72,Z1,'s');
acUnit(4.20,12.85,Z1+2.25,'n');
ceilLamp(4.30,13.90,D.ceil1,0.19);
// 卫4 x 0.80–2.40, y 12.75–15.05（门在东墙 13.20–14.00；适老：坐便扶手 + 淋浴凳）
wc(1.15,14.62,Z1,'w'); basin(1.55,13.03,Z1,'n',0.76);
shower(1.60,14.08,2.35,15.00,Z1,'y');
box(0.86,14.20,Z1+0.70, 0.92,14.95,Z1+0.76, M.steel);   // 坐便扶手
box(1.72,14.30,Z1+0.06, 2.06,14.64,Z1+0.44, M.rattan);  // 淋浴凳
bathCabinet(0.85,13.40,1.25,14.05,Z1,1.70);
// 玄关 x 6.00–9.30, y 5.75–7.30
box(8.20,5.80,Z1, 9.25,6.35,Z1+0.50, M.woodDk);          // 换鞋凳
wardrobe(8.20,6.45,9.25,7.25,Z1,2.05,'y');               // 鞋柜
plantPot(7.85,5.98,Z1,1.15);                             // 贴前墙，让开入户→走廊与入户→楼梯两条线
ceilLamp(7.60,6.50,D.ceil1,0.15);
// 走廊 x 6.00–7.05
ceilLamp(6.52,8.60,D.ceil1,0.12); ceilLamp(6.52,11.60,D.ceil1,0.12); ceilLamp(6.52,14.30,D.ceil1,0.12);
// 公厕 x 7.15–9.30, y 11.10–12.90（门在西墙 11.50–12.30）
wc(7.60,12.62,Z1,'w'); basin(9.00,11.90,Z1,'w',0.70);
bathCabinet(8.95,12.30,9.25,12.85,Z1,1.60);
// 储物间 x 7.15–9.30, y 13.00–15.05（门在西墙 13.50–14.30）
for(let i=0;i<4;i++) box(7.20,13.05,Z1+0.35+i*0.52, 9.25,13.45,Z1+0.40+i*0.52, M.woodLt);
box(7.20,14.40,Z1, 8.10,15.00,Z1+0.85, M.woodDk);
cyl(8.70,14.60,Z1+0.05, Z1+1.35, 0.28,0.28, 12, M.tank);   // 生活水箱
box(9.20,14.30,Z1+1.45, 9.26,14.85,Z1+1.95, M.metalDk);    // 配电箱（东墙贴面）
// 厨房 x 0.80–5.90, y 15.35–18.95（L 形：西墙 + 北墙，门口完全空出）
kitchenRun(0.86,15.45,1.46,18.30,D.FF,{sink:[1.16,16.35], sinkBack:0.30, upper:1, splash:1});
kitchenRun(1.56,18.35,5.30,18.90,D.FF,{hob:[3.30,18.62], upper:1, splash:1});
fridge(4.95,15.45,5.85,16.15,D.FF);
box(2.30,16.30,D.FF, 4.30,17.30,D.FF+0.88, M.woodLt);       // 中岛
box(2.24,16.24,D.FF+0.88, 4.36,17.36,D.FF+0.94, M.slab);
for(const q of [[2.60,16.00],[3.30,16.00],[4.00,16.00]]) chair(q[0],q[1],D.FF,'n',M.rattan);
ceilLamp(3.30,16.80,D.annexTop-0.12,0.22); ceilLamp(1.60,17.50,D.annexTop-0.12,0.16);
acUnit(4.60,15.45,D.FF+2.25,'n');
// 洗衣房 x 7.15–9.30, y 15.35–17.15（门在西墙 15.75–16.55，机位全部靠东，门口留空）
washer(8.15,16.62,D.FF); washer(8.85,16.62,D.FF);
box(7.85,15.40,D.FF+0.80, 9.25,15.95,D.FF+0.90, M.slab);   // 折叠台面
box(7.85,15.40,D.FF+0.30, 9.25,15.95,D.FF+0.80, M.woodLt);
cyl(8.60,15.58,D.FF+1.35, D.FF+2.05, 0.20,0.20, 12, M.tank); // 电热水器
for(let i=0;i<3;i++) box(7.30,16.16,D.FF+1.32+i*0.42, 9.20,16.22,D.FF+1.36+i*0.42, M.steel); // 室内晾杆
// 泳池淋浴更衣 x 7.15–9.30, y 17.25–18.95（内门西墙 17.65–18.45；外门北墙 7.75–8.65）
shower(8.45,17.30,9.25,18.20,D.FF,'x');
wc(7.45,18.58,D.FF,'n'); basin(8.05,17.55,D.FF,'n',0.66);
box(7.20,17.30,D.FF, 7.72,17.62,D.FF+0.42, M.woodDk);       // 更衣凳
for(let i=0;i<4;i++) box(7.06,18.20+i*0.18,D.FF+1.55, 7.16,18.26+i*0.18,D.FF+1.62, M.steel); // 挂钩

/* —— 二层布置 —— */
group('furn2');
const Z2=D.F1+0.02;
// 主卧 x 2.50–5.90, y 5.75–9.90
bed(4.05,7.95,1.85,2.05,Z2,'e',M.fabricW,M.fabric);
nightstand(4.05,6.75,Z2); nightstand(4.05,9.15,Z2);
tvUnit(2.75,7.95,Z2,'w',1.60);
rug(3.60,7.95,1.70,2.30,Z2);
box(4.95,9.10,Z2, 5.85,9.85,Z2+0.74, M.woodLt);
chair(5.35,8.70,Z2,'n');
acUnit(4.20,5.95,Z2+2.25,'n');
ceilLamp(4.05,7.90,D.ceil2,0.26);
ceilFan(4.05,8.90,D.ceil2);
// 衣帽间 x 0.80–2.40, y 5.75–7.75（门洞在东墙 6.50–7.30，中间留 0.95 m 通道）
wardrobe(0.85,5.80,2.35,6.35,Z2,2.30,'x');
box(0.85,7.32,Z2+1.10, 2.35,7.72,Z2+1.16, M.woodLt);
box(0.85,7.32,Z2+1.80, 2.35,7.72,Z2+1.86, M.woodLt);
cyl(0.88,7.50,Z2+1.66, Z2+1.68, 0.016,0.016, 6, M.steel, false);
for(let i=0;i<6;i++) box(0.98+i*0.22,7.38,Z2+0.66, 1.12+i*0.22,7.64,Z2+1.62, M.cloth);
box(0.85,6.55,Z2, 1.40,7.15,Z2+0.45, M.woodDk);            // 抽屉柜靠西墙
ceilLamp(1.60,6.70,D.ceil2,0.13);
// 主卫 x 0.80–2.40, y 7.85–9.90（门在东墙 8.50–9.30）
wc(1.10,8.35,Z2,'w'); basin(1.85,8.10,Z2,'n',0.70);
shower(0.85,9.05,1.62,9.85,Z2,'y');
bathCabinet(2.05,9.35,2.35,9.85,Z2,1.60);
ceilLamp(1.60,9.10,D.ceil2,0.13);
// 次卧1 x 2.50–5.90, y 10.00–12.50
bed(3.95,11.10,1.55,2.00,Z2,'w',M.fabricW,M.fabric);
nightstand(3.95,12.25,Z2);
wardrobe(5.25,10.05,5.85,11.85,Z2,2.15,'y');
box(2.55,12.00,Z2, 3.05,12.45,Z2+0.74, M.woodLt);
acUnit(4.20,10.10,Z2+2.25,'n');
ceilLamp(4.05,11.20,D.ceil2,0.19);
// 卫1 x 0.80–2.40, y 10.00–12.50（含浴缸；门在东墙 10.80–11.60，正对洗手台）
bathtub(0.86,10.05,2.35,10.76,Z2);
wc(1.15,12.15,Z2,'w'); basin(1.15,11.35,Z2,'e',0.70);
bathCabinet(2.05,11.85,2.35,12.45,Z2,1.60);
ceilLamp(1.60,11.30,D.ceil2,0.13);
// 次卧2 x 2.50–5.90, y 12.60–15.05
bed(3.90,13.70,1.55,2.00,Z2,'w',M.fabricW,M.fabric);
nightstand(3.90,14.85,Z2);
wardrobe(5.25,12.65,5.85,14.45,Z2,2.15,'y');
box(2.55,14.55,Z2, 3.35,15.00,Z2+0.74, M.woodLt);
chair(3.00,14.20,Z2,'s');
acUnit(4.20,12.70,Z2+2.25,'n');
ceilLamp(4.00,13.80,D.ceil2,0.19);
// 卫2 x 0.80–2.40, y 12.60–15.05（门在东墙 12.80–13.60）
basin(1.45,12.88,Z2,'n',0.72);
shower(0.85,14.05,1.70,15.00,Z2,'y');
wc(2.10,14.60,Z2,'e');
bathCabinet(2.05,13.70,2.35,14.25,Z2,1.60);
ceilLamp(1.60,13.90,D.ceil2,0.13);
// 楼梯厅 x 6.00–9.30, y 5.75–7.30
sofa(6.70,6.15,1.30,0.75,Z2,'n');
table(8.15,6.20,0.72,0.52,Z2,0.42,M.woodDk);
plantPot(9.00,7.00,Z2,1.30);
ceilLamp(7.30,6.60,D.ceil2,0.16);
// 二层起居 / 书房 x 7.15–9.30, y 11.10–13.40（门在西墙 11.85–12.65）
box(7.20,11.20,Z2, 9.25,11.75,Z2+0.76, M.woodLt);          // 长书桌靠南墙
chair(8.15,12.10,Z2,'n'); chair(8.85,12.10,Z2,'n');
for(let i=0;i<3;i++) box(8.20,12.90,Z2+0.35+i*0.50, 9.25,13.35,Z2+0.40+i*0.50, M.woodLt);
sofa(7.80,13.00,0.90,0.72,Z2,'e');                          // 单人阅读椅
plantPot(9.05,12.30,Z2,1.00);
ceilLamp(8.20,12.20,D.ceil2,0.18);
acUnit(8.20,11.15,Z2+2.25,'n');
// 后阳台 x 7.15–9.30, y 13.50–15.05（门洞在西墙 13.80–14.60，晾杆全部退到 x≥7.85）
for(let i=0;i<2;i++) box(7.85,13.75+i*0.45,Z2+1.55, 9.20,13.77+i*0.45,Z2+1.57, M.steel);
for(let i=0;i<4;i++) box(7.95+i*0.30,13.70,Z2+0.85, 8.15+i*0.30,13.84,Z2+1.54, M.cloth);
box(8.65,14.55,Z2, 9.25,14.98,Z2+0.55, M.steel);
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
tree(0.44,17.90,3.10,0.58,'papaya');                // 西通道
tree(0.44,21.40,3.00,0.56,'papaya');
tree(0.38,26.00,4.20,1.00,'jackfruit');
// 东边界果树带
tree(9.58,4.40,2.60,0.85,'acerola');                // 西印度樱桃（替代无法结果的甜樱桃）
tree(9.62,6.60,3.20,0.90,'banana');
tree(9.60,12.90,2.55,0.95,'pomegranate');
tree(9.56,17.60,3.30,0.95,'banana');                // 东通道
tree(9.56,20.80,3.10,0.90,'banana');
tree(9.56,24.20,2.70,0.60,'papaya');
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
