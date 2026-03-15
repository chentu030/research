'use strict';
function initKlineChart(cid,code){
  var el=document.getElementById(cid);
  if(!el)return;
  fetch('../kline_data/'+code+'.json')
    .then(function(r){if(!r.ok)throw 0;return r.json();})
    .then(function(d){if(d&&d.length>0)new KC(el,d);else el.innerHTML='<p style="color:#bbb;text-align:center;padding:16px;">無K線資料</p>';})
    .catch(function(){el.innerHTML='<p style="color:#bbb;text-align:center;padding:16px;">無K線資料</p>';});
}
function KC(el,data){
  this.data=data;this.ci=-1;this.my=0;
  this._setup(el);this._pre();this._draw();this._bind();
  var self=this;
  if(window.ResizeObserver)new ResizeObserver(function(){self._draw();}).observe(el);
}
KC.prototype._setup=function(el){
  el.innerHTML='';el.style.position='relative';el.style.userSelect='none';
  this.el=el;
  this.lgd=document.createElement('div');
  this.lgd.style.cssText='display:flex;flex-wrap:wrap;gap:6px;padding:4px 2px;font-size:11px;align-items:center;line-height:1.7;';
  el.appendChild(this.lgd);
  this.cv=document.createElement('canvas');
  this.cv.style.cssText='display:block;width:100%;cursor:crosshair;';
  el.appendChild(this.cv);
  this.cx=this.cv.getContext('2d');
};
KC.prototype._pre=function(){
  var d=this.data,obv=0;this.obv=[];
  for(var i=0;i<d.length;i++){
    if(i>0){if(d[i].c>d[i-1].c)obv+=d[i].v;else if(d[i].c<d[i-1].c)obv-=d[i].v;}
    this.obv.push(obv);
  }
  var maf=function(p){return d.map(function(_,i){if(i<p-1)return null;var s=0;for(var j=i-p+1;j<=i;j++)s+=d[j].c;return s/p;});};
  this.ma5=maf(5);this.ma10=maf(10);this.ma20=maf(20);this.ma60=maf(60);
  this.cols=d.map(function(b,i){return b.c>=(i>0?d[i-1].c:b.o)?'#ef5350':'#26a69a';});
};
KC.prototype._draw=function(){
  var cv=this.cv,el=this.el,W=el.clientWidth;
  if(W<20)return;
  var dpr=window.devicePixelRatio||1;
  var ML=4,MR=66,MT=14,MB=22,KH=270,VH=68,OH=60,G=6;
  var TH=MT+KH+G+VH+G+OH+MB;
  cv.width=Math.round(W*dpr);cv.height=Math.round(TH*dpr);cv.style.height=TH+'px';
  var ctx=this.cx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,TH);
  var d=this.data,n=d.length,cW=W-ML-MR,step=cW/n,bw=Math.max(1,Math.floor(step*0.75));
  var ky0=MT,ky1=MT+KH,vy0=ky1+G,vy1=ky1+G+VH,oy0=vy1+G,oy1=vy1+G+OH;
  var i,pMin=Infinity,pMax=-Infinity;
  for(i=0;i<n;i++){pMin=Math.min(pMin,d[i].l);pMax=Math.max(pMax,d[i].h);}
  var pad=(pMax-pMin)*0.04||0.5;pMin-=pad;pMax+=pad;
  var py=function(v){return ky0+KH*(1-(v-pMin)/(pMax-pMin));};
  var vMax=0;for(i=0;i<n;i++)vMax=Math.max(vMax,d[i].v);
  var vy=function(v){return vy1-VH*(v/(vMax||1));};
  var oMin=Infinity,oMax=-Infinity;
  for(i=0;i<n;i++){oMin=Math.min(oMin,this.obv[i]);oMax=Math.max(oMax,this.obv[i]);}
  var oR=(oMax-oMin)||1,oy=function(v){return oy0+OH*(1-(v-oMin)/oR);};
  ctx.strokeStyle='#efefef';ctx.lineWidth=0.5;
  var panels=[[ky0,ky1,4],[vy0,vy1,2],[oy0,oy1,2]];
  for(var p=0;p<panels.length;p++){
    var p0=panels[p][0],p1=panels[p][1],pc=panels[p][2];
    for(var gi=0;gi<=pc;gi++){var gy=p0+(p1-p0)*gi/pc;ctx.beginPath();ctx.moveTo(ML,gy);ctx.lineTo(W-MR,gy);ctx.stroke();}
  }
  var b,cx,col,bt,bb;
  for(i=0;i<n;i++){
    b=d[i];cx=ML+(i+0.5)*step;col=this.cols[i];
    ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,py(b.h));ctx.lineTo(cx,py(b.l));ctx.stroke();
    bt=py(Math.max(b.o,b.c));bb=py(Math.min(b.o,b.c));
    ctx.fillRect(cx-bw/2,bt,bw,Math.max(1,bb-bt));
  }
  var mas=[[this.ma5,'#2962FF'],[this.ma10,'#FF6D00'],[this.ma20,'#4CAF50'],[this.ma60,'#9C27B0']];
  var cx2,st,arr;
  for(var m=0;m<mas.length;m++){
    arr=mas[m][0];ctx.strokeStyle=mas[m][1];ctx.lineWidth=1.2;ctx.beginPath();st=false;
    for(i=0;i<n;i++){if(arr[i]===null){st=false;continue;}cx2=ML+(i+0.5)*step;if(!st){ctx.moveTo(cx2,py(arr[i]));st=true;}else ctx.lineTo(cx2,py(arr[i]));}
    ctx.stroke();
  }
  var vt;
  for(i=0;i<n;i++){
    b=d[i];cx=ML+(i+0.5)*step;
    ctx.fillStyle=this.cols[i]==='#ef5350'?'rgba(239,83,80,0.72)':'rgba(38,166,154,0.72)';
    vt=vy(b.v);ctx.fillRect(cx-bw/2,vt,bw,vy1-vt);
  }
  ctx.strokeStyle='#FF9800';ctx.lineWidth=1.5;ctx.beginPath();
  for(i=0;i<n;i++){cx=ML+(i+0.5)*step;if(i===0)ctx.moveTo(cx,oy(this.obv[i]));else ctx.lineTo(cx,oy(this.obv[i]));}
  ctx.stroke();
  ctx.fillStyle='#999';ctx.font='10px sans-serif';ctx.textAlign='left';
  for(i=0;i<=4;i++){var pv=pMin+(pMax-pMin)*(1-i/4);ctx.fillText(pv.toFixed(2),W-MR+3,ky0+KH*i/4+3);}
  var fv=function(v){var a=Math.abs(v);return a>=1e6?(v/1e6).toFixed(1)+'M':a>=1e3?(v/1e3).toFixed(0)+'K':Math.round(v)+'';};
  ctx.fillText(fv(vMax),W-MR+3,vy0+10);ctx.fillText(fv(oMax),W-MR+3,oy0+10);ctx.fillText(fv(oMin),W-MR+3,oy1-2);
  ctx.fillStyle='#bbb';ctx.font='10px sans-serif';ctx.textAlign='left';
  ctx.fillText('K',ML+2,ky0+12);ctx.fillText('VOL',ML+2,vy0+12);ctx.fillText('OBV',ML+2,oy0+12);
  ctx.fillStyle='#bbb';ctx.textAlign='center';
  var lev=Math.max(1,Math.floor(n/5));
  for(i=0;i<n;i+=lev)ctx.fillText(d[i].t.slice(5),ML+(i+0.5)*step,TH-4);
  if(this.ci>=0&&this.ci<n)this._xhair(this.ci,this.my,ML,MR,ky0,ky1,oy1,W,step,py,pMin,pMax,KH);
  this._lyt={ML:ML,MR:MR,n:n,step:step,ky0:ky0,ky1:ky1,oy1:oy1,W:W,py:py,pMin:pMin,pMax:pMax,KH:KH};
  if(this.ci<0)this._lgd(n-1);
};
KC.prototype._xhair=function(idx,my,ML,MR,ky0,ky1,oy1,W,step,py,pMin,pMax,KH){
  var ctx=this.cx,cx=ML+(idx+0.5)*step;
  ctx.save();ctx.strokeStyle='rgba(100,100,100,0.4)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(cx,ky0);ctx.lineTo(cx,oy1);ctx.stroke();
  if(my>=ky0&&my<=ky1){
    ctx.beginPath();ctx.moveTo(ML,my);ctx.lineTo(W-MR,my);ctx.stroke();
    var pv=pMin+(pMax-pMin)*(1-(my-ky0)/KH),lbl=pv.toFixed(2),lw=ctx.measureText(lbl).width+6;
    ctx.setLineDash([]);ctx.fillStyle='rgba(60,60,60,0.85)';ctx.fillRect(W-MR+1,my-7,lw,14);
    ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='left';ctx.fillText(lbl,W-MR+4,my+3);
  }
  ctx.restore();
};
KC.prototype._lgd=function(i){
  if(i<0||i>=this.data.length)return;
  var d=this.data[i],pc=i>0?this.data[i-1].c:d.o;
  var ch=((d.c-pc)/pc*100).toFixed(2),col=parseFloat(ch)>=0?'#ef5350':'#26a69a';
  var fv=function(v){var a=Math.abs(v);return a>=1e6?(v/1e6).toFixed(1)+'M':a>=1e3?(v/1e3).toFixed(0)+'K':v+'';};
  var p=['<span style="font-weight:700">'+d.t+'</span>',
    '開<b>'+d.o+'</b>','高<b>'+d.h+'</b>','低<b>'+d.l+'</b>',
    '收<b style="color:'+col+'">'+d.c+'</b>','量<b>'+fv(d.v)+'</b>',
    '<b style="color:'+col+'">'+(parseFloat(ch)>=0?'+':'')+ch+'%</b>'];
  var ma=[[this.ma5[i],'#2962FF','5'],[this.ma10[i],'#FF6D00','10'],[this.ma20[i],'#4CAF50','20'],[this.ma60[i],'#9C27B0','60']];
  for(var m=0;m<ma.length;m++)if(ma[m][0]!==null)p.push('<span style="color:'+ma[m][1]+'">MA'+ma[m][2]+' '+ma[m][0].toFixed(2)+'</span>');
  this.lgd.innerHTML=p.join('<span style="color:#e0e0e0">|</span>');
};
KC.prototype._bind=function(){
  var self=this;
  this.cv.addEventListener('mousemove',function(e){
    var L=self._lyt;if(!L)return;
    var r=self.cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    var idx=Math.max(0,Math.min(L.n-1,Math.round((x-L.ML)/L.step-0.5)));
    self.my=y;if(self.ci!==idx){self.ci=idx;self._draw();self._lgd(idx);}
  });
  this.cv.addEventListener('mouseleave',function(){
    self.ci=-1;self.my=0;self._draw();if(self.data.length)self._lgd(self.data.length-1);
  });
};
