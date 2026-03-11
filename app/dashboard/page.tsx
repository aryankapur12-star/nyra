18:47:00.045 Running build in Portland, USA (West) – pdx1
18:47:00.046 Build machine configuration: 2 cores, 8 GB
18:47:00.168 Cloning github.com/aryankapur12-star/nyra (Branch: master, Commit: e8425f0)
18:47:00.670 Cloning completed: 501.000ms
18:47:02.456 Restored build cache from previous deployment (7pEAaL56NgpFM6JmNSRE2hWuyiJP)
18:47:02.723 Running "vercel build"
18:47:03.292 Vercel CLI 50.28.0
18:47:03.581 Installing dependencies...
18:47:04.689 
18:47:04.690 up to date in 914ms
18:47:04.690 
18:47:04.691 150 packages are looking for funding
18:47:04.691   run `npm fund` for details
18:47:04.854 Detected Next.js version: 16.1.6
18:47:04.859 Running "npm run build"
18:47:04.955 
18:47:04.955 > my-app@0.1.0 build
18:47:04.955 > next build
18:47:04.955 
18:47:05.992 ▲ Next.js 16.1.6 (Turbopack)
18:47:05.993 
18:47:06.031   Creating an optimized production build ...
18:47:25.207 ✓ Compiled successfully in 18.6s
18:47:25.211   Running TypeScript ...
18:47:33.208 Failed to compile.
18:47:33.208 
18:47:33.209 ./app/dashboard/page.tsx:180:25
18:47:33.209 Type error: 'cv' is possibly 'null'.
18:47:33.209 
18:47:33.209 [0m [90m 178 |[39m     [36mfunction[39m draw(){
18:47:33.209  [90m 179 |[39m       [36mif[39m([33m![39mctx)[36mreturn[39m[33m;[39m
18:47:33.209 [31m[1m>[22m[39m[90m 180 |[39m       ctx[33m.[39mclearRect([35m0[39m[33m,[39m[35m0[39m[33m,[39mcv[33m.[39mwidth[33m,[39mcv[33m.[39mheight)[33m;[39m
18:47:33.209  [90m     |[39m                         [31m[1m^[22m[39m
18:47:33.209  [90m 181 |[39m       particles[33m.[39mcurrent[33m=[39mparticles[33m.[39mcurrent[33m.[39mfilter(p[33m=>[39mp[33m.[39mlife[33m>[39m[35m0[39m)[33m;[39m
18:47:33.210  [90m 182 |[39m       particles[33m.[39mcurrent[33m.[39mforEach(p[33m=>[39m{p[33m.[39mvx[33m*=[39mp[33m.[39mdrag[33m;[39mp[33m.[39mvy[33m*=[39mp[33m.[39mdrag[33m;[39mp[33m.[39mvy[33m+=[39mp[33m.[39mg[33m;[39mp[33m.[39mx[33m+=[39mp[33m.[39mvx[33m;[39mp[33m.[39my[33m+=[39mp[33m.[39mvy[33m;[39mp[33m.[39mrot[33m+=[39mp[33m.[39mrs[33m;[39mp[33m.[39mlife[33m-=[39mp[33m.[39mdecay[33m;[39mctx[33m.[39msave()[33m;[39mctx[33m.[39mglobalAlpha[33m=[39m[33mMath[39m[33m.[39mmax([35m0[39m[33m,[39mp[33m.[39mlife)[33m;[39mctx[33m.[39mfillStyle[33m=[39mp[33m.[39mcolor[33m;[39mctx[33m.[39mtranslate(p[33m.[39mx[33m,[39mp[33m.[39my)[33m;[39mctx[33m.[39mrotate(p[33m.[39mrot)[33m;[39m[36mif[39m(p[33m.[39mshape[33m===[39m[32m'circle'[39m){ctx[33m.[39mbeginPath()[33m;[39mctx[33m.[39marc([35m0[39m[33m,[39m[35m0[39m[33m,[39mp[33m.[39mr[33m,[39m[35m0[39m[33m,[39m[33mMath[39m[33m.[39m[33mPI[39m[33m*[39m[35m2[39m)[33m;[39mctx[33m.[39mfill()[33m;[39m}[36melse[39m{ctx[33m.[39mfillRect([33m-[39mp[33m.[39mw[33m/[39m[35m2[39m[33m,[39m[33m-[39mp[33m.[39mh[33m/[39m[35m2[39m[33m,[39mp[33m.[39mw[33m,[39mp[33m.[39mh)[33m;[39m}ctx[33m.[39mrestore()[33m;[39m})[33m;[39m
18:47:33.210  [90m 183 |[39m       [36mif[39m(particles[33m.[39mcurrent[33m.[39mlength[33m>[39m[35m0[39m)animRef[33m.[39mcurrent[33m=[39mrequestAnimationFrame(draw)[33m;[39m[0m
18:47:33.262 Next.js build worker exited with code: 1 and signal: null
18:47:33.321 Error: Command "npm run build" exited with 1