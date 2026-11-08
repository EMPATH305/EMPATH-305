export function roomECanvasMetrics(rectWidth, fallbackWidth, devicePixelRatio = 1) {
  const cssWidth = Math.max(280, Math.round(rectWidth || fallbackWidth || 600));
  const cssHeight = 220;
  const dpr = Math.min(Math.max(Number(devicePixelRatio) || 1, 1), 2);
  return Object.freeze({ cssWidth, cssHeight, dpr, width:Math.round(cssWidth * dpr), height:Math.round(cssHeight * dpr) });
}

export function roomECanvasPoint(event, rect, metrics) {
  const widthRatio = (metrics.width / metrics.dpr) / rect.width;
  const heightRatio = (metrics.height / metrics.dpr) / rect.height;
  return Object.freeze({
    x:(event.clientX - rect.left) * widthRatio,
    y:(event.clientY - rect.top) * heightRatio
  });
}

export function createRoomECanvas({
  document,
  browserWindow,
  getContentMode,
  onBrushVolume = () => {}
}) {
  if (!document || !browserWindow || typeof getContentMode !== 'function') throw new TypeError('Room E canvas requires browser dependencies.');

  let canvas = null;
  let context = null;
  let drawing = false;
  let hasDrawn = false;
  let lastX = 0;
  let lastY = 0;
  let eventsBound = false;
  let resizeTimer = null;
  let currentMetrics = roomECanvasMetrics(0, 600, 1);

  function clearBitmap() {
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function resize() {
    if (!canvas || !context) return false;
    const rect = canvas.getBoundingClientRect();
    const wrap = document.getElementById('e-draw-wrap');
    currentMetrics = roomECanvasMetrics(rect.width, wrap?.clientWidth, browserWindow.devicePixelRatio);
    if (canvas.width === currentMetrics.width && canvas.height === currentMetrics.height) return true;
    canvas.width = currentMetrics.width;
    canvas.height = currentMetrics.height;
    canvas.style.height = `${currentMetrics.cssHeight}px`;
    context.setTransform(currentMetrics.dpr, 0, 0, currentMetrics.dpr, 0, 0);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    hasDrawn = false;
    return true;
  }

  function point(event) {
    return roomECanvasPoint(event, canvas.getBoundingClientRect(), currentMetrics);
  }

  function beginDraw(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    drawing = true;
    hasDrawn = true;
    const position = point(event);
    lastX = position.x;
    lastY = position.y;
    context.beginPath();
    context.arc(lastX, lastY, 1.8, 0, Math.PI * 2);
    context.fillStyle = 'rgba(222,230,238,.9)';
    context.fill();
    context.beginPath();
    context.moveTo(lastX, lastY);
    try { canvas.setPointerCapture(event.pointerId); } catch {}
  }

  function continueDraw(event) {
    if (!drawing) return;
    event.preventDefault();
    const position = point(event);
    const distance = Math.hypot(position.x - lastX, position.y - lastY);
    context.lineWidth = Math.max(1.4, 5.2 - distance * 0.09);
    context.strokeStyle = 'rgba(222,230,238,.9)';
    context.shadowBlur = 4;
    context.shadowColor = 'rgba(123,143,161,.62)';
    context.lineTo(position.x, position.y);
    context.stroke();
    context.beginPath();
    context.moveTo(position.x, position.y);
    lastX = position.x;
    lastY = position.y;
    onBrushVolume(distance);
  }

  function endDraw(event) {
    if (!drawing) return;
    event.preventDefault();
    drawing = false;
    onBrushVolume(0);
    context.beginPath();
    try {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    } catch {}
  }

  function bindEvents() {
    if (eventsBound) return;
    canvas.addEventListener('pointerdown', beginDraw, { passive:false });
    canvas.addEventListener('pointermove', continueDraw, { passive:false });
    canvas.addEventListener('pointerup', endDraw, { passive:false });
    canvas.addEventListener('pointercancel', endDraw, { passive:false });
    eventsBound = true;
  }

  function init() {
    canvas = document.getElementById('e-draw-canvas');
    if (!canvas) return false;
    context = canvas.getContext('2d', { alpha:true });
    if (!context) return false;
    resize();
    bindEvents();
    return true;
  }

  function clear() {
    clearBitmap();
    hasDrawn = false;
  }

  function toDataURL(type = 'image/webp', quality = 0.8) {
    return canvas && hasDrawn ? canvas.toDataURL(type, quality) : null;
  }

  browserWindow.addEventListener('resize', () => {
    if (getContentMode() !== 'draw') return;
    browserWindow.clearTimeout(resizeTimer);
    resizeTimer = browserWindow.setTimeout(resize, 120);
  }, { passive:true });

  return Object.freeze({ clear, hasDrawing:() => hasDrawn, init, resize, toDataURL });
}
