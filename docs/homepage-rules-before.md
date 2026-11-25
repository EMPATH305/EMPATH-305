# Homepage CSS inventory before redesign

Original line numbers; complete matching selector blocks, including shared rules. Room-only selectors in mixed blocks must be retained.

## styles/01-foundation.css:44

```css
textarea, input, .hero-quote, .a-feed, .t-feed { -webkit-user-select: text; user-select: text; }
```

## styles/01-foundation.css:66

```css
h1, h2, .hero-title, .room-letter { text-shadow: 0 0 6px rgba(255, 255, 255, 0.15); }
```

## styles/01-foundation.css:78

```css
nav { position:fixed;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;
  padding:16px 40px;background:#03070a;backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(255,255,255,.08);z-index:500;
  box-shadow: 0 4px 30px rgba(0,0,0,0.8); }
```

## styles/01-foundation.css:84

```css
.nav-logo { font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:600;color:var(--white);letter-spacing:6px; z-index: 501; }
```

## styles/01-foundation.css:86

```css
.hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; z-index: 501; padding: 5px; }
```

## styles/01-foundation.css:87

```css
.hamburger span { width: 24px; height: 2px; background: var(--white); transition: all 0.3s; border-radius: 2px; }
```

## styles/01-foundation.css:88

```css
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
```

## styles/01-foundation.css:89

```css
.hamburger.open span:nth-child(2) { opacity: 0; }
```

## styles/01-foundation.css:90

```css
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
```

## styles/01-foundation.css:92

```css
.nav-menu { display: flex; align-items: center; gap: 32px; transition: all 0.4s ease-in-out; }
```

## styles/01-foundation.css:93

```css
.nav-letters { display:flex;gap:8px; }
```

## styles/01-foundation.css:94

```css
.nav-controls { display:flex;align-items:center;gap:12px; }
```

## styles/01-foundation.css:96

```css
.nav-letter { width:38px;height:38px;border:1px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;
  font-family:"Cormorant Garamond",serif;font-size:16px;font-weight:600;cursor:pointer;transition:all .3s;color:var(--fog);
  border-radius: 4px; }
```

## styles/01-foundation.css:101

```css
.nav-letter:hover { transform:translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
```

## styles/01-foundation.css:102

```css
.nav-letter[data-l="E"] { color:var(--e); }
```

## styles/01-foundation.css:102

```css
.nav-letter[data-l="E"]:hover { border-color:var(--e);background:rgba(123,143,161,.15); }
```

## styles/01-foundation.css:103

```css
.nav-letter[data-l="M"] { color:var(--m); }
```

## styles/01-foundation.css:103

```css
.nav-letter[data-l="M"]:hover { border-color:var(--m);background:rgba(168,184,200,.15); }
```

## styles/01-foundation.css:104

```css
.nav-letter[data-l="P"] { color:var(--p); }
```

## styles/01-foundation.css:104

```css
.nav-letter[data-l="P"]:hover { border-color:var(--p);background:rgba(201,168,76,.15); }
```

## styles/01-foundation.css:105

```css
.nav-letter[data-l="A"] { color:var(--a); }
```

## styles/01-foundation.css:105

```css
.nav-letter[data-l="A"]:hover { border-color:var(--a);background:rgba(122,158,159,.15); }
```

## styles/01-foundation.css:106

```css
.nav-letter[data-l="T"] { color:var(--t); }
```

## styles/01-foundation.css:106

```css
.nav-letter[data-l="T"]:hover { border-color:var(--t);background:rgba(232,168,124,.15); }
```

## styles/01-foundation.css:107

```css
.nav-letter[data-l="H"] { color:var(--h); }
```

## styles/01-foundation.css:107

```css
.nav-letter[data-l="H"]:hover { border-color:var(--h);background:rgba(242,232,217,.15); }
```

## styles/01-foundation.css:109

```css
.func-btn { font-family: "Noto Sans TC", sans-serif; font-size: 13px; letter-spacing: 2px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.25); color: var(--fog);
  padding: 0 16px; border-radius: 20px; font-weight: normal; opacity: 0.9;
  height: 38px; cursor: pointer; transition: all 0.3s; margin: 0; display:flex; align-items:center; gap:6px; justify-content: center; }
```

## styles/01-foundation.css:115

```css
.func-btn:hover { background: rgba(255,255,255,0.15); opacity: 1; border-color: rgba(255,255,255,0.5); }
```

## styles/01-foundation.css:116

```css
.hsp-toggle-btn.active { background: var(--gold); color: #000; border-color: var(--gold); font-weight: bold; opacity: 1; }
```

## styles/01-foundation.css:117

```css
.audio-btn { transition: all 0.3s ease; }
```

## styles/01-foundation.css:118

```css
.audio-btn.active { background: rgba(255,255,255,0.15); border-color: var(--white); color: var(--white); box-shadow: 0 0 10px rgba(255,255,255,0.2); }
```

## styles/01-foundation.css:120

```css
.lang-dropdown-wrapper { position: relative; display: inline-block; }
```

## styles/01-foundation.css:121

```css
.lang-dropdown-list { position: absolute; right: 0; top: 48px; background: rgba(5,12,18,0.98);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; overflow: hidden;
  display: none; flex-direction: column; width: 150px; box-shadow: 0 8px 30px rgba(0,0,0,0.8);
  z-index: 999; backdrop-filter: blur(10px); }
```

## styles/01-foundation.css:127

```css
.lang-dropdown-list.show { display: flex; animation: fadeSlideIn 0.3s ease; }
```

## styles/01-foundation.css:128

```css
.lang-option { padding: 14px 16px; font-size: 13px; color: var(--fog); cursor: pointer; transition: all 0.2s;
  font-family: "Noto Sans TC", sans-serif; text-align: left; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
```

## styles/01-foundation.css:132

```css
.lang-option:last-child { border-bottom: none; }
```

## styles/01-foundation.css:133

```css
.lang-option:hover { background: rgba(255,255,255,0.08); color: var(--gold); }
```

## styles/01-foundation.css:134

```css
.lang-option.active-lang { color: var(--gold); font-weight: bold; background: rgba(201,168,76,0.1); }
```

## styles/01-foundation.css:136

```css
.hsp-tooltip-wrap { position: relative; display: flex; align-items: center; }
```

## styles/01-foundation.css:137

```css
.hsp-first-visit-tooltip { position: absolute; top: 50px; right: 0; background: rgba(8,13,18,0.98);
  border: 1px solid rgba(201,168,76,0.5); color: var(--gold); padding: 12px 30px 12px 16px;
  font-size: 13px; border-radius: 6px; opacity: 0; pointer-events: none; transition: opacity 0.4s ease;
  white-space: nowrap; letter-spacing: 1.5px; font-family: "Noto Sans TC", sans-serif;
  box-shadow: 0 8px 20px rgba(0,0,0,0.6); z-index: 1000; display: none; }
```

## styles/01-foundation.css:144

```css
.hsp-first-visit-tooltip.show { opacity: 1; pointer-events: auto; display: block; }
```

## styles/01-foundation.css:145

```css
.hsp-first-visit-tooltip::before { content: ""; position: absolute; top: -5px; right: 24px; width: 8px; height: 8px;
  background: rgba(8,13,18,0.98); border-top: 1px solid rgba(201,168,76,0.5);
  border-left: 1px solid rgba(201,168,76,0.5); transform: rotate(45deg); }
```

## styles/01-foundation.css:150

```css
.hsp-tooltip-close { position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  color: var(--gold); cursor: pointer; font-size: 18px; opacity: 0.7; padding: 4px; }
```

## styles/01-foundation.css:154

```css
.hsp-tooltip-close:hover { opacity: 1; }
```

## styles/01-foundation.css:156

```css
#hero { min-height:100vh; min-height:100dvh; display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 40px 80px;position:relative;overflow:hidden; }
```

## styles/01-foundation.css:157

```css
.hero-bg-text { position:absolute;font-family:"Cormorant Garamond",serif;font-size:28vw;font-weight:600;color:rgba(255,255,255,.025);letter-spacing:-0.02em;pointer-events:none;user-select:none;line-height:1;top:50%;left:50%;transform:translate(-50%,-50%);white-space:nowrap; }
```

## styles/01-foundation.css:158

```css
.hero-title { font-family:"Cormorant Garamond",serif;font-size:clamp(60px,12vw,120px);font-weight:600;color:var(--white);letter-spacing:20px;line-height:1;margin-bottom:16px;position:relative; }
```

## styles/01-foundation.css:159

```css
.hero-sub { font-family:"Cormorant Garamond",serif;font-style:italic;font-size:clamp(15px,2.5vw,22px);color:var(--gold);letter-spacing:3px;margin-bottom:24px;position:relative; }
```

## styles/01-foundation.css:178

```css
.hero-quotes { display:flex;gap:40px;margin-bottom:48px;position:relative;flex-wrap:wrap;justify-content:center; }
```

## styles/01-foundation.css:179

```css
.hero-quote { max-width:280px;padding:20px 24px;background: rgba(255,255,255,0.03); border-left:2px solid rgba(255,255,255,.2);font-family:"Cormorant Garamond",serif;font-style:italic;font-size:15px;color:var(--muted);line-height:1.9;text-align:left; border-radius: 0 4px 4px 0; }
```

## styles/01-foundation.css:180

```css
.hero-quote cite { display:block;margin-top:10px;font-style:normal;font-size:12px;letter-spacing:2px;color:rgba(255,255,255,.4); }
```

## styles/01-foundation.css:182

```css
.doors-nav { display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-bottom:32px;position:relative; z-index: 10; }
```

## styles/01-foundation.css:183

```css
.door-btn { display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 20px; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,.15); border-radius: 6px; cursor:pointer;transition:all .35s;min-width:100px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
```

## styles/01-foundation.css:184

```css
.door-btn:hover { transform:translateY(-5px); box-shadow: 0 8px 24px rgba(0,0,0,0.5); background: rgba(255,255,255,0.08); }
```

## styles/01-foundation.css:185

```css
.door-btn .dl { font-family:"Cormorant Garamond",serif;font-size:36px;font-weight:600;line-height:1; transition: color 0.3s; }
```

## styles/01-foundation.css:186

```css
.door-btn .dz { font-size:13px;letter-spacing:2px;color:var(--fog); opacity: 0.9; font-weight:bold; }
```

## styles/01-foundation.css:187

```css
.door-btn .d-act { font-size:11px;letter-spacing:1px;color:var(--muted); opacity: 0.8; margin-top:2px; }
```

## styles/01-foundation.css:189

```css
.door-btn[data-d="E"] { border-color:rgba(123,143,161,.4); }
```

## styles/01-foundation.css:189

```css
.door-btn[data-d="E"]:hover { border-color:var(--e); box-shadow: 0 8px 20px rgba(123,143,161,.25); }
```

## styles/01-foundation.css:189

```css
.door-btn[data-d="E"] .dl { color:var(--e); }
```

## styles/01-foundation.css:190

```css
.door-btn[data-d="M"] { border-color:rgba(168,184,200,.4); }
```

## styles/01-foundation.css:190

```css
.door-btn[data-d="M"]:hover { border-color:var(--m); box-shadow: 0 8px 20px rgba(168,184,200,.25); }
```

## styles/01-foundation.css:190

```css
.door-btn[data-d="M"] .dl { color:var(--m); }
```

## styles/01-foundation.css:191

```css
.door-btn[data-d="P"] { border-color:rgba(201,168,76,.4); }
```

## styles/01-foundation.css:191

```css
.door-btn[data-d="P"]:hover { border-color:var(--p); box-shadow: 0 8px 20px rgba(201,168,76,.25); }
```

## styles/01-foundation.css:191

```css
.door-btn[data-d="P"] .dl { color:var(--p); }
```

## styles/01-foundation.css:192

```css
.door-btn[data-d="A"] { border-color:rgba(122,158,159,.4); }
```

## styles/01-foundation.css:192

```css
.door-btn[data-d="A"]:hover { border-color:var(--a); box-shadow: 0 8px 20px rgba(122,158,159,.25); }
```

## styles/01-foundation.css:192

```css
.door-btn[data-d="A"] .dl { color:var(--a); }
```

## styles/01-foundation.css:193

```css
.door-btn[data-d="T"] { border-color:rgba(232,168,124,.4); }
```

## styles/01-foundation.css:193

```css
.door-btn[data-d="T"]:hover { border-color:var(--t); box-shadow: 0 8px 20px rgba(232,168,124,.25); }
```

## styles/01-foundation.css:193

```css
.door-btn[data-d="T"] .dl { color:var(--t); }
```

## styles/01-foundation.css:194

```css
.door-btn[data-d="H"] { border-color:rgba(242,232,217,.4); }
```

## styles/01-foundation.css:194

```css
.door-btn[data-d="H"]:hover { border-color:var(--h); box-shadow: 0 8px 20px rgba(242,232,217,.25); }
```

## styles/01-foundation.css:194

```css
.door-btn[data-d="H"] .dl { color:var(--h); }
```

## styles/01-foundation.css:196

```css
.flow-line { font-family:"Noto Serif TC",serif;font-size:12px;letter-spacing:4px;color:var(--muted);position:relative;margin-bottom:20px; font-weight:bold; }
```

## styles/02-room-foundations.css:308

```css
footer { padding:48px 40px 32px;border-top:1px solid rgba(255,255,255,.12); background: rgba(5,12,18,0.95); display:flex; flex-direction:column; align-items:center; }
```

## styles/02-room-foundations.css:309

```css
.footer-main { width:100%; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; margin-bottom:40px; }
```

## styles/02-room-foundations.css:310

```css
.footer-left { font-family:"Cormorant Garamond",serif;font-style:italic;font-size:18px;color:rgba(255,255,255,.7);letter-spacing:2px; }
```

## styles/02-room-foundations.css:311

```css
.footer-right { font-size:12px;color:rgba(255,255,255,.6);letter-spacing:3px; font-weight:bold; }
```

## styles/02-room-foundations.css:312

```css
.footer-letters { display:flex;gap:10px; }
```

## styles/02-room-foundations.css:313

```css
.footer-l { font-family:"Cormorant Garamond",serif;font-size:16px;opacity:.6;letter-spacing:2px; }
```

## styles/02-room-foundations.css:314

```css
.footer-copy { width:100%; text-align:center; padding-top:28px; border-top:1px dashed rgba(255,255,255,0.15); font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:2px; font-family:"Noto Sans TC",sans-serif; }
```

## styles/03-effects-and-accessibility.css:106
@media (max-width:768px)
```css
nav { padding: 16px 20px; }
```

## styles/03-effects-and-accessibility.css:106
@media (max-width:768px)
```css
.nav-logo { font-size: 22px; }
```

## styles/03-effects-and-accessibility.css:106
@media (max-width:768px)
```css
.hamburger { display: flex; }
```

## styles/03-effects-and-accessibility.css:107
@media (max-width:768px)
```css
.nav-menu { position: absolute; top: 100%; left: 0; right: 0; background: #03070a; flex-direction: column; padding: 24px; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.8); transform: translateY(-150%); opacity: 0; pointer-events: none; }
```

## styles/03-effects-and-accessibility.css:108
@media (max-width:768px)
```css
.nav-menu.show { transform: translateY(0); opacity: 1; pointer-events: auto; }
```

## styles/03-effects-and-accessibility.css:109
@media (max-width:768px)
```css
.nav-letters { flex-wrap: wrap; justify-content: center; width: 100%; gap: 12px; }
```

## styles/03-effects-and-accessibility.css:109
@media (max-width:768px)
```css
.nav-controls { justify-content: center; width: 100%; }
```

## styles/03-effects-and-accessibility.css:110
@media (max-width:768px)
```css
.hsp-first-visit-tooltip { right: 50%; transform: translateX(50%); top: 56px; font-size:12px; padding: 12px 30px 12px 16px; }
```

## styles/03-effects-and-accessibility.css:111
@media (max-width:768px)
```css
.hsp-first-visit-tooltip::before { right: 50%; transform: translateX(50%) rotate(45deg); }
```

## styles/03-effects-and-accessibility.css:112
@media (max-width:768px)
```css
#hero { justify-content: flex-start; padding-top: 150px; }
```

## styles/03-effects-and-accessibility.css:113
@media (max-width:768px)
```css
.hero-title { font-size: 15vw; letter-spacing: 10px; margin-top: 4vh; margin-bottom: 20px; }
```

## styles/03-effects-and-accessibility.css:114
@media (max-width:768px)
```css
.hero-bg-text { font-size: 34vw; top: 45%; }
```

## styles/03-effects-and-accessibility.css:114
@media (max-width:768px)
```css
.hero-sub { font-size: 14px; margin-bottom: 36px; }
```

## styles/03-effects-and-accessibility.css:114
@media (max-width:768px)
```css
.hero-desc { margin-bottom: 40px; }
```

## styles/03-effects-and-accessibility.css:117
@media (max-width:768px)
```css
.hero-quotes { display: none; flex-direction: column; gap: 20px; margin-bottom: 40px; }
```

## styles/03-effects-and-accessibility.css:118
@media (max-width:768px)
```css
.hero-quotes.show-quotes { display: flex; animation: fadeSlideIn 0.5s ease; }
```

## styles/03-effects-and-accessibility.css:119
@media (max-width:768px)
```css
#hero-quotes-toggle { display: inline-flex !important; margin: 0 auto 36px; align-items: center; }
```

## styles/03-effects-and-accessibility.css:126
@media (max-width:768px)
```css
.door-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 6px 15px rgba(0,0,0,0.4); }
```

## styles/03-effects-and-accessibility.css:128
@media (max-width:768px)
```css
.door-btn:active, .send-btn:active, .action-btn:active, .shard:active, .nav-letter:active { transform: scale(0.95) !important; background: rgba(255,255,255,0.15) !important; box-shadow: none !important; transition: all 0.1s !important; }
```

## styles/03-effects-and-accessibility.css:133
@media (max-width:480px)
```css
.hero-title { font-size: 17vw; letter-spacing: 6px; }
```

## styles/03-effects-and-accessibility.css:133
@media (max-width:480px)
```css
.doors-nav { gap: 10px; }
```

## styles/03-effects-and-accessibility.css:133
@media (max-width:480px)
```css
.door-btn { padding: 16px 10px; min-width: 80px; }
```

## styles/03-effects-and-accessibility.css:134
@media (max-width:480px)
```css
.door-btn .dl { font-size: 28px; }
```

## styles/03-effects-and-accessibility.css:134
@media (max-width:480px)
```css
.door-btn .dz { font-size: 12px; }
```

## styles/03-effects-and-accessibility.css:184

```css
body.night-mode .hero-bg-text { opacity: 0.01; }
```

## styles/03-effects-and-accessibility.css:253

```css
.door-btn { padding: 24px; }
```

## styles/03-effects-and-accessibility.css:302

```css
:where(#creator-btn, #fortune-spark, #breathe-btn) { min-width: 44px !important;
  min-height: 44px !important; }
```

## styles/03-effects-and-accessibility.css:307

```css
:where(.room-back-lobby, .nav-utility-toggle, .footer-privacy-btn, footer a) { min-height: 44px;
  display: inline-flex;
  align-items: center; }
```

## styles/03-effects-and-accessibility.css:349

```css
body.hsp-mode :where(.room-desc, .e-mode-hint, .daily-local-note, .cosmic-presence, .h-event, footer) { color: rgba(232,230,225,.78) !important; }
```

## styles/04-page-and-art-direction.css:11

```css
html.empath-room-page #hero,
html.empath-room-page #room-e,
html.empath-room-page #room-m,
html.empath-room-page #room-p,
html.empath-room-page #room-a,
html.empath-room-page #room-t,
html.empath-room-page #room-h { display: none !important; }
```

## styles/04-page-and-art-direction.css:30

```css
html.empath-room-page .nav-logo::after { content: " / ROOM";
  margin-left: 10px;
  color: rgba(255,255,255,.3);
  font-size: 9px;
  letter-spacing: .18em; }
```

## styles/04-page-and-art-direction.css:37

```css
html.empath-room-page .nav-letter[aria-current="page"] { border-color: currentColor;
  background: rgba(255,255,255,.09);
  box-shadow: 0 0 18px rgba(201,168,76,.13); }
```

## styles/04-page-and-art-direction.css:79
@media (max-width: 760px)
```css
html.empath-room-page .nav-logo::after { display: none; }
```

## styles/04-page-and-art-direction.css:105

```css
#hero { display:block; min-height:0; padding:0; text-align:left;
  background:#03070d; isolation:isolate; overflow:hidden; }
```

## styles/04-page-and-art-direction.css:109

```css
.cinematic-sky { position:absolute;inset:0 0 auto;height:100vh;min-height:720px;overflow:hidden;pointer-events:none;z-index:-1;background:linear-gradient(180deg,#03070d 0%,#07111f 52%,#03070d 100%); }
```

## styles/04-page-and-art-direction.css:110

```css
.cinematic-nebula { position:absolute;inset:-20%;background:radial-gradient(ellipse at 72% 34%,rgba(64,86,125,.25),transparent 34%),radial-gradient(ellipse at 25% 60%,rgba(39,61,91,.18),transparent 38%);filter:blur(20px); }
```

## styles/04-page-and-art-direction.css:111

```css
.cinematic-stars { position:absolute;inset:0;background-repeat:repeat;opacity:.7; }
```

## styles/04-page-and-art-direction.css:112

```css
.cinematic-stars-a { background-image:radial-gradient(circle,rgba(255,255,255,.9) 0 1px,transparent 1.5px);background-size:93px 87px;animation:cinemaDrift 42s linear infinite; }
```

## styles/04-page-and-art-direction.css:113

```css
.cinematic-stars-b { background-image:radial-gradient(circle,rgba(201,168,76,.8) 0 1px,transparent 1.4px);background-size:167px 149px;background-position:38px 21px;opacity:.36;animation:cinemaDrift 64s linear infinite reverse; }
```

## styles/04-page-and-art-direction.css:114

```css
.cinematic-vignette { position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 32%,rgba(0,0,0,.58) 100%); }
```

## styles/04-page-and-art-direction.css:115

```css
.cinematic-grain { position:absolute;inset:0;opacity:.055;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.88' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");mix-blend-mode:screen; }
```

## styles/04-page-and-art-direction.css:117

```css
.hero-opening { height:100vh;min-height:720px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:120px 32px 72px;position:relative; }
```

## styles/04-page-and-art-direction.css:118

```css
.hero-kicker,.journey-index,.manifesto-label { font-size:10px;letter-spacing:.42em;color:rgba(232,230,225,.48);font-weight:400; }
```

## styles/04-page-and-art-direction.css:119

```css
.hero-opening .hero-bg-text { font-size:min(26vw,360px);top:48%;color:rgba(255,255,255,.018); }
```

## styles/04-page-and-art-direction.css:120

```css
.hero-opening .hero-title { font-size:clamp(76px,13vw,176px);font-weight:300;letter-spacing:.19em;line-height:.82;margin:0 0 30px;text-indent:.19em;text-shadow:0 0 60px rgba(150,180,220,.14); }
```

## styles/04-page-and-art-direction.css:121

```css
.hero-opening .hero-sub { font-size:clamp(13px,1.5vw,19px);letter-spacing:.32em;margin:0 0 48px;color:rgba(225,205,147,.9); }
```

## styles/04-page-and-art-direction.css:122

```css
.hero-lead { max-width:620px;font-family:"Noto Serif TC",serif;font-size:clamp(15px,1.5vw,18px);line-height:2.2;letter-spacing:.12em;color:rgba(242,232,217,.76); }
```

## styles/04-page-and-art-direction.css:123

```css
.hero-actions { display:flex;align-items:center;gap:18px;margin-top:44px;position:relative;z-index:2; }
```

## styles/04-page-and-art-direction.css:124

```css
.cinema-cta { height:52px;padding:0 30px;border:1px solid rgba(255,255,255,.2);background:transparent;color:rgba(253,252,248,.86);font:400 12px "Noto Sans TC",sans-serif;letter-spacing:.2em;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:.45s ease; }
```

## styles/04-page-and-art-direction.css:125

```css
.cinema-cta-primary { border-color:rgba(201,168,76,.58);background:rgba(201,168,76,.08); }
```

## styles/04-page-and-art-direction.css:126

```css
.cinema-cta:hover { border-color:rgba(255,255,255,.72);background:rgba(255,255,255,.08);transform:translateY(-2px); }
```

## styles/04-page-and-art-direction.css:127

```css
.opening-scroll { position:absolute;bottom:30px;font-size:9px;letter-spacing:.34em;color:rgba(255,255,255,.34);display:flex;flex-direction:column;align-items:center;gap:12px; }
```

## styles/04-page-and-art-direction.css:128

```css
.opening-scroll i { display:block;width:1px;height:34px;background:linear-gradient(var(--gold),transparent);animation:pulse 2.6s infinite; }
```

## styles/04-page-and-art-direction.css:129

```css
#hero .onboarding-box { display:none;position:fixed;z-index:1500;left:50%;top:50%;transform:translate(-50%,-50%);max-height:min(82vh,760px);overflow:auto;margin:0;background:rgba(4,9,15,.97);border:1px solid rgba(201,168,76,.34);box-shadow:0 30px 100px rgba(0,0,0,.8);backdrop-filter:blur(24px); }
```

## styles/04-page-and-art-direction.css:130

```css
#hero .onboarding-box.is-open { display:flex; }
```

## styles/04-page-and-art-direction.css:131

```css
.journey-map { position:relative;padding:120px max(32px,7vw) 112px;background:linear-gradient(180deg,#03070d,#07111b 48%,#04080e);border-top:1px solid rgba(255,255,255,.06); }
```

## styles/04-page-and-art-direction.css:132

```css
.journey-heading { max-width:760px;margin-bottom:72px; }
```

## styles/04-page-and-art-direction.css:133

```css
.journey-heading h2 { font-family:"Noto Serif TC",serif;font-size:clamp(32px,4.6vw,62px);font-weight:300;letter-spacing:.08em;color:var(--white);margin:18px 0 22px; }
```

## styles/04-page-and-art-direction.css:134

```css
.journey-heading>p:last-child { font-family:"Noto Serif TC",serif;font-size:15px;line-height:2;color:rgba(232,230,225,.56);letter-spacing:.08em; }
```

## styles/04-page-and-art-direction.css:135

```css
.journey-acts { max-width:1180px;margin:0 auto; }
```

## styles/04-page-and-art-direction.css:136

```css
.journey-act { display:grid;grid-template-columns:180px 1fr;gap:48px;padding:44px 0;border-top:1px solid rgba(255,255,255,.1); }
```

## styles/04-page-and-art-direction.css:137

```css
.journey-act:last-child { border-bottom:1px solid rgba(255,255,255,.1); }
```

## styles/04-page-and-art-direction.css:138

```css
.act-meta { display:flex;flex-direction:column;gap:12px;padding-top:8px; }
```

## styles/04-page-and-art-direction.css:139

```css
.act-meta span { font-family:"Cormorant Garamond",serif;font-size:12px;letter-spacing:.3em;color:var(--gold); }
```

## styles/04-page-and-art-direction.css:140

```css
.act-meta strong { font-family:"Noto Serif TC",serif;font-size:15px;letter-spacing:.18em;color:rgba(255,255,255,.68);font-weight:400; }
```

## styles/04-page-and-art-direction.css:141

```css
.act-rooms { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px; }
```

## styles/04-page-and-art-direction.css:142

```css
#hero .door-btn { min-width:0;min-height:174px;display:grid;grid-template-columns:52px 72px 1fr 24px;align-items:center;gap:12px;padding:28px;background:rgba(255,255,255,.018);border:1px solid rgba(255,255,255,.09);border-radius:0;box-shadow:none;text-align:left;position:relative;overflow:hidden; }
```

## styles/04-page-and-art-direction.css:143

```css
#hero .door-btn::before { content:"";position:absolute;inset:0;background:radial-gradient(circle at 76% 40%,rgba(255,255,255,.08),transparent 44%);opacity:0;transition:.5s; }
```

## styles/04-page-and-art-direction.css:144

```css
#hero .door-btn:hover { transform:translateY(-3px);background:rgba(255,255,255,.035);border-color:rgba(201,168,76,.42);box-shadow:0 20px 50px rgba(0,0,0,.32); }
```

## styles/04-page-and-art-direction.css:145

```css
#hero .door-btn:hover::before { opacity:1; }
```

## styles/04-page-and-art-direction.css:146

```css
#hero .door-btn .room-no { align-self:start;font:300 11px "Cormorant Garamond",serif;letter-spacing:.2em;color:rgba(255,255,255,.3); }
```

## styles/04-page-and-art-direction.css:147

```css
#hero .door-btn .dl { font-size:58px;font-weight:300;text-align:center;opacity:.82; }
```

## styles/04-page-and-art-direction.css:148

```css
.door-copy { display:flex;flex-direction:column;gap:12px;position:relative;z-index:1; }
```

## styles/04-page-and-art-direction.css:149

```css
.door-copy b { font-family:"Noto Serif TC",serif;font-size:17px;font-weight:400;letter-spacing:.12em;color:rgba(255,255,255,.9); }
```

## styles/04-page-and-art-direction.css:150

```css
.door-copy small { font-size:12px;font-weight:300;line-height:1.7;letter-spacing:.08em;color:rgba(255,255,255,.42); }
```

## styles/04-page-and-art-direction.css:151

```css
.door-arrow { font-size:16px;color:rgba(255,255,255,.3);transition:.4s; }
```

## styles/04-page-and-art-direction.css:152

```css
#hero .door-btn:hover .door-arrow { color:var(--gold);transform:translate(3px,-3px); }
```

## styles/04-page-and-art-direction.css:153

```css
.journey-map .flow-line { text-align:center;margin:72px 0 0;font-weight:300;color:rgba(255,255,255,.32); }
```

## styles/04-page-and-art-direction.css:154

```css
.hero-manifesto { padding:104px max(32px,10vw);background:#03070a;border-top:1px solid rgba(255,255,255,.05); }
```

## styles/04-page-and-art-direction.css:155

```css
.hero-manifesto .hero-desc { margin:24px 0 54px;max-width:760px;font-family:"Noto Serif TC",serif;font-size:clamp(22px,3vw,38px);font-weight:300;line-height:1.65;letter-spacing:.08em;color:rgba(255,255,255,.82); }
```

## styles/04-page-and-art-direction.css:156

```css
.hero-manifesto .hero-desc span { display:block; }
```

## styles/04-page-and-art-direction.css:157

```css
.hero-manifesto .hero-desc span+span { font-size:.48em;margin-top:18px;color:rgba(255,255,255,.4); }
```

## styles/04-page-and-art-direction.css:158

```css
.hero-manifesto .hero-quotes { justify-content:flex-start;gap:56px;margin:0; }
```

## styles/04-page-and-art-direction.css:159

```css
.hero-manifesto .hero-quote { max-width:420px;padding:0 0 0 24px;background:none;border-left:1px solid rgba(201,168,76,.34);font-size:14px;color:rgba(255,255,255,.46); }
```

## styles/04-page-and-art-direction.css:162
@media (max-width:900px)
```css
.journey-act { grid-template-columns:1fr;gap:24px; }
```

## styles/04-page-and-art-direction.css:163
@media (max-width:900px)
```css
.act-meta { flex-direction:row;align-items:center; }
```

## styles/04-page-and-art-direction.css:164
@media (max-width:900px)
```css
#hero .door-btn { grid-template-columns:40px 58px 1fr 20px;padding:22px; }
```

## styles/04-page-and-art-direction.css:165
@media (max-width:900px)
```css
#hero .door-btn .dl { font-size:48px; }
```

## styles/04-page-and-art-direction.css:169
@media (max-width:680px)
```css
.hero-opening { min-height:680px;padding:108px 22px 64px; }
```

## styles/04-page-and-art-direction.css:170
@media (max-width:680px)
```css
.hero-opening .hero-title { font-size:clamp(52px,18vw,82px);letter-spacing:.12em;text-indent:.12em; }
```

## styles/04-page-and-art-direction.css:171
@media (max-width:680px)
```css
.hero-opening .hero-sub { letter-spacing:.18em;margin-bottom:36px; }
```

## styles/04-page-and-art-direction.css:172
@media (max-width:680px)
```css
.hero-lead { font-size:14px;max-width:330px; }
```

## styles/04-page-and-art-direction.css:173
@media (max-width:680px)
```css
.hero-actions { flex-direction:column;width:100%;max-width:320px;margin-top:34px; }
```

## styles/04-page-and-art-direction.css:174
@media (max-width:680px)
```css
.cinema-cta { width:100%; }
```

## styles/04-page-and-art-direction.css:175
@media (max-width:680px)
```css
.journey-map { padding:88px 20px; }
```

## styles/04-page-and-art-direction.css:176
@media (max-width:680px)
```css
.journey-heading { margin-bottom:54px; }
```

## styles/04-page-and-art-direction.css:177
@media (max-width:680px)
```css
.journey-heading h2 { font-size:32px; }
```

## styles/04-page-and-art-direction.css:178
@media (max-width:680px)
```css
.act-rooms { grid-template-columns:1fr; }
```

## styles/04-page-and-art-direction.css:179
@media (max-width:680px)
```css
.journey-act { padding:34px 0; }
```

## styles/04-page-and-art-direction.css:180
@media (max-width:680px)
```css
#hero .door-btn { min-height:142px;grid-template-columns:30px 46px 1fr 18px;padding:20px 16px; }
```

## styles/04-page-and-art-direction.css:181
@media (max-width:680px)
```css
#hero .door-btn .dl { font-size:42px; }
```

## styles/04-page-and-art-direction.css:182
@media (max-width:680px)
```css
.hero-manifesto { padding:80px 24px; }
```

## styles/04-page-and-art-direction.css:183
@media (max-width:680px)
```css
.hero-manifesto .hero-quotes { display:grid;gap:34px; }
```

## styles/04-page-and-art-direction.css:184
@media (max-width:680px)
```css
#hero .onboarding-box { width:calc(100% - 28px);padding:28px 18px; }
```

## styles/04-page-and-art-direction.css:209

```css
nav { padding:14px 42px;
  background:linear-gradient(180deg,rgba(2,6,10,.82),rgba(2,6,10,.42));
  border-bottom-color:rgba(255,255,255,.055);
  box-shadow:none;
  backdrop-filter:blur(18px) saturate(115%);
  transition:background .55s ease,border-color .55s ease,transform .55s ease; }
```

## styles/04-page-and-art-direction.css:217

```css
body:not(.page-scrolled) nav { background:linear-gradient(180deg,rgba(2,6,10,.72),transparent);border-bottom-color:transparent; }
```

## styles/04-page-and-art-direction.css:218

```css
.nav-logo { font-size:19px;font-weight:400;letter-spacing:7px;color:rgba(255,255,255,.88); }
```

## styles/04-page-and-art-direction.css:219

```css
.nav-menu { gap:26px; }
```

## styles/04-page-and-art-direction.css:220

```css
.nav-letters { gap:3px; }
```

## styles/04-page-and-art-direction.css:221

```css
.nav-letter { width:38px;height:38px;border-color:transparent;border-radius:0;
  font-size:14px;font-weight:400;color:rgba(255,255,255,.48)!important;
  position:relative;box-shadow:none!important; }
```

## styles/04-page-and-art-direction.css:226

```css
.nav-letter::after { content:"";position:absolute;left:12px;right:12px;bottom:2px;height:1px;background:var(--gold);transform:scaleX(0);transition:transform .35s ease; }
```

## styles/04-page-and-art-direction.css:227

```css
.nav-letter:hover { transform:none!important;background:transparent!important;color:rgba(255,255,255,.92)!important; }
```

## styles/04-page-and-art-direction.css:228

```css
.nav-letter:hover::after { transform:scaleX(1); }
```

## styles/04-page-and-art-direction.css:229

```css
.func-btn { height:36px;padding:0 14px;border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.025);font-size:11px;letter-spacing:.16em;color:rgba(255,255,255,.62); }
```

## styles/04-page-and-art-direction.css:230

```css
.func-btn:hover { background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.28); }
```

## styles/04-page-and-art-direction.css:232

```css
#creator-btn,#fortune-spark,#breathe-btn { transition:opacity .5s ease,transform .5s ease,filter .5s ease!important; }
```

## styles/04-page-and-art-direction.css:233

```css
body:not(.page-scrolled) #creator-btn,
body:not(.page-scrolled) #fortune-spark,
body:not(.page-scrolled) #breathe-btn { opacity:0!important;pointer-events:none;transform:translateY(8px) scale(.92)!important; }
```

## styles/04-page-and-art-direction.css:236

```css
body.page-scrolled #creator-btn,
body.page-scrolled #fortune-spark,
body.page-scrolled #breathe-btn { opacity:.42; }
```

## styles/04-page-and-art-direction.css:240

```css
.hero-opening::after { content:"";position:absolute;left:50%;bottom:0;width:min(820px,78vw);height:1px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(201,168,76,.26),transparent); }
```

## styles/04-page-and-art-direction.css:241

```css
.hero-opening .hero-title { color:rgba(255,255,255,.94);text-shadow:0 0 80px rgba(128,165,215,.12),0 8px 35px rgba(0,0,0,.45); }
```

## styles/04-page-and-art-direction.css:242

```css
.cinema-cta { position:relative;overflow:hidden; }
```

## styles/04-page-and-art-direction.css:243

```css
.cinema-cta::before { content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.12) 50%,transparent 70%);transform:translateX(-130%);transition:transform .8s ease; }
```

## styles/04-page-and-art-direction.css:244

```css
.cinema-cta:hover::before { transform:translateX(130%); }
```

## styles/04-page-and-art-direction.css:246

```css
.journey-map::before { content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0 7%,rgba(255,255,255,.018) 7% 7.08%,transparent 7.08% 93%,rgba(255,255,255,.018) 93% 93.08%,transparent 93.08%); }
```

## styles/04-page-and-art-direction.css:247

```css
.journey-act { position:relative; }
```

## styles/04-page-and-art-direction.css:248

```css
.journey-act::before { content:"";position:absolute;left:0;top:-1px;width:56px;height:1px;background:var(--gold);opacity:.5; }
```

## styles/04-page-and-art-direction.css:249

```css
#hero .door-btn { backdrop-filter:blur(5px);transition:transform .5s cubic-bezier(.2,.8,.2,1),border-color .5s ease,background .5s ease,box-shadow .5s ease; }
```

## styles/04-page-and-art-direction.css:250

```css
#hero .door-btn::after { content:"";position:absolute;left:0;top:0;bottom:0;width:1px;background:linear-gradient(transparent,var(--gold),transparent);opacity:0;transition:opacity .45s; }
```

## styles/04-page-and-art-direction.css:251

```css
#hero .door-btn:hover::after { opacity:.8; }
```

## styles/04-page-and-art-direction.css:252

```css
#hero .door-btn[data-d="E"],#hero .door-btn[data-d="M"] { background-color:rgba(115,145,180,.018); }
```

## styles/04-page-and-art-direction.css:253

```css
#hero .door-btn[data-d="P"],#hero .door-btn[data-d="A"] { background-color:rgba(201,168,76,.015); }
```

## styles/04-page-and-art-direction.css:254

```css
#hero .door-btn[data-d="T"],#hero .door-btn[data-d="H"] { background-color:rgba(232,190,155,.014); }
```

## styles/04-page-and-art-direction.css:256

```css
#hero.guide-active { z-index:1400;overflow:visible; }
```

## styles/04-page-and-art-direction.css:263

```css
#hero .onboarding-box { display:none;position:fixed;z-index:1500;
  inset:76px 24px 24px;top:auto;left:auto;transform:none!important;
  width:min(680px,calc(100vw - 32px));height:max-content;
  max-height:calc(100dvh - 100px);margin:auto;
  overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;
  padding:42px 34px 38px;
  animation:none!important;
  background:linear-gradient(145deg,rgba(8,15,25,.985),rgba(3,8,14,.985));
  border:1px solid rgba(201,168,76,.28);
  box-shadow:0 40px 120px rgba(0,0,0,.82),inset 0 1px rgba(255,255,255,.04); }
```

## styles/04-page-and-art-direction.css:275

```css
#hero .onboarding-box.is-open { display:flex; }
```

## styles/04-page-and-art-direction.css:285

```css
#hero .onboarding-box .ob-options { padding-bottom:12px; }
```

## styles/04-page-and-art-direction.css:286

```css
#hero .onboarding-box .ob-btn { background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.12);font-weight:300;text-align:left; }
```

## styles/04-page-and-art-direction.css:287

```css
#hero .onboarding-box .ob-btn:hover { background:rgba(201,168,76,.07);border-color:rgba(201,168,76,.42);transform:translateX(3px); }
```

## styles/04-page-and-art-direction.css:290
@media (max-width:768px)
```css
nav { padding:12px 18px; }
```

## styles/04-page-and-art-direction.css:291
@media (max-width:768px)
```css
.nav-logo { font-size:17px;letter-spacing:5px; }
```

## styles/04-page-and-art-direction.css:292
@media (max-width:768px)
```css
#hero .onboarding-box { inset:68px 14px 14px;width:calc(100vw - 28px);max-height:calc(100dvh - 82px);padding:36px 18px 28px; }
```

## styles/04-page-and-art-direction.css:297

```css
nav { min-height:74px;padding:15px 38px; }
```

## styles/04-page-and-art-direction.css:298

```css
.nav-logo { font-size:22px;letter-spacing:7.5px; }
```

## styles/04-page-and-art-direction.css:299

```css
.nav-menu { gap:32px; }
```

## styles/04-page-and-art-direction.css:300

```css
.nav-letters { gap:5px; }
```

## styles/04-page-and-art-direction.css:301

```css
.nav-letter { width:44px;height:44px;font-size:16px; }
```

## styles/04-page-and-art-direction.css:302

```css
.nav-letter::after { left:13px;right:13px;bottom:1px; }
```

## styles/04-page-and-art-direction.css:303

```css
.nav-controls { gap:10px; }
```

## styles/04-page-and-art-direction.css:304

```css
.func-btn { height:42px;padding:0 17px;font-size:12px;letter-spacing:.14em; }
```

## styles/04-page-and-art-direction.css:305

```css
.lang-dropdown-list { top:52px; }
```

## styles/04-page-and-art-direction.css:307

```css
.cinematic-sky { --lens-x:50%;--lens-y:42%;--depth-x:0px;--depth-y:0px; }
```

## styles/04-page-and-art-direction.css:308

```css
.cinematic-nebula { transform:translate3d(var(--depth-x),var(--depth-y),0) scale(1.04);transition:transform .6s cubic-bezier(.2,.8,.2,1); }
```

## styles/04-page-and-art-direction.css:309

```css
.cinematic-lens { position:absolute;inset:0;background:radial-gradient(420px circle at var(--lens-x) var(--lens-y),rgba(128,164,211,.11),rgba(52,78,114,.035) 35%,transparent 72%);mix-blend-mode:screen;opacity:.9; }
```

## styles/04-page-and-art-direction.css:310

```css
.cinematic-meteor { position:absolute;width:150px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.82),transparent);filter:drop-shadow(0 0 5px rgba(170,205,255,.72));opacity:0;transform:rotate(-28deg);pointer-events:none; }
```

## styles/04-page-and-art-direction.css:311

```css
.cinematic-meteor::after { content:"";position:absolute;right:7px;top:-1px;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 10px 3px rgba(185,213,255,.8); }
```

## styles/04-page-and-art-direction.css:312

```css
.cinematic-meteor-one { top:22%;left:72%;animation:meteorPass 12s ease-in-out 2.5s infinite; }
```

## styles/04-page-and-art-direction.css:313

```css
.cinematic-meteor-two { top:58%;left:18%;transform:rotate(-20deg) scale(.72);animation:meteorPassTwo 17s ease-in-out 8s infinite; }
```

## styles/04-page-and-art-direction.css:317

```css
.hero-opening .hero-title { transition:letter-spacing .9s cubic-bezier(.2,.8,.2,1),text-shadow .9s ease; }
```

## styles/04-page-and-art-direction.css:318

```css
.hero-opening:hover .hero-title { letter-spacing:.205em;text-shadow:0 0 90px rgba(135,177,230,.18),0 8px 35px rgba(0,0,0,.45); }
```

## styles/04-page-and-art-direction.css:319

```css
.hero-lead::before,.hero-lead::after { content:"✦";display:inline-block;margin:0 14px;color:rgba(201,168,76,.38);font-size:8px;vertical-align:middle; }
```

## styles/04-page-and-art-direction.css:321

```css
body.visual-ready .journey-heading,
body.visual-ready .journey-act,
body.visual-ready .hero-manifesto>* { opacity:0;transform:translateY(32px);filter:blur(5px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.8,.2,1),filter .9s ease; }
```

## styles/04-page-and-art-direction.css:324

```css
body.visual-ready .journey-heading.is-revealed,
body.visual-ready .journey-act.is-revealed,
body.visual-ready .hero-manifesto>*.is-revealed { opacity:1;transform:translateY(0);filter:blur(0); }
```

## styles/04-page-and-art-direction.css:327

```css
body.visual-ready .journey-act:nth-child(2) { transition-delay:.08s; }
```

## styles/04-page-and-art-direction.css:328

```css
body.visual-ready .journey-act:nth-child(3) { transition-delay:.16s; }
```

## styles/04-page-and-art-direction.css:330

```css
#hero .door-btn { --card-x:75%;--card-y:40%; }
```

## styles/04-page-and-art-direction.css:331

```css
#hero .door-btn::before { background:radial-gradient(260px circle at var(--card-x) var(--card-y),rgba(255,255,255,.115),rgba(201,168,76,.022) 38%,transparent 72%);opacity:.22; }
```

## styles/04-page-and-art-direction.css:332

```css
#hero .door-btn:hover::before { opacity:1; }
```

## styles/04-page-and-art-direction.css:333

```css
#hero .door-btn .dl { transition:transform .6s cubic-bezier(.2,.8,.2,1),text-shadow .6s ease,opacity .6s ease; }
```

## styles/04-page-and-art-direction.css:334

```css
#hero .door-btn:hover .dl { transform:translateY(-3px) scale(1.04);text-shadow:0 0 28px currentColor;opacity:1; }
```

## styles/04-page-and-art-direction.css:337
@media (max-width:900px)
```css
nav { min-height:68px;padding:12px 20px; }
```

## styles/04-page-and-art-direction.css:338
@media (max-width:900px)
```css
.nav-logo { font-size:20px;letter-spacing:6px; }
```

## styles/04-page-and-art-direction.css:341
@media (max-width:768px)
```css
nav { min-height:64px;padding:10px 18px; }
```

## styles/04-page-and-art-direction.css:342
@media (max-width:768px)
```css
.nav-logo { font-size:20px; }
```

## styles/04-page-and-art-direction.css:343
@media (max-width:768px)
```css
.hamburger { padding:10px; }
```

## styles/04-page-and-art-direction.css:344
@media (max-width:768px)
```css
.hamburger span { width:27px; }
```

## styles/04-page-and-art-direction.css:345
@media (max-width:768px)
```css
.cinematic-lens { display:none; }
```

## styles/04-page-and-art-direction.css:346
@media (max-width:768px)
```css
.hero-lead::before,.hero-lead::after { display:none; }
```

## styles/04-page-and-art-direction.css:349
@media (prefers-reduced-motion:reduce)
```css
.cinematic-meteor { display:none; }
```

## styles/04-page-and-art-direction.css:350
@media (prefers-reduced-motion:reduce)
```css
body.visual-ready .journey-heading,
  body.visual-ready .journey-act,
  body.visual-ready .hero-manifesto>* { opacity:1;transform:none;filter:none; }
```

## styles/05-editorial-and-microdetails.css:58

```css
.hero-title,
.room-title,
.wrapped-title { font-family: "Cormorant Garamond", "Noto Serif TC", serif !important; }
```

## styles/05-editorial-and-microdetails.css:115

```css
.send-btn,
.door-btn,
.action-btn,
.sync-btn-small { font-family: "Noto Sans TC", sans-serif !important;
    font-size: 12px !important;
    font-weight: 400 !important;
    line-height: 1 !important;
    letter-spacing: 0.2em !important; }
```

## styles/05-editorial-and-microdetails.css:125

```css
.e-tool-btn,
.echo-btn,
.func-btn { font-size: 11px !important;
    font-weight: 400 !important;
    letter-spacing: 0.14em !important; }
```

## styles/05-editorial-and-microdetails.css:134

```css
.lang-dropdown-list,
.hsp-first-visit-tooltip,
.onboarding-box,
.ob-btn,
.door-btn,
#e-draw-canvas,
.star-tooltip,
.a-warning-mask,
.t-panel,
.t-send-panel,
.j-card,
.g-card,
.sync-box,
.lighthouse,
.action-btn,
.wrapped-card,
.close-modal-btn,
.toast { border-radius: 2px !important; }
```

## styles/05-editorial-and-microdetails.css:189

```css
.send-btn,
.door-btn,
.action-btn,
.ob-btn,
.sync-btn-small,
.e-mode-btn,
.e-tool-btn,
.echo-btn,
.func-btn { transition:
        color 320ms ease,
        background-color 320ms ease,
        border-color 320ms ease,
        opacity 320ms ease,
        transform 320ms cubic-bezier(.22,.61,.36,1) !important; }
```

## styles/05-editorial-and-microdetails.css:228

```css
.send-btn:hover,
.door-btn:hover,
.action-btn:hover { transform: translateY(-1px) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important; }
```

## styles/05-editorial-and-microdetails.css:383

```css
.hero-bg-text { will-change:transform !important;
    backface-visibility:hidden !important;
    transform:translate3d(-50%,calc(-50% + var(--hero-parallax-y,0px)),0) !important; }
```

## styles/05-editorial-and-microdetails.css:390

```css
.send-btn,.door-btn { --magnetic-x:0px;
    --magnetic-y:0px;
    transform:translate3d(var(--magnetic-x),var(--magnetic-y),0) !important;
    transition:transform 650ms cubic-bezier(.23,1,.32,1),
               color 320ms ease,background-color 320ms ease,
               border-color 320ms ease,box-shadow 400ms ease !important;
    will-change:transform !important; }
```

## styles/05-editorial-and-microdetails.css:399

```css
.send-btn.is-magnetic,.door-btn.is-magnetic { transition:transform 90ms linear,color 320ms ease,
               background-color 320ms ease,border-color 320ms ease,
               box-shadow 400ms ease !important; }
```

## styles/05-editorial-and-microdetails.css:479
@media (max-width:768px)
```css
.hero-bg-text { --hero-parallax-y:0px !important }
```

## styles/05-editorial-and-microdetails.css:481
@media (max-width:768px)
```css
.send-btn,.door-btn { --magnetic-x:0px !important;--magnetic-y:0px !important }
```

## styles/05-editorial-and-microdetails.css:488
@media (prefers-reduced-motion:reduce)
```css
.hero-bg-text { --hero-parallax-y:0px !important }
```

## styles/05-editorial-and-microdetails.css:489
@media (prefers-reduced-motion:reduce)
```css
.send-btn,.door-btn { --magnetic-x:0px !important;--magnetic-y:0px !important;
        transition:none !important; }
```

## styles/05-editorial-and-microdetails.css:645

```css
body,
body .room,
body nav,
body .room-desc,
body .room-title,
body .send-btn,
body .door-btn { transition-duration:1.5s !important;
    transition-timing-function:cubic-bezier(.23,1,.32,1) !important; }
```

## styles/06-concept-and-art-overrides.css:81

```css
body.empath-world-open #hero .hero-opening { animation:empathWorldUnfold 1500ms cubic-bezier(.23,1,.32,1) both !important; }
```

## styles/06-concept-and-art-overrides.css:90

```css
#hero .empath-living-field { position:absolute !important;
    inset:0 !important;
    width:100% !important;
    height:100% !important;
    z-index:1 !important;
    pointer-events:none !important;
    opacity:.72 !important;
    mix-blend-mode:screen !important; }
```

## styles/06-concept-and-art-overrides.css:100

```css
#hero .hero-opening { position:relative !important;
    z-index:2 !important; }
```

## styles/06-concept-and-art-overrides.css:178
@media (max-width:768px)
```css
#hero .empath-living-field { opacity:.48 !important; }
```

## styles/06-concept-and-art-overrides.css:188
@media (prefers-reduced-motion:reduce)
```css
#hero .empath-living-field { display:none !important; }
```

## styles/06-concept-and-art-overrides.css:189
@media (prefers-reduced-motion:reduce)
```css
body.empath-world-open #hero .hero-opening,
    body.empath-room-arrived .room:target > * { animation:none !important; }
```

## styles/06-concept-and-art-overrides.css:317

```css
#hero .hero-manifesto { display: none !important; }
```

## styles/06-concept-and-art-overrides.css:320

```css
#journey.journey-map { padding: 72px max(32px, 7vw) 80px !important; }
```

## styles/06-concept-and-art-overrides.css:323

```css
#journey .journey-heading { margin-bottom: 40px !important; }
```

## styles/06-concept-and-art-overrides.css:326

```css
#journey .journey-heading h2 { font-size: clamp(30px, 3.8vw, 50px) !important;
  margin: 12px 0 16px !important; }
```

## styles/06-concept-and-art-overrides.css:330

```css
#journey .journey-acts { display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 24px !important;
  max-width: 1180px !important; }
```

## styles/06-concept-and-art-overrides.css:336

```css
#journey .journey-act { display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 20px !important;
  padding: 24px 0 !important;
  align-content: start !important; }
```

## styles/06-concept-and-art-overrides.css:343

```css
#journey .act-meta { min-height: 52px !important; }
```

## styles/06-concept-and-art-overrides.css:346

```css
#journey .act-rooms { grid-template-columns: 1fr !important;
  gap: 12px !important; }
```

## styles/06-concept-and-art-overrides.css:350

```css
#journey .door-btn { min-height: 132px !important;
  grid-template-columns: 28px 50px 1fr 18px !important;
  padding: 18px !important; }
```

## styles/06-concept-and-art-overrides.css:355

```css
#journey .door-btn .dl { font-size: 42px !important; }
```

## styles/06-concept-and-art-overrides.css:358

```css
#journey .flow-line { grid-column: 1 / -1 !important;
  margin: 38px 0 0 !important; }
```

## styles/06-concept-and-art-overrides.css:494
@media (max-width: 980px)
```css
#journey .journey-acts { grid-template-columns: 1fr !important;
    gap: 0 !important; }
```

## styles/06-concept-and-art-overrides.css:498
@media (max-width: 980px)
```css
#journey .journey-act { grid-template-columns: 150px 1fr !important;
    gap: 28px !important; }
```

## styles/06-concept-and-art-overrides.css:502
@media (max-width: 980px)
```css
#journey .act-rooms { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
```

## styles/06-concept-and-art-overrides.css:510
@media (max-width: 680px)
```css
#journey.journey-map { padding: 64px 20px 72px !important; }
```

## styles/06-concept-and-art-overrides.css:513
@media (max-width: 680px)
```css
#journey .journey-act { grid-template-columns: 1fr !important;
    gap: 16px !important; }
```

## styles/06-concept-and-art-overrides.css:517
@media (max-width: 680px)
```css
#journey .act-rooms { grid-template-columns: 1fr !important; }
```

## styles/06-concept-and-art-overrides.css:587

```css
.nav-utility-toggle { width:92px;height:38px;padding:0;border:0;border-left:1px solid rgba(232,230,225,.12);
  background:transparent;color:rgba(232,230,225,.54);display:flex;align-items:center;justify-content:flex-end;gap:11px;
  font-family:"Cormorant Garamond",serif;font-size:10px;letter-spacing:.24em;cursor:pointer;position:relative;z-index:3;
  transition:color .35s ease!important; }
```

## styles/06-concept-and-art-overrides.css:593

```css
.nav-utility-toggle i { width:5px;height:5px;border:1px solid currentColor;border-radius:50%;transition:transform .45s cubic-bezier(.23,1,.32,1),background .35s ease!important }
```

## styles/06-concept-and-art-overrides.css:594

```css
.nav-utility-toggle:hover,.nav-utility-toggle[aria-expanded="true"] { color:var(--gold) }
```

## styles/06-concept-and-art-overrides.css:595

```css
.nav-utility-toggle[aria-expanded="true"] i { background:var(--gold);transform:scale(1.5) }
```

## styles/06-concept-and-art-overrides.css:596

```css
nav .nav-menu { position:relative }
```

## styles/06-concept-and-art-overrides.css:597

```css
nav .nav-controls { position:absolute!important;top:54px;right:0;min-width:310px;padding:14px!important;
  display:flex!important;justify-content:flex-end;gap:8px!important;
  background:rgba(3,7,10,.94);border:1px solid rgba(232,230,225,.09);box-shadow:0 24px 70px rgba(0,0,0,.42);
  backdrop-filter:blur(22px);opacity:0;visibility:hidden;transform:translateY(-8px);pointer-events:none;
  transition:opacity .28s ease,transform .42s cubic-bezier(.23,1,.32,1),visibility .28s!important; }
```

## styles/06-concept-and-art-overrides.css:604

```css
nav .nav-controls.is-open { opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto }
```

## styles/06-concept-and-art-overrides.css:605

```css
nav .nav-controls .func-btn { background:transparent!important;border-color:rgba(232,230,225,.1)!important }
```

## styles/06-concept-and-art-overrides.css:741
@media (max-width:900px)
```css
.nav-utility-toggle { display:none!important }
```

## styles/06-concept-and-art-overrides.css:741
@media (max-width:900px)
```css
nav .nav-controls { position:static!important;min-width:0!important;opacity:1!important;visibility:visible!important;transform:none!important;pointer-events:auto!important;background:transparent!important;border:0!important;box-shadow:none!important }
```

## styles/06-concept-and-art-overrides.css:769

```css
.aw-site-noise,.cinematic-stars-a,.cinematic-stars-b,.cinematic-meteor-one,.cinematic-meteor-two { animation:none!important }
```

## styles/06-concept-and-art-overrides.css:770

```css
.room .room-letter,.scroll-hint,.behance-float,.opening-scroll i,.warmth-pulse,.echo-heart,.lighthouse-flame,.presence-spark.show,.lux-input-spark::after { animation-play-state:paused!important }
```

## styles/06-concept-and-art-overrides.css:783

```css
.cosmic-presence { min-height:18px!important;margin:10px 0 0!important;
  color:rgba(232,230,225,.42)!important;font:400 10px/1.8 "Noto Sans TC",sans-serif!important;
  letter-spacing:.18em!important;text-align:center!important; }
```

## styles/06-concept-and-art-overrides.css:788

```css
.return-memory { position:absolute!important;left:50%!important;bottom:92px!important;z-index:3!important;
  width:min(88vw,680px)!important;margin:0!important;transform:translate(-50%,6px)!important;
  color:rgba(232,230,225,.3)!important;font:400 11px/1.8 "Noto Sans TC",sans-serif!important;
  letter-spacing:3px!important;text-align:center!important;opacity:0!important;pointer-events:none!important;
  transition:opacity 900ms ease,transform 900ms cubic-bezier(.23,1,.32,1)!important; }
```

## styles/06-concept-and-art-overrides.css:795

```css
.return-memory.is-visible { opacity:1!important;transform:translate(-50%,0)!important }
```

## styles/06-concept-and-art-overrides.css:796

```css
.return-memory.is-fading { opacity:0!important;transform:translate(-50%,-4px)!important }
```

## styles/06-concept-and-art-overrides.css:857

```css
.footer-farewell { margin:0 auto 48px!important;color:rgba(232,230,225,.62)!important;font:italic 400 clamp(20px,3vw,32px)/1.8 "Noto Serif TC",serif!important;letter-spacing:.12em!important;text-align:center!important;opacity:.25!important;transform:translateY(10px)!important;transition:opacity 1.2s ease,transform 1.2s cubic-bezier(.23,1,.32,1)!important }
```

## styles/06-concept-and-art-overrides.css:858

```css
footer.is-farewell-visible .footer-farewell { opacity:1!important;transform:none!important }
```

## styles/06-concept-and-art-overrides.css:860
@media (max-width:680px)
```css
.cosmic-presence { max-width:290px!important;letter-spacing:.1em!important }
```

## styles/06-concept-and-art-overrides.css:861
@media (max-width:680px)
```css
.return-memory { bottom:86px!important;width:82vw!important;letter-spacing:2px!important }
```

## styles/06-concept-and-art-overrides.css:870
@media (prefers-reduced-motion:reduce)
```css
.footer-farewell { opacity:1!important;transform:none!important;transition:none!important }
```

## styles/07-responsive-and-layout.css:8
@media (max-width:900px)
```css
nav { padding-left:max(18px,var(--empath-safe-left))!important;padding-right:max(18px,var(--empath-safe-right))!important;padding-top:max(10px,var(--empath-safe-top))!important }
```

## styles/07-responsive-and-layout.css:9
@media (max-width:900px)
```css
.nav-menu { max-height:calc(var(--empath-vh) - 64px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;padding-bottom:calc(24px + var(--empath-safe-bottom))!important }
```

## styles/07-responsive-and-layout.css:10
@media (max-width:900px)
```css
.nav-menu,.nav-letters,.nav-controls { max-width:100%!important;min-width:0!important }
```

## styles/07-responsive-and-layout.css:12
@media (max-width:900px)
```css
#hero,.room { width:100%!important;max-width:100%!important;overflow-x:clip!important }
```

## styles/07-responsive-and-layout.css:13
@media (max-width:900px)
```css
#hero { min-height:var(--empath-vh)!important }
```

## styles/07-responsive-and-layout.css:14
@media (max-width:900px)
```css
.hero-opening { height:auto!important;min-height:var(--empath-vh)!important;padding-top:calc(96px + var(--empath-safe-top))!important;padding-bottom:calc(64px + var(--empath-safe-bottom))!important }
```

## styles/07-responsive-and-layout.css:15
@media (max-width:900px)
```css
.cinematic-sky { height:var(--empath-vh)!important;min-height:0!important }
```

## styles/07-responsive-and-layout.css:16
@media (max-width:900px)
```css
.hero-opening>* { max-width:calc(100vw - 36px)!important }
```

## styles/07-responsive-and-layout.css:17
@media (max-width:900px)
```css
.hero-title { max-width:100%!important;overflow:visible!important;line-height:.92!important;word-break:normal!important }
```

## styles/07-responsive-and-layout.css:18
@media (max-width:900px)
```css
.hero-actions,.doors-nav,.journey-acts { width:100%!important;max-width:100%!important }
```

## styles/07-responsive-and-layout.css:19
@media (max-width:900px)
```css
.opening-scroll { bottom:calc(18px + var(--empath-safe-bottom))!important }
```

## styles/07-responsive-and-layout.css:69
@media (max-width:900px)
```css
#creator-btn { left:max(16px,var(--empath-safe-left))!important;bottom:calc(76px + var(--empath-safe-bottom))!important }
```

## styles/07-responsive-and-layout.css:74
@media (max-width:480px)
```css
.hero-opening { padding-left:18px!important;padding-right:18px!important }
```

## styles/07-responsive-and-layout.css:75
@media (max-width:480px)
```css
.hero-title { font-size:clamp(52px,16.5vw,72px)!important;letter-spacing:clamp(3px,1.4vw,6px)!important }
```

## styles/07-responsive-and-layout.css:76
@media (max-width:480px)
```css
.cinema-cta,.send-btn { width:100%!important;min-width:0!important;white-space:normal!important;text-align:center!important }
```

## styles/07-responsive-and-layout.css:77
@media (max-width:480px)
```css
#hero .door-btn { width:100%!important;max-width:100%!important;grid-template-columns:28px 42px minmax(0,1fr) 14px!important }
```

## styles/07-responsive-and-layout.css:88
@media (max-width:768px)
```css
nav { top:0!important;right:0!important;bottom:auto!important;left:0!important;
    width:100%!important;height:calc(64px + var(--empath-safe-top))!important;
    min-height:calc(64px + var(--empath-safe-top))!important;
    padding:var(--empath-safe-top) max(18px,var(--empath-safe-right)) 0 max(18px,var(--empath-safe-left))!important;
    display:flex!important;align-items:center!important;justify-content:space-between!important;
    background:rgba(2,7,11,.94)!important;border-bottom:1px solid rgba(255,255,255,.07)!important;
    backdrop-filter:blur(18px) saturate(110%)!important;-webkit-backdrop-filter:blur(18px) saturate(110%)!important; }
```

## styles/07-responsive-and-layout.css:97
@media (max-width:768px)
```css
.nav-logo { font-size:18px!important;line-height:1!important;letter-spacing:5px!important;white-space:nowrap!important }
```

## styles/07-responsive-and-layout.css:98
@media (max-width:768px)
```css
.hamburger { width:44px!important;height:44px!important;padding:10px 8px!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;flex-shrink:0!important }
```

## styles/07-responsive-and-layout.css:99
@media (max-width:768px)
```css
.hamburger span { width:28px!important;height:1px!important;flex:none!important }
```

## styles/07-responsive-and-layout.css:101
@media (max-width:768px)
```css
.nav-menu { position:fixed!important;top:calc(64px + var(--empath-safe-top))!important;right:0!important;bottom:auto!important;left:0!important;
    width:100vw!important;height:calc(var(--empath-vh) - 64px - var(--empath-safe-top))!important;
    max-width:none!important;max-height:none!important;margin:0!important;
    padding:34px max(22px,var(--empath-safe-right)) calc(34px + var(--empath-safe-bottom)) max(22px,var(--empath-safe-left))!important;
    display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:30px!important;
    overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;
    background:rgba(2,7,11,.985)!important;border:0!important;border-top:1px solid rgba(255,255,255,.06)!important;
    opacity:0!important;visibility:hidden!important;pointer-events:none!important;
    transform:translate3d(0,-18px,0)!important;
    transition:opacity .3s ease,transform .45s cubic-bezier(.23,1,.32,1),visibility 0s linear .45s!important; }
```

## styles/07-responsive-and-layout.css:113
@media (max-width:768px)
```css
.nav-menu.show { opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;
    transition:opacity .3s ease,transform .45s cubic-bezier(.23,1,.32,1),visibility 0s!important; }
```

## styles/07-responsive-and-layout.css:117
@media (max-width:768px)
```css
.nav-letters { display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important }
```

## styles/07-responsive-and-layout.css:118
@media (max-width:768px)
```css
.nav-letter { width:100%!important;height:58px!important;border:1px solid rgba(255,255,255,.09)!important;font-size:17px!important;background:rgba(255,255,255,.018)!important }
```

## styles/07-responsive-and-layout.css:119
@media (max-width:768px)
```css
.nav-letter::after { left:30%!important;right:30%!important;bottom:8px!important }
```

## styles/07-responsive-and-layout.css:120
@media (max-width:768px)
```css
.nav-controls { display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important }
```

## styles/07-responsive-and-layout.css:121
@media (max-width:768px)
```css
.nav-controls>* { width:100%!important;min-width:0!important }
```

## styles/07-responsive-and-layout.css:122
@media (max-width:768px)
```css
.nav-controls .func-btn { width:100%!important;height:48px!important;padding:0 10px!important;border-radius:2px!important;font-size:11px!important;white-space:normal!important }
```

## styles/07-responsive-and-layout.css:123
@media (max-width:768px)
```css
.lang-dropdown-wrapper { grid-column:1/-1!important;width:100%!important }
```

## styles/07-responsive-and-layout.css:124
@media (max-width:768px)
```css
.lang-dropdown-wrapper>.func-btn { width:100%!important }
```

## styles/07-responsive-and-layout.css:125
@media (max-width:768px)
```css
.lang-dropdown-list { position:static!important;width:100%!important;max-height:240px!important;margin-top:8px!important;overflow-y:auto!important;box-shadow:none!important }
```

## styles/07-responsive-and-layout.css:126
@media (max-width:768px)
```css
.hsp-first-visit-tooltip { display:none!important }
```

## styles/07-responsive-and-layout.css:128
@media (max-width:768px)
```css
#hero { padding-top:calc(64px + var(--empath-safe-top))!important }
```

## styles/07-responsive-and-layout.css:129
@media (max-width:768px)
```css
.hero-opening { padding-top:64px!important;padding-bottom:calc(128px + var(--empath-safe-bottom))!important;justify-content:center!important }
```

## styles/07-responsive-and-layout.css:130
@media (max-width:768px)
```css
.hero-actions { margin-bottom:28px!important }
```

## styles/07-responsive-and-layout.css:131
@media (max-width:768px)
```css
.opening-scroll { display:none!important }
```

## styles/07-responsive-and-layout.css:146
@media (max-width:390px)
```css
.nav-menu { padding-left:18px!important;padding-right:18px!important }
```

## styles/07-responsive-and-layout.css:147
@media (max-width:390px)
```css
.nav-controls { grid-template-columns:1fr!important }
```

## styles/07-responsive-and-layout.css:148
@media (max-width:390px)
```css
.lang-dropdown-wrapper { grid-column:auto!important }
```

## styles/07-responsive-and-layout.css:149
@media (max-width:390px)
```css
.hero-opening { padding-left:16px!important;padding-right:16px!important }
```

## styles/07-responsive-and-layout.css:273

```css
.room-title,
#journey .journey-heading h2,
.h-journey-arc-head h3 { text-wrap: balance; }
```

## styles/07-responsive-and-layout.css:299

```css
#journey .journey-heading > p:last-child { max-width: 54ch;
  color: rgba(232,230,225,.64) !important; }
```

## styles/07-responsive-and-layout.css:304

```css
#journey .door-btn { border-color: rgba(232,230,225,.13) !important;
  background: linear-gradient(145deg,rgba(255,255,255,.028),rgba(255,255,255,.008)) !important; }
```

## styles/07-responsive-and-layout.css:309

```css
#journey .door-btn:hover,
#journey .door-btn:focus-visible { border-color: rgba(201,168,76,.48) !important;
  background: rgba(201,168,76,.045) !important; }
```

## styles/07-responsive-and-layout.css:341
@media (max-width: 900px)
```css
#journey .door-btn { min-height: 116px !important; }
```

## styles/07-responsive-and-layout.css:454
@media (max-width: 480px)
```css
#journey.journey-map { padding-inline: var(--empath-mobile-gutter) !important; }
```

## styles/07-responsive-and-layout.css:458
@media (max-width: 480px)
```css
#journey .journey-heading h2 { font-size: clamp(29px,9vw,36px) !important;
    line-height: 1.35 !important; }
```

## styles/07-responsive-and-layout.css:463
@media (max-width: 480px)
```css
#journey .door-btn { min-height: 108px !important;
    padding: 16px !important; }
```

## styles/07-responsive-and-layout.css:484

```css
#creator-btn,
#fortune-spark,
#breathe-btn,
.lighthouse-flame,
.footer-privacy-btn,
.hsp-tooltip-close,
.lang-option { appearance: none;
  -webkit-appearance: none;
  font: inherit; }
```

## styles/07-responsive-and-layout.css:496

```css
#creator-btn,
#fortune-spark,
#breathe-btn,
.lighthouse-flame,
.footer-privacy-btn,
.hsp-tooltip-close { border: 0;
  background: transparent;
  color: inherit; }
```

## styles/07-responsive-and-layout.css:507

```css
#creator-btn,
#fortune-spark,
#breathe-btn { width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%; }
```

## styles/07-responsive-and-layout.css:522

```css
.footer-privacy-btn { padding: 3px 5px;
  color: rgba(255,255,255,.5);
  text-decoration: underline;
  cursor: pointer;
  transition: color .3s ease; }
```

## styles/07-responsive-and-layout.css:530

```css
.footer-privacy-btn:hover { color: var(--gold); }
```

## styles/07-responsive-and-layout.css:532

```css
.hsp-tooltip-close { min-width: 32px;
  min-height: 32px;
  padding: 0;
  cursor: pointer; }
```

## styles/07-responsive-and-layout.css:539

```css
.lang-option { display: block;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer; }
```

## styles/07-responsive-and-layout.css:552

```css
html.empath-home-page #creator-btn,
html.empath-home-page .csslight-ribbon { display: none !important; }
```

## styles/07-responsive-and-layout.css:706
@media (max-width: 900px)
```css
html.empath-inapp nav { background: rgba(2,7,11,.975) !important;
    border-bottom-color: color-mix(in srgb, var(--empath-inapp-accent) 22%, transparent) !important; }
```

## styles/07-responsive-and-layout.css:711
@media (max-width: 900px)
```css
html.empath-inapp .hero-opening,
  html.empath-inapp .room,
  html.empath-inapp .room-content { max-width: 100% !important; }
```

## styles/07-responsive-and-layout.css:717
@media (max-width: 900px)
```css
html.empath-inapp .hero-title { max-width: 100% !important;
    font-size: clamp(48px,15.5vw,68px) !important;
    letter-spacing: clamp(2px,1.2vw,5px) !important;
    text-indent: 0 !important; }
```

## styles/07-responsive-and-layout.css:736
@media (max-width: 900px)
```css
html.empath-inapp :where(button,a,.door-btn,.echo-btn,.shard) { touch-action: manipulation; }
```

## styles/07-responsive-and-layout.css:744
@media (max-width: 900px)
```css
html.empath-inapp #creator-btn { bottom: calc(76px + var(--empath-safe-bottom) + var(--empath-vv-bottom) + var(--empath-inapp-bottom) + var(--empath-inapp-tip-reserve)) !important; }
```

## styles/07-responsive-and-layout.css:845
@media (max-width: 900px)
```css
html.empath-inapp-line .hero-opening { padding-bottom: calc(138px + var(--empath-safe-bottom)) !important; }
```

## styles/07-responsive-and-layout.css:846
@media (max-width: 900px)
```css
html.empath-inapp-line .cinema-cta { min-height: 50px !important; }
```

## styles/07-responsive-and-layout.css:853
@media (max-width: 900px)
```css
html.empath-inapp-instagram nav,
  html.empath-inapp-instagram .nav-menu,
  html.empath-inapp-instagram .empath-inapp-tip { backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important; }
```

## styles/07-responsive-and-layout.css:867
@media (max-width: 900px)
```css
html.empath-inapp-facebook,
  html.empath-inapp-facebook body,
  html.empath-inapp-facebook #hero,
  html.empath-inapp-facebook .room { overflow-x: hidden !important; }
```

## styles/07-responsive-and-layout.css:879
@media (max-width: 900px)
```css
html.empath-inapp-x :where(.door-btn,.nav-letter,.action-btn,.send-btn) { touch-action: pan-y !important; }
```

## styles/07-responsive-and-layout.css:899
@media (max-width: 900px) and (orientation: landscape) and (max-height: 500px)
```css
html.empath-inapp .hero-opening { min-height: var(--empath-vh) !important; padding-top: 78px !important; padding-bottom: 48px !important; }
```

## styles/07-responsive-and-layout.css:900
@media (max-width: 900px) and (orientation: landscape) and (max-height: 500px)
```css
html.empath-inapp .hero-title { font-size: clamp(42px,11vw,62px) !important; }
```

## styles/08-room-and-community-refinements.css:4

```css
.daily-checkin,
.emotion-week { position: relative;
  width: min(980px, calc(100% - 40px));
  margin-inline: auto;
  border: 1px solid rgba(201,168,76,.22);
  background:
    radial-gradient(circle at 12% 0%, rgba(201,168,76,.09), transparent 36%),
    linear-gradient(145deg, rgba(18,20,26,.92), rgba(8,10,14,.84));
  box-shadow: 0 28px 80px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.025);
  overflow: hidden; }
```

## styles/08-room-and-community-refinements.css:17

```css
.daily-checkin::before,
.emotion-week::before { content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .18;
  background-image: radial-gradient(rgba(255,255,255,.55) .5px, transparent .6px);
  background-size: 19px 19px;
  mask-image: linear-gradient(to bottom, #000, transparent 74%); }
```

## styles/08-room-and-community-refinements.css:29

```css
.daily-checkin { z-index: 3;
  /* Keep the opening as a true full-screen scene; reveal this card only after scrolling. */
  margin-top: 0;
  margin-bottom: clamp(82px, 11vw, 150px);
  padding: clamp(28px, 5vw, 58px);
  border-radius: 3px 30px 3px 30px; }
```

## styles/08-room-and-community-refinements.css:38

```css
.daily-checkin-head,
.daily-mood-grid,
.daily-checkin-result,
.daily-local-note,
.emotion-week > * { position: relative; z-index: 1; }
```

## styles/08-room-and-community-refinements.css:44

```css
.daily-checkin-head { max-width: 680px; margin-bottom: 30px; }
```

## styles/08-room-and-community-refinements.css:45

```css
.daily-checkin-kicker,
.emotion-week-kicker,
.tonight-echo-kicker,
.daily-result-label { margin: 0 0 10px;
  color: var(--gold);
  font: 600 10px/1.4 "Noto Sans TC", sans-serif;
  letter-spacing: .24em;
  text-transform: uppercase; }
```

## styles/08-room-and-community-refinements.css:55

```css
.daily-checkin h2,
.emotion-week h3,
.tonight-echo h2 { margin: 0;
  color: var(--white);
  font-family: "Noto Serif TC", "Cormorant Garamond", serif;
  font-weight: 500; }
```

## styles/08-room-and-community-refinements.css:63

```css
.daily-checkin h2 { font-size: clamp(26px, 4vw, 40px); letter-spacing: .06em; }
```

## styles/08-room-and-community-refinements.css:64

```css
.daily-checkin-head > p:last-child { max-width: 620px;
  margin: 14px 0 0;
  color: rgba(255,255,255,.57);
  font-size: 14px;
  line-height: 1.9; }
```

## styles/08-room-and-community-refinements.css:72

```css
.daily-mood-grid { display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 10px; }
```

## styles/08-room-and-community-refinements.css:77

```css
.daily-mood { display: grid;
  grid-template-columns: 38px 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
  min-height: 88px;
  padding: 17px 18px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 2px 14px 2px 14px;
  color: rgba(255,255,255,.72);
  background: rgba(255,255,255,.025);
  text-align: left;
  cursor: pointer;
  transition: transform .25s ease, border-color .25s ease, background .25s ease, box-shadow .25s ease; }
```

## styles/08-room-and-community-refinements.css:93

```css
.daily-mood > span { grid-row: 1 / 3; font-size: 23px; filter: grayscale(.25); }
```

## styles/08-room-and-community-refinements.css:94

```css
.daily-mood strong { align-self: end; font: 500 14px/1.4 "Noto Serif TC", serif; letter-spacing: .08em; }
```

## styles/08-room-and-community-refinements.css:95

```css
.daily-mood small { align-self: start; margin-top: 3px; color: rgba(255,255,255,.36); font-size: 10px; letter-spacing: .05em; }
```

## styles/08-room-and-community-refinements.css:96

```css
.daily-mood:hover,
.daily-mood:focus-visible { transform: translateY(-2px);
  border-color: rgba(201,168,76,.5);
  background: rgba(201,168,76,.075);
  outline: none; }
```

## styles/08-room-and-community-refinements.css:103

```css
.daily-mood[aria-pressed="true"] { border-color: var(--gold);
  color: #fff8df;
  background: linear-gradient(135deg, rgba(201,168,76,.17), rgba(201,168,76,.045));
  box-shadow: inset 3px 0 var(--gold), 0 12px 30px rgba(0,0,0,.18); }
```

## styles/08-room-and-community-refinements.css:110

```css
.daily-checkin-result { display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 26px;
  margin-top: 20px;
  padding: 22px 24px;
  border: 1px solid rgba(201,168,76,.25);
  border-radius: 2px 16px 2px 16px;
  background: rgba(201,168,76,.065); }
```

## styles/08-room-and-community-refinements.css:121

```css
.daily-checkin-result[hidden] { display: none; }
```

## styles/08-room-and-community-refinements.css:122

```css
.daily-checkin-result strong { display: block; color: #f4ead0; font: 500 20px/1.4 "Noto Serif TC", serif; letter-spacing: .08em; }
```

## styles/08-room-and-community-refinements.css:123

```css
.daily-checkin-result p { margin: 5px 0 0; color: rgba(255,255,255,.48); font-size: 12px; line-height: 1.7; }
```

## styles/08-room-and-community-refinements.css:124

```css
.daily-result-link { flex: 0 0 auto;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border: 1px solid var(--gold);
  border-radius: 999px;
  color: #f4df9a;
  font-size: 12px;
  letter-spacing: .12em;
  transition: color .2s ease, background .2s ease, transform .2s ease; }
```

## styles/08-room-and-community-refinements.css:138

```css
.daily-result-link:hover,
.daily-result-link:focus-visible { color: #111; background: var(--gold); transform: translateX(2px); outline: none; }
```

## styles/08-room-and-community-refinements.css:140

```css
.daily-local-note { margin: 18px 0 0; color: rgba(255,255,255,.3); font-size: 10px; letter-spacing: .08em; }
```

## styles/08-room-and-community-refinements.css:202
@media (max-width: 760px)
```css
.daily-checkin { width: calc(100% - 24px); margin-top: 0; padding: 28px 18px; }
```

## styles/08-room-and-community-refinements.css:203
@media (max-width: 760px)
```css
.daily-mood-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
```

## styles/08-room-and-community-refinements.css:204
@media (max-width: 760px)
```css
.daily-mood { grid-template-columns: 30px 1fr; min-height: 84px; padding: 14px 12px; column-gap: 9px; }
```

## styles/08-room-and-community-refinements.css:205
@media (max-width: 760px)
```css
.daily-mood > span { font-size: 20px; }
```

## styles/08-room-and-community-refinements.css:206
@media (max-width: 760px)
```css
.daily-checkin-result { align-items: stretch; flex-direction: column; padding: 20px; }
```

## styles/08-room-and-community-refinements.css:207
@media (max-width: 760px)
```css
.daily-result-link { align-self: flex-start; }
```

## styles/08-room-and-community-refinements.css:215
@media (max-width: 390px)
```css
.daily-mood-grid { grid-template-columns: 1fr; }
```

## styles/08-room-and-community-refinements.css:216
@media (max-width: 390px)
```css
.daily-mood { min-height: 76px; }
```

## styles/08-room-and-community-refinements.css:222
@media (prefers-reduced-motion: reduce)
```css
.daily-mood,
  .daily-result-link,
  .tonight-echo,
  .tonight-echo-card { transition: none !important; }
```
