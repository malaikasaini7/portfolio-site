# malaikasaini.com

Source for my portfolio - hand-coded HTML, CSS and JavaScript. No framework, no build step.

**Live:** [www.malaikasaini.com](https://www.malaikasaini.com) (password-gated while I interview)

## What's in here

- **Vanilla everything.** Each page is a plain HTML file; styling is hand-written CSS (`style.css`, `micro.css`); interaction is a few small JS modules (`script.js`, `field.js`, `micro.js`).
- **WebGL hero field.** `field.js` is a raw-WebGL animated grain/field shader on the landing hero - no libraries, just a fragment shader and a render loop.
- **Self-hosted motion covers.** Project rows and case-study heroes use looping `<video>` (WebM + MP4 fallback, `autoplay loop muted playsinline`). The loops are screen recordings transcoded with ffmpeg (`libvpx-vp9` / `libx264`, ~10x smaller than GIFs, no banding). The Chariot cover is a scripted human-rhythm scroll: flick, pause, flick - recorded frame-by-frame with Puppeteer, then encoded.
- **Password gate as a Pages Function.** `functions/_middleware.js` checks an HMAC-style cookie and serves `gate.html` to anonymous visitors. The password lives in the `GATE_PASSWORD` environment variable, never in the repo. With no variable set, the gate is open (local preview).
- **Deployed on Cloudflare Pages.** Static assets + the one Function. `npx wrangler pages deploy . --project-name=malaikasaini`

## Why hand-rolled

The site is my answer to "can the designer ship code too." Every easing curve, the scroll reveals, the custom cursor, the shader - written by hand, tuned by eye.
