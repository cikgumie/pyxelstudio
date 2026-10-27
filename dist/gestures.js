/* Two-finger canvas navigation. Kept separate from drawing tools. */
function installCanvasGestures({ area, canvas, getZoom, setZoom, captureDrawing, cancelDrawing, panBy, isHandTool = () => false }) {
  const touches = new Map();
  let baseline = null, navigating = false, gesture = null, handDrag = null;
  const position = e => ({ x: e.clientX, y: e.clientY });
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function begin() {
    const [a, b] = [...touches.values()];
    const mid = midpoint(a, b), rect = canvas.getBoundingClientRect(), zoom = getZoom();
    gesture = { distance: Math.max(1, distance(a, b)), zoom,
      x: (mid.x - rect.left) / zoom, y: (mid.y - rect.top) / zoom };
  }
  function suppress(e) { e.preventDefault(); e.stopImmediatePropagation(); }
  area.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') {
      if (isHandTool() && e.button === 0) {handDrag={id:e.pointerId,...position(e)};area.setPointerCapture(e.pointerId);suppress(e)}
      return;
    }
    if (!touches.size) baseline = e.target === canvas && !isHandTool() ? captureDrawing() : null;
    touches.set(e.pointerId, position(e));
    if (touches.size >= 2) {
      if (!navigating) cancelDrawing(baseline);
      navigating = true;handDrag = null;
      begin();
      suppress(e);
    } else if (navigating) suppress(e);
    else if(isHandTool()){handDrag={id:e.pointerId,...position(e)};area.setPointerCapture(e.pointerId);suppress(e)}
    // Capture even touches that start in the canvas margin.
    if (e.target !== canvas) area.setPointerCapture(e.pointerId);
  }, { capture: true, passive: false });
  area.addEventListener('pointermove', e => {
    if(handDrag?.id===e.pointerId){panBy(e.clientX-handDrag.x,e.clientY-handDrag.y);handDrag={id:e.pointerId,...position(e)};if(touches.has(e.pointerId))touches.set(e.pointerId,position(e));suppress(e);return}
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, position(e));
    if (!navigating) return;
    suppress(e);
    if (touches.size < 2 || !gesture) return;
    const [a, b] = [...touches.values()], mid = midpoint(a, b);
    setZoom(Math.max(.25, Math.min(24, gesture.zoom * distance(a, b) / gesture.distance)));
    const rect = canvas.getBoundingClientRect();
    panBy(mid.x - rect.left - gesture.x * getZoom(), mid.y - rect.top - gesture.y * getZoom());
  }, { capture: true, passive: false });
  function release(e) {
    if(handDrag?.id===e.pointerId){handDrag=null;suppress(e)}
    if (!touches.has(e.pointerId)) return;
    touches.delete(e.pointerId);
    if (navigating) suppress(e);
    if (touches.size >= 2) begin();
    else gesture = null;
    // Do not resume drawing with the remaining finger after a pinch.
    if (!touches.size) { navigating = false; baseline = null; }
  }
  area.addEventListener('pointerup', release, { capture: true, passive: false });
  area.addEventListener('pointercancel', release, { capture: true, passive: false });
  area.addEventListener('lostpointercapture', e => {
    // A bubbling loss from the canvas is a capture handoff, not a finger lift.
    // Only the area losing its own capture can cancel an active touch here.
    if (e.target === area && (touches.has(e.pointerId)||handDrag?.id===e.pointerId)) release(e);
  }, { capture: true });
}
