# Pyxel Studio

[Open the editor](https://cikgumie.github.io/pyxelstudio/).

Independent browser pixel art editor inspired by classic desktop workflows. Vanilla HTML, CSS and JavaScript; no build step or application dependencies.

GitHub Pages: serve the `main` branch from `/ (root)`. The root `index.html` opens the editor in `dist/`; `.nojekyll` keeps the deployment as plain static files.

Serve `dist` with `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173.

Features: pencil, eraser, flood fill, color picker, line, rectangle, layers (visibility, order, opacity), undo/redo, grid, zoom, PNG export, PNG/JPEG import, `.pxweb` project save/load, browser autosave and keyboard shortcuts. Canvas dimensions: 8–256 pixels per side. PNG exports at native resolution. PNG/JPEG import quantizes partially transparent pixels to opaque pixels; projects preserve per-layer opacity.

This is a new implementation. Original PyxelEdit `.pyxel` files, tilesets and animation are not supported in this initial version. Keep downloaded `.pxweb` files for durable backups; browser autosave belongs to the current origin and browser profile.

Responsive layout follows screen width automatically. Below 760px, the canvas uses the available viewport, file operations move into a hamburger menu, colors open in a dropdown, and layers open from the menu. Drawing tools stay in a compact bottom toolbar. No Desktop / Mobile switch.

Touch navigation: spread two fingers to zoom in, pinch to zoom out, and drag two fingers to pan. Single-finger drawing resumes after both fingers lift. Pinching cancels the first touch mark, including fill operations; artwork and undo history stay intact. The Fit button resets the view.

Free canvas navigation (v0.3.0): two-finger panning can move the artwork beyond all viewport edges. Select the Hand tool (H) to drag using one finger or a mouse. Fit recenters the canvas. Pan and zoom never alter exported pixels.

PWA (v0.4.0): install from the Studio menu or browser install UI. On iOS, use Safari → Share → Add to Home Screen. Open online once and wait for Ready for offline use. Service worker scope is relative to the editor path, so both GitHub Pages `/pyxelstudio/dist/` and the standalone Site work. Offline shell includes all local assets and icons; no external font dependency. Updates wait for Update app rather than reloading active work. Save a `.pxweb` backup before installing or moving between browser profiles, because installed-app storage can be separate.
