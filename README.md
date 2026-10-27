# Pyxel Studio

Independent browser pixel art editor inspired by classic desktop workflows. Vanilla HTML, CSS and JavaScript; no build step or application dependencies.

Serve `dist` with `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173.

Features: pencil, eraser, flood fill, color picker, line, rectangle, layers (visibility, order, opacity), undo/redo, grid, zoom, PNG export, PNG/JPEG import, `.pxweb` project save/load, browser autosave and keyboard shortcuts. Canvas dimensions: 8–256 pixels per side. PNG exports at native resolution. PNG/JPEG import quantizes partially transparent pixels to opaque pixels; projects preserve per-layer opacity.

This is a new implementation. Original PyxelEdit `.pyxel` files, tilesets and animation are not supported in this initial version. Keep downloaded `.pxweb` files for durable backups; browser autosave belongs to the current origin and browser profile.

Layout modes: use the Desktop / Mobile switch in the header. The first visit selects a layout from screen width; explicit selection is remembered on this device. Mobile uses touch drawing, a horizontal toolbar, and collapsible Colors / Layers panels. Switching modes preserves the current canvas, layers and undo history.
