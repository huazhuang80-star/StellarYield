/* ═══════════════════════════════════════════════════════════════════════
   西宁自建房 · 实时渲染与日照模拟
   WebGL2 · 阴影贴图 · 程序化材质 · 真实太阳轨迹
   坐标系：X = 东，Y = 北（地块纵深方向），Z = 上。临路面朝南。
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const cv = document.getElementById('c3d');
const gl = cv.getContext('webgl2', {antialias:true, alpha:false, powerPreference:'high-performance'});
if(!gl){
  const w = cv.parentElement;
  w.innerHTML = '<div style="padding:48px 24px;text-align:center;font-family:var(--sans);color:var(--muted)">'
    + '<p style="font-size:1.1rem;color:var(--ink);margin-bottom:8px">此设备不支持 WebGL2</p>'
    + '<p style="font-size:.9rem">实时渲染需要 WebGL2。请用较新的 Chrome、Safari 或 Edge 打开本页；'
    + '下方的平面图、立面图与剖面图不受影响，可正常查看。</p></div>';
  return;
}

/* ───────────────────────── 1. 数学 ───────────────────────── */
const M4 = {
  mul(a,b,o){ o=o||new Float32Array(16);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0;
      for(let k=0;k<4;k++) s += a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
    return o; },
  persp(fovy,asp,n,f){ const t=1/Math.tan(fovy/2), o=new Float32Array(16);
    o[0]=t/asp; o[5]=t; o[10]=(f+n)/(n-f); o[11]=-1; o[14]=2*f*n/(n-f); return o; },
  ortho(l,r,b,t,n,f){ const o=new Float32Array(16);
    o[0]=2/(r-l); o[5]=2/(t-b); o[10]=-2/(f-n); o[15]=1;
    o[12]=-(r+l)/(r-l); o[13]=-(t+b)/(t-b); o[14]=-(f+n)/(f-n); return o; },
  look(e,c,u){ const z=V.n(V.s(e,c)), x=V.n(V.c(u,z)), y=V.c(z,x), o=new Float32Array(16);
    o[0]=x[0];o[1]=y[0];o[2]=z[0];o[3]=0; o[4]=x[1];o[5]=y[1];o[6]=z[1];o[7]=0;
    o[8]=x[2];o[9]=y[2];o[10]=z[2];o[11]=0;
    o[12]=-V.d(x,e); o[13]=-V.d(y,e); o[14]=-V.d(z,e); o[15]=1; return o; }
};
const V = {
  s:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  a:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  m:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  d:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  c:(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
  n(a){ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; },
  len:a=>Math.hypot(a[0],a[1],a[2])
};

/* ───────────────────────── 2. 材质 ─────────────────────────
   kind: 0 抹灰 1 金属瓦 2 地砖 3 草 4 水 5 木 6 玻璃 7 混凝土
         8 清水砖 9 泥土 10 泳池砖 11 陶瓷洁具 12 织物 13 树叶
         14 沥青 15 深色金属 16 石材 17 绿篱 18 布料 19 自发光       */
const MATS = [];
function mat(name, rgb, rough, kind, opts){
  MATS.push({name, c:[rgb[0]/255,rgb[1]/255,rgb[2]/255], r:rough, k:kind,
             emi:(opts&&opts.emi)||0, alpha:(opts&&opts.alpha)!==undefined?opts.alpha:1});
  return MATS.length-1;
}
const M = {
  wallOut:   mat('外墙涂料',   [238,235,226], .92, 0),
  wallIn:    mat('内墙涂料',   [244,242,236], .94, 0),
  wallAccent:mat('深灰饰面',   [ 92, 94, 92], .85, 0),
  plinth:    mat('勒脚',       [122,116,105], .90, 7),
  roofMetal: mat('隔热彩钢瓦', [ 66, 68, 70], .58, 1),
  roofTile:  mat('仿瓦屋面',   [128, 74, 56], .78, 1),
  fascia:    mat('檐口收边',   [ 58, 60, 60], .70, 15),
  slab:      mat('楼板',       [178,174,164], .93, 7),
  ceil:      mat('吊顶',       [246,245,240], .95, 0),
  floorTile: mat('地砖',       [214,208,196], .35, 2),
  wetTile:   mat('卫浴墙砖',   [222,226,226], .30, 2),
  poolTile:  mat('泳池砖',     [ 86,170,190], .25, 10),
  woodDk:    mat('深木',       [104, 70, 44], .72, 5),
  woodLt:    mat('浅木',       [176,132, 84], .70, 5),
  louver:    mat('仿木格栅',   [162,114, 70], .66, 5),
  glass:     mat('玻璃',       [130,166,178], .06, 6, {alpha:.30}),
  metalDk:   mat('深色金属',   [ 74, 76, 78], .42, 15),
  steel:     mat('不锈钢',     [178,182,186], .28, 15),
  concrete:  mat('混凝土铺装', [152,148,139], .88, 7),
  brick:     mat('清水砖墙',   [166,116, 92], .90, 8),
  grass:     mat('草坪',       [ 74,104, 46], .96, 3),
  hedge:     mat('绿篱',       [ 46, 78, 38], .95,17),
  foliage:   mat('树冠',       [ 54, 88, 42], .94,13),
  foliage2:  mat('树冠浅',     [ 72,108, 50], .94,13),
  banana:    mat('芭蕉叶',     [ 68,116, 50], .92,13),
  bark:      mat('树皮',       [ 92, 70, 50], .95, 5),
  soil:      mat('营养土',     [ 96, 74, 52], .97, 9),
  veg:       mat('菜苗',       [ 78,124, 50], .93,13),
  water:     mat('水面',       [ 26,124,156], .05, 4, {alpha:.90}),
  pondWater: mat('鱼池水',     [ 26, 88,108], .06, 4, {alpha:.90}),
  rock:      mat('置石',       [126,124,118], .92,16),
  asphalt:   mat('沥青路',     [ 54, 54, 55], .93,14),
  ceramic:   mat('洁具陶瓷',   [248,248,246], .18,11),
  fabric:    mat('布艺',       [148,142,132], .95,12),
  fabricW:   mat('床品',       [238,236,230], .94,12),
  cloth:     mat('晾晒衣物',   [206,214,222], .95,18),
  carBody:   mat('车身',       [ 82, 96,112], .22,15),
  carGlass:  mat('车窗',       [ 44, 52, 60], .10, 6, {alpha:.55}),
  tyre:      mat('轮胎',       [ 34, 34, 36], .95,15),
  lamp:      mat('灯具',       [255,236,196], .40,19, {emi:1}),
  mesh:      mat('镀锌网',     [140,146,138], .70,15),
  screen:    mat('纱窗',       [ 96,104,100], .80,15, {alpha:.55}),
  mirror:    mat('镜面',       [196,206,210], .04, 6, {alpha:.55}),
  panel:     mat('太阳能板',   [ 38, 44, 58], .20,15),
  tank:      mat('水箱',       [186,192,198], .35,15)
};

/* ───────────────────────── 3. 网格构建 ───────────────────────── */
const GROUPS = {};
let G = null;
function group(name){ G = GROUPS[name] || (GROUPS[name] = {v:[], i:[], name}); return G; }
function vert(p,n,m){ const g=G; g.v.push(p[0],p[1],p[2], n[0],n[1],n[2], m); return g.v.length/7-1; }
function tri(a,b,c){ G.i.push(a,b,c); }
function face(p0,p1,p2,p3,m,flip){
  let n = V.n(V.c(V.s(p1,p0), V.s(p2,p0)));
  if(flip) n = V.m(n,-1);
  const a=vert(p0,n,m), b=vert(p1,n,m), c=vert(p2,n,m), d=vert(p3,n,m);
  if(flip){ tri(a,c,b); tri(a,d,c); } else { tri(a,b,c); tri(a,c,d); }
}
function tri3(p0,p1,p2,m,flip){
  let n = V.n(V.c(V.s(p1,p0), V.s(p2,p0)));
  if(flip) n = V.m(n,-1);
  const a=vert(p0,n,m), b=vert(p1,n,m), c=vert(p2,n,m);
  if(flip) tri(a,c,b); else tri(a,b,c);
}
/* 轴对齐盒体。skip: 'top','bot','n','s','e','w' 的组合，用于省略看不见的面 */
function box(x0,y0,z0,x1,y1,z1,m,skip){
  if(x1<x0){const t=x0;x0=x1;x1=t;} if(y1<y0){const t=y0;y0=y1;y1=t;} if(z1<z0){const t=z0;z0=z1;z1=t;}
  skip = skip||'';
  const A=[x0,y0,z0],B=[x1,y0,z0],C=[x1,y1,z0],D=[x0,y1,z0];
  const E=[x0,y0,z1],F=[x1,y0,z1],H=[x1,y1,z1],I=[x0,y1,z1];
  if(skip.indexOf('top')<0) face(E,F,H,I,m);
  if(skip.indexOf('bot')<0) face(A,D,C,B,m);
  if(skip.indexOf('s')<0)   face(A,B,F,E,m);
  if(skip.indexOf('n')<0)   face(C,D,I,H,m);
  if(skip.indexOf('w')<0)   face(D,A,E,I,m);
  if(skip.indexOf('e')<0)   face(B,C,H,F,m);
}
/* 竖直棱柱／圆柱／圆台 */
function cyl(cx,cy,z0,z1,r0,r1,seg,m,cap){
  const lo=[],hi=[];
  for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2;
    lo.push([cx+Math.cos(a)*r0, cy+Math.sin(a)*r0, z0]);
    hi.push([cx+Math.cos(a)*r1, cy+Math.sin(a)*r1, z1]); }
  for(let i=0;i<seg;i++){ const j=(i+1)%seg; face(lo[i],lo[j],hi[j],hi[i],m); }
  if(cap!==false){
    const ct=[cx,cy,z1]; for(let i=0;i<seg;i++){ const j=(i+1)%seg; tri3(hi[i],hi[j],ct,m); }
    const cb=[cx,cy,z0]; for(let i=0;i<seg;i++){ const j=(i+1)%seg; tri3(lo[j],lo[i],cb,m); }
  }
}
/* 球／椭球（树冠、软垫） */
function ball(cx,cy,cz,rx,ry,rz,seg,m){
  const ring=seg, stack=Math.max(3,seg>>1), pts=[];
  for(let s=0;s<=stack;s++){ const ph=s/stack*Math.PI, row=[];
    for(let i=0;i<=ring;i++){ const th=i/ring*Math.PI*2;
      row.push([cx+Math.sin(ph)*Math.cos(th)*rx, cy+Math.sin(ph)*Math.sin(th)*ry, cz+Math.cos(ph)*rz]); }
    pts.push(row); }
  for(let s=0;s<stack;s++) for(let i=0;i<ring;i++){
    const a=pts[s][i],b=pts[s][i+1],c=pts[s+1][i+1],d=pts[s+1][i];
    const na=V.n(V.s(a,[cx,cy,cz])), nb=V.n(V.s(b,[cx,cy,cz])),
          nc=V.n(V.s(c,[cx,cy,cz])), nd=V.n(V.s(d,[cx,cy,cz]));
    const ia=vert(a,na,m), ib=vert(b,nb,m), ic=vert(c,nc,m), id=vert(d,nd,m);
    tri(ia,ib,ic); tri(ia,ic,id);
  }
}
/* 带洞口的墙：沿 X 或 Y 展开，openings=[{a,b,z0,z1}] a/b 为沿墙长度方向坐标 */
function wallOpen(dir, u0,u1, v0,v1, z0,z1, m, ops){
  ops = (ops||[]).slice().sort((p,q)=>p.a-q.a);
  const seg = (a,b,c,d)=>{ if(b-a<0.001||d-c<0.001) return;
    if(dir==='x') box(a,v0,c,b,v1,d,m); else box(v0,a,c,v1,b,d,m); };
  let cur = u0;
  for(const o of ops){
    seg(cur, o.a, z0, z1);              // 洞口之间的墙垛
    seg(o.a, o.b, z0, o.z0);            // 窗下墙
    seg(o.a, o.b, o.z1, z1);            // 窗上过梁
    cur = o.b;
  }
  seg(cur, u1, z0, z1);
}

/* ───────────────────────── 4. 尺寸定义 ─────────────────────────
   与平面图完全一致。site x∈[0,10]，y∈[0,32]，路在 y=0 一侧（南）。 */
const D = {
  plotW:10, plotL:32,
  hx0:1.4, hx1:9.4,          // 主楼左右
  hy0:6.8, hy1:16.4,         // 主楼前后
  ay0:16.4, ay1:20.0,        // 后附房
  W:0.15,                    // 外墙厚
  P:0.10,                    // 隔墙厚
  FF:0.45,                   // 室内地坪标高
  F1:3.75,                   // 二层楼面
  F2:7.05,                   // 屋面标高
  RG:8.10,                   // 屋脊
  ceil1:3.55, ceil2:6.85,    // 吊顶
  annexTop:3.55
};
const S = (lx,ly)=>[D.hx0+lx, D.hy0+ly];   // 平面图局部坐标 → 场地坐标

/* ───────────────────────── 5. 门窗构件 ─────────────────────────
   dir: 'x' 墙沿 X 展开（洞口 a..b 为 X），'y' 墙沿 Y 展开
   v0,v1: 墙体在垂直方向的两个面；out: -1/+1 指出室外在垂直轴的哪一侧 */
const FR = 0.055;                                    // 框料截面
function glazing(dir,a,b,z0,z1,v0,v1,out,opts){
  opts = opts||{};
  const vm = (v0+v1)/2, gt = 0.008;
  const put = (p,q,c,d,mm)=> dir==='x' ? box(p,c,q,d,0,0,0,0) : 0;   // 占位（未使用）
  const B = (ax,ay,az,bx,by,bz,mm)=> box(ax,ay,az,bx,by,bz,mm);
  const seg = (u0,u1,w0,w1,zz0,zz1,mm)=> dir==='x'
      ? B(u0,w0,zz0,u1,w1,zz1,mm) : B(w0,u0,zz0,w1,u1,zz1,mm);
  // 框
  seg(a,a+FR, v0,v1, z0,z1, M.metalDk);
  seg(b-FR,b, v0,v1, z0,z1, M.metalDk);
  seg(a,b, v0,v1, z0,z0+FR, M.metalDk);
  seg(a,b, v0,v1, z1-FR,z1, M.metalDk);
  // 中挺
  const n = opts.mull===0 ? 0 : (opts.mull || Math.max(1, Math.round((b-a)/1.05)-1));
  for(let i=1;i<=n;i++){ const u=a+(b-a)*i/(n+1); seg(u-0.028,u+0.028, v0,v1, z0,z1, M.metalDk); }
  if(opts.transom){ const zt=z0+(z1-z0)*opts.transom; seg(a,b, v0,v1, zt-0.028,zt+0.028, M.metalDk); }
  // 玻璃
  seg(a+FR*0.7,b-FR*0.7, vm-gt,vm+gt, z0+FR*0.7,z1-FR*0.7, M.glass);
  // 纱窗（内侧）
  if(opts.screen!==false) seg(a+FR,b-FR, vm-out*0.045-gt, vm-out*0.045+gt, z0+FR,z1-FR, M.screen);
  // 窗台（外挑）与内窗台板
  if(opts.sill!==false){
    const so = out<0 ? [v0-0.07, v0+0.02] : [v1-0.02, v1+0.07];
    seg(a-0.06,b+0.06, so[0],so[1], z0-0.055,z0, M.concrete);
    seg(a,b, v0,v1, z0-0.03,z0, M.slab);
  }
  // 外侧滴水线 / 窗楣
  if(opts.hood){ const ho = out<0 ? [v0-0.16, v0] : [v1, v1+0.16];
    seg(a-0.10,b+0.10, ho[0],ho[1], z1,z1+0.07, M.wallAccent); }
}
function doorway(dir,a,b,z0,z1,v0,v1,out,opts){
  opts = opts||{};
  const vm=(v0+v1)/2;
  const seg=(u0,u1,w0,w1,zz0,zz1,mm)=> dir==='x'
      ? box(u0,w0,zz0,u1,w1,zz1,mm) : box(w0,u0,zz0,w1,u1,zz1,mm);
  // 门套
  seg(a,a+0.05, v0,v1, z0,z1, opts.frameMat||M.woodDk);
  seg(b-0.05,b, v0,v1, z0,z1, opts.frameMat||M.woodDk);
  seg(a,b, v0,v1, z1-0.05,z1, opts.frameMat||M.woodDk);
  if(opts.open) return;                                   // 敞开的门洞
  const lm = opts.leafMat || M.woodLt;
  if(opts.ajar){                                          // 半开：门扇转到洞口内侧
    const w=(b-a)-0.10, t=0.04, sw=opts.ajar;             // sw>0 向 +u 开
    dir==='x' ? box(a+0.05, vm, z0, a+0.05+t, vm+w*sw, z1-0.06, lm)
              : box(vm, a+0.05, z0, vm+w*sw, a+0.05+t, z1-0.06, lm);
  } else {
    seg(a+0.05,b-0.05, vm-0.022,vm+0.022, z0,z1-0.05, lm);
    if(opts.glazed) seg(a+0.22,b-0.22, vm-0.006,vm+0.006, z0+0.95,z1-0.35, M.glass);
    // 门把手
    const hu = opts.hinge==='b' ? a+0.16 : b-0.16;
    dir==='x' ? box(hu-0.045,vm-0.075,z0+1.02, hu+0.045,vm+0.075,z0+1.10, M.steel)
              : box(vm-0.075,hu-0.045,z0+1.02, vm+0.075,hu+0.045,z0+1.10, M.steel);
  }
}

/* ───────────────────────── 6. 主体建筑 ───────────────────────── */
const X0=D.hx0, X1=D.hx1, Y0=D.hy0, Y1=D.hy1, AY1=D.ay1;
const IX0=X0+D.W, IX1=X1-D.W, IY0=Y0+D.W, IY1=Y1-D.W;   // 主楼内墙面
const AIY0=D.ay0+D.W, AIY1=AY1-D.W;

group('shell1');
// 勒脚 / 台基
box(X0-0.06, Y0-0.06, 0, X1+0.06, AY1+0.06, D.FF, M.plinth);
// —— 一层外墙（含洞口）
const w=D.W;
wallOpen('x', X0,X1, Y0,Y0+w, D.FF,D.F1, M.wallOut, [
  {a:X0+0.9, b:X0+2.9, z0:0.50, z1:3.05},          // 客厅推拉门
  {a:X0+5.6, b:X0+6.6, z0:D.FF, z1:2.75}           // 入户门
]);
wallOpen('y', Y0,Y1, X0,X0+w, D.FF,D.F1, M.wallOut, [
  {a:Y0+2.0, b:Y0+3.2, z0:1.35, z1:2.95},
  {a:Y0+6.4, b:Y0+7.6, z0:1.35, z1:2.95}
]);
wallOpen('y', Y0,Y1, X1-w,X1, D.FF,D.F1, M.wallOut, [
  {a:Y0+2.0, b:Y0+3.2, z0:1.35, z1:2.95},
  {a:Y0+5.4, b:Y0+6.9, z0:1.35, z1:2.95}
]);
// 主楼后墙（与后附房相接，留通口）
wallOpen('x', X0,X1, Y1-w,Y1, D.FF,D.F1, M.wallOut, [
  {a:X0+1.1, b:X0+2.3, z0:D.FF, z1:2.55}
]);
// —— 后附房外墙
wallOpen('y', D.ay0,AY1, X0,X0+w, D.FF,D.annexTop, M.wallOut, [
  {a:D.ay0+1.0, b:D.ay0+2.4, z0:1.35, z1:2.75}
]);
wallOpen('y', D.ay0,AY1, X1-w,X1, D.FF,D.annexTop, M.wallOut, [
  {a:D.ay0+1.8, b:D.ay0+2.6, z0:1.60, z1:2.60}
]);
wallOpen('x', X0,X1, AY1-w,AY1, D.FF,D.annexTop, M.wallOut, [
  {a:X0+1.0, b:X0+2.0, z0:D.FF, z1:2.55},
  {a:X0+6.3, b:X0+7.2, z0:D.FF, z1:2.55}
]);
// 一层楼板面 / 吊顶
box(IX0,IY0,D.FF-0.02, IX1,IY1,D.FF, M.floorTile);
box(IX0,AIY0,D.FF-0.02, IX1,AIY1,D.FF, M.floorTile);
group('ceil1'); box(IX0,IY0,D.ceil1, IX1,IY1,D.ceil1+0.03, M.ceil);
group('ceilA'); box(IX0,AIY0,D.annexTop-0.10, IX1,AIY1,D.annexTop-0.07, M.ceil);
// 二层楼板
group('slab2');
box(X0,Y0,D.F1-0.16, X1,Y1,D.F1, M.slab);
box(IX0,IY0,D.F1, IX1,IY1,D.F1+0.02, M.floorTile);
group('shell1');
// 腰线（四面环绕的窄带，不能做成实心体块）
(function(){ const a=D.F1-0.26, b=D.F1+0.04, o=0.05, t=0.20;
  box(X0-o,Y0-o,a, X1+o,Y0+t,b, M.wallAccent);
  box(X0-o,Y1-t,a, X1+o,Y1+o,b, M.wallAccent);
  box(X0-o,Y0+t,a, X0+t,Y1-t,b, M.wallAccent);
  box(X1-t,Y0+t,a, X1+o,Y1-t,b, M.wallAccent);
})();

group('shell2');
wallOpen('x', X0,X1, Y0,Y0+w, D.F1,D.F2, M.wallOut, [
  {a:X0+1.2, b:X0+2.6, z0:4.15, z1:6.55},
  {a:X0+5.6, b:X0+7.0, z0:4.55, z1:6.35}
]);
wallOpen('y', Y0,Y1, X0,X0+w, D.F1,D.F2, M.wallOut, [
  {a:Y0+1.6, b:Y0+2.8, z0:4.65, z1:6.25},
  {a:Y0+7.0, b:Y0+8.4, z0:4.65, z1:6.25}
]);
wallOpen('y', Y0,Y1, X1-w,X1, D.F1,D.F2, M.wallOut, [
  {a:Y0+2.2, b:Y0+3.2, z0:4.65, z1:6.25},
  {a:Y0+5.4, b:Y0+6.8, z0:4.65, z1:6.25}
]);
wallOpen('x', X0,X1, Y1-w,Y1, D.F1,D.F2, M.wallOut, [
  {a:X0+3.2, b:X0+4.0, z0:5.35, z1:6.35},
  {a:X0+4.8, b:X0+5.6, z0:5.35, z1:6.35},
  {a:X0+6.4, b:X0+7.6, z0:4.15, z1:6.35}
]);
group('ceil2'); box(IX0,IY0,D.ceil2, IX1,IY1,D.ceil2+0.03, M.ceil);
group('roof'); box(X0,Y0,D.F2, X1,Y1,D.F2+0.14, M.slab);
group('shell2');

// —— 门窗构件
group('glass');
glazing('x', X0+0.9,X0+2.9, 0.50,3.05, Y0,Y0+w, -1, {mull:2, transom:0.82});
glazing('y', Y0+2.0,Y0+3.2, 1.35,2.95, X0,X0+w, -1, {hood:1});
glazing('y', Y0+6.4,Y0+7.6, 1.35,2.95, X0,X0+w, -1, {hood:1});
glazing('y', Y0+2.0,Y0+3.2, 1.35,2.95, X1-w,X1, 1, {hood:1});
glazing('y', Y0+5.4,Y0+6.9, 1.35,2.95, X1-w,X1, 1, {hood:1});
glazing('y', D.ay0+1.0,D.ay0+2.4, 1.35,2.75, X0,X0+w, -1, {hood:1});
glazing('y', D.ay0+1.8,D.ay0+2.6, 1.60,2.60, X1-w,X1, 1, {mull:0});
glazing('x', X0+1.2,X0+2.6, 4.15,6.55, Y0,Y0+w, -1, {mull:1, transom:0.80, sill:false});
glazing('x', X0+5.6,X0+7.0, 4.55,6.35, Y0,Y0+w, -1, {hood:1});
glazing('y', Y0+1.6,Y0+2.8, 4.65,6.25, X0,X0+w, -1, {hood:1});
glazing('y', Y0+7.0,Y0+8.4, 4.65,6.25, X0,X0+w, -1, {hood:1});
glazing('y', Y0+2.2,Y0+3.2, 4.65,6.25, X1-w,X1, 1, {mull:0, hood:1});
glazing('y', Y0+5.4,Y0+6.8, 4.65,6.25, X1-w,X1, 1, {hood:1});
glazing('x', X0+3.2,X0+4.0, 5.35,6.35, Y1-w,Y1, 1, {mull:0});
glazing('x', X0+4.8,X0+5.6, 5.35,6.35, Y1-w,Y1, 1, {mull:0});
glazing('x', X0+6.4,X0+7.6, 4.15,6.35, Y1-w,Y1, 1, {mull:1, transom:0.80, sill:false});
group('shell1');
doorway('x', X0+5.6,X0+6.6, D.FF,2.75, Y0,Y0+w, -1, {leafMat:M.woodDk, glazed:1, hinge:'b'});
doorway('x', X0+1.0,X0+2.0, D.FF,2.55, AY1-w,AY1, 1, {leafMat:M.woodDk, glazed:1});
doorway('x', X0+6.3,X0+7.2, D.FF,2.55, AY1-w,AY1, 1, {leafMat:M.woodDk});
doorway('x', X0+1.1,X0+2.3, D.FF,2.55, Y1-w,Y1, 1, {open:1});

/* ───────────────────────── 7. 屋面 ───────────────────────── */
group('roof');
(function(){
  const e=D.F2+0.14, ov=0.60, rx=(X0+X1)/2;
  const ex0=X0-ov, ex1=X1+ov, ey0=Y0-ov, ey1=Y1+ov;
  const ry0=Y0+1.6, ry1=Y1-1.6, rz=D.RG;
  const A=[ex0,ey0,e],B=[ex1,ey0,e],C=[ex1,ey1,e],Dd=[ex0,ey1,e];
  const R0=[rx,ry0,rz], R1=[rx,ry1,rz];
  face(A,Dd,R1,R0,M.roofMetal,true);      // 西坡
  face(B,R0,R1,C,M.roofMetal,true);       // 东坡
  tri3(A,R0,B,M.roofMetal,true);          // 南坡
  tri3(C,R1,Dd,M.roofMetal,true);         // 北坡
  // 屋面板底（从下方可见）
  face(A,B,C,Dd,M.ceil);
  // 檐口封板 + 檐沟
  box(ex0,ey0,e-0.16, ex1,ey0+0.09,e, M.fascia);
  box(ex0,ey1-0.09,e-0.16, ex1,ey1,e, M.fascia);
  box(ex0,ey0,e-0.16, ex0+0.09,ey1,e, M.fascia);
  box(ex1-0.09,ey0,e-0.16, ex1,ey1,e, M.fascia);
  box(ex0-0.10,ey0-0.10,e-0.22, ex1+0.10,ey0-0.02,e-0.06, M.metalDk);   // 南檐沟
  box(ex0-0.10,ey1+0.02,e-0.22, ex1+0.10,ey1+0.10,e-0.06, M.metalDk);
  // 落水管
  cyl(ex0+0.06, ey0+0.2, 0, e-0.2, 0.055,0.055, 8, M.metalDk, false);
  cyl(ex1-0.06, ey1-0.2, 0, e-0.2, 0.055,0.055, 8, M.metalDk, false);
  // 屋脊压顶
  box(rx-0.11, ry0-0.15, rz-0.05, rx+0.11, ry1+0.15, rz+0.06, M.fascia);
  // 外露椽条
  for(let y=ey0+0.35; y<ey1; y+=0.85){
    box(ex0+0.02, y, e-0.14, X0-0.02, y+0.07, e-0.05, M.woodDk);
    box(X1+0.02, y, e-0.14, ex1-0.02, y+0.07, e-0.05, M.woodDk);
  }
  // 屋顶设备：太阳能热水器 + 水箱
  box(6.35,14.55,e+0.02, 7.75,15.75,e+0.10, M.metalDk);
  for(let i=0;i<7;i++) cyl(6.5+i*0.19, 15.15, e+0.10, e+0.16, 0.075,0.075, 8, M.panel);
  cyl(7.05,14.35,e+0.10, e+0.62, 0.30,0.30, 12, M.tank);
  // 光井天窗
  box(7.60,8.15,D.F2+0.10, 9.00,9.25,D.F2+0.16, M.metalDk);
})();
group('glass');
box(7.64,8.19,D.F2+0.16, 8.96,9.21,D.F2+0.52, M.glass);
group('roof');
box(7.60,8.15,D.F2+0.52, 9.00,9.25,D.F2+0.60, M.metalDk);

/* ───────────────────────── 8. 门廊 · 阳台 · 遮阳 ───────────────────────── */
group('shell1');
box(X0,Y0-1.20,D.ceil1-0.15, X1,Y0,D.ceil1, M.slab);                 // 门廊顶板
cyl(X0+0.65, Y0-0.95, 0, D.ceil1-0.15, 0.075,0.075, 10, M.metalDk);
cyl(X1-0.65, Y0-0.95, 0, D.ceil1-0.15, 0.075,0.075, 10, M.metalDk);
box(X0+0.9,Y0-1.35,0, X0+3.1,Y0,0.15, M.concrete);                    // 入户台阶
box(X0+1.1,Y0-1.05,0.15, X0+2.9,Y0,0.30, M.concrete);
box(X0+5.3,Y0-1.35,0, X0+7.0,Y0,0.15, M.concrete);
box(X0+5.5,Y0-1.05,0.15, X0+6.8,Y0,0.30, M.concrete);
group('shell2');
box(X0,Y0-1.20,D.F1-0.16, X0+4.2,Y0,D.F1, M.slab);                    // 前阳台
box(X0,Y0-1.20,D.F1, X0+4.2,Y0,D.F1+0.02, M.floorTile);
(function(){                                                           // 阳台栏杆
  const zt=D.F1+1.05;
  box(X0,Y0-1.24,zt-0.06, X0+4.2,Y0-1.16,zt+0.02, M.woodLt);
  box(X0-0.04,Y0-1.24,zt-0.06, X0+0.04,Y0,zt+0.02, M.woodLt);
  box(X0+4.16,Y0-1.24,zt-0.06, X0+4.24,Y0,zt+0.02, M.woodLt);
  for(let x=X0+0.06; x<X0+4.16; x+=0.115)
    box(x,Y0-1.22,D.F1+0.02, x+0.028,Y0-1.18,zt-0.06, M.metalDk);
  box(X0,Y0-1.23,D.F1+0.48, X0+4.2,Y0-1.17,D.F1+0.52, M.metalDk);
})();
// 仿木遮阳格栅（西南向楼梯间）
for(let x=X0+5.75; x<X1-0.05; x+=0.27)
  box(x, Y0-0.16, D.F1+0.25, x+0.10, Y0-0.04, D.F2-0.05, M.louver);
box(X0+5.70,Y0-0.20,D.F1+0.18, X1, Y0-0.02, D.F1+0.28, M.metalDk);
box(X0+5.70,Y0-0.20,D.F2-0.10, X1, Y0-0.02, D.F2, M.metalDk);
// 后晾衣棚
group('shell1');
box(X0,AY1,2.55, X0+4.0,AY1+1.25,2.68, M.metalDk);
cyl(X0+0.15,AY1+1.10,0, 2.55, 0.06,0.06, 8, M.metalDk, false);
cyl(X0+3.85,AY1+1.10,0, 2.55, 0.06,0.06, 8, M.metalDk, false);
for(let i=0;i<3;i++) box(X0+0.2,AY1+0.35+i*0.34,1.62, X0+3.8,AY1+0.37+i*0.34,1.64, M.steel);
// 后附房单坡屋面
group('roofA');
(function(){ const e0=4.12, e1=3.70, ox=0.45;
  face([X0-ox,D.ay0-0.10,e0],[X1+ox,D.ay0-0.10,e0],[X1+ox,AY1+ox,e1],[X0-ox,AY1+ox,e1], M.roofMetal);
  face([X0-ox,D.ay0-0.10,e0],[X0-ox,AY1+ox,e1],[X1+ox,AY1+ox,e1],[X1+ox,D.ay0-0.10,e0], M.ceil);
  box(X0-ox,D.ay0-0.16,e0-0.16, X1+ox,D.ay0-0.07,e0, M.fascia);
  box(X0-ox,AY1+ox-0.09,e1-0.16, X1+ox,AY1+ox,e1, M.fascia);
  box(X0-ox,D.ay0-0.10,e0-0.14, X0-ox+0.09,AY1+ox,e0-0.02, M.fascia);
  box(X1+ox-0.09,D.ay0-0.10,e0-0.14, X1+ox,AY1+ox,e0-0.02, M.fascia);
  box(X0-ox-0.10,AY1+ox,e1-0.20, X1+ox+0.10,AY1+ox+0.09,e1-0.04, M.metalDk);
  for(let y=D.ay0+0.2;y<AY1+0.3;y+=0.80){
    const t=(y-D.ay0+0.10)/(AY1+ox-D.ay0+0.10), z=e0+(e1-e0)*t;
    box(X0-ox+0.02,y,z-0.13, X0,y+0.07,z-0.03, M.woodDk);
    box(X1,y,z-0.13, X1+ox-0.02,y+0.07,z-0.03, M.woodDk); }
})();
group('shell1');
// 空调外机（右侧通道）
for(const yy of [8.6, 11.4, 14.2]){
  box(X1+0.02, yy, 2.35, X1+0.34, yy+0.85, 2.95, M.steel);
  box(X1+0.02, yy+0.15, D.F1+2.0, X1+0.34, yy+1.0, D.F1+2.6, M.steel);
}

/* ───────────────────────── 9. 隔墙与内门 ───────────────────────── */
const L = (lx,ly)=>[X0+lx, Y0+ly];                       // 局部 → 场地
function parts(list, z0, z1){
  for(const p of list){ const a=L(p[0],p[1]), b=L(p[2],p[3]);
    box(a[0],a[1],z0, b[0],b[1],z1, M.wallIn); }
}
group('part1');
parts([
  [4.30,0.15,4.40,2.20],[4.30,3.20,4.40,4.65],
  [0.15,5.35,1.30,5.45],[3.40,5.35,4.30,5.45],
  [4.30,4.75,4.40,8.20],[4.30,8.95,4.40,9.45],
  [4.40,4.65,6.30,4.75],[7.05,4.65,7.85,4.75],
  [4.40,7.75,6.60,7.85],[7.40,7.75,7.85,7.85],
  [6.15,7.85,6.25,9.45]
], D.FF, D.ceil1);
parts([
  [4.05,9.75,4.15,11.20],[4.05,12.00,4.15,13.05],
  [5.75,9.75,5.85,10.20],[5.75,11.00,5.85,13.05],
  [5.85,11.50,6.40,11.60],[7.20,11.50,7.85,11.60]
], D.FF, D.annexTop-0.10);
// 卫浴墙砖内衬
box(X0+4.45,Y0+7.90,D.FF, X0+6.10,Y0+9.40,D.FF+1.85, M.wetTile);
box(X0+4.20,Y0+9.80,D.FF, X0+5.70,Y0+13.00,D.FF+1.85, M.wetTile);
// 内门
doorway('y', Y0+2.20,Y0+3.20, D.FF,2.55, X0+4.30,X0+4.40, -1, {ajar:0.9});
doorway('y', Y0+8.20,Y0+8.95, D.FF,2.45, X0+4.30,X0+4.40, 1, {});
doorway('x', X0+6.30,X0+7.05, D.FF,2.55, Y0+4.65,Y0+4.75, -1, {ajar:0.85});
doorway('x', X0+6.60,X0+7.40, D.FF,2.45, Y0+7.75,Y0+7.85, 1, {});
doorway('y', Y0+11.20,Y0+12.00, D.FF,2.45, X0+4.05,X0+4.15, -1, {});
doorway('y', Y0+10.20,Y0+11.00, D.FF,2.45, X0+5.75,X0+5.85, -1, {});
doorway('x', X0+6.40,X0+7.20, D.FF,2.45, Y0+11.50,Y0+11.60, -1, {});

group('part2');
parts([
  [4.30,0.15,4.40,1.50],[4.30,2.40,4.40,9.45],
  [0.15,4.35,1.20,4.45],[2.10,4.35,4.30,4.45],
  [1.95,4.45,2.05,6.05],
  [0.15,6.05,1.10,6.15],[2.00,6.05,4.30,6.15],
  [2.60,7.00,2.70,8.20],[2.60,8.90,2.70,9.45],[2.70,7.65,4.30,7.75],
  [4.40,4.65,5.60,4.75],[6.30,4.65,7.85,4.75],
  [4.40,7.65,4.90,7.75],[5.60,7.65,6.60,7.75],[7.30,7.65,7.85,7.75],
  [6.15,7.75,6.25,9.45]
], D.F1, D.ceil2);
box(X0+2.10,Y0+4.50,D.F1, X0+4.25,Y0+6.00,D.F1+1.85, M.wetTile);
box(X0+2.75,Y0+7.80,D.F1, X0+4.25,Y0+9.40,D.F1+1.85, M.wetTile);
box(X0+4.45,Y0+7.80,D.F1, X0+6.10,Y0+9.40,D.F1+1.85, M.wetTile);
doorway('y', Y0+1.50,Y0+2.40, D.F1,D.F1+2.10, X0+4.30,X0+4.40, -1, {ajar:0.9});
doorway('x', X0+1.20,X0+2.10, D.F1,D.F1+2.10, Y0+4.35,Y0+4.45, 1, {open:1});
doorway('x', X0+1.10,X0+2.00, D.F1,D.F1+2.10, Y0+6.05,Y0+6.15, 1, {ajar:0.85});
doorway('y', Y0+8.20,Y0+8.90, D.F1,D.F1+2.10, X0+2.60,X0+2.70, 1, {});
doorway('x', X0+5.60,X0+6.30, D.F1,D.F1+2.10, Y0+4.65,Y0+4.75, -1, {ajar:0.8});
doorway('x', X0+4.90,X0+5.60, D.F1,D.F1+2.10, Y0+7.65,Y0+7.75, 1, {});
doorway('x', X0+6.60,X0+7.30, D.F1,D.F1+2.10, Y0+7.65,Y0+7.75, 1, {open:1});

/* ───────────────────────── 10. 楼梯 ───────────────────────── */
group('part1');
(function(){
  const n=18, rise=(D.F1-D.FF)/n, go=0.26;
  const ax0=7.60, ax1=9.15, bx0=6.00, bx1=7.55;
  const yA=8.15, yB=11.35, land=2.10;
  for(let i=0;i<9;i++){ const z=D.FF+i*rise, y=yA+i*go;
    box(ax0,y,z, ax1,y+go+0.03,z+0.045, M.floorTile);          // 踏板
    box(ax0,y,z-rise+0.045, ax1,y+0.035,z, M.wallIn);          // 踢面
  }
  box(bx0,10.49,land-0.14, ax1,11.35,land, M.slab);
  box(bx0,10.49,land, ax1,11.35,land+0.02, M.floorTile);       // 休息平台
  for(let i=0;i<9;i++){ const z=land+i*rise, y=yB-i*go;
    box(bx0,y-go-0.03,z, bx1,y,z+0.045, M.floorTile);
    box(bx0,y-0.035,z-rise+0.045, bx1,y,z, M.wallIn);
  }
  // 栏杆
  const rail=(x,y0,y1,z0,z1)=>{
    box(x-0.025,y0,z0+0.90, x+0.025,y1,z1+0.98, M.woodLt);
    const n2=Math.max(2,Math.round((y1-y0)/0.16));
    for(let i=0;i<=n2;i++){ const t=i/n2, y=y0+(y1-y0)*t, z=z0+(z1-z0)*t;
      box(x-0.014,y,z, x+0.014,y+0.028,z+0.92, M.metalDk); }
  };
  rail(ax0-0.03, yA, yA+9*go, D.FF, land);
  rail(bx1+0.03, yB-9*go, yB, land, D.F1);
  box(bx0-0.02,10.52,land+0.90, ax0+0.02,10.58,land+0.98, M.woodLt);
  for(let x=bx0;x<ax0;x+=0.16) box(x,10.53,land, x+0.028,10.57,land+0.90, M.metalDk);
  // 二层楼板洞口栏杆
  group('part2');
  box(bx1+0.03,9.0,D.F1+0.90, bx1+0.08,11.45,D.F1+0.98, M.woodLt);
  for(let y=9.0;y<11.4;y+=0.16) box(bx1+0.04,y,D.F1, bx1+0.07,y+0.028,D.F1+0.90, M.metalDk);
  group('part1');
})();

/* ───────────────────────── 11. 家具与设备 ───────────────────────── */
function bed(cx,cy,w,l,z,dir,m1,m2){        // dir: 床头朝向 'n','s','w','e'
  const h=0.30, x0=cx-w/2, x1=cx+w/2, y0=cy-l/2, y1=cy+l/2;
  box(x0+0.04,y0+0.04,z, x1-0.04,y1-0.04,z+h, M.woodDk);               // 床架
  box(x0,y0,z+h, x1,y1,z+h+0.26, m1||M.fabricW);                        // 床垫
  const hb=0.62;
  if(dir==='n') box(x0,y1-0.08,z, x1,y1,z+h+hb, M.woodLt);
  if(dir==='s') box(x0,y0,z, x1,y0+0.08,z+h+hb, M.woodLt);
  if(dir==='w') box(x0,y0,z, x0+0.08,y1,z+h+hb, M.woodLt);
  if(dir==='e') box(x1-0.08,y0,z, x1,y1,z+h+hb, M.woodLt);
  // 被子
  const bz=z+h+0.26;
  if(dir==='n'||dir==='s'){ const dy0 = dir==='n'? y0 : y0+l*0.32;
    box(x0+0.02,dy0,bz, x1-0.02,dy0+l*0.68,bz+0.09, m2||M.fabric); }
  else { const dx0 = dir==='w'? x0 : x0+w*0.32;
    box(dx0,y0+0.02,bz, dx0+w*0.68,y1-0.02,bz+0.09, m2||M.fabric); }
  // 枕头
  const pz=bz+0.02;
  if(dir==='n'){ ball(cx-w*0.22,y1-0.30,pz+0.06, w*0.19,0.20,0.07,10,M.fabricW);
                 if(w>1.3) ball(cx+w*0.22,y1-0.30,pz+0.06, w*0.19,0.20,0.07,10,M.fabricW); }
  if(dir==='s'){ ball(cx-w*0.22,y0+0.30,pz+0.06, w*0.19,0.20,0.07,10,M.fabricW);
                 if(w>1.3) ball(cx+w*0.22,y0+0.30,pz+0.06, w*0.19,0.20,0.07,10,M.fabricW); }
  if(dir==='w'){ ball(x0+0.30,cy-l*0.20,pz+0.06, 0.20,l*0.17,0.07,10,M.fabricW);
                 ball(x0+0.30,cy+l*0.20,pz+0.06, 0.20,l*0.17,0.07,10,M.fabricW); }
  if(dir==='e'){ ball(x1-0.30,cy-l*0.20,pz+0.06, 0.20,l*0.17,0.07,10,M.fabricW);
                 ball(x1-0.30,cy+l*0.20,pz+0.06, 0.20,l*0.17,0.07,10,M.fabricW); }
}
function nightstand(cx,cy,z){
  box(cx-0.21,cy-0.19,z, cx+0.21,cy+0.19,z+0.50, M.woodDk);
  box(cx-0.05,cy-0.20,z+0.30, cx+0.05,cy-0.19,z+0.34, M.steel);
  cyl(cx,cy,z+0.50, z+0.56, 0.11,0.09, 10, M.metalDk);
  cyl(cx,cy,z+0.56, z+0.74, 0.02,0.02, 6, M.metalDk, false);
  ball(cx,cy,z+0.83, 0.11,0.11,0.09, 10, M.lamp);
}
function wardrobe(x0,y0,x1,y1,z,h,doorsAxis){
  box(x0,y0,z, x1,y1,z+h, M.woodLt);
  const n = doorsAxis==='x' ? Math.max(2,Math.round((x1-x0)/0.55)) : Math.max(2,Math.round((y1-y0)/0.55));
  for(let i=1;i<n;i++){ const t=i/n;
    if(doorsAxis==='x') box(x0+(x1-x0)*t-0.008,y0-0.006,z+0.02, x0+(x1-x0)*t+0.008,y1+0.006,z+h-0.02, M.woodDk);
    else box(x0-0.006,y0+(y1-y0)*t-0.008,z+0.02, x1+0.006,y0+(y1-y0)*t+0.008,z+h-0.02, M.woodDk); }
  for(let i=0;i<n;i++){ const t=(i+0.86)/n;
    if(doorsAxis==='x') box(x0+(x1-x0)*t-0.02,y0-0.028,z+h*0.48, x0+(x1-x0)*t+0.02,y0-0.008,z+h*0.62, M.steel);
    else box(x0-0.028,y0+(y1-y0)*t-0.02,z+h*0.48, x0-0.008,y0+(y1-y0)*t+0.02,z+h*0.62, M.steel); }
}
function sofa(cx,cy,w,d,z,facing){          // facing: 面朝方向
  const x0=cx-w/2,x1=cx+w/2,y0=cy-d/2,y1=cy+d/2;
  box(x0,y0,z, x1,y1,z+0.34, M.fabric);
  box(x0,y0,z+0.34, x1,y1,z+0.40, M.fabricW);
  const bk=0.42;
  if(facing==='s') box(x0,y1-0.20,z, x1,y1,z+0.40+bk, M.fabric);
  if(facing==='n') box(x0,y0,z, x1,y0+0.20,z+0.40+bk, M.fabric);
  if(facing==='e') box(x0,y0,z, x0+0.20,y1,z+0.40+bk, M.fabric);
  if(facing==='w') box(x1-0.20,y0,z, x1,y1,z+0.40+bk, M.fabric);
  if(facing==='s'||facing==='n'){
    box(x0,y0,z, x0+0.16,y1,z+0.56, M.fabric); box(x1-0.16,y0,z, x1,y1,z+0.56, M.fabric);
  } else { box(x0,y0,z, x1,y0+0.16,z+0.56, M.fabric); box(x0,y1-0.16,z, x1,y1,z+0.56, M.fabric); }
  for(let i=0;i<2;i++){ const px=cx+(i?0.28:-0.28)*w;
    ball(px, facing==='s'?y1-0.26:y0+0.26, z+0.52, 0.16,0.07,0.12, 8, M.fabricW); }
}
function table(cx,cy,w,l,z,h,m){
  box(cx-w/2,cy-l/2,z+h-0.05, cx+w/2,cy+l/2,z+h, m||M.woodLt);
  const ix=w/2-0.10, iy=l/2-0.10;
  for(const s of [[-1,-1],[1,-1],[-1,1],[1,1]])
    box(cx+s[0]*ix-0.035,cy+s[1]*iy-0.035,z, cx+s[0]*ix+0.035,cy+s[1]*iy+0.035,z+h-0.05, m||M.woodDk);
}
function chair(cx,cy,z,rot){
  const s=0.21;
  box(cx-s,cy-s,z+0.42, cx+s,cy+s,z+0.47, M.woodLt);
  for(const q of [[-1,-1],[1,-1],[-1,1],[1,1]])
    box(cx+q[0]*(s-0.03)-0.022,cy+q[1]*(s-0.03)-0.022,z, cx+q[0]*(s-0.03)+0.022,cy+q[1]*(s-0.03)+0.022,z+0.42, M.woodDk);
  if(rot==='n') box(cx-s,cy+s-0.05,z+0.47, cx+s,cy+s,z+0.92, M.woodLt);
  else if(rot==='s') box(cx-s,cy-s,z+0.47, cx+s,cy-s+0.05,z+0.92, M.woodLt);
  else if(rot==='e') box(cx+s-0.05,cy-s,z+0.47, cx+s,cy+s,z+0.92, M.woodLt);
  else box(cx-s,cy-s,z+0.47, cx-s+0.05,cy+s,z+0.92, M.woodLt);
}
function wc(cx,cy,z,dir){                    // 坐便器，dir 为靠墙方向
  const d = dir==='n'?[0,1]:dir==='s'?[0,-1]:dir==='w'?[-1,0]:[1,0];
  const bx=cx-d[0]*0.06, by=cy-d[1]*0.06;
  box(bx-0.19,by-0.19,z, bx+0.19,by+0.19,z+0.20, M.ceramic);
  ball(bx,by,z+0.30, 0.20,0.24,0.10, 10, M.ceramic);
  box(bx+d[0]*0.20-0.19, by+d[1]*0.20-0.19, z, bx+d[0]*0.20+0.19, by+d[1]*0.20+0.19, z+0.72, M.ceramic);
}
function basin(cx,cy,z,dir,w){
  w = w||0.62;
  const d = dir==='n'?[0,1]:dir==='s'?[0,-1]:dir==='w'?[-1,0]:[1,0];
  const ax = Math.abs(d[0])>0.5;
  const hw = ax?0.26:w/2, hl = ax?w/2:0.26;
  box(cx-hw,cy-hl,z+0.74, cx+hw,cy+hl,z+0.82, M.slab);
  box(cx-hw+0.05,cy-hl+0.05,z+0.42, cx+hw-0.05,cy+hl-0.05,z+0.74, M.woodDk);
  ball(cx,cy,z+0.80, hw*0.62,hl*0.62,0.09, 10, M.ceramic);
  cyl(cx-d[0]*0.19, cy-d[1]*0.19, z+0.82, z+1.04, 0.018,0.018, 8, M.steel, false);
  box(cx-d[0]*0.19-0.02, cy-d[1]*0.19-0.02, z+1.02, cx-d[0]*0.19+d[0]*0.14+0.02, cy-d[1]*0.19+d[1]*0.14+0.02, z+1.06, M.steel);
  // 镜
  const mz0=z+1.15, mz1=z+1.85;
  if(ax) box(cx-d[0]*0.24, cy-hl+0.06, mz0, cx-d[0]*0.24+d[0]*0.02, cy+hl-0.06, mz1, M.mirror);
  else   box(cx-hw+0.06, cy-d[1]*0.24, mz0, cx+hw-0.06, cy-d[1]*0.24+d[1]*0.02, mz1, M.mirror);
}
function shower(x0,y0,x1,y1,z,openDir){
  box(x0,y0,z, x1,y1,z+0.06, M.ceramic);                       // 淋浴盘
  const h=1.95;
  // 玻璃隔断（两面）
  if(openDir==='x') box(x0,y1-0.012,z, x1,y1+0.012,z+h, M.glass);
  else box(x1-0.012,y0,z, x1+0.012,y1,z+h, M.glass);
  cyl((x0+x1)/2,(y0+y1)/2,z, z+0.001, 0.01,0.01, 4, M.steel, false);
  const sx=x0+0.16, sy=y0+0.16;
  cyl(sx,sy,z+0.30, z+2.05, 0.016,0.016, 8, M.steel, false);
  box(sx-0.09,sy-0.09,z+2.02, sx+0.09,sy+0.09,z+2.07, M.steel);
  box(sx-0.05,sy-0.05,z+1.10, sx+0.05,sy+0.05,z+1.22, M.steel);
}
function kitchenRun(x0,y0,x1,y1,z,dir,opts){   // dir: 台面正面朝向
  opts=opts||{};
  box(x0,y0,z, x1,y1,z+0.86, M.woodLt);                        // 地柜
  box(x0-0.02,y0-0.02,z+0.86, x1+0.02,y1+0.02,z+0.92, M.slab); // 石材台面
  const ax = (x1-x0) > (y1-y0);
  const n = Math.max(2, Math.round((ax?(x1-x0):(y1-y0))/0.60));
  for(let i=1;i<n;i++){ const t=i/n;
    if(ax) box(x0+(x1-x0)*t-0.008, y0-0.006, z+0.05, x0+(x1-x0)*t+0.008, y1+0.006, z+0.84, M.woodDk);
    else box(x0-0.006, y0+(y1-y0)*t-0.008, z+0.05, x1+0.006, y0+(y1-y0)*t+0.008, z+0.84, M.woodDk); }
  if(opts.upper){                                              // 吊柜
    const uz=z+1.45;
    box(x0, ax?y0:y0, uz, ax?x1:x0+0.34, ax?y0+0.34:y1, uz+0.72, M.woodLt);
  }
  if(opts.sink){ const s=opts.sink;
    box(s[0]-0.26,s[1]-0.20,z+0.86, s[0]+0.26,s[1]+0.20,z+0.90, M.steel);
    box(s[0]-0.23,s[1]-0.17,z+0.76, s[0]+0.23,s[1]+0.17,z+0.87, M.steel);
    cyl(s[0], s[1]-0.26, z+0.92, z+1.22, 0.017,0.017, 8, M.steel, false);
    box(s[0]-0.02,s[1]-0.30,z+1.19, s[0]+0.02,s[1]-0.12,z+1.23, M.steel); }
  if(opts.hob){ const h=opts.hob;
    box(h[0]-0.30,h[1]-0.24,z+0.90, h[0]+0.30,h[1]+0.24,z+0.94, M.metalDk);
    for(const q of [[-0.15,0],[0.15,0]]) cyl(h[0]+q[0],h[1]+q[1],z+0.94, z+0.96, 0.085,0.085, 10, M.steel);
    box(h[0]-0.34,h[1]-0.26,z+1.52, h[0]+0.34,h[1]+0.26,z+1.62, M.steel);   // 抽油烟机
    box(h[0]-0.16,h[1]-0.12,z+1.62, h[0]+0.16,h[1]+0.12,z+2.20, M.steel); }
}
function fridge(x0,y0,x1,y1,z){
  box(x0,y0,z, x1,y1,z+1.78, M.steel);
  box(x0-0.008,y0-0.008,z+1.14, x1+0.008,y1+0.008,z+1.16, M.metalDk);
  box(x0+0.06,y0-0.03,z+1.24, x0+0.10,y0-0.01,z+1.62, M.metalDk);
}
function washer(cx,cy,z){
  box(cx-0.30,cy-0.30,z, cx+0.30,cy+0.30,z+0.86, M.steel);
  cyl(cx,cy-0.31,z+0.50, cy-0.29>0?z+0.50:z+0.50, 0.20,0.20, 12, M.metalDk, false);
  box(cx-0.22,cy-0.325,z+0.28, cx+0.22,cy-0.30,z+0.72, M.metalDk);
  box(cx-0.28,cy-0.325,z+0.78, cx+0.28,cy-0.30,z+0.84, M.metalDk);
}
function tvUnit(cx,cy,z,dir,w){
  const ax = dir==='n'||dir==='s';
  const hw = ax? w/2:0.22, hl = ax?0.22:w/2;
  box(cx-hw,cy-hl,z, cx+hw,cy+hl,z+0.42, M.woodDk);
  const tz=z+0.62, th=0.60;
  if(ax) box(cx-w*0.34, cy-0.03, tz, cx+w*0.34, cy+0.03, tz+th, M.metalDk);
  else   box(cx-0.03, cy-w*0.34, tz, cx+0.03, cy+w*0.34, tz+th, M.metalDk);
}
function rug(cx,cy,w,l,z){ box(cx-w/2,cy-l/2,z+0.002, cx+w/2,cy+l/2,z+0.014, M.fabric); }
function ceilLamp(cx,cy,z,r){ cyl(cx,cy,z-0.10, z-0.02, r||0.19, (r||0.19)*0.75, 12, M.lamp);
  cyl(cx,cy,z-0.02, z, 0.02,0.02, 6, M.metalDk, false); }
function plantPot(cx,cy,z,h){
  cyl(cx,cy,z, z+h*0.34, h*0.20,h*0.16, 10, M.brick);
  cyl(cx,cy,z+h*0.30, z+h*0.52, 0.025,0.025, 6, M.bark, false);
  ball(cx,cy,z+h*0.76, h*0.30,h*0.30,h*0.28, 10, M.foliage);
  ball(cx-h*0.16,cy+h*0.10,z+h*0.60, h*0.20,h*0.20,h*0.18, 8, M.foliage2);
}

/* —— 一层布置 —— */
group('furn1');
const Z1=D.FF+0.02;
// 客厅 site [1.55,6.95]-[5.70,12.15]
rug(3.5,9.4,2.9,2.1,Z1);
sofa(3.55,11.10,2.55,0.92,Z1,'s');
sofa(1.95,9.30,0.95,1.70,Z1,'e');
table(3.50,9.35,1.15,0.62,Z1,0.42,M.woodDk);
tvUnit(3.50,7.35,Z1,'n',1.85);
plantPot(5.35,7.35,Z1,1.35);
ceilLamp(3.6,9.5,D.ceil1,0.24);
// 餐厅 site [1.55,12.25]-[5.70,16.25]
table(3.45,14.10,1.62,0.94,Z1,0.75,M.woodLt);
chair(2.40,13.75,Z1,'e'); chair(2.40,14.45,Z1,'e');
chair(4.50,13.75,Z1,'w'); chair(4.50,14.45,Z1,'w');
chair(3.10,13.05,Z1,'n'); chair(3.80,13.05,Z1,'n');
chair(3.10,15.15,Z1,'s'); chair(3.80,15.15,Z1,'s');
ceilLamp(3.45,14.10,D.ceil1,0.16); ceilLamp(2.65,14.10,D.ceil1,0.16); ceilLamp(4.25,14.10,D.ceil1,0.16);
wardrobe(1.60,15.55,2.95,16.20,Z1,0.90,'x');
// 玄关 site [5.80,6.95]-[9.25,8.05]
box(8.05,7.00,Z1, 9.20,7.42,Z1+0.46, M.woodDk);
plantPot(6.05,7.60,Z1,1.10);
ceilLamp(7.5,7.5,D.ceil1,0.14);
// 次卧3 site [5.80,11.55]-[9.25,14.55]
bed(7.35,12.95,1.55,2.00,Z1,'n',M.fabricW,M.fabric);
nightstand(6.35,13.75,Z1); nightstand(8.35,13.75,Z1);
wardrobe(5.85,11.60,6.45,13.30,Z1,2.15,'y');
ceilLamp(7.5,13.0,D.ceil1,0.18);
// 卫3 site [7.65,14.65]-[9.25,16.25]
wc(8.05,15.95,Z1,'n'); basin(8.85,15.05,Z1,'e',0.72); shower(7.72,14.72,8.42,15.42,Z1,'x');
// 设备/储物 site [5.80,14.65]-[7.55,16.25]
box(5.85,15.95,Z1, 7.50,16.20,Z1+1.95, M.woodLt);
cyl(6.90,15.10,Z1+0.10, Z1+1.30, 0.28,0.28, 12, M.tank);
box(5.90,14.70,Z1+1.30, 6.30,14.98,Z1+1.75, M.metalDk);
// 厨房 site [1.55,16.55]-[5.45,19.85]
kitchenRun(1.60,16.60,5.40,17.24,D.FF,'n',{sink:[2.55,16.92], hob:[4.35,16.92], upper:1});
box(1.60,17.24,D.FF+1.45, 5.40,17.28,D.FF+2.17, M.woodLt);
kitchenRun(1.60,19.20,3.30,19.80,D.FF,'s',{});
fridge(3.55,19.15,4.25,19.80,D.FF);
table(3.20,18.35,1.10,0.72,D.FF,0.76,M.woodLt);
chair(2.45,18.35,D.FF,'e'); chair(3.95,18.35,D.FF,'w');
ceilLamp(3.2,18.2,D.annexTop-0.12,0.20);
// 公厕·淋浴 site [5.55,16.55]-[7.15,19.85]
wc(5.95,19.50,D.FF,'n'); basin(6.85,18.55,D.FF,'e',0.70);
shower(5.62,16.62,6.62,17.62,D.FF,'x');
// 洗衣房 site [7.25,16.55]-[9.25,18.30]
washer(7.70,17.05,D.FF); washer(8.45,17.05,D.FF);
box(7.30,17.85,D.FF+0.80, 9.20,18.25,D.FF+0.90, M.slab);
box(7.30,17.85,D.FF+0.35, 9.20,18.25,D.FF+0.80, M.woodLt);
cyl(9.00,16.95,D.FF+1.35, D.FF+2.05, 0.20,0.20, 12, M.tank);
// 杂物间 site [7.25,18.40]-[9.25,19.85]
for(let i=0;i<3;i++) box(7.30,18.45,D.FF+0.45+i*0.55, 9.20,18.95,D.FF+0.50+i*0.55, M.woodLt);
box(8.30,19.15,D.FF, 9.15,19.80,D.FF+0.75, M.woodDk);

/* —— 二层布置 —— */
group('furn2');
const Z2=D.F1+0.02;
// 主卧 site [1.55,6.95]-[5.70,11.15]
bed(3.30,9.35,1.85,2.05,Z2,'n',M.fabricW,M.fabric);
nightstand(2.10,10.20,Z2); nightstand(4.50,10.20,Z2);
tvUnit(3.30,7.25,Z2,'n',1.55);
rug(3.30,8.15,2.4,1.3,Z2);
box(4.75,7.10,Z2, 5.62,8.30,Z2+0.74, M.woodLt);          // 书桌
chair(4.95,8.55,Z2,'n');
ceilLamp(3.3,9.0,D.ceil2,0.24);
// 衣帽间 site [1.55,11.25]-[3.35,12.85]
wardrobe(1.60,11.30,3.30,11.86,Z2,2.25,'x');
box(1.60,12.30,Z2+1.05, 3.30,12.80,Z2+1.11, M.woodLt);
box(1.60,12.30,Z2+1.75, 3.30,12.80,Z2+1.81, M.woodLt);
cyl(1.62,12.55,Z2+1.60, Z2+1.62, 0.016,0.016, 6, M.steel, false);
for(let i=0;i<7;i++) box(1.72+i*0.21,12.42,Z2+0.62, 1.86+i*0.21,12.70,Z2+1.58, M.cloth);
box(1.60,12.05,Z2, 3.30,12.28,Z2+0.42, M.woodDk);
ceilLamp(2.4,12.0,D.ceil2,0.13);
// 主卫 site [3.45,11.25]-[5.70,12.85]
wc(5.35,11.65,Z2,'e'); basin(4.30,12.62,Z2,'n',0.78);
shower(3.52,11.32,4.32,12.12,Z2,'x');
// 次卧1 site [1.55,12.95]-[4.00,16.25]
bed(2.70,14.55,1.55,2.00,Z2,'n',M.fabricW,M.fabric);
nightstand(1.80,15.40,Z2);
wardrobe(4.15,13.00,5.65,13.62,Z2,2.15,'x');            // 凹室衣柜
box(4.15,13.90,Z2, 5.65,14.42,Z2+0.74, M.woodLt);
chair(4.90,14.75,Z2,'n');
ceilLamp(2.8,14.4,D.ceil2,0.18);
// 卫1 site [4.10,14.55]-[5.70,16.25]
wc(4.50,15.95,Z2,'n'); basin(5.35,15.05,Z2,'e',0.68);
shower(4.17,14.62,4.92,15.32,Z2,'x');
// 楼梯厅 site [5.80,6.95]-[9.25,11.45]
sofa(6.55,7.55,1.35,0.80,Z2,'n');
table(7.55,7.55,0.72,0.52,Z2,0.42,M.woodDk);
plantPot(8.95,7.35,Z2,1.30);
box(8.80,9.20,Z2, 9.20,10.60,Z2+0.80, M.woodDk);
ceilLamp(7.0,7.6,D.ceil2,0.16);
// 次卧2 site [5.80,11.55]-[9.25,14.45]
bed(7.60,12.85,1.50,1.95,Z2,'n',M.fabricW,M.fabric);
nightstand(6.65,13.65,Z2);
wardrobe(5.85,11.60,6.42,13.20,Z2,2.15,'y');
box(8.55,11.62,Z2, 9.20,13.10,Z2+0.74, M.woodLt);
ceilLamp(7.6,13.0,D.ceil2,0.18);
// 卫2 site [5.80,14.55]-[7.55,16.25]
wc(6.20,15.95,Z2,'n'); basin(7.10,15.05,Z2,'e',0.70);
shower(5.87,14.62,6.62,15.32,Z2,'x');
// 后阳台 site [7.65,14.55]-[9.25,16.25]
for(let i=0;i<2;i++) box(7.75,14.85+i*0.42,Z2+1.55, 9.15,14.87+i*0.42,Z2+1.57, M.steel);
for(let i=0;i<4;i++) box(7.90+i*0.31,14.80,Z2+0.85, 8.12+i*0.31,14.94,Z2+1.54, M.cloth);
box(8.60,15.75,Z2, 9.20,16.20,Z2+0.55, M.steel);

/* ───────────────────────── 12. 场地与地形 ───────────────────────── */
group('site');
const FIELD=-0.55, ROAD=-0.15;
const field2 = mat('农田A',[62,92,42],.97,3), field3 = mat('农田B',[86,106,52],.97,3),
      field4 = mat('农田C',[70,98,50],.97,3);
face([-90,-90,FIELD],[110,-90,FIELD],[110,120,FIELD],[-90,120,FIELD], M.grass);
[[-52,4,-2,34,field2],[12,-4,46,26,field3],[-46,36,20,72,field4],[22,30,64,74,field2],
 [-40,-40,4,-10,field3],[14,-46,58,-8,field4],[-88,-20,-52,40,field4],[48,10,92,60,field3]]
 .forEach(f=>face([f[0],f[1],FIELD+0.01],[f[2],f[1],FIELD+0.01],[f[2],f[3],FIELD+0.01],[f[0],f[3],FIELD+0.01], f[4]));
box(-1.2,-8.0,FIELD, 11.2,0,ROAD, M.asphalt);                                  // 镇道
box(-1.2,-0.35,ROAD, 11.2,0,ROAD+0.02, M.concrete);                            // 路缘
box(0,0,FIELD, 10,32,0, M.plinth, 'top');                                      // 回填台地（顶面另做，需挖出水池）
// 场地面：绕开泳池 (1.2,21.9)-(4.7,28.4) 与鱼池 (6.6,26.0)-(9.2,27.8) 的开口
[[0,0,10,21.9],[0,21.9,1.2,28.4],[4.7,21.9,6.6,28.4],[9.2,21.9,10,28.4],
 [6.6,21.9,9.2,26.0],[6.6,27.8,9.2,28.4],[0,28.4,10,32]]
 .forEach(r=>face([r[0],r[1],0],[r[2],r[1],0],[r[2],r[3],0],[r[0],r[3],0], M.grass));
// 铺装
const pave=(x0,y0,x1,y1,m)=>box(x0,y0,0.005, x1,y1,0.035, m||M.concrete);
pave(1.15,0.35,6.45,3.25);                       // 停车与车道
pave(6.75,0.35,8.05,5.65);                       // 入户步道
pave(X0,Y0-1.40,X1,Y0);                          // 门廊前
// 泳池铺装：绕池四边，不能整块盖住水面
pave(0.45,21.15,0.78,28.95, M.floorTile);
pave(5.12,21.15,5.75,28.95, M.floorTile);
pave(0.78,21.15,5.12,21.48, M.floorTile);
pave(0.78,28.82,5.12,28.95, M.floorTile);
pave(X0,AY1,X0+4.05,AY1+1.30);                   // 晾衣区
// 凉亭区铺装：绕鱼池四边
pave(6.30,21.80,9.55,25.88, M.floorTile);
pave(6.30,27.92,9.55,28.60, M.floorTile);
pave(6.30,25.88,6.48,27.92, M.floorTile);
pave(9.32,25.88,9.55,27.92, M.floorTile);
pave(0.05,6.0,1.38,20.4);                        // 左侧通道
pave(9.42,6.0,9.95,20.4);                        // 右侧通道
// 排水明沟
box(0.05,6.0,0.005, 0.30,29.0,0.045, M.concrete);
box(0.09,6.0,0.02, 0.26,29.0,0.05, M.metalDk);
box(9.70,6.0,0.005, 9.95,29.0,0.045, M.concrete);
// 菜园与禽舍地面
box(0.45,29.10,0, 7.25,31.75,0.30, M.soil);
box(7.35,29.05,0, 9.60,31.65,0.06, M.soil);

/* ───────────────────────── 13. 围墙 · 大门 · 门口 ───────────────────────── */
function pillar(cx,cy,h,lamp){
  box(cx-0.17,cy-0.17,0, cx+0.17,cy+0.17,h, M.brick);
  box(cx-0.21,cy-0.21,h, cx+0.21,cy+0.21,h+0.09, M.concrete);
  if(lamp){ box(cx-0.08,cy-0.08,h+0.09, cx+0.08,cy+0.08,h+0.14, M.metalDk);
    box(cx-0.10,cy-0.10,h+0.14, cx+0.10,cy+0.10,h+0.34, M.lamp);
    box(cx-0.12,cy-0.12,h+0.34, cx+0.12,cy+0.12,h+0.40, M.metalDk); }
}
function wallRun(dir,u0,u1,v,h){
  const t=0.06;
  if(dir==='x') box(u0,v-t,0, u1,v+t,h, M.brick); else box(v-t,u0,0, v+t,u1,h, M.brick);
  if(dir==='x') box(u0,v-0.10,h, u1,v+0.10,h+0.07, M.concrete);
  else box(v-0.10,u0,h, v+0.10,u1,h+0.07, M.concrete);
}
const WH=1.90;
wallRun('x',0,1.05,0,WH); wallRun('x',5.35,6.65,0,WH); wallRun('x',7.85,10,0,WH);
wallRun('y',0.30,11.9,0,WH); wallRun('y',0.30,11.9,10,WH);
pillar(0.12,0.12,WH,0); pillar(1.20,0.10,WH+0.15,1); pillar(5.20,0.10,WH+0.15,1);
pillar(6.80,0.10,WH,1); pillar(7.70,0.10,WH,1); pillar(9.88,0.12,WH,0);
for(let y=3.0;y<12;y+=3.0){ pillar(0.10,y,WH,0); pillar(9.90,y,WH,0); }
// 网栅围栏 + 绿篱
for(let y=11.9;y<32;y+=2.4){ box(0.04,y,0,0.14,y+0.10,1.80, M.metalDk); box(9.86,y,0,9.96,y+0.10,1.80, M.metalDk); }
for(let x=0.1;x<10;x+=2.4) box(x,31.88,0, x+0.10,31.98,1.80, M.metalDk);
for(const z of [0.25,1.02,1.74]){
  box(0.06,11.9,z, 0.12,32,z+0.05, M.metalDk); box(9.88,11.9,z, 9.94,32,z+0.05, M.metalDk);
  box(0,31.90,z, 10,31.96,z+0.05, M.metalDk);
}
group('yard');
box(0.16,12.0,0, 0.62,31.7,1.05, M.hedge); box(9.38,12.0,0, 9.84,31.7,1.05, M.hedge);
box(0.62,31.42,0, 9.38,31.88,1.05, M.hedge);
// —— 车行门（推拉）
group('site');
box(1.22,-0.02,0, 5.18,0.02,0.06, M.steel);                    // 地轨
box(1.25,-0.05,0.08, 5.15,0.05,0.20, M.metalDk);
box(1.25,-0.05,1.55, 5.15,0.05,1.70, M.metalDk);
for(let x=1.32;x<5.12;x+=0.155) box(x,-0.035,0.20, x+0.045,0.035,1.55, M.metalDk);
for(let x=1.32;x<5.12;x+=0.62) box(x-0.02,-0.05,0.78, x+0.10,0.05,0.92, M.louver);
// —— 人行门
box(6.86,-0.04,0.05, 7.64,0.04,0.14, M.metalDk);
box(6.86,-0.04,1.62, 7.64,0.04,1.72, M.metalDk);
for(let x=6.92;x<7.60;x+=0.135) box(x,-0.03,0.14, x+0.04,0.03,1.62, M.metalDk);
box(7.52,-0.075,0.92, 7.60,0.075,1.02, M.steel);
// —— 门口细部
box(6.95,0.16,WH*0.55, 7.55,0.20,WH*0.55+0.22, M.steel);       // 门牌
box(5.42,0.14,1.00, 5.72,0.30,1.34, M.metalDk);                // 信箱
box(5.44,0.10,1.26, 5.70,0.16,1.30, M.steel);
for(const p of [[6.55,1.2],[6.55,3.0],[6.55,4.8],[8.25,1.2],[8.25,3.0],[8.25,4.8]]){
  cyl(p[0],p[1],0.03, 0.62, 0.035,0.035, 8, M.metalDk, false);
  box(p[0]-0.07,p[1]-0.07,0.62, p[0]+0.07,p[1]+0.07,0.70, M.lamp);
}
for(const p of [[6.45,0.55],[8.35,0.55]]){                      // 门口大盆栽
  cyl(p[0],p[1],0.03, 0.46, 0.30,0.26, 12, M.brick);
  ball(p[0],p[1],0.86, 0.42,0.42,0.40, 12, M.foliage);
  ball(p[0]-0.2,p[1]+0.16,0.68, 0.26,0.26,0.24, 10, M.foliage2);
}
// 摩托车
(function(){ const x=8.65,y=2.2;
  box(x-0.05,y-0.85,0.02, x+0.05,y-0.25,0.62, M.tyre);
  box(x-0.05,y+0.25,0.02, x+0.05,y+0.85,0.62, M.tyre);
  box(x-0.10,y-0.60,0.28, x+0.10,y+0.60,0.46, M.metalDk);
  box(x-0.14,y-0.10,0.46, x+0.14,y+0.42,0.70, M.carBody);
  box(x-0.16,y+0.10,0.70, x+0.16,y+0.50,0.82, M.fabric);
  box(x-0.30,y-0.62,0.78, x+0.30,y-0.56,0.84, M.steel);
  cyl(x,y-0.58,0.46, 0.80, 0.035,0.035, 8, M.steel, false);
})();

/* ───────────────────────── 14. 汽车 ───────────────────────── */
group('yard');
(function(){ const x0=1.70,x1=6.30,y0=0.75,y1=2.60, z=0.035;
  box(x0,y0,z+0.26, x1,y1,z+0.78, M.carBody);
  box(x0+0.18,y0+0.05,z+0.20, x1-0.18,y1-0.05,z+0.30, M.carBody);
  box(x0+1.05,y0+0.09,z+0.78, x1-0.95,y1-0.09,z+1.28, M.carBody);
  box(x0+1.12,y0+0.06,z+0.84, x1-1.02,y1-0.06,z+1.20, M.carGlass);
  for(const p of [[x0+0.72,y0+0.02],[x1-0.62,y0+0.02],[x0+0.72,y1-0.24],[x1-0.62,y1-0.24]]){
    box(p[0]-0.30,p[1],z, p[0]+0.30,p[1]+0.22,z+0.60, M.tyre);
    box(p[0]-0.17,p[1]-0.012,z+0.13, p[0]+0.17,p[1]+0.232,z+0.47, M.steel); }
  box(x0-0.02,y0+0.12,z+0.52, x0+0.04,y0+0.42,z+0.66, M.lamp);
  box(x0-0.02,y1-0.42,z+0.52, x0+0.04,y1-0.12,z+0.66, M.lamp);
})();

/* ───────────────────────── 15. 泳池 ───────────────────────── */
group('yard');
(function(){
  const px0=1.20,px1=4.70,py0=21.90,py1=28.40, dp0=-0.95, dp1=-1.45;
  // 池壁
  box(px0-0.22,py0-0.22,dp1, px0,py1+0.22,0, M.poolTile);
  box(px1,py0-0.22,dp1, px1+0.22,py1+0.22,0, M.poolTile);
  box(px0,py0-0.22,dp1, px1,py0,0, M.poolTile);
  box(px0,py1,dp1, px1,py1+0.22,0, M.poolTile);
  // 池底（浅→深）
  face([px0,py0,dp0],[px1,py0,dp0],[px1,py1,dp1],[px0,py1,dp1], M.poolTile);
  // 压顶
  const cop=(a,b,c,d)=>box(a,b,0, c,d,0.09, M.slab);
  cop(px0-0.42,py0-0.42,px1+0.42,py0-0.22); cop(px0-0.42,py1+0.22,px1+0.42,py1+0.42);
  cop(px0-0.42,py0-0.42,px0-0.22,py1+0.42); cop(px1+0.22,py0-0.42,px1+0.42,py1+0.42);
  // 台阶
  for(let i=0;i<3;i++) box(px0+0.05,py0+0.05+i*0.32, -0.22-i*0.24, px0+1.15,py0+0.37+i*0.32, -0.22-i*0.24+0.06, M.poolTile);
  // 扶手
  cyl(px0+1.35,py0+0.30,0.02, 0.95, 0.028,0.028, 8, M.steel, false);
  cyl(px0+1.35,py0+0.30+0.55,0.02, 0.95, 0.028,0.028, 8, M.steel, false);
  box(px0+1.32,py0+0.30,0.90, px0+1.38,py0+0.85,0.96, M.steel);
  // 水面
  group('water');
  face([px0,py0,-0.10],[px1,py0,-0.10],[px1,py1,-0.10],[px0,py1,-0.10], M.water);
  group('yard');
  // 过滤设备箱
  box(5.05,21.35,0.035, 5.68,22.05,0.72, M.metalDk);
  // 躺椅 ×2 与遮阳伞
  for(const yy of [23.4,24.9]){
    box(4.95,yy,0.30, 5.66,yy+0.62,0.36, M.fabricW);
    box(5.50,yy,0.36, 5.66,yy+0.62,0.72, M.fabricW);
    for(const q of [[5.02,yy+0.05],[5.60,yy+0.05],[5.02,yy+0.55],[5.60,yy+0.55]])
      cyl(q[0],q[1],0.035, 0.30, 0.022,0.022, 6, M.steel, false);
  }
  cyl(5.30,26.1,0.035, 2.25, 0.035,0.035, 8, M.steel, false);
  cyl(5.30,26.1,2.05, 2.30, 1.15,0.06, 12, M.cloth);
})();

/* ───────────────────────── 16. 凉亭 ───────────────────────── */
(function(){
  const x0=6.40,x1=9.40,y0=22.20,y1=25.20, ph=2.50, rz=3.30;
  box(x0,y0,0.03, x1,y1,0.16, M.floorTile);
  for(const p of [[x0+0.18,y0+0.18],[x1-0.18,y0+0.18],[x0+0.18,y1-0.18],[x1-0.18,y1-0.18]]){
    box(p[0]-0.09,p[1]-0.09,0.16, p[0]+0.09,p[1]+0.09,ph, M.woodDk);
    box(p[0]-0.12,p[1]-0.12,0.16, p[0]+0.12,p[1]+0.12,0.30, M.concrete);
  }
  box(x0+0.06,y0+0.09,ph, x1-0.06,y0+0.27,ph+0.16, M.woodDk);
  box(x0+0.06,y1-0.27,ph, x1-0.06,y1-0.09,ph+0.16, M.woodDk);
  box(x0+0.09,y0+0.06,ph, x0+0.27,y1-0.06,ph+0.16, M.woodDk);
  box(x1-0.27,y0+0.06,ph, x1-0.09,y1-0.06,ph+0.16, M.woodDk);
  const e=ph+0.16, ex0=x0-0.40,ex1=x1+0.40,ey0=y0-0.40,ey1=y1+0.40, rx=(x0+x1)/2;
  const R0=[rx,y0+0.75,rz], R1=[rx,y1-0.75,rz];
  face([ex0,ey0,e],[ex0,ey1,e],R1,R0,M.roofTile,true);
  face([ex1,ey1,e],[ex1,ey0,e],R0,R1,M.roofTile,true);
  tri3([ex0,ey0,e],R0,[ex1,ey0,e],M.roofTile,true);
  tri3([ex1,ey1,e],R1,[ex0,ey1,e],M.roofTile,true);
  face([ex0,ey0,e],[ex1,ey0,e],[ex1,ey1,e],[ex0,ey1,e],M.woodLt);
  box(rx-0.10,y0+0.55,rz-0.05, rx+0.10,y1-0.55,rz+0.05, M.fascia);
  for(let y=ey0+0.4;y<ey1;y+=0.55){ box(ex0+0.02,y,e-0.10, x0,y+0.06,e-0.02, M.woodDk);
    box(x1,y,e-0.10, ex1-0.02,y+0.06,e-0.02, M.woodDk); }
  // 石桌石凳
  cyl(7.90,23.70,0.16, 0.70, 0.16,0.20, 10, M.rock);
  cyl(7.90,23.70,0.70, 0.76, 0.62,0.62, 14, M.slab);
  for(const q of [[7.90,22.85],[7.90,24.55],[7.05,23.70],[8.75,23.70]]){
    cyl(q[0],q[1],0.16, 0.42, 0.17,0.17, 10, M.rock);
    cyl(q[0],q[1],0.42, 0.46, 0.24,0.24, 12, M.slab); }
  cyl(7.90,24.60,ph+0.05, ph+0.14, 0.02,0.02, 6, M.metalDk, false);
  ball(7.90,24.60,ph-0.05, 0.13,0.13,0.13, 10, M.lamp);
})();

/* ───────────────────────── 17. 锦鲤池 ───────────────────────── */
(function(){
  const x0=6.60,x1=9.20,y0=26.00,y1=27.80, d=-1.05;
  box(x0-0.12,y0-0.12,d, x1+0.12,y1+0.12,-0.02, M.rock, 'top');
  face([x0,y0,d],[x1,y0,d],[x1,y1,d],[x0,y1,d], M.rock);
  box(x0-0.12,y0-0.12,d, x0,y1+0.12,0, M.rock);
  box(x1,y0-0.12,d, x1+0.12,y1+0.12,0, M.rock);
  box(x0,y0-0.12,d, x1,y0,0, M.rock);
  box(x0,y1,d, x1,y1+0.12,0, M.rock);
  group('water');
  face([x0,y0,-0.12],[x1,y0,-0.12],[x1,y1,-0.12],[x0,y1,-0.12], M.pondWater);
  group('yard');
  // 汀石与跌水
  let sd=0;
  for(const r of [[6.45,25.85,0.30],[9.28,26.35,0.26],[9.30,27.55,0.30],[6.50,27.70,0.24],
                  [7.55,25.80,0.22],[8.45,27.95,0.26]]){
    sd+=1; ball(r[0],r[1],0.02, r[2],r[2]*0.85,r[2]*0.62, 8, M.rock); }
  box(9.05,27.85,0.05, 9.45,28.35,0.85, M.rock);
  box(9.10,27.70,0.62, 9.40,27.90,0.72, M.rock);
  group('water');
  box(9.16,27.72,0.20, 9.34,27.88,0.66, M.pondWater);
  group('yard');
  for(const lp of [[7.2,26.6],[8.1,27.2],[8.7,26.4]])
    cyl(lp[0],lp[1],-0.10,-0.08, 0.22,0.22, 10, M.veg);
  cyl(6.9,27.3,-0.10, 0.55, 0.10,0.06, 8, M.veg, false);
})();

/* ───────────────────────── 18. 菜园 · 果树 · 禽舍 ───────────────────────── */
(function(){
  for(let i=0;i<4;i++){ const x=0.55+i*1.68;
    box(x,29.20,0.30, x+1.40,31.70,0.42, M.brick);
    box(x+0.06,29.26,0.36, x+1.34,31.64,0.52, M.soil);
    for(let r=0;r<4;r++) for(let c=0;c<7;c++)
      ball(x+0.24+r*0.30, 29.50+c*0.32, 0.56, 0.11,0.11,0.13, 6, M.veg); }
  // 竹架 + 藤蔓
  for(let i=0;i<5;i++){ const x=0.6+i*1.6;
    cyl(x,29.35,0.42, 2.15, 0.035,0.030, 6, M.bark, false);
    cyl(x,31.55,0.42, 2.15, 0.035,0.030, 6, M.bark, false); }
  box(0.55,29.32,2.10, 7.20,29.38,2.15, M.bark);
  box(0.55,31.52,2.10, 7.20,31.58,2.15, M.bark);
  for(let i=0;i<5;i++){ const x=0.6+i*1.6; box(x-0.02,29.35,2.12, x+0.02,31.55,2.15, M.bark); }
  for(let i=0;i<26;i++){ const x=0.6+ (i%13)*0.52, y = i<13?29.36:31.54;
    ball(x,y,1.75+((i*7)%5)*0.08, 0.16,0.10,0.14, 6, M.veg); }
  // 堆肥箱 + 水桶
  box(0.55,28.35,0.03, 1.35,29.05,0.75, M.woodDk);
  cyl(1.75,28.65,0.03, 0.42, 0.20,0.20, 10, M.metalDk);
  // 禽舍
  box(7.60,30.00,0.06, 9.40,31.40,1.35, M.brick);
  box(7.60,30.00,1.35, 9.40,31.40,1.45, M.woodDk);
  face([7.42,29.82,1.78],[9.58,29.82,1.78],[9.58,31.58,1.46],[7.42,31.58,1.46], M.roofMetal);
  box(7.66,29.96,0.30, 8.06,30.04,1.05, M.woodLt);
  for(let y=29.10;y<31.6;y+=0.62) box(7.38,y,0.06, 7.46,y+0.07,1.15, M.metalDk);
  for(let x=7.4;x<9.6;x+=0.62) box(x,29.05,0.06, x+0.07,29.12,1.15, M.metalDk);
  for(const z of [0.20,0.65,1.08]){ box(7.40,29.08,z, 7.44,31.62,z+0.04, M.metalDk);
    box(7.40,29.08,z, 9.60,29.12,z+0.04, M.metalDk); }
  cyl(8.30,29.55,0.06, 0.22, 0.16,0.18, 10, M.metalDk);
  cyl(8.90,29.45,0.06, 0.26, 0.13,0.13, 10, M.steel);
  for(const c of [[8.15,29.65],[8.75,29.95],[9.20,29.40]]){          // 家禽
    ball(c[0],c[1],0.24, 0.13,0.17,0.14, 8, M.fabricW);
    ball(c[0],c[1]-0.14,0.36, 0.07,0.07,0.08, 6, M.fabricW);
    box(c[0]-0.02,c[1]-0.22,0.34, c[0]+0.02,c[1]-0.16,0.38, M.lamp); }
})();

/* ───────────────────────── 19. 树木 ───────────────────────── */
function tree(x,y,h,r,kind){
  if(kind==='banana'){
    cyl(x,y,0, h*0.52, 0.13,0.09, 8, M.bark);
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+0.4, dx=Math.cos(a), dy=Math.sin(a);
      const b=h*0.50, t=h*0.95, L=r*1.5;
      face([x-dy*0.10,y+dx*0.10,b],[x+dy*0.10,y-dx*0.10,b],
           [x+dx*L+dy*0.30, y+dy*L-dx*0.30, t-r*0.30],
           [x+dx*L-dy*0.30, y+dy*L+dx*0.30, t-r*0.30], M.banana);
    }
    return;
  }
  if(kind==='papaya'){
    cyl(x,y,0, h*0.72, 0.10,0.07, 8, M.bark);
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, dx=Math.cos(a), dy=Math.sin(a);
      ball(x+dx*r*0.6, y+dy*r*0.6, h*0.72+0.06, r*0.42,r*0.42,0.10, 6, M.foliage); }
    for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+0.3;
      ball(x+Math.cos(a)*0.16, y+Math.sin(a)*0.16, h*0.60, 0.10,0.10,0.13, 6, M.veg); }
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
}
group('yard');
tree(8.95,2.10,4.20,1.45,'mango');
tree(8.85,4.60,2.90,0.95,'mango');
tree(0.72,17.60,3.10,0.60,'papaya');
tree(0.72,19.55,3.00,0.58,'papaya');
tree(9.68,17.50,3.20,0.95,'banana');
tree(9.68,20.60,3.30,1.00,'banana');
tree(9.68,23.40,3.10,0.95,'banana');
tree(9.62,29.85,2.60,0.55,'papaya');
tree(1.55,31.20,2.60,0.80,'mango');
tree(3.60,31.20,2.55,0.78,'mango');
tree(5.70,31.20,2.60,0.80,'mango');
for(const q of [[6.05,22.4],[6.05,23.6],[6.05,29.0],[6.05,30.2]])
  ball(q[0],q[1],0.20, 0.24,0.24,0.26, 8, M.hedge);
// 周边环境树
[[-4.6,4.0,5.4,1.7],[-3.4,26.0,4.6,1.4],[13.8,5.0,5.0,1.6],[12.6,29.5,4.2,1.3],
 [-6.4,35.6,4.8,1.5],[15.5,19.0,4.4,1.4],[-8.6,11.0,4.0,1.25],[14.2,-6.0,4.6,1.5],
 [-5.2,-5.0,4.2,1.35]].forEach(t=>tree(t[0],t[1],t[2],t[3],'mango'));
// 前院绿化
for(const p of [[2.2,4.6],[3.6,4.9],[5.0,4.6],[8.9,3.5]]) ball(p[0],p[1],0.32, 0.42,0.42,0.32, 10, M.hedge);
box(0.30,0.35,0, 1.05,5.40,0.32, M.hedge);
box(8.55,0.35,0, 9.68,1.05,0.32, M.hedge);

/* ───────────────────────── 20. 上传缓冲 ───────────────────────── */
const ORDER = ['site','yard','shell1','shell2','slab2','ceil1','ceilA','ceil2','part1','part2','furn1','furn2','roof','roofA','water','glass'];
const RANGES = {};
(function(){
  let vc=0, ic=0;
  for(const n of ORDER){ const g=GROUPS[n]; if(!g) continue; vc+=g.v.length; ic+=g.i.length; }
  const VB=new Float32Array(vc), IB=new Uint32Array(ic);
  let vo=0, io=0, base=0;
  for(const n of ORDER){ const g=GROUPS[n]; if(!g){ RANGES[n]={o:0,n:0}; continue; }
    VB.set(g.v, vo);
    for(let k=0;k<g.i.length;k++) IB[io+k] = g.i[k] + base;
    RANGES[n] = {o:io, n:g.i.length};
    base += g.v.length/7; vo += g.v.length; io += g.i.length; }
  const vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo); gl.bufferData(gl.ARRAY_BUFFER,VB,gl.STATIC_DRAW);
  const ibo=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,IB,gl.STATIC_DRAW);
  RANGES.__vbo=vbo; RANGES.__ibo=ibo; RANGES.__tris=ic/3; RANGES.__verts=vc/7;
})();

/* ───────────────────────── 21. 着色器 ───────────────────────── */
function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)+'\n'+src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n').slice(0,1800));
  return s; }
function prog(vs,fs){ const p=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));
  gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p; }
const H='#version 300 es\n';

const VS_MAIN = H+`
in vec3 aPos; in vec3 aNrm; in float aMat;
uniform mat4 uVP, uLVP;
out vec3 vP; out vec3 vN; flat out int vM; out vec4 vL;
void main(){ vP=aPos; vN=aNrm; vM=int(aMat+0.5);
  vL=uLVP*vec4(aPos+aNrm*0.045,1.0);
  gl_Position=uVP*vec4(aPos,1.0); }`;

const FS_MAIN = H+`precision highp float; precision highp sampler2DShadow;
in vec3 vP; in vec3 vN; flat in int vM; in vec4 vL;
uniform vec3 uCam,uSun,uSunC,uSkyC,uGndC; uniform float uAmb,uT,uFog,uNight;
uniform vec4 uMc[64]; uniform vec4 uMk[64];
uniform sampler2DShadow uSh;
uniform vec3 uPLp[8]; uniform vec4 uPLc[8]; uniform int uPLn;
out vec4 O;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; }
float lm(float v,float w){ float d=abs(fract(v)-0.5); return smoothstep(0.5-w,0.5-w*0.35,d); }
vec2 planar(vec3 p, vec3 n){ vec3 a=abs(n);
  if(a.z>a.x&&a.z>a.y) return p.xy; if(a.x>a.y) return p.yz; return p.xz; }
float shade(vec4 l,float ndl){
  vec3 p=l.xyz/l.w*0.5+0.5;
  if(p.z>1.0||p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  float b=max(0.0022*(1.0-ndl),0.0004);
  float s=0.0; vec2 tx=vec2(1.0/2048.0);
  for(int i=-1;i<=1;i++) for(int j=-1;j<=1;j++)
    s+=texture(uSh,vec3(p.xy+vec2(float(i),float(j))*tx*1.25,p.z-b));
  return s/9.0; }
void main(){
  int k=int(uMk[vM].x+0.5);
  vec3 alb=uMc[vM].rgb; float rough=uMc[vM].a;
  vec3 N=normalize(vN); vec2 uv=planar(vP,N);
  if(k==0)      alb*=0.95+0.10*fbm(uv*7.0);
  else if(k==1){ float rib=sin(uv.x*24.0)*0.5+0.5; alb*=0.84+0.28*rib; }
  else if(k==2){ float g=min(lm(uv.x/0.60,0.030),lm(uv.y/0.60,0.030));
                 alb*=mix(0.74,1.0,g)*(0.97+0.06*fbm(uv*9.0)); }
  else if(k==3){ float n=fbm(uv*2.4); alb*=0.74+0.52*n;
                 alb=mix(alb,vec3(0.30,0.40,0.19),0.32*fbm(uv*0.5)); }
  else if(k==5){ alb*=0.80+0.36*fbm(vec2(uv.x*3.0,uv.y*32.0)); }
  else if(k==7){ float g=min(lm(uv.x,0.012),lm(uv.y,0.012));
                 alb*=mix(0.85,1.0,g)*(0.93+0.14*fbm(uv*22.0)); }
  else if(k==8){ float row=floor(uv.y/0.075); float off=mod(row,2.0)*0.5;
                 float g=min(lm(uv.x/0.24+off,0.05),lm(uv.y/0.075,0.11));
                 alb*=mix(0.66,1.0,g)*(0.88+0.24*h21(vec2(floor(uv.x/0.24+off),row))); }
  else if(k==9)  alb*=0.78+0.44*fbm(uv*8.0);
  else if(k==10){ float g=min(lm(uv.x/0.30,0.04),lm(uv.y/0.30,0.04)); alb*=mix(0.80,1.0,g); }
  else if(k==11) alb*=0.99+0.02*fbm(uv*12.0);
  else if(k==12) alb*=0.90+0.18*fbm(uv*24.0);
  else if(k==13){ float n=fbm(uv*5.5); alb*=0.68+0.66*n; }
  else if(k==14) alb*=0.86+0.26*fbm(uv*30.0);
  else if(k==16) alb*=0.76+0.44*fbm(uv*4.5);
  else if(k==17){ float n=fbm(uv*6.5); alb*=0.64+0.70*n; }
  else if(k==18) alb*=0.92+0.14*fbm(uv*18.0);
  else if(k==4){
    float t=uT;
    N=normalize(N+vec3(0.075*cos(vP.x*3.2+t*1.15)+0.05*cos((vP.x+vP.y)*4.9+t*1.8),
                       0.075*cos(vP.y*2.8-t*0.95)+0.05*cos((vP.x+vP.y)*4.9+t*1.8),0.0));
    rough=0.04; }
  vec3 Vd=normalize(uCam-vP);
  float ndl=max(dot(N,uSun),0.0);
  float sh1=shade(vL,ndl);
  vec3 Hh=normalize(uSun+Vd);
  float spec=pow(max(dot(N,Hh),0.0), mix(240.0,10.0,rough))*(1.0-rough*0.92)*1.25;
  vec3 hemi=mix(uGndC,uSkyC,N.z*0.5+0.5);
  vec3 col=alb*hemi*uAmb + alb*uSunC*ndl*sh1 + uSunC*spec*sh1;
  if(k==4){ float fr=pow(1.0-max(dot(N,Vd),0.0),5.0);
    col=mix(col,uSkyC*1.10,fr*0.42); col*=1.15; }
  else if(k==6){ float fr=pow(1.0-max(dot(N,Vd),0.0),4.0);
    col=mix(col,uSkyC*1.15,fr*0.85); }
  for(int i=0;i<8;i++){ if(i>=uPLn) break;
    vec3 d=uPLp[i]-vP; float ds=length(d); d/=max(ds,0.001);
    float wrap=0.42+0.58*max(dot(N,d),0.0);
    col += alb*uPLc[i].rgb*wrap*(uPLc[i].a/(1.0+ds*ds*(0.16+0.26*uNight))); }
  col += alb*uMk[vM].y*(1.0+3.6*uNight);
  float dd=length(uCam-vP);
  col=mix(col,uSkyC*1.05,clamp(1.0-exp(-dd*uFog),0.0,0.55));
  float lum=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(lum),col,1.18);
  col*=1.05;
  col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  O=vec4(pow(max(col,0.0),vec3(1.0/2.2)), uMk[vM].z);
}`;

const VS_DEPTH = H+`in vec3 aPos; uniform mat4 uLVP; void main(){ gl_Position=uLVP*vec4(aPos,1.0); }`;
const FS_DEPTH = H+`precision highp float; void main(){}`;

const VS_SKY = H+`out vec2 vUV;
void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUV=p; gl_Position=vec4(p*2.0-1.0,1.0,1.0); }`;
const FS_SKY = H+`precision highp float;
in vec2 vUV; uniform mat4 uInvVP; uniform vec3 uCam,uSun,uSunC,uSkyC,uGndC; uniform float uNight;
out vec4 O;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
void main(){
  vec4 a=uInvVP*vec4(vUV*2.0-1.0,-1.0,1.0), b=uInvVP*vec4(vUV*2.0-1.0,1.0,1.0);
  vec3 d=normalize(b.xyz/b.w-a.xyz/a.w);
  float up=clamp(d.z,-1.0,1.0);
  vec3 hor=mix(uSkyC*1.28, uSkyC*0.72, clamp(uNight,0.0,1.0));
  vec3 zen=uSkyC*mix(0.52,0.16,uNight);
  vec3 c=mix(hor,zen,pow(clamp(up,0.0,1.0),0.62));
  c=mix(c, uGndC*0.85, smoothstep(0.0,-0.10,up));
  float sd=max(dot(d,uSun),0.0);
  c += uSunC*pow(sd,150.0)*3.4;
  c += uSunC*pow(sd,7.0)*0.30;
  c += uSunC*pow(sd,1.6)*0.09*max(0.0,1.0-abs(up)*2.2);
  if(uNight>0.02){ vec3 sd3=d/max(abs(d.z),0.30);
    vec2 g=floor(vec2(sd3.x,sd3.y)*95.0);
    float st=step(0.9982,h21(g))*smoothstep(0.02,0.35,up)*uNight;
    c += vec3(st)*0.95; }
  c=(c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);
  O=vec4(pow(max(c,0.0),vec3(1.0/2.2)),1.0);
}`;

const P_MAIN=prog(VS_MAIN,FS_MAIN), P_DEP=prog(VS_DEPTH,FS_DEPTH), P_SKY=prog(VS_SKY,FS_SKY);
const U=(p,n)=>gl.getUniformLocation(p,n);
const uM={VP:U(P_MAIN,'uVP'),LVP:U(P_MAIN,'uLVP'),Cam:U(P_MAIN,'uCam'),Sun:U(P_MAIN,'uSun'),
  SunC:U(P_MAIN,'uSunC'),SkyC:U(P_MAIN,'uSkyC'),GndC:U(P_MAIN,'uGndC'),Amb:U(P_MAIN,'uAmb'),
  T:U(P_MAIN,'uT'),Fog:U(P_MAIN,'uFog'),Night:U(P_MAIN,'uNight'),Mc:U(P_MAIN,'uMc'),Mk:U(P_MAIN,'uMk'),
  Sh:U(P_MAIN,'uSh'),PLp:U(P_MAIN,'uPLp'),PLc:U(P_MAIN,'uPLc'),PLn:U(P_MAIN,'uPLn')};
const uD={LVP:U(P_DEP,'uLVP')};
const uS={InvVP:U(P_SKY,'uInvVP'),Cam:U(P_SKY,'uCam'),Sun:U(P_SKY,'uSun'),SunC:U(P_SKY,'uSunC'),
  SkyC:U(P_SKY,'uSkyC'),GndC:U(P_SKY,'uGndC'),Night:U(P_SKY,'uNight')};

// 材质 uniform 数组
const MC=new Float32Array(64*4), MK=new Float32Array(64*4);
if(MATS.length>64) console.warn('材质数量超限', MATS.length);
MATS.forEach((m,i)=>{ MC[i*4]=m.c[0]; MC[i*4+1]=m.c[1]; MC[i*4+2]=m.c[2]; MC[i*4+3]=m.r;
  MK[i*4]=m.k; MK[i*4+1]=m.emi; MK[i*4+2]=m.alpha; });

// VAO
const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER,RANGES.__vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,RANGES.__ibo);
const ST=7*4;
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,ST,0);
gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,ST,12);
gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,1,gl.FLOAT,false,ST,24);
gl.bindAttribLocation(P_MAIN,0,'aPos');
gl.bindVertexArray(null);

// 阴影贴图
const SM=2048;
const shTex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,shTex);
gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,SM,SM);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
const shFB=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,shFB);
gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);
gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
gl.bindFramebuffer(gl.FRAMEBUFFER,null);

/* ───────────────────────── 22. 太阳位置（西宁 11.31°N, 106.10°E, UTC+7） ───────────────────────── */
const LAT=11.31*Math.PI/180, LON=106.10, TZ=7;
function solar(doy, hour){
  const decl = 23.45*Math.PI/180*Math.sin(2*Math.PI*(284+doy)/365);
  const B = 2*Math.PI*(doy-81)/364;
  const EoT = 9.87*Math.sin(2*B) - 7.53*Math.cos(B) - 1.5*Math.sin(B);
  const st = hour + (4*(LON-15*TZ)+EoT)/60;
  const Hh = (st-12)*15*Math.PI/180;
  const alt = Math.asin(Math.sin(LAT)*Math.sin(decl)+Math.cos(LAT)*Math.cos(decl)*Math.cos(Hh));
  let ca = (Math.sin(decl)*Math.cos(LAT)-Math.cos(decl)*Math.sin(LAT)*Math.cos(Hh))/Math.max(Math.cos(alt),1e-4);
  ca=Math.max(-1,Math.min(1,ca));
  let az = Math.acos(ca); if(Hh>0) az = 2*Math.PI-az;
  return {alt, az, dir:[Math.sin(az)*Math.cos(alt), Math.cos(az)*Math.cos(alt), Math.sin(alt)]};
}
const DATES=[{n:'春分 3/21',d:80},{n:'夏至 6/21',d:172},{n:'秋分 9/23',d:266},{n:'冬至 12/21',d:355}];

M4.inv=function(m){ const o=new Float32Array(16),
 a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],
 a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15],
 b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,
 b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,
 b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
 let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; if(!d) return o; d=1/d;
 o[0]=(a11*b11-a12*b10+a13*b09)*d; o[1]=(a02*b10-a01*b11-a03*b09)*d;
 o[2]=(a31*b05-a32*b04+a33*b03)*d; o[3]=(a22*b04-a21*b05-a23*b03)*d;
 o[4]=(a12*b08-a10*b11-a13*b07)*d; o[5]=(a00*b11-a02*b08+a03*b07)*d;
 o[6]=(a32*b02-a30*b05-a33*b01)*d; o[7]=(a20*b05-a22*b02+a23*b01)*d;
 o[8]=(a10*b10-a11*b08+a13*b06)*d; o[9]=(a01*b08-a00*b10-a03*b06)*d;
 o[10]=(a30*b04-a31*b02+a33*b00)*d; o[11]=(a21*b02-a20*b04-a23*b00)*d;
 o[12]=(a11*b07-a10*b09-a12*b06)*d; o[13]=(a00*b09-a01*b07+a02*b06)*d;
 o[14]=(a31*b01-a30*b03-a32*b00)*d; o[15]=(a20*b03-a21*b01+a22*b00)*d; return o; };

/* ───────────────────────── 23. 状态与相机 ───────────────────────── */
const VIEWS={
  aerial:{az:54,el:30,d:34,t:[5,16.0,1.4]},
  front :{az:4, el:11,d:19,t:[5,9.0,3.1]},
  gate  :{az:16,el:8, d:11,t:[5.6,3.2,1.6]},
  pool  :{pose:{p:[5.38,28.55,1.80], l:[2.05,22.10,0.10]}},
  yard  :{pose:{p:[8.15,20.55,1.74], l:[3.10,27.20,0.55]}},
  up    :{az:28,el:62,d:30,t:[5,16.0,0.5]},
  living:{pose:{p:[5.05,8.35,1.58], l:[2.30,11.90,1.25]}},
  master:{pose:{p:[5.25,10.65,4.92], l:[2.55,7.70,4.50]}},
  kitchen:{pose:{p:[3.10,15.95,1.60], l:[3.70,19.40,1.15]}},
  bath  :{pose:{p:[5.52,12.72,4.92], l:[3.62,11.40,4.30]}},
  dining:{pose:{p:[4.95,11.60,1.60], l:[2.60,15.60,1.20]}}
};
let cam={...VIEWS.aerial}, curView='aerial';
let hour=14.2, dateIdx=1, playSun=false, tour=null, tourT=0;
let showRoof=true, onlyF1=false, showFurn=true, showLab=true;
let W=1,Hh=1,DPR=1, t0=performance.now();

const TOUR=[
 {p:[5.0,-3.2,1.62], l:[5.2,6.5,2.2], d:3.4, n:'从镇道看入口'},
 {p:[4.2,2.4,1.62],  l:[6.2,7.0,2.0], d:3.0, n:'前院 · 停车位'},
 {p:[7.35,4.6,1.62], l:[7.35,8.4,1.5], d:2.6, n:'入户门廊'},
 {p:[6.8,7.9,1.62],  l:[3.2,10.4,1.4], d:3.0, n:'玄关进客厅'},
 {p:[4.6,8.6,1.62],  l:[3.4,12.6,1.3], d:3.2, n:'客厅'},
 {p:[3.4,13.0,1.62], l:[3.2,18.0,1.3], d:3.2, n:'餐厅通厨房'},
 {p:[3.2,17.4,1.62], l:[4.4,19.4,1.2], d:3.0, n:'厨房'},
 {p:[7.4,10.6,1.62], l:[7.6,8.6,3.0], d:2.8, n:'楼梯间'},
 {p:[7.3,9.0,4.95],  l:[5.6,11.0,4.6], d:2.8, n:'二层楼梯厅'},
 {p:[5.2,9.4,4.95],  l:[3.0,8.0,4.5], d:3.0, n:'主卧'},
 {p:[3.2,7.6,4.95],  l:[3.6,0.5,3.2], d:3.0, n:'主卧前阳台'},
 {p:[7.5,12.6,4.95], l:[7.6,15.6,4.4], d:2.6, n:'次卧 2'},
 {p:[5.0,20.8,1.62], l:[3.0,25.0,0.6], d:3.0, n:'后院 · 晾衣区'},
 {p:[5.5,26.4,1.62], l:[2.6,23.5,0.2], d:3.4, n:'泳池'},
 {p:[7.9,27.4,1.62], l:[7.9,23.6,1.1], d:3.0, n:'凉亭与锦鲤池'},
 {p:[4.2,28.6,1.62], l:[7.6,30.6,0.7], d:3.0, n:'菜园与禽舍'},
 {p:[5.0,34.5,3.20], l:[5.0,20.0,2.0], d:3.4, n:'从后院回望'}
];
function tourPose(tt){
  let acc=0, i=0;
  for(;i<TOUR.length-1;i++){ if(acc+TOUR[i].d>tt) break; acc+=TOUR[i].d; }
  const a=TOUR[i], b=TOUR[Math.min(i+1,TOUR.length-1)];
  let u=(tt-acc)/a.d; u=Math.max(0,Math.min(1,u)); u=u*u*(3-2*u);
  const L=(p,q)=>[p[0]+(q[0]-p[0])*u, p[1]+(q[1]-p[1])*u, p[2]+(q[2]-p[2])*u];
  return {eye:L(a.p,b.p), at:L(a.l,b.l), name:a.n};
}
const TOUR_LEN = TOUR.reduce((s,w)=>s+w.d,0) - TOUR[TOUR.length-1].d;

function camEye(){
  if(tour!==null) return tourPose(tour).eye;
  if(cam.pose) return cam.pose.p;
  const e=cam.el*Math.PI/180, a=cam.az*Math.PI/180;
  return [cam.t[0]+cam.d*Math.cos(e)*Math.sin(a),
          cam.t[1]-cam.d*Math.cos(e)*Math.cos(a),
          cam.t[2]+cam.d*Math.sin(e)];
}
function camAt(){ return tour!==null ? tourPose(tour).at : (cam.pose?cam.pose.l:cam.t); }

/* ───────────────────────── 24. 光照配色 ───────────────────────── */
const sat=(x,a,b)=>Math.max(0,Math.min(1,(x-a)/(b-a)));
function lighting(alt){
  const night = 1-sat(alt, -0.06, 0.14);
  const low   = 1-sat(alt, 0.02, 0.42);
  const inten = Math.max(0, Math.sin(Math.max(alt,0)))**0.55;
  const mix3=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  const sunC = mix3([1.00,0.965,0.90],[1.00,0.50,0.22], low);
  const k = 1.05*inten*(1-night*0.97);
  const skyDay=[0.36,0.55,0.86], skyDusk=[0.70,0.42,0.32], skyNight=[0.045,0.062,0.125];
  let skyC = mix3(skyDay, skyDusk, low*0.85);
  skyC = mix3(skyC, skyNight, night);
  const gndC = mix3([0.34,0.33,0.28],[0.035,0.04,0.05], night);
  return {
    sun:[sunC[0]*k, sunC[1]*k, sunC[2]*k],
    sky:skyC, gnd:gndC,
    amb: 0.30 - 0.272*night,
    night
  };
}
const PLIGHT=[
 [3.50,9.50,3.30],[3.45,14.10,3.30],[3.20,18.20,3.30],[7.50,13.00,3.30],
 [3.30,9.00,6.60],[7.00,7.60,6.60],[7.60,12.90,6.60],[7.90,24.60,2.35]
];

/* ───────────────────────── 25. 渲染 ───────────────────────── */
function drawGroups(list){
  for(const n of list){ const r=RANGES[n]; if(!r||!r.n) continue;
    gl.drawElements(gl.TRIANGLES, r.n, gl.UNSIGNED_INT, r.o*4); }
}
function visible(){
  const g=['site','yard','shell1','part1'];
  if(!onlyF1){ g.push('shell2','slab2','part2','ceil1'); }
  if(showRoof) g.push('ceilA','roofA');
  if(showRoof && !onlyF1) g.push('ceil2','roof');
  if(showFurn){ g.push('furn1'); if(!onlyF1) g.push('furn2'); }
  return g;
}
function render(){
  const now=performance.now(), tt=(now-t0)/1000;
  const S=solar(DATES[dateIdx].d, hour);
  const Lg=lighting(S.alt);
  const eye=camEye(), at=camAt();
  const proj=M4.persp((tour!==null||cam.pose)?60*Math.PI/180:46*Math.PI/180, W/Hh, 0.05, 320);
  const view=M4.look(eye, at, [0,0,1]);
  const VP=M4.mul(proj,view);

  // —— 阴影
  let sdir=S.dir;
  if(sdir[2]<0.08) sdir=V.n([sdir[0], sdir[1], 0.08]);
  const C=[5,16,1.5], R=25;
  const LVP=M4.mul(M4.ortho(-R,R,-R,R,1,110), M4.look(V.a(C,V.m(sdir,52)), C, [0,0,1]));
  gl.bindFramebuffer(gl.FRAMEBUFFER, shFB);
  gl.viewport(0,0,SM,SM); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
  gl.useProgram(P_DEP); gl.uniformMatrix4fv(uD.LVP,false,LVP);
  gl.bindVertexArray(vao); drawGroups(visible());
  gl.cullFace(gl.BACK);

  // —— 主画面
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,cv.width,cv.height);
  gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.CULL_FACE);

  gl.useProgram(P_SKY); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
  gl.uniformMatrix4fv(uS.InvVP,false,M4.inv(VP));
  gl.uniform3fv(uS.Cam,eye); gl.uniform3fv(uS.Sun,S.dir);
  gl.uniform3fv(uS.SunC,Lg.sun); gl.uniform3fv(uS.SkyC,Lg.sky);
  gl.uniform3fv(uS.GndC,Lg.gnd); gl.uniform1f(uS.Night,Lg.night);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);

  gl.useProgram(P_MAIN);
  gl.uniformMatrix4fv(uM.VP,false,VP); gl.uniformMatrix4fv(uM.LVP,false,LVP);
  gl.uniform3fv(uM.Cam,eye); gl.uniform3fv(uM.Sun,S.dir);
  gl.uniform3fv(uM.SunC,Lg.sun); gl.uniform3fv(uM.SkyC,Lg.sky); gl.uniform3fv(uM.GndC,Lg.gnd);
  gl.uniform1f(uM.Amb,Lg.amb); gl.uniform1f(uM.T,tt);
  gl.uniform1f(uM.Fog, tour!==null?0.0009:0.0017); gl.uniform1f(uM.Night,Lg.night);
  gl.uniform4fv(uM.Mc,MC); gl.uniform4fv(uM.Mk,MK);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,shTex); gl.uniform1i(uM.Sh,0);
  const pn = showFurn?PLIGHT.length:0;
  const pp=new Float32Array(24), pc=new Float32Array(32);
  const pi = 0.42 + 1.35*Lg.night;
  for(let i=0;i<pn;i++){ pp[i*3]=PLIGHT[i][0]; pp[i*3+1]=PLIGHT[i][1]; pp[i*3+2]=PLIGHT[i][2];
    pc[i*4]=1.0; pc[i*4+1]=0.90; pc[i*4+2]=0.72; pc[i*4+3]=pi; }
  gl.uniform3fv(uM.PLp,pp); gl.uniform4fv(uM.PLc,pc); gl.uniform1i(uM.PLn,pn);

  gl.bindVertexArray(vao);
  drawGroups(visible());
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  drawGroups(['water','glass']);
  gl.depthMask(true); gl.disable(gl.BLEND);
  gl.bindVertexArray(null);

  updateHUD(S, eye, VP);
}
/* HUD 与标注 */
const hud=document.getElementById('hud'), labWrap=document.getElementById('labels');
const LABELS=[
 {p:[5.4,11.6,8.7], t:'主楼 · 两层 8.0×9.6'},
 {p:[5.4,18.2,4.6], t:'后附房 · 厨房/公厕/洗衣/杂物'},
 {p:[3.9,1.8,2.1],  t:'停车位 · 车行门 4.0 m'},
 {p:[2.95,25.1,0.6],t:'游泳池 3.5×6.5'},
 {p:[7.9,23.7,3.7], t:'凉亭 3×3'},
 {p:[7.9,26.9,0.9], t:'锦鲤金鱼池'},
 {p:[3.6,30.4,2.5], t:'菜园 19.4 m²'},
 {p:[8.5,30.7,2.1], t:'鸡鸭舍'},
 {p:[3.4,20.6,3.1], t:'洗衣晾衣区'}
];
function updateHUD(S,eye,VP){
  if(hud){
    const hh=Math.floor(hour), mm=Math.round((hour-hh)*60);
    hud.innerHTML = '<b>'+DATES[dateIdx].n+'</b> &nbsp; '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')
      + ' &nbsp;·&nbsp; 太阳高度角 '+(S.alt*180/Math.PI).toFixed(1)+'°'
      + ' &nbsp; 方位角 '+(S.az*180/Math.PI).toFixed(0)+'°'
      + (S.alt<0 ? ' &nbsp;·&nbsp; 日落后' : '')
      + (tour!==null ? ' &nbsp;·&nbsp; '+tourPose(tour).name : '');
  }
  if(!labWrap) return;
  if(!showLab || tour!==null){ labWrap.style.display='none'; return; }
  labWrap.style.display='block';
  const eyeP=camEye();
  const BK=[[X0-0.1,Y0-0.1,0, X1+0.1,Y1+0.1, showRoof&&!onlyF1?D.RG:(onlyF1?D.F1-0.2:D.F2)],
            [X0-0.1,D.ay0-0.1,0, X1+0.1,AY1+0.1,4.15]];
  const hit=(a,b,B)=>{ let t0=0,t1=1; const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    for(let i=0;i<3;i++){
      if(Math.abs(d[i])<1e-9){ if(a[i]<B[i]||a[i]>B[i+3]) return false; continue; }
      let u1=(B[i]-a[i])/d[i], u2=(B[i+3]-a[i])/d[i];
      if(u1>u2){const q=u1;u1=u2;u2=q;}
      t0=Math.max(t0,u1); t1=Math.min(t1,u2); if(t0>t1) return false; }
    return t1>0.03 && t0<0.96; };
  const used=[];
  LABELS.forEach((l,i)=>{
    let el=labWrap.children[i];
    if(!el){ el=document.createElement('div'); el.className='lab3d'; labWrap.appendChild(el); }
    el.textContent=l.t;
    const p=l.p, cx=VP[0]*p[0]+VP[4]*p[1]+VP[8]*p[2]+VP[12],
          cy=VP[1]*p[0]+VP[5]*p[1]+VP[9]*p[2]+VP[13],
          cw=VP[3]*p[0]+VP[7]*p[1]+VP[11]*p[2]+VP[15];
    if(cw<=0.2){ el.style.display='none'; return; }
    if(BK.some(B=>hit(eyeP,l.p,B))){ el.style.display='none'; return; }
    let sx=(cx/cw*0.5+0.5)*W, sy=(1-(cy/cw*0.5+0.5))*Hh;
    if(sx<50||sx>W-50||sy<14||sy>Hh-14){ el.style.display='none'; return; }
    let tries=0;
    while(used.some(u=>Math.abs(u[0]-sx)<120&&Math.abs(u[1]-sy)<16)&&tries<3){ sy-=18; tries++; }
    if(tries>=3||sy<14){ el.style.display='none'; return; }
    used.push([sx,sy]);
    el.style.display='block'; el.style.left=sx+'px'; el.style.top=sy+'px';
  });
}

/* ───────────────────────── 26. 交互与控件 ───────────────────────── */
function resize(){
  DPR=Math.min(2, window.devicePixelRatio||1);
  const r=cv.getBoundingClientRect();
  W=Math.max(320,Math.round(r.width)); Hh=Math.max(300,Math.round(r.height));
  cv.width=Math.round(W*DPR); cv.height=Math.round(Hh*DPR);
}
new ResizeObserver(resize).observe(cv); resize();

let drag=null;
cv.addEventListener('pointerdown',e=>{ if(tour!==null||cam.pose) return;
  drag={x:e.clientX,y:e.clientY}; cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
  const h=document.getElementById('vhint'); if(h) h.style.opacity='0'; });
cv.addEventListener('pointermove',e=>{ if(!drag) return;
  cam.az=(cam.az+(e.clientX-drag.x)*0.4)%360;
  cam.el=Math.max(2,Math.min(86,cam.el-(e.clientY-drag.y)*0.28));
  drag={x:e.clientX,y:e.clientY}; });
const stop=()=>{ drag=null; cv.classList.remove('drag'); };
cv.addEventListener('pointerup',stop); cv.addEventListener('pointercancel',stop);
cv.addEventListener('wheel',e=>{ if(tour!==null||cam.pose) return; e.preventDefault();
  cam.d=Math.max(2.2,Math.min(70,cam.d*(1+Math.sign(e.deltaY)*0.09))); },{passive:false});
let pinch=null;
cv.addEventListener('touchstart',e=>{ if(e.touches.length===2)
  pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); });
cv.addEventListener('touchmove',e=>{ if(e.touches.length===2&&pinch&&tour===null){ e.preventDefault();
  const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  cam.d=Math.max(2.2,Math.min(70,cam.d*pinch/d)); pinch=d; } },{passive:false});
cv.addEventListener('touchend',()=>{pinch=null;});

const bar=document.querySelector('.vbar');
function btn(label,on,cb,id){ const b=document.createElement('button'); b.className='vbtn';
  b.textContent=label; if(on!==null) b.setAttribute('aria-pressed',String(!!on));
  if(id) b.id=id; b.addEventListener('click',()=>cb(b)); bar.appendChild(b); return b; }
function spacer(f){ const s=document.createElement('span'); s.style.flex=f||'1 0 10px'; bar.appendChild(s); }
if(bar){
  bar.innerHTML='';
  const views=[['鸟瞰','aerial'],['正立面','front'],['门口','gate'],['客厅','living'],['主卧','master'],
               ['餐厨','kitchen'],['主卫','bath'],['泳池','pool'],['后院','yard'],['俯视','up']];
  const vbtns=[];
  views.forEach(v=>{ const b=btn(v[1]===curView?v[0]:v[0], v[1]===curView, ()=>{
      tour=null; curView=v[1]; cam=JSON.parse(JSON.stringify(VIEWS[v[1]]));
      vbtns.forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true');
      tb.setAttribute('aria-pressed','false');
    }); vbtns.push(b); });
  spacer();
  const tb=btn('▶ 漫游全屋', false, b=>{
    if(tour===null){ tour=0; tourT=performance.now(); b.setAttribute('aria-pressed','true'); b.textContent='■ 停止漫游';
      vbtns.forEach(x=>x.setAttribute('aria-pressed','false')); }
    else { tour=null; b.setAttribute('aria-pressed','false'); b.textContent='▶ 漫游全屋'; }
  });
  btn('掀屋顶', false, b=>{ const on=b.getAttribute('aria-pressed')!=='true';
    b.setAttribute('aria-pressed',String(on)); showRoof=!on; });
  btn('只看一层', false, b=>{ const on=b.getAttribute('aria-pressed')!=='true';
    b.setAttribute('aria-pressed',String(on)); onlyF1=on; if(on) showRoof=false; });
  btn('家具', true, b=>{ const on=b.getAttribute('aria-pressed')!=='true';
    b.setAttribute('aria-pressed',String(on)); showFurn=on; });
  btn('标注', true, b=>{ const on=b.getAttribute('aria-pressed')!=='true';
    b.setAttribute('aria-pressed',String(on)); showLab=on; });
}
const tbar=document.querySelector('.tbar');
if(tbar){
  tbar.innerHTML='';
  const mk=(tag,cls)=>{ const e=document.createElement(tag); if(cls) e.className=cls; tbar.appendChild(e); return e; };
  const lab=mk('span','tlab'); lab.textContent='日照模拟';
  const sel=mk('select','tsel');
  DATES.forEach((d,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=d.n;
    if(i===dateIdx) o.selected=true; sel.appendChild(o); });
  sel.addEventListener('change',()=>{ dateIdx=+sel.value; });
  const pb=mk('button','vbtn'); pb.textContent='▶ 播放一天';
  pb.addEventListener('click',()=>{ playSun=!playSun; pb.textContent=playSun?'❚❚ 暂停':'▶ 播放一天';
    pb.setAttribute('aria-pressed',String(playSun)); });
  const rng=mk('input','trng'); rng.type='range'; rng.min='5'; rng.max='19'; rng.step='0.05'; rng.value=String(hour);
  rng.setAttribute('aria-label','时间');
  rng.addEventListener('input',()=>{ hour=+rng.value; playSun=false; pb.textContent='▶ 播放一天';
    pb.setAttribute('aria-pressed','false'); });
  const rd=mk('span','tval');
  tbar.__sync=()=>{ rng.value=String(hour);
    const h=Math.floor(hour), m=Math.round((hour-h)*60);
    rd.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); };
  tbar.__sync();
}

/* ───────────────────────── 27. 主循环 ───────────────────────── */
let last=performance.now(), paused=false;
function loop(now){
  const dt=Math.min(0.1,(now-last)/1000); last=now;
  if(paused){ requestAnimationFrame(loop); return; }
  if(playSun){ hour+=dt*1.15; if(hour>19){ hour=5; }
    if(tbar&&tbar.__sync) tbar.__sync(); }
  if(tour!==null){ tour+=dt; if(tour>TOUR_LEN){ tour=0; } }
  try{ render(); }catch(err){ console.error(err); return; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__tn = {
  set(o){ if(o.hour!==undefined) hour=o.hour; if(o.date!==undefined) dateIdx=o.date;
    if(o.cam) cam=JSON.parse(JSON.stringify(VIEWS[o.cam])); if(o.roof!==undefined) showRoof=o.roof;
    if(o.f1!==undefined) onlyF1=o.f1; if(o.furn!==undefined) showFurn=o.furn;
    if(o.tour!==undefined) tour=o.tour; if(o.free) Object.assign(cam,o.free);
    if(o.lab!==undefined) showLab=o.lab; },
  stats(){ return {tris:RANGES.__tris, verts:RANGES.__verts, mats:MATS.length}; },
  pause(v){ paused=!!v; },
  frame(){ paused=true; try{ render(); return 'ok'; }catch(e){ return String(e); } }
};
console.log('[viewer] 三角面 '+RANGES.__tris+' · 顶点 '+RANGES.__verts+' · 材质 '+MATS.length);
})();

