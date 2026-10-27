const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const install = vm.runInNewContext(readFileSync(require('node:path').join(__dirname, '../dist/gestures.js'), 'utf8') + '\ninstallCanvasGestures;');

function setup() {
  let zoom = 4, cancellations = 0;
  const baseline = { artwork: 'before touch', undo: ['previous edit'] }, handlers = {};
  const area = { scrollLeft: 0, scrollTop: 0, setPointerCapture() {},
    addEventListener(name, fn) { handlers[name] = fn; } };
  const canvas = { getBoundingClientRect: () => ({ left: -area.scrollLeft, top: -area.scrollTop }) };
  install({ area, canvas, getZoom: () => zoom, setZoom: value => { zoom = value; },
    captureDrawing: () => baseline,
    cancelDrawing: value => { assert.equal(value, baseline); cancellations++; } });
  function send(type, id, x, y, pointerType = 'touch', target = canvas) {
    const e = { pointerId: id, pointerType, clientX: x, clientY: y, target,
      prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
    handlers[type](e); return e;
  }
  return { send, area, get zoom() { return zoom; }, get cancellations() { return cancellations; } };
}

test('one finger and mouse remain available for drawing', () => {
  const s = setup();
  assert.equal(s.send('pointerdown', 1, 40, 80).stopped, false);
  assert.equal(s.send('pointermove', 1, 50, 90).stopped, false);
  assert.equal(s.zoom, 4); assert.equal(s.cancellations, 0);
  s.send('pointerup', 1, 50, 90);
  assert.equal(s.send('pointerdown', 2, 40, 80, 'mouse').stopped, false);
});
test('pinch zoom keeps the pixel under the gesture midpoint anchored', () => {
  const s = setup();
  s.send('pointerdown', 1, 40, 80);
  assert.equal(s.send('pointerdown', 2, 120, 80).stopped, true);
  assert.equal(s.cancellations, 1);
  s.send('pointermove', 2, 200, 80);
  assert.equal(s.zoom, 8);
  assert.equal(s.area.scrollLeft, 40); assert.equal(s.area.scrollTop, 80);
  // Translate both fingers equally: scale stays fixed, scroll position changes.
  s.send('pointermove', 1, 20, 60); s.send('pointermove', 2, 180, 60);
  assert.equal(s.zoom, 8);
  assert.equal(s.area.scrollLeft, 60); assert.equal(s.area.scrollTop, 100);
});
test('pinch in reduces zoom and caps zoom at safe limits', () => {
  const s = setup();
  s.send('pointerdown', 1, 0, 0); s.send('pointerdown', 2, 100, 0);
  s.send('pointermove', 2, 50, 0); assert.equal(s.zoom, 2);
  s.send('pointermove', 2, 10000, 0); assert.equal(s.zoom, 24);
  s.send('pointermove', 2, 0, 0); assert.equal(s.zoom, .25);
});
test('remaining finger cannot draw after pinch; all fingers lifting resets navigation', () => {
  const s = setup();
  s.send('pointerdown', 1, 0, 0); s.send('pointerdown', 2, 100, 0);
  assert.equal(s.send('pointerup', 2, 100, 0).stopped, true);
  assert.equal(s.send('pointermove', 1, 20, 20).stopped, true);
  s.send('pointercancel', 1, 20, 20);
  assert.equal(s.send('pointerdown', 3, 20, 20).stopped, false);
});
test('a third finger or lost capture does not leave gestures stuck', () => {
  const s = setup();
  s.send('pointerdown', 1, 0, 0); s.send('pointerdown', 2, 100, 0);
  s.send('pointerdown', 3, 200, 0); assert.equal(s.cancellations, 1);
  s.send('pointerup', 1, 0, 0); s.send('pointermove', 3, 300, 0);
  assert.equal(s.zoom, 8);
  s.send('lostpointercapture', 2, 100, 0, 'touch', s.area); s.send('pointercancel', 3, 300, 0);
  assert.equal(s.send('pointerdown', 4, 30, 30).stopped, false);
});
test('canvas capture handoff must not remove a finger or stop pinch zoom', () => {
  const s = setup();
  s.send('pointerdown', 1, 40, 80); s.send('pointerdown', 2, 120, 80);
  s.send('lostpointercapture', 2, 120, 80);
  s.send('pointermove', 2, 200, 80);
  assert.equal(s.zoom, 8);
  assert.equal(s.cancellations, 1);
});
