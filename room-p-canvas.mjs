export const ROOM_P_CANVAS_HEIGHT = 380;
export const ROOM_P_CANVAS_MAX_DPR = 2;

export function getRoomPCanvasMetrics(canvas, devicePixelRatio = 1) {
  const cssWidth = Math.max(1, Math.round(canvas?.getBoundingClientRect?.().width || canvas?.offsetWidth || 540));
  const cssHeight = ROOM_P_CANVAS_HEIGHT;
  const dpr = Math.min(ROOM_P_CANVAS_MAX_DPR, Math.max(1, Number(devicePixelRatio) || 1));
  return Object.freeze({ cssWidth, cssHeight, dpr, width:Math.round(cssWidth * dpr), height:Math.round(cssHeight * dpr) });
}

export function getRoomPGoldVeinCount(ratio, veinCount = 6) {
  return Math.min(veinCount, Math.max(0, Math.round((Number(ratio) || 0) * veinCount)));
}

function tracePath(context, points) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    context.quadraticCurveTo(previous[0], previous[1], (previous[0] + current[0]) / 2, (previous[1] + current[1]) / 2);
    if (index === points.length - 1) context.lineTo(current[0], current[1]);
  }
}

export function drawRoomPKintsugi(context, metrics, ratio = 0, Path = globalThis.Path2D) {
  if (!context || !Path) return false;
  const { cssWidth:width, cssHeight:height, dpr } = metrics;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2 + 18);
  context.scale(Math.min(1, width / 620), Math.min(1, width / 620));

  const body = new Path();
  body.moveTo(-164,-55); body.bezierCurveTo(-151,-15,-139,38,-102,77);
  body.bezierCurveTo(-72,107,-31,118,8,116); body.bezierCurveTo(55,116,97,98,125,65);
  body.bezierCurveTo(151,33,160,-13,157,-50); body.bezierCurveTo(88,-30,-92,-27,-164,-55); body.closePath();

  context.save(); context.filter='blur(15px)'; context.fillStyle='rgba(0,0,0,.58)';
  context.beginPath(); context.ellipse(-2,128,130,17,-.015,0,Math.PI*2); context.fill(); context.restore();

  const clay=context.createLinearGradient(-150,-75,125,120);
  [['0','#d5c9b4'],['.22','#b9aa91'],['.54','#897a65'],['.78','#5b5042'],['1','#302a23']]
    .forEach(([stop,color]) => clay.addColorStop(Number(stop),color));
  context.fillStyle=clay; context.shadowBlur=30; context.shadowColor='rgba(203,171,91,.09)'; context.fill(body); context.shadowBlur=0;
  context.save(); context.clip(body);

  const glaze=context.createRadialGradient(-92,-59,5,-40,-5,220);
  glaze.addColorStop(0,'rgba(255,250,232,.48)'); glaze.addColorStop(.34,'rgba(239,226,198,.17)');
  glaze.addColorStop(.72,'rgba(92,74,56,.05)'); glaze.addColorStop(1,'rgba(24,19,15,.28)');
  context.fillStyle=glaze; context.fillRect(-180,-90,360,240);
  const fire=context.createRadialGradient(92,56,2,88,56,82);
  fire.addColorStop(0,'rgba(126,72,45,.18)'); fire.addColorStop(.55,'rgba(91,52,35,.07)'); fire.addColorStop(1,'rgba(60,35,24,0)');
  context.fillStyle=fire; context.fillRect(5,-20,165,160);
  for(let index=0;index<58;index+=1){
    const x=-145+((index*83)%292), y=-44+((index*53)%147), radius=.28+((index*17)%9)/13;
    context.beginPath(); context.arc(x,y,radius,0,Math.PI*2);
    context.fillStyle=index%5===0?'rgba(82,54,36,.24)':'rgba(255,248,225,.12)'; context.fill();
  }
  context.strokeStyle='rgba(255,245,220,.055)'; context.lineWidth=1;
  for(let y=10;y<90;y+=18){context.beginPath();context.moveTo(-128+y*.12,y);context.bezierCurveTo(-55,y+4,52,y-4,118-y*.08,y+1);context.stroke();}
  context.restore();

  const inner=new Path(); inner.moveTo(-164,-55); inner.bezierCurveTo(-101,-83,79,-82,157,-50); inner.bezierCurveTo(95,-16,-96,-15,-164,-55); inner.closePath();
  const inside=context.createRadialGradient(-36,-51,8,5,-48,172); inside.addColorStop(0,'#4a4033');inside.addColorStop(.58,'#29231d');inside.addColorStop(1,'#120f0c');
  context.fillStyle=inside;context.fill(inner);
  context.beginPath();context.moveTo(-164,-55);context.bezierCurveTo(-101,-83,79,-82,157,-50);context.strokeStyle='rgba(255,242,210,.52)';context.lineWidth=2.2;context.stroke();
  context.beginPath();context.moveTo(-158,-51);context.bezierCurveTo(-91,-27,88,-25,151,-48);context.strokeStyle='rgba(18,14,11,.72)';context.lineWidth=2.4;context.stroke();
  const foot=new Path();foot.moveTo(-47,108);foot.bezierCurveTo(-33,119,36,120,52,105);foot.lineTo(43,121);foot.bezierCurveTo(18,132,-25,131,-42,120);foot.closePath();
  context.fillStyle='#272019';context.fill(foot);context.strokeStyle='rgba(222,202,162,.25)';context.lineWidth=1.2;context.stroke(foot);

  const veins=[
    {p:[[-18,112],[-19,79],[-4,51],[-12,24],[8,-4],[3,-35],[19,-66]],w:3.1},
    {p:[[-5,50],[-35,38],[-53,18],[-78,9]],w:1.7},{p:[[-12,24],[18,30],[38,20],[61,24]],w:1.35},
    {p:[[7,-4],[34,-16],[49,-38]],w:1.5},{p:[[34,-16],[62,-7],[79,8]],w:1.05},{p:[[-53,18],[-70,35],[-75,55]],w:.95}
  ];
  const goldCount=getRoomPGoldVeinCount(ratio,veins.length);
  veins.forEach((vein,index)=>{
    tracePath(context,vein.p);context.lineCap='round';context.lineJoin='round';context.strokeStyle='rgba(25,16,10,.72)';context.lineWidth=vein.w+1.8;context.shadowBlur=0;context.stroke();
    tracePath(context,vein.p);
    if(index<goldCount){
      const gold=context.createLinearGradient(vein.p[0][0],vein.p[0][1],vein.p.at(-1)[0],vein.p.at(-1)[1]);
      gold.addColorStop(0,'#7c5415');gold.addColorStop(.28,'#d6ad45');gold.addColorStop(.5,'#fff0a5');gold.addColorStop(.72,'#c08a25');gold.addColorStop(1,'#68420c');
      context.strokeStyle=gold;context.lineWidth=vein.w;context.shadowBlur=3;context.shadowColor='rgba(235,190,75,.28)';
    }else{context.strokeStyle='rgba(34,24,17,.82)';context.lineWidth=Math.max(.8,vein.w);}
    context.stroke();context.shadowBlur=0;
  });
  context.restore();
  return true;
}

export function createRoomPCanvas({ document, browserWindow, getRatio }) {
  let canvas = null;
  let context = null;
  let resizeObserver = null;
  let frame = 0;
  let lastWidth = 0;

  function draw() {
    if (!canvas || !context) return false;
    const metrics = getRoomPCanvasMetrics(canvas, browserWindow?.devicePixelRatio);
    if (canvas.width !== metrics.width) canvas.width = metrics.width;
    if (canvas.height !== metrics.height) canvas.height = metrics.height;
    canvas.style.setProperty('height', `${metrics.cssHeight}px`, 'important');
    lastWidth = metrics.cssWidth;
    return drawRoomPKintsugi(context, metrics, getRatio?.() || 0, browserWindow?.Path2D);
  }

  function scheduleDraw() {
    browserWindow?.cancelAnimationFrame?.(frame);
    frame = browserWindow?.requestAnimationFrame?.(draw) || 0;
  }

  function init() {
    canvas = document?.getElementById?.('p-canvas');
    context = canvas?.getContext?.('2d') || null;
    if (!canvas || !context) return false;
    if (browserWindow?.ResizeObserver) {
      resizeObserver = new browserWindow.ResizeObserver(entries => {
        const width = Math.round(entries[0]?.contentRect?.width || 0);
        if (width && width !== lastWidth) scheduleDraw();
      });
      resizeObserver.observe(canvas);
    } else browserWindow?.addEventListener?.('resize', scheduleDraw, { passive:true });
    draw();
    return true;
  }

  function destroy() {
    resizeObserver?.disconnect();
    browserWindow?.removeEventListener?.('resize', scheduleDraw);
    browserWindow?.cancelAnimationFrame?.(frame);
  }

  return Object.freeze({ destroy, draw, init });
}
