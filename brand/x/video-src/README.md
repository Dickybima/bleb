# ZEON intro video

`index.html` is the animation (a `render(t)` timeline, 22 s); `render.cjs` steps it frame by frame in
Playwright and pipes the frames to ffmpeg.

```bash
node brand/x/video-src/render.cjs "$PWD/brand/x/video-src" brand/x/zeon-intro.mp4
```

Output: 1920×1080, 30 fps, H.264 (yuv420p, faststart), ready for X.

## "$ZEON is live" video

```bash
node brand/x/video-src/render.cjs "$PWD/brand/x/video-src/live" brand/x/zeon-live.mp4
```

18 s, same format.
