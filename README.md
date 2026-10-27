# Pyxel Studio

Independent browser pixel art editor inspired by classic desktop workflows. Vanilla HTML, CSS and JavaScript; no build step or application dependencies.

Serve `dist` with `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173.

Features: pencil, eraser, flood fill, color picker, line, rectangle, layers (visibility, order, opacity), undo/redo, grid, zoom, PNG export, PNG/JPEG import, `.pxweb` project save/load, browser autosave and keyboard shortcuts. Canvas dimensions: 8–256 pixels per side. PNG exports at native resolution. PNG/JPEG import quantizes partially transparent pixels to opaque pixels; projects preserve per-layer opacity.

This is a new implementation. Original PyxelEdit `.pyxel` files, tilesets and animation are not supported in this initial version. Keep downloaded `.pxweb` files for durable backups; browser autosave belongs to the current origin and browser profile.

Responsive layout follows screen width automatically. Below 760px, the canvas uses the available viewport, file operations move into a hamburger menu, colors open in a dropdown, and layers open from the menu. Drawing tools stay in a compact bottom toolbar. No Desktop / Mobile switch.
