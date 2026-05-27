(function(){"use strict";const A={enabled:!1,mode:"none",contrastBoost:50,fontSize:100,lineHeight:100,readableFont:!1,highReadability:!1,a11yMode:"none",heatmapEnabled:!1,adaptiveLearning:!0,showRecommendations:!0},nt={"adaptive-reading":{fontSize:120,lineHeight:150,readableFont:!0,highReadability:!1,contrastBoost:60},"smart-dashboard":{contrastBoost:80,fontSize:105,lineHeight:115,readableFont:!1,highReadability:!1},"eye-comfort":{contrastBoost:30,fontSize:110,lineHeight:130,readableFont:!1,highReadability:!1},coding:{contrastBoost:75,fontSize:110,lineHeight:140,readableFont:!1,highReadability:!1},"low-distraction":{highReadability:!0,fontSize:100,lineHeight:160,contrastBoost:55,readableFont:!0}},at=[[.31399022,.63951294,.04649755],[.15537241,.75789446,.08670142],[.01775239,.10944209,.87256922]],it=[[5.47221206,-4.6419601,.16963708],[-1.1252419,2.29317094,-.1678952],[.02980165,-.19318073,1.16364789]],rt={protanopia:[[0,2.02344,-2.52581],[0,1,0],[0,0,1]],deuteranopia:[[1,0,0],[.494207,0,1.24827],[0,0,1]],tritanopia:[[1,0,0],[0,1,0],[-.395913,.801109,0]]},l="visionadapt-active",L="visionadapt-styles",P="visionadapt-heatmap",st='"Atkinson Hyperlegible", "OpenDyslexic", "Verdana", "Trebuchet MS", system-ui, sans-serif',_=200,q="visionadapt_memory",R="visionadapt_analytics",F="visionadapt_settings";async function ct(){return new Promise(t=>{try{chrome.storage.sync.get(F,o=>{if(chrome.runtime.lastError){t({...A});return}const e=o[F];t(e&&typeof e=="object"?{...A,...e}:{...A})})}catch{t({...A})}})}function lt(t){const o=e=>{if(F in e){const n=e[F].newValue;n&&t({...A,...n})}};return chrome.storage.onChanged.addListener(o),()=>chrome.storage.onChanged.removeListener(o)}async function V(){return new Promise(t=>{try{chrome.storage.local.get(q,o=>{if(chrome.runtime.lastError){t({});return}t(o[q]||{})})}catch{t({})}})}async function dt(t,o){const e=await V();e[t]=o;const n=Object.keys(e);return n.length>200&&n.sort((i,r)=>e[i].lastVisit-e[r].lastVisit).slice(0,n.length-200).forEach(i=>delete e[i]),new Promise(a=>{chrome.storage.local.set({[q]:e},()=>a())})}async function G(t){return(await V())[t]||null}const z={totalSessions:0,sitesImproved:0,transformationsApplied:0,mostUsedMode:"none",avgScoreImprovement:0,history:[]};async function ut(){return new Promise(t=>{try{chrome.storage.local.get(R,o=>{if(chrome.runtime.lastError){t({...z});return}t(o[R]||{...z})})}catch{t({...z})}})}async function mt(t){return t.history.length>100&&(t.history=t.history.slice(-100)),new Promise(o=>{chrome.storage.local.set({[R]:t},()=>o())})}async function pt(t,o,e,n,a){try{const i=await ut();i.totalSessions+=1,a>n&&(i.sitesImproved+=1),i.transformationsApplied+=e.length,i.history.push({timestamp:Date.now(),domain:t,websiteType:o,modesApplied:e,scoresBefore:n,scoresAfter:a}),e.length>0&&(i.mostUsedMode=e[0]),await mt(i)}catch{}}function u(t){const o=t/255;return o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4)}function S(t){const o=Math.max(0,Math.min(1,t)),e=o<=.0031308?o*12.92:1.055*Math.pow(o,1/2.4)-.055;return Math.round(e*255)}function ft(t){const o=u(t.r),e=u(t.g),n=u(t.b),[a,i,r]=at;return{l:a[0]*o+a[1]*e+a[2]*n,m:i[0]*o+i[1]*e+i[2]*n,s:r[0]*o+r[1]*e+r[2]*n}}function ht(t){const[o,e,n]=it,a=o[0]*t.l+o[1]*t.m+o[2]*t.s,i=e[0]*t.l+e[1]*t.m+e[2]*t.s,r=n[0]*t.l+n[1]*t.m+n[2]*t.s;return{r:S(a),g:S(i),b:S(r)}}function yt(t,o){const e=ft(t),n=rt[o],a={l:n[0][0]*e.l+n[0][1]*e.m+n[0][2]*e.s,m:n[1][0]*e.l+n[1][1]*e.m+n[1][2]*e.s,s:n[2][0]*e.l+n[2][1]*e.m+n[2][2]*e.s};return ht(a)}function K(t,o){const e=yt(t,o),n=u(t.r)-u(e.r),a=u(t.g)-u(e.g),i=u(t.b)-u(e.b);let r=0,s=0,c=0;return o==="protanopia"?(s=n*.7+a,c=n*.3+i,r=0):o==="deuteranopia"?(r=a*.7+n,c=a*.3+i,s=0):(r=i*.3+n,s=i*.7+a,c=0),{r:S(u(e.r)+r),g:S(u(e.g)+s),b:S(u(e.b)+c)}}const I=new Map;function b(t){if(!t||t==="transparent"||t==="inherit"||t==="currentcolor")return null;const o=I.get(t);if(o!==void 0)return o;let e=null;const n=t.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(n&&(e={r:parseInt(n[1],10),g:parseInt(n[2],10),b:parseInt(n[3],10)}),!e){const a=t.match(/^#([0-9a-f]{3,8})$/i);if(a){const i=a[1];i.length===3||i.length===4?e={r:parseInt(i[0]+i[0],16),g:parseInt(i[1]+i[1],16),b:parseInt(i[2]+i[2],16)}:i.length>=6&&(e={r:parseInt(i.slice(0,2),16),g:parseInt(i.slice(2,4),16),b:parseInt(i.slice(4,6),16)})}}return I.size>500&&I.clear(),I.set(t,e),e}function k(t){return`rgb(${t.r}, ${t.g}, ${t.b})`}function E(t){const o=u(t.r),e=u(t.g),n=u(t.b);return .2126*o+.7152*e+.0722*n}function w(t,o){const e=E(t),n=E(o),a=Math.max(e,n),i=Math.min(e,n);return(a+.05)/(i+.05)}function W(t,o,e){const n=Math.max(0,Math.min(1,e)),a=u(t.r),i=u(o.r),r=u(t.g),s=u(o.g),c=u(t.b),d=u(o.b);return{r:S(a+(i-a)*n),g:S(r+(s-r)*n),b:S(c+(d-c)*n)}}const j=4.5;function gt(t,o,e=j){if(w(t,o)>=e)return t;E(o);const n={r:0,g:0,b:0},a={r:255,g:255,b:255},i=w(n,o),s=w(a,o)>=i?a:n;let c=0,d=1,m=t;for(let p=0;p<20;p++){const g=(c+d)/2,f=W(t,s,g);w(f,o)>=e?(m=f,d=g):c=g}return m}function bt(t,o,e){if(e<=0)return t;const n=Math.min(1,e),i=E(o)>.5?{r:0,g:0,b:0}:{r:255,g:255,b:255};return W(t,i,n*.6)}function St(t){const{fontSizePercent:o,lineHeightPercent:e,readableFont:n,highReadability:a}=t,i=o/100,r=e/100,s=n?`font-family: ${st} !important;`:"",c=a?Math.max(1.8,1.5*r):r===1?"normal":`${(1.5*r).toFixed(2)}`,d=a?"letter-spacing: 0.05em !important;":"",m=a?"word-spacing: 0.1em !important;":"",p=a?"margin-bottom: 1.2em !important;":"",g=["p","span","li","td","th","label","caption","blockquote","figcaption","summary","dt","dd"].join(", "),f=["h1","h2","h3","h4","h5","h6"].join(", ");let C="";return(i!==1||n||a)&&(C+=`
/* VisionAdapt Typography — body baseline */
body, html {
  ${s}
}

/* Scale text elements (preserves em-relative sizing) */
${g} {
  ${i!==1?`font-size: ${(i*100).toFixed(0)}% !important;`:""}
  line-height: ${c} !important;
  ${s}
  ${d}
  ${m}
}

/* Scale headings proportionally */
${f} {
  ${i!==1?`font-size: revert !important; transform: scale(${i.toFixed(3)}); transform-origin: left;`:""}
  line-height: ${typeof c=="number"?`${(c*.9).toFixed(2)}`:c} !important;
  ${s}
}

/* Paragraph spacing for readability */
${p?`p { ${p} }`:""}
`),(r!==1||a)&&(C+=`
/* VisionAdapt — input / textarea scaling */
input, textarea, select, button {
  line-height: ${typeof c=="number"?`${c}`:c} !important;
  ${s}
}
`),a&&(C+=`
/* VisionAdapt — high readability mode */
* {
  max-width: 80ch;
}
article, main, .content, [role="main"] {
  max-width: 75ch;
  margin-left: auto !important;
  margin-right: auto !important;
}
`),C}function vt(){return`@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap');
`}function Ct(){let t=document.getElementById(L);return t||(t=document.createElement("style"),t.id=L,t.setAttribute("data-visionadapt","1"),(document.head||document.documentElement).appendChild(t)),t}function U(){document.getElementById(L)?.remove(),document.documentElement.classList.remove(l),document.querySelectorAll("[data-va-original]").forEach(t=>{const o=t,e=o.dataset.vaOriginal;e!==void 0&&(o.style.color=e,delete o.dataset.vaOriginal);const n=o.dataset.vaOriginalBg;n!==void 0&&(o.style.backgroundColor=n,delete o.dataset.vaOriginalBg),delete o.dataset.vaDone})}function At(t){const{contrastBoost:o,mode:e}=t;return`
/* VisionAdapt — Base Accessibility Layer */

/* Underline all links clearly */
.${l} a:not([role="button"]):not(.btn):not(.button) {
  text-decoration: underline !important;
  text-decoration-thickness: 1.5px !important;
}

/* Add visible focus rings */
.${l} :focus-visible {
  outline: 3px solid #3b6fa0 !important;
  outline-offset: 2px !important;
}

/* Error states — add red border + icon indicator */
.${l} [class*="error"]:not(script):not(style),
.${l} [class*="invalid"]:not(script):not(style),
.${l} [aria-invalid="true"] {
  border: 2px solid #dc2626 !important;
  border-left: 4px solid #dc2626 !important;
}

/* Success states — add green border */
.${l} [class*="success"]:not(script):not(style),
.${l} [class*="valid"]:not(script):not(style):not([aria-invalid]) {
  border-left: 4px solid #16a34a !important;
}

/* Warning states — add orange border + pattern */
.${l} [class*="warn"]:not(script):not(style),
.${l} [class*="alert"]:not(script):not(style),
.${l} [role="alert"] {
  border-left: 4px solid #d97706 !important;
}

/* Disabled elements — add striped pattern */
.${l} [disabled],
.${l} [aria-disabled="true"] {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* Required fields — add indicator */
.${l} [required] {
  border-color: #3b6fa0 !important;
}

/* Improve button affordance */
.${l} button:not([disabled]),
.${l} [role="button"]:not([aria-disabled]) {
  border: 1.5px solid currentColor !important;
}

/* Improve image alt text visibility */
.${l} img:not([alt]),
.${l} img[alt=""] {
  outline: 2px dashed #d97706;
}
`}function wt(t,o){if(t==="none")return"";let e=`
/* VisionAdapt — ${t} color mode */
`;return(t==="protanopia"||t==="deuteranopia")&&(e+=`
.${l} [class*="red"],
.${l} [class*="danger"],
.${l} [class*="error"] {
  border-bottom: 2px solid #3b6fa0 !important;
}
.${l} [class*="green"],
.${l} [class*="success"] {
  border-bottom: 2px dashed #f59e0b !important;
}
`),t==="tritanopia"&&(e+=`
.${l} [class*="blue"],
.${l} [class*="info"],
.${l} [class*="primary"] {
  border-bottom: 2px solid #dc2626 !important;
}
.${l} [class*="yellow"],
.${l} [class*="warn"] {
  border-bottom: 2px dashed #7c3aed !important;
}
`),e}const Y=new Set(["script","style","noscript","head","meta","link","svg","path","symbol","defs","use","canvas","video"]);function Et(t,o,e){if(t.dataset.vaDone)return;const n=window.getComputedStyle(t),a=n.color,i=n.backgroundColor,r=b(a),s=b(i);let c=!1;if(r){const d=K(r,o),m=s?bt(d,s,e/150):d,p=s?gt(m,s,j):m,g=k(p);g!==k(r)&&(t.dataset.vaOriginal===void 0&&(t.dataset.vaOriginal=t.style.color||""),t.style.setProperty("color",g,"important"),c=!0)}if(s&&s.r+s.g+s.b<750){const d=K(s,o),m=k(d);m!==k(s)&&(t.dataset.vaOriginalBg===void 0&&(t.dataset.vaOriginalBg=t.style.backgroundColor||""),t.style.setProperty("background-color",m,"important"),c=!0)}c&&(t.dataset.vaDone="1")}function X(t,o,e){const n=t.slice(0,_);for(const a of n)try{Et(a,o,e)}catch{}}function J(t=document.documentElement){const o=[],e=document.createTreeWalker(t,NodeFilter.SHOW_ELEMENT,{acceptNode(a){const i=a;return Y.has(i.tagName.toLowerCase())?NodeFilter.FILTER_REJECT:i.dataset.vaSkip?NodeFilter.FILTER_SKIP:NodeFilter.FILTER_ACCEPT}});let n;for(;n=e.nextNode();)o.push(n);return o}let x=null,H=null;function Mt(t){if(x!==null&&(cancelAnimationFrame(x),x=null),H?.disconnect(),!t.enabled){U();return}document.documentElement.classList.add(l);const o=Ct();let e="";t.readableFont&&(e+=vt()),e+=At(t),e+=wt(t.mode,t.contrastBoost),e+=St({fontSizePercent:t.fontSize,lineHeightPercent:t.lineHeight,readableFont:t.readableFont,highReadability:t.highReadability}),o.textContent=e,t.mode!=="none"&&(xt(t),Tt(t))}function xt(t){const o=t.mode,e=t.contrastBoost,n=J();let a=0;function i(){const r=n.slice(a,a+_);r.length!==0&&(X(r,o,e),a+=_,a<n.length&&(x=requestAnimationFrame(i)))}x=requestAnimationFrame(i)}function Tt(t){const o=t.mode,e=t.contrastBoost;let n=[],a=null;H=new MutationObserver(i=>{for(const r of i)for(const s of r.addedNodes){if(s.nodeType!==Node.ELEMENT_NODE)continue;const c=s;if(Y.has(c.tagName.toLowerCase()))continue;n.push(c);const d=J(c);n.push(...d)}n.length!==0&&a===null&&(a=requestAnimationFrame(()=>{const r=n.splice(0,_*2);X(r,o,e),a=null}))}),H.observe(document.documentElement,{childList:!0,subtree:!0})}function $t(t){const o=[],e=t.toLowerCase();return/dashboard|analytics|metrics|grafana|kibana|datadog|tableau/.test(e)&&o.push({type:"dashboard",score:.8}),/medium\.com|substack|blog|article|news|post|read|story|wiki/.test(e)&&o.push({type:"reading",score:.7}),/shop|store|cart|checkout|product|buy|price|amazon|shopify|etsy/.test(e)&&o.push({type:"ecommerce",score:.8}),/github|gitlab|stackoverflow|codepen|jsfiddle|replit|developer|api|docs|devdocs/.test(e)&&o.push({type:"development",score:.8}),/learn|course|tutorial|udemy|coursera|edu|university|school|lesson|study/.test(e)&&o.push({type:"education",score:.75}),o}function Lt(){const t=[],o=document.body;if(!o)return t;const e=o.querySelectorAll("*");Math.min(e.length,500);let n=0,a=0,i=0,r=0,s=0,c=0;const d=document.querySelectorAll("svg, canvas").length;n+=Math.min(d/3,5),a+=document.querySelectorAll("code, pre, .hljs, .prism, [class*='code'], [class*='syntax']").length,i+=document.querySelectorAll("form, input, select, textarea").length,r+=document.querySelectorAll("article, [role='article'], .post, .article, .entry, .blog-post").length,s+=document.querySelectorAll("table, [role='grid']").length,c+=document.querySelectorAll("nav, [role='navigation']").length;const p=((o.innerText?.slice(0,5e3)||"").match(/\$[\d,]+/g)||[]).length;return(n>=2||s>=3)&&t.push({type:"dashboard",score:.4+Math.min(n*.1,.4)}),a>=2&&t.push({type:"development",score:.3+Math.min(a*.05,.5)}),r>=1&&t.push({type:"reading",score:.5+Math.min(r*.1,.3)}),p>=3&&t.push({type:"ecommerce",score:.3+Math.min(p*.05,.5)}),i>=5&&t.push({type:"ecommerce",score:.25}),t}function _t(){const t=[],o=document.querySelector('meta[name="keywords"]')?.getAttribute("content")||"",e=document.querySelector('meta[name="description"]')?.getAttribute("content")||"",n=document.querySelector('meta[property="og:type"]')?.getAttribute("content")||"",a=(o+" "+e+" "+n).toLowerCase();return/dashboard|analytics|metrics|chart|graph|visualization/.test(a)&&t.push({type:"dashboard",score:.6}),/article|blog|news|story|reading/.test(a)&&t.push({type:"reading",score:.6}),/shop|product|buy|cart|store/.test(a)&&t.push({type:"ecommerce",score:.6}),/code|developer|programming|api|documentation/.test(a)&&t.push({type:"development",score:.6}),/learn|course|education|tutorial/.test(a)&&t.push({type:"education",score:.6}),n==="article"&&t.push({type:"reading",score:.5}),n==="product"&&t.push({type:"ecommerce",score:.5}),t}function Ft(){try{const o=(document.body?.innerText||"").trim().split(/\s+/).filter(Boolean).length,e=document.querySelectorAll("*").length;return Math.min(o/Math.max(e,1),1)}catch{return 0}}function It(){const t=window.location?.hostname||"unknown",o=window.location?.href||"",e=[...$t(o),..._t(),...Lt()],n={};for(const f of e)n[f.type]=(n[f.type]||0)+f.score;let a="general",i=0;for(const[f,C]of Object.entries(n))C>i&&(i=C,a=f);const r=Math.min(i/2,1),s=document.querySelectorAll("svg, canvas, [class*='chart'], [class*='graph']").length>1,c=document.querySelectorAll("code, pre, [class*='code']").length>0,d=document.querySelectorAll("form, input[type='text'], input[type='email']").length>0,m=document.querySelectorAll("nav, [role='navigation']").length>0,p=document.querySelectorAll("*").length,g=Ft();return{type:a,confidence:r,domain:t,hasCharts:s,hasCode:c,hasForms:d,hasNavigation:m,elementCount:p,textDensity:g}}function kt(t){return t.type==="dashboard"||t.hasCharts?"smart-dashboard":t.type==="reading"&&t.textDensity>.3?"adaptive-reading":t.type==="development"||t.hasCode?"coding":t.type==="education"?"adaptive-reading":(t.type==="ecommerce","none")}function Bt(t=80){let o=0,e=0;const n=Array.from(document.querySelectorAll("p, span, h1, h2, h3, h4, li, a, label, td, th, button")).slice(0,t);for(const a of n)try{const i=window.getComputedStyle(a),r=b(i.color),s=b(i.backgroundColor);if(!r||!s)continue;e++,w(r,s)>=4.5&&o++}catch{}return{passes:o,total:e}}function Ot(){const{passes:t,total:o}=Bt(80);return o===0?75:Math.round(t/o*100)}function qt(){let t=100;const o=Array.from(document.querySelectorAll("p, li, td, span")).slice(0,50);let e=0;for(const s of o)try{parseFloat(window.getComputedStyle(s).fontSize)<12&&e++}catch{}if(o.length>0){const s=e/o.length;t-=s*40}let n=0;const a=document.body;if(a){const s=parseFloat(window.getComputedStyle(a).lineHeight),c=parseFloat(window.getComputedStyle(a).fontSize);s/c<1.3&&(n=15)}t-=n;const i=window.getComputedStyle(document.body).fontFamily.toLowerCase();return/hyperlegible|verdana|trebuchet|arial|helvetica|segoe/.test(i)||(t-=5),Math.max(0,Math.min(100,Math.round(t)))}function Rt(){let t=60;const o=document.querySelectorAll("nav, main, header, footer, aside, [role='navigation'], [role='main'], [role='banner'], [role='contentinfo']").length;return t+=Math.min(o*5,25),document.querySelectorAll('a[href^="#"], [class*="skip"]').length>0&&(t+=10),document.querySelectorAll('[aria-label*="breadcrumb"], [class*="breadcrumb"]').length>0&&(t+=5),Math.max(0,Math.min(100,t))}function zt(){let t=70;const o=Array.from(document.querySelectorAll("button, [role='button'], input[type='submit'], a")).slice(0,50);let e=0,n=0;for(const i of o){i.getAttribute("aria-label")||i.getAttribute("title")||i.textContent?.trim()||e++;try{const s=window.getComputedStyle(i),c=b(s.color),d=b(s.backgroundColor);c&&d&&w(c,d)<3&&n++}catch{}}return o.length>0&&(t-=e/o.length*20,t-=n/o.length*15),document.querySelector("[data-visionadapt]")&&(t+=10),Math.max(0,Math.min(100,Math.round(t)))}function Ht(){let t=80;const o=document.querySelectorAll("*").length,e=window.innerWidth*window.innerHeight,n=o/(e/1e4);return n>50?t-=20:n>30&&(t-=10),document.querySelectorAll("video[autoplay], video.autoplay").length>0&&(t-=15),document.querySelectorAll("[class*='animate'], [class*='animation']").length>10&&(t-=10),Math.max(0,Math.min(100,t))}function Dt(){let t=70;const o=b(window.getComputedStyle(document.body).backgroundColor);if(o){const i=E(o);i>.9&&(t-=10),i<.05&&(t+=5),i>=.1&&i<=.8&&(t+=15)}const e=document.querySelectorAll("section, article, aside, header, footer");let n=0,a=-1;for(const i of Array.from(e).slice(0,10)){const r=b(window.getComputedStyle(i).backgroundColor);if(r){const s=E(r);a>=0&&Math.abs(s-a)>.5&&n++,a=s}}return t-=n*5,Math.max(0,Math.min(100,t))}function B(){try{const t=Ot(),o=qt(),e=Rt(),n=zt(),a=Ht(),i=Dt();return{overall:Math.round(t*.25+o*.25+e*.15+n*.15+a*.1+i*.1),colorDistinction:t,readability:o,navigationClarity:e,interactionVisibility:n,cognitiveSimplicity:a,visualComfort:i}}catch{return{overall:50,colorDistinction:50,readability:50,navigationClarity:50,interactionVisibility:50,cognitiveSimplicity:50,visualComfort:50}}}let h=null,v=null,T=[],Q=0,Z=!1;async function Nt(t){h=It(),v=B(),Q=v.overall;const o=await G(h.domain).catch(()=>null);if(o&&(o.visitCount+=1,o.lastVisit=Date.now()),t.adaptiveLearning&&t.a11yMode==="none"&&t.enabled){const e=o?.preferredMode||kt(h);e!=="none"&&T.push(e)}return Z=!0,{context:h,scores:v}}function Pt(){return v||(v=B()),v}function Vt(){return v=B(),v}function tt(){return h}function Gt(t,o){if(o==="none")return t;const e=nt[o];return e?(T.includes(o)||T.push(o),{...t,...e}):t}function Kt(t,o){if(!o.enabled)return"";let e="";return(t.type==="dashboard"||t.hasCharts)&&(e+=`
/* VisionAdapt A11y — Dashboard Context */
svg text, canvas + *, [class*="chart"] text, [class*="recharts"] text,
[class*="chart-label"], [class*="legend"] {
  font-size: max(11px, 1em) !important;
  font-weight: 600 !important;
}
[class*="chart"], [class*="graph"], [class*="recharts"], canvas {
  outline: 1px solid rgba(148, 163, 184, 0.2) !important;
  border-radius: 4px !important;
}
`),(t.type==="reading"||o.a11yMode==="adaptive-reading")&&(e+=`
/* VisionAdapt A11y — Reading Context */
article, [class*="article"], [class*="post-content"], [class*="entry-content"],
[class*="prose"], main > div {
  max-width: 72ch !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
article p, [class*="prose"] p {
  margin-bottom: 1.4em !important;
}
`),(t.type==="development"||t.hasCode)&&(e+=`
/* VisionAdapt A11y — Development Context */
code, pre, [class*="code"], [class*="syntax"], [class*="hljs"], [class*="prism"] {
  font-size: max(13px, 0.95em) !important;
  line-height: 1.65 !important;
}
pre {
  padding: 1rem !important;
}
`),t.type==="ecommerce"&&(e+=`
/* VisionAdapt A11y — E-Commerce Context */
[class*="price"], [class*="cost"], [class*="amount"] {
  font-weight: 700 !important;
  font-size: max(1em, 16px) !important;
}
`),o.a11yMode==="eye-comfort"&&(e+=`
/* VisionAdapt A11y — Eye Comfort Mode */
html {
  filter: sepia(8%) saturate(95%) !important;
}
`),o.a11yMode==="low-distraction"&&(e+=`
/* VisionAdapt A11y — Low Distraction Mode */
*, *::before, *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
video, [class*="banner-ad"], [class*="sidebar-ad"], iframe[src*="ad"] {
  opacity: 0.15 !important;
}
`),e}async function Wt(t){if(!(!Z||!h))try{const o=B(),e=await G(h.domain).catch(()=>null),n={domain:h.domain,websiteType:h.type,lastVisit:Date.now(),visitCount:(e?.visitCount||0)+1,preferredMode:t.a11yMode,successfulAdjustments:T,avgScores:{overall:Math.round(((e?.avgScores?.overall||o.overall)+o.overall)/2)}};await dt(h.domain,n),await pt(h.domain,h.type,T,Q,o.overall)}catch{}}let M=null,$=null;function jt(t){return t>=7?"rgba(52, 211, 153, 0.25)":t>=4.5?"rgba(96, 165, 250, 0.25)":t>=3?"rgba(251, 191, 36, 0.35)":t>=1.5?"rgba(251, 146, 60, 0.45)":"rgba(248, 113, 113, 0.55)"}function Ut(){let t=document.getElementById(P);return t||(t=document.createElement("canvas"),t.id=P,t.setAttribute("data-visionadapt","1"),t.setAttribute("data-va-skip","1"),Object.assign(t.style,{position:"fixed",top:"0",left:"0",width:"100vw",height:"100vh",pointerEvents:"none",zIndex:"2147483646",opacity:"0.85"}),document.documentElement.appendChild(t)),t.width=window.innerWidth,t.height=window.innerHeight,t}function Yt(t){const o=t.getContext("2d");if(!o)return;o.clearRect(0,0,t.width,t.height);const e=Array.from(document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, li, a, button, label, td, th, input, div")).slice(0,150);for(const n of e)if(!n.dataset.vaSkip)try{const a=n.getBoundingClientRect();if(a.width<5||a.height<5||a.bottom<0||a.top>t.height||a.right<0||a.left>t.width)continue;const i=window.getComputedStyle(n),r=b(i.color),s=b(i.backgroundColor);if(!r||!s)continue;const c=w(r,s);o.fillStyle=jt(c),o.fillRect(Math.round(a.left),Math.round(a.top),Math.round(a.width),Math.round(a.height))}catch{}Xt(o,t.width,t.height)}function Xt(t,o,e){const n=[{label:"AAA (7:1+)",color:"rgba(52, 211, 153, 0.8)"},{label:"AA (4.5:1+)",color:"rgba(96, 165, 250, 0.8)"},{label:"AA Large (3:1+)",color:"rgba(251, 191, 36, 0.8)"},{label:"Poor (1.5:1+)",color:"rgba(251, 146, 60, 0.8)"},{label:"Fail (<1.5)",color:"rgba(248, 113, 113, 0.8)"}],a=12,i=12,r=20,s=160,c=n.length*r+a*2,d=o-s-16,m=e-c-60;t.fillStyle="rgba(15, 17, 23, 0.85)",t.beginPath(),t.roundRect(d-4,m-4,s+8,c+8,8),t.fill(),t.fillStyle="#94a3b8",t.font="bold 10px system-ui, sans-serif",t.fillText("A11y Contrast Heatmap",d+4,m+10),n.forEach((p,g)=>{const f=m+a+10+g*r;t.fillStyle=p.color,t.fillRect(d,f,i,i),t.fillStyle="#e2e8f0",t.font="11px system-ui, sans-serif",t.fillText(p.label,d+i+6,f+9)})}function et(){if(M)return;M=Ut();function t(){M&&(Yt(M),$=requestAnimationFrame(t))}$=requestAnimationFrame(t)}function D(){$!==null&&(cancelAnimationFrame($),$=null),M?.remove(),M=null}let y={...A},N=!1;async function O(t){y=t;const o=t.a11yMode!=="none"?Gt(t,t.a11yMode):t;if(Mt(o),t.enabled&&N){const e=tt();if(e){const n=Kt(e,o);if(n){const a=document.getElementById(L);a&&(a.textContent+=n)}}}t.heatmapEnabled&&t.enabled?et():D()}async function ot(){try{y=await ct(),await O(y),(y.enabled||y.adaptiveLearning)&&setTimeout(async()=>{try{await Nt(y),N=!0,y.enabled&&await O(y)}catch{}},800)}catch{}}try{lt(t=>{O(t)})}catch{}chrome.runtime.onMessage.addListener((t,o,e)=>{try{switch(t.type){case"APPLY_SETTINGS":O(t.settings),e({type:"OK"});break;case"RESET_SETTINGS":U(),D(),y={...A},e({type:"OK"});break;case"GET_STATUS":e({type:"STATUS",active:y.enabled,mode:y.mode});break;case"GET_SCORES":{const n=N?Vt():Pt();e({type:"SCORES",scores:n});break}case"GET_WEBSITE_CONTEXT":{const n=tt();e(n?{type:"WEBSITE_CONTEXT",context:n}:{type:"OK"});break}case"TOGGLE_HEATMAP":t.enabled?et():D(),e({type:"OK"});break;default:e({type:"OK"})}}catch{e({type:"OK"})}return!0}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&Wt(y).catch(()=>{})}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{ot()}):ot()})();
