# M and H reading surfaces: original CSS inventory

Baseline 6b083d49d22fc2d675ea7220a82350f38ad163db. Shared selectors are scoped away from the selected surfaces; unrelated rooms keep their declarations.

## styles/01-foundation.css:44

```css
textarea,
input,
.a-feed,
.t-feed { -webkit-user-select: text; user-select: text; }
```

## styles/01-foundation.css:69

```css
h1:not(:where(.home-surface, .home-surface *)),
h2:not(:where(.home-surface, .home-surface *)),
.room-letter { text-shadow: 0 0 6px rgba(255, 255, 255, 0.15); }
```

## styles/01-foundation.css:83

```css
nav:not(:where(.home-surface, .home-surface *)) {
  position:fixed;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;
  padding:16px 40px;background:#03070a;backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(255,255,255,.08);z-index:500;
  box-shadow: 0 4px 30px rgba(0,0,0,0.8);
}
```

## styles/01-foundation.css:181

```css
.room{min-height:100vh; min-height:100dvh; padding:100px 40px 80px;position:relative;overflow:hidden;}
```

## styles/01-foundation.css:182

```css
.room-letter{ font-family:'Cormorant Garamond',serif;font-size:clamp(80px,15vw,160px);font-weight:600;line-height:1;opacity:.07;position:absolute;top:80px;right:40px;pointer-events:none; }
```

## styles/01-foundation.css:183

```css
.room-tag{font-size:12px;letter-spacing:4px;color:var(--muted);margin-bottom:16px;text-transform:uppercase; font-weight:bold;}
```

## styles/01-foundation.css:185

```css
.room-title-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
```

## styles/01-foundation.css:186

```css
.room-title{ font-family:'Noto Serif TC',serif;font-weight:700;font-size:clamp(24px,3.5vw,36px);color:var(--white); margin-bottom:0; }
```

## styles/01-foundation.css:187

```css
.room-title-icon { width: 24px; height: 24px; opacity: 0.8; }
```

## styles/01-foundation.css:189

```css
.desc-wrap { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 48px; max-width: 600px; }
```

## styles/01-foundation.css:190

```css
.room-desc{ font-size:16px;color:var(--muted);line-height:2; flex: 1; padding: 16px 20px; background: rgba(255,255,255,0.03); border-left: 2px solid rgba(255,255,255,0.15); border-radius: 0 4px 4px 0;}
```

## styles/01-foundation.css:191

```css
.tts-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: var(--muted); border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; flex-shrink: 0; margin-top: 4px; }
```

## styles/01-foundation.css:192

```css
.tts-btn:hover { background: rgba(255,255,255,0.1); color: var(--dawn); border-color: var(--dawn); transform: scale(1.05); }
```

## styles/01-foundation.css:194

```css
.input-area { 
    width: 100%; max-width: 600px; 
    background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.25); 
    border-radius: 0; color: var(--white); font-family: 'Noto Serif TC', serif; 
    font-size: 16px; padding: 16px 8px; line-height: 2; resize: none; outline: none; 
    transition: all 0.4s ease; box-shadow: none; 
}
```

## styles/01-foundation.css:201

```css
.input-area:focus { 
    border-color: var(--gold); background: rgba(255,255,255,0.02); 
    box-shadow: 0 8px 15px -8px rgba(201,168,76,0.15); 
}
```

## styles/01-foundation.css:205

```css
.input-area::placeholder { 
    color: rgba(255,255,255,0.25); letter-spacing: 1.5px; 
}
```

## styles/01-foundation.css:209

```css
.send-btn{ display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;padding:14px 36px;background:rgba(255,255,255,0.04);border:1px solid; border-radius:4px; font-family:'Noto Serif TC',serif;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .3s; color:inherit; min-width: 160px;}
```

## styles/02-room-foundations.css:8

```css
.e-char-count{font-size:12px;color:var(--muted);margin-top:8px;letter-spacing:1px;}
```

## styles/02-room-foundations.css:65

```css
#room-m{background:#060d1a;overflow:hidden;}
```

## styles/02-room-foundations.css:66

```css
#room-m .room-letter{color:var(--m);}
```

## styles/02-room-foundations.css:66

```css
#room-m .room-tag{color:var(--m);}
```

## styles/02-room-foundations.css:67

```css
#room-m .send-btn{border-color:var(--m);color:var(--m);}
```

## styles/02-room-foundations.css:68

```css
#room-m .send-btn:hover{background:rgba(168,184,200,.15); box-shadow: 0 0 16px rgba(168,184,200,0.3); transform: translateY(-2px);}
```

## styles/02-room-foundations.css:69

```css
#star-canvas{position:absolute;inset:0;pointer-events:none;z-index:0;}
```

## styles/02-room-foundations.css:69

```css
#room-m .room-content{position:relative;z-index:1;}
```

## styles/02-room-foundations.css:70

```css
.m-input-wrap{max-width:480px;}
```

## styles/02-room-foundations.css:73

```css
.m-stats{ display:flex;gap:32px;margin-top:24px; }
```

## styles/02-room-foundations.css:74

```css
.m-stat{font-size:12px;letter-spacing:2px;color:rgba(168,184,200,.8);}
```

## styles/02-room-foundations.css:74

```css
.m-stat span{color:var(--m);font-family:'Noto Serif TC',serif;font-size:20px;font-weight:600;}
```

## styles/02-room-foundations.css:215

```css
#room-h{background: linear-gradient(180deg, #0D1B2A 0%, #0f0f1a 40%, #05050a 100%); border-top: 1px solid rgba(255,255,255,0.02);}
```

## styles/02-room-foundations.css:216

```css
#room-h .room-letter{color:var(--h);}
```

## styles/02-room-foundations.css:216

```css
#room-h .room-tag{color:rgba(242,232,217,.6);}
```

## styles/03-effects-and-accessibility.css:106

```css
nav:not(:where(.home-surface, .home-surface *)) { padding: 16px 20px; }
```

## styles/03-effects-and-accessibility.css:113

```css
.room { padding: 120px 20px 60px; }
```

## styles/03-effects-and-accessibility.css:113

```css
.room-letter { font-size: 80px; top: 80px; right: 16px; }
```

## styles/03-effects-and-accessibility.css:121

```css
.input-area { background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.35); }
```

## styles/03-effects-and-accessibility.css:122

```css
.send-btn, .action-btn { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
```

## styles/03-effects-and-accessibility.css:125

```css
.send-btn:active,
.action-btn:active,
.shard:active,
.nav-letter:active:not(:where(.home-surface, .home-surface *)) { transform: scale(0.95) !important; background: rgba(255,255,255,0.15) !important; box-shadow: none !important; transition: all 0.1s !important; }
```

## styles/03-effects-and-accessibility.css:132

```css
.room { padding: 110px 16px 40px; }
```

## styles/03-effects-and-accessibility.css:132

```css
.input-area { padding: 16px; font-size: 15px; }
```

## styles/03-effects-and-accessibility.css:138

```css
#room-m { padding-bottom: 600px !important; }
```

## styles/03-effects-and-accessibility.css:139

```css
.m-stats { gap: 12px !important; justify-content: space-between; width: 100%; margin-top: 20px; }
```

## styles/03-effects-and-accessibility.css:140

```css
.m-stat { font-size: 11px; letter-spacing: 1px; }
```

## styles/03-effects-and-accessibility.css:141

```css
.m-stat span { font-size: 16px; }
```

## styles/03-effects-and-accessibility.css:239

```css
.input-area, .sync-input { 
        background: transparent !important; 
        border: none !important; 
        border-bottom: 1px solid rgba(255,255,255,0.35) !important; 
        box-shadow: none !important;
        border-radius: 0 !important;
    }
```

## styles/03-effects-and-accessibility.css:246

```css
.input-area:focus, .sync-input:focus {
        border-bottom-color: var(--gold) !important;
        background: rgba(255,255,255,0.02) !important;
    }
```

## styles/03-effects-and-accessibility.css:254

```css
.room-desc { padding: 16px 24px; }
```

## styles/03-effects-and-accessibility.css:255

```css
.send-btn, .action-btn { padding: 16px 32px; }
```

## styles/03-effects-and-accessibility.css:276

```css
#a-warning-mask .send-btn { width: 100%; min-height: 48px; }
```

## styles/04-page-and-art-direction.css:26

```css
html.empath-room-page .room {
  padding-top: clamp(112px, 12vw, 150px);
  animation: empathRoomArrival .7s cubic-bezier(.2,.8,.2,1) both;
}
```

## styles/04-page-and-art-direction.css:78

```css
html.empath-room-page .room { padding-top: 104px; }
```

## styles/04-page-and-art-direction.css:94

```css
:focus-visible:not(:where(.home-surface, .home-surface *)) { outline: 2px solid var(--gold) !important; outline-offset: 4px; border-radius: 4px; }
```

## styles/04-page-and-art-direction.css:95

```css
textarea:focus-visible, input:focus-visible { outline: none !important; }
```

## styles/04-page-and-art-direction.css:98

```css
#room-m { min-height: 150vh !important; padding-bottom: 300px; }
```

## styles/04-page-and-art-direction.css:100

```css
#room-m { min-height: 180vh !important; padding-bottom: 800px !important; }
```

## styles/04-page-and-art-direction.css:139

```css
nav:not(:where(.home-surface, .home-surface *)) {
  padding:14px 42px;
  background:linear-gradient(180deg,rgba(2,6,10,.82),rgba(2,6,10,.42));
  border-bottom-color:rgba(255,255,255,.055);
  box-shadow:none;
  backdrop-filter:blur(18px) saturate(115%);
  transition:background .55s ease,border-color .55s ease,transform .55s ease;
}
```

## styles/04-page-and-art-direction.css:147

```css
body:not(.page-scrolled) nav:not(:where(.home-surface, .home-surface *)) {background:linear-gradient(180deg,rgba(2,6,10,.72),transparent);border-bottom-color:transparent;}
```

## styles/04-page-and-art-direction.css:206

```css
nav:not(:where(.home-surface, .home-surface *)) {padding:12px 18px;}
```

## styles/04-page-and-art-direction.css:213

```css
nav:not(:where(.home-surface, .home-surface *)) {min-height:74px;padding:15px 38px;}
```

## styles/04-page-and-art-direction.css:227

```css
nav:not(:where(.home-surface, .home-surface *)) {min-height:68px;padding:12px 20px;}
```

## styles/04-page-and-art-direction.css:231

```css
nav:not(:where(.home-surface, .home-surface *)) {min-height:64px;padding:10px 18px;}
```

## styles/04-page-and-art-direction.css:240

```css
.room{
  --room-accent:201,168,76;
  padding-top:128px;
  border-top:1px solid rgba(255,255,255,.07);
  box-shadow:inset 0 1px rgba(255,255,255,.018),inset 0 110px 120px -130px rgba(var(--room-accent),.18);
  isolation:isolate;
}
```

## styles/04-page-and-art-direction.css:248

```css
#room-m{--room-accent:168,184,200;background:radial-gradient(ellipse at 82% 30%,rgba(82,108,153,.15),transparent 42%),linear-gradient(180deg,#060d1a,#030812);}
```

## styles/04-page-and-art-direction.css:252

```css
#room-h{--room-accent:242,232,217;background:radial-gradient(ellipse at 76% 22%,rgba(203,195,183,.12),transparent 36%),linear-gradient(160deg,#101927,#0b0e19 52%,#050509);}
```

## styles/04-page-and-art-direction.css:254

```css
.room::before{
  content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:
    linear-gradient(90deg,transparent 7%,rgba(255,255,255,.018) 7.05%,transparent 7.1%),
    linear-gradient(90deg,transparent 92.9%,rgba(255,255,255,.018) 92.95%,transparent 93%),
    radial-gradient(380px circle at 80% 18%,rgba(var(--room-accent),.075),transparent 72%);
}
```

## styles/04-page-and-art-direction.css:261

```css
.room::after{
  content:'';position:absolute;left:max(40px,7vw);right:max(40px,7vw);top:92px;height:1px;z-index:0;
  background:linear-gradient(90deg,rgba(var(--room-accent),.62) 0 56px,rgba(255,255,255,.09) 56px,transparent 58%);
  pointer-events:none;
}
```

## styles/04-page-and-art-direction.css:266

```css
.room-letter{
  top:106px;right:max(36px,6vw);
  font-size:clamp(110px,18vw,220px);font-weight:300;opacity:.045;
  letter-spacing:-.04em;
}
```

## styles/04-page-and-art-direction.css:271

```css
.room-tag{
  margin-bottom:18px;font-size:10px;font-weight:400;
  letter-spacing:.42em;opacity:.74;
}
```

## styles/04-page-and-art-direction.css:275

```css
.room-title-wrap{gap:16px;margin-bottom:34px;}
```

## styles/04-page-and-art-direction.css:276

```css
.room-title{
  font-size:clamp(34px,4.2vw,54px);font-weight:300;
  letter-spacing:.09em;line-height:1.25;
  text-shadow:0 12px 38px rgba(0,0,0,.45);
}
```

## styles/04-page-and-art-direction.css:281

```css
.room-title-icon{
  width:42px;height:42px;padding:10px;
  border:1px solid rgba(var(--room-accent),.30);border-radius:50%;
  background:rgba(var(--room-accent),.045);
  filter:drop-shadow(0 0 12px rgba(var(--room-accent),.16));
}
```

## styles/04-page-and-art-direction.css:287

```css
.desc-wrap{max-width:720px;margin-bottom:58px;gap:14px;}
```

## styles/04-page-and-art-direction.css:288

```css
.room-desc{
  padding:22px 26px;
  border:1px solid rgba(255,255,255,.075);border-left:1px solid rgba(var(--room-accent),.48);
  background:linear-gradient(110deg,rgba(255,255,255,.038),rgba(255,255,255,.012));
  backdrop-filter:blur(10px);
  border-radius:0;
  color:rgba(232,230,225,.68);font-size:15px;line-height:2.15;font-weight:300;
  box-shadow:0 18px 50px rgba(0,0,0,.16),inset 0 1px rgba(255,255,255,.025);
}
```

## styles/04-page-and-art-direction.css:297

```css
.tts-btn{
  width:46px;height:46px;margin-top:0;
  background:rgba(255,255,255,.025);border-color:rgba(var(--room-accent),.24);
  color:rgba(255,255,255,.48);
}
```

## styles/04-page-and-art-direction.css:302

```css
.tts-btn:hover{color:rgb(var(--room-accent));border-color:rgba(var(--room-accent),.58);box-shadow:0 0 22px rgba(var(--room-accent),.12);}
```

## styles/04-page-and-art-direction.css:304

```css
.input-area{
  max-width:680px;padding:18px 10px;font-size:16px;font-weight:300;
  border-bottom-color:rgba(255,255,255,.22);
  background:linear-gradient(90deg,rgba(var(--room-accent),.025),transparent 68%);
}
```

## styles/04-page-and-art-direction.css:309

```css
.input-area:focus{
  border-color:rgba(var(--room-accent),.82);
  box-shadow:0 14px 30px -20px rgba(var(--room-accent),.55);
}
```

## styles/04-page-and-art-direction.css:313

```css
.input-area::placeholder{color:rgba(255,255,255,.25);font-weight:300;}
```

## styles/04-page-and-art-direction.css:315

```css
.room .send-btn{
  min-height:50px;border-width:1px;border-radius:0;
  background:rgba(var(--room-accent),.025);
  letter-spacing:.18em;font-size:12px;font-weight:400;
  position:relative;overflow:hidden;
}
```

## styles/04-page-and-art-direction.css:321

```css
.room .send-btn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.13) 50%,transparent 70%);
  transform:translateX(-130%);transition:transform .75s ease;
}
```

## styles/04-page-and-art-direction.css:326

```css
.room .send-btn:hover::before{transform:translateX(130%);}
```

## styles/04-page-and-art-direction.css:340

```css
.m-stats,.p-global-progress,.global-stats{
  color:rgba(255,255,255,.58);
  letter-spacing:.08em;
}
```

## styles/04-page-and-art-direction.css:352

```css
body.visual-ready .room .room-tag,
body.visual-ready .room .room-title-wrap,
body.visual-ready .room .desc-wrap{
  opacity:0;transform:translateY(26px);filter:blur(4px);
  transition:opacity .82s ease,transform .82s cubic-bezier(.2,.8,.2,1),filter .82s ease;
}
```

## styles/04-page-and-art-direction.css:358

```css
body.visual-ready .room .room-title-wrap{transition-delay:.06s;}
```

## styles/04-page-and-art-direction.css:359

```css
body.visual-ready .room .desc-wrap{transition-delay:.12s;}
```

## styles/04-page-and-art-direction.css:360

```css
body.visual-ready .room .room-tag.is-revealed,
body.visual-ready .room .room-title-wrap.is-revealed,
body.visual-ready .room .desc-wrap.is-revealed{opacity:1;transform:translateY(0);filter:blur(0);}
```

## styles/04-page-and-art-direction.css:365

```css
.room{padding-top:104px;}
```

## styles/04-page-and-art-direction.css:366

```css
.room::after{top:76px;left:20px;right:20px;}
```

## styles/04-page-and-art-direction.css:367

```css
.room-letter{top:94px;right:20px;font-size:110px;}
```

## styles/04-page-and-art-direction.css:368

```css
.room-title{font-size:32px;}
```

## styles/04-page-and-art-direction.css:369

```css
.room-title-icon{width:38px;height:38px;padding:9px;}
```

## styles/04-page-and-art-direction.css:370

```css
.room-desc{padding:18px 20px;font-size:14px;}
```

## styles/04-page-and-art-direction.css:371

```css
.desc-wrap{margin-bottom:44px;}
```

## styles/04-page-and-art-direction.css:386

```css
.room-desc {
    border-left: 1px solid rgba(255,255,255,0.12) !important;
    background: transparent !important;
    padding: 0 0 0 20px !important;
    font-size: 15px !important;
    letter-spacing: 0.5px;
    line-height: 2.2 !important;
}
```

## styles/04-page-and-art-direction.css:396

```css
.send-btn {
    letter-spacing: 3px !important;
    font-size: 13px !important;
    padding: 14px 40px !important;
    border-radius: 2px !important;
    position: relative;
    overflow: hidden;
}
```

## styles/04-page-and-art-direction.css:404

```css
.send-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%);
    pointer-events: none;
}
```

## styles/04-page-and-art-direction.css:479

```css
.room-title-wrap {
    padding-bottom: 24px !important;
    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
    margin-bottom: 40px !important;
}
```

## styles/04-page-and-art-direction.css:486

```css
.char-count,
[id$="-char"] {
    font-size: 11px !important;
    letter-spacing: 2px !important;
    color: rgba(255,255,255,0.2) !important;
    font-family: 'Cormorant Garamond', serif !important;
}
```

## styles/04-page-and-art-direction.css:495

```css
textarea {
    border-radius: 0 !important;
    border: none !important;
    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
    background: transparent !important;
    padding: 16px 0 !important;
    font-size: 15px !important;
    line-height: 2 !important;
    letter-spacing: 0.5px;
    resize: none;
}
```

## styles/04-page-and-art-direction.css:506

```css
textarea:focus {
    border-bottom-color: rgba(255,255,255,0.3) !important;
    outline: none !important;
    background: transparent !important;
}
```

## styles/05-editorial-and-microdetails.css:16

```css
.room {
    padding: 128px 48px 96px !important;
}
```

## styles/05-editorial-and-microdetails.css:19

```css
.room-tag {
    margin-bottom: 16px !important;
}
```

## styles/05-editorial-and-microdetails.css:22

```css
.room-title-wrap {
    gap: 16px !important;
    margin-bottom: 32px !important;
    padding-bottom: 24px !important;
}
```

## styles/05-editorial-and-microdetails.css:27

```css
.desc-wrap {
    gap: 16px !important;
    margin-bottom: 64px !important;
}
```

## styles/05-editorial-and-microdetails.css:31

```css
.room-desc {
    padding: 0 0 0 24px !important;
}
```

## styles/05-editorial-and-microdetails.css:58

```css
.room-title,
.wrapped-title {
    font-family: 'Cormorant Garamond', 'Noto Serif TC', serif !important;
}
```

## styles/05-editorial-and-microdetails.css:62

```css
.room-title {
    font-size: clamp(40px, 4.5vw, 56px) !important;
    font-weight: 300 !important;
    line-height: 1.15 !important;
    letter-spacing: 0.06em !important;
}
```

## styles/05-editorial-and-microdetails.css:68

```css
.room-tag {
    font-size: 11px !important;
    font-weight: 500 !important;
    line-height: 1.4 !important;
    letter-spacing: 0.32em !important;
    text-transform: uppercase !important;
}
```

## styles/05-editorial-and-microdetails.css:75

```css
.room-desc {
    font-size: 15px !important;
    font-weight: 300 !important;
    line-height: 2.1 !important;
    letter-spacing: 0.04em !important;
}
```

## styles/05-editorial-and-microdetails.css:90

```css
.e-msg-time,
.shard-healed-tag,
.sand-timer-label,
.sand-time-left,
.j-label,
.g-label,
.char-count,
[id$="-char"] {
    font-family: 'Cormorant Garamond', 'Noto Sans TC', sans-serif !important;
    font-size: 11px !important;
    font-weight: 400 !important;
    line-height: 1.5 !important;
    letter-spacing: 0.16em !important;
    color: rgba(232,230,225,0.38) !important;
}
```

## styles/05-editorial-and-microdetails.css:114

```css
.send-btn,
.action-btn,
.sync-btn-small {
    font-family: 'Noto Sans TC', sans-serif !important;
    font-size: 12px !important;
    font-weight: 400 !important;
    line-height: 1 !important;
    letter-spacing: 0.2em !important;
}
```

## styles/05-editorial-and-microdetails.css:176

```css
.input-area,
.sync-input,
textarea {
    border: none !important;
    border-bottom: 1px solid rgba(232,230,225,0.14) !important;
    border-radius: 0 !important;
    box-shadow: none !important;
}
```

## styles/05-editorial-and-microdetails.css:186

```css
.send-btn,
.action-btn,
.ob-btn,
.sync-btn-small,
.e-mode-btn,
.e-tool-btn,
.echo-btn,
.func-btn:not(:where(.home-surface, .home-surface *)) {
    transition:
        color 320ms ease,
        background-color 320ms ease,
        border-color 320ms ease,
        opacity 320ms ease,
        transform 320ms cubic-bezier(.22,.61,.36,1) !important;
}
```

## styles/05-editorial-and-microdetails.css:224

```css
.send-btn:hover,
.action-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
}
```

## styles/05-editorial-and-microdetails.css:294

```css
.room {
        padding: 96px 24px 64px !important;
    }
```

## styles/05-editorial-and-microdetails.css:297

```css
.room-title {
        font-size: clamp(36px, 11vw, 48px) !important;
    }
```

## styles/05-editorial-and-microdetails.css:300

```css
.desc-wrap {
        margin-bottom: 48px !important;
    }
```

## styles/05-editorial-and-microdetails.css:376

```css
.send-btn {
    --magnetic-x:0px;
    --magnetic-y:0px;
    transform:translate3d(var(--magnetic-x),var(--magnetic-y),0) !important;
    transition:transform 650ms cubic-bezier(.23,1,.32,1),
               color 320ms ease,background-color 320ms ease,
               border-color 320ms ease,box-shadow 400ms ease !important;
    will-change:transform !important;
}
```

## styles/05-editorial-and-microdetails.css:385

```css
.send-btn.is-magnetic {
    transition:transform 90ms linear,color 320ms ease,
               background-color 320ms ease,border-color 320ms ease,
               box-shadow 400ms ease !important;
}
```

## styles/05-editorial-and-microdetails.css:392

```css
.room-title { overflow:hidden !important; }
```

## styles/05-editorial-and-microdetails.css:404

```css
.room-title.aw-title-in .aw-title-char {
    opacity:1 !important;
    transform:translate3d(0,0,0) rotate(0) !important;
    filter:blur(0) !important;
}
```

## styles/05-editorial-and-microdetails.css:467

```css
.send-btn {--magnetic-x:0px !important;--magnetic-y:0px !important}
```

## styles/05-editorial-and-microdetails.css:485

```css
.room .room-letter {
    animation: luxRoomBreath 6s ease-in-out infinite !important;
    will-change: opacity !important;
}
```

## styles/05-editorial-and-microdetails.css:495

```css
.send-btn {
    position:relative !important;
    overflow:hidden !important;
    isolation:isolate !important;
}
```

## styles/05-editorial-and-microdetails.css:500

```css
.send-btn > *:not(.lux-btn-ripple) {
    position:relative !important;
    z-index:2 !important;
}
```

## styles/05-editorial-and-microdetails.css:613

```css
.room { position:relative !important; }
```

## styles/05-editorial-and-microdetails.css:629

```css
body,
body .room,
body nav:not(:where(.home-surface, .home-surface *)),
body .room-desc,
body .room-title,
body .send-btn {
    transition-duration:1.5s !important;
    transition-timing-function:cubic-bezier(.23,1,.32,1) !important;
}
```

## styles/06-concept-and-art-overrides.css:558

```css
#room-m{min-height:100svh!important;padding:0!important;background:#030914!important}
```

## styles/06-concept-and-art-overrides.css:559

```css
#room-m .room-content{min-height:100svh!important;width:100%!important;max-width:none!important;padding:clamp(112px,12vh,150px) clamp(30px,7vw,112px) 64px!important;display:grid!important;grid-template-columns:minmax(290px,440px) 1fr minmax(220px,310px)!important;grid-template-rows:auto 1fr auto!important;column-gap:6vw!important}
```

## styles/06-concept-and-art-overrides.css:560

```css
#room-m .room-tag{grid-column:1;grid-row:1;margin:0 0 24px!important}
```

## styles/06-concept-and-art-overrides.css:561

```css
#room-m .room-title-wrap{grid-column:1;grid-row:1;margin-top:28px!important;border-bottom:0!important}
```

## styles/06-concept-and-art-overrides.css:562

```css
#room-m .desc-wrap{grid-column:1;grid-row:2;align-self:start;max-width:390px!important;margin-top:24px!important}
```

## styles/06-concept-and-art-overrides.css:563

```css
#room-m .room-title-wrap,#room-m .desc-wrap{
  position:relative!important;padding-right:34px!important;
  background:linear-gradient(90deg,rgba(3,9,20,.48) 0%,rgba(3,9,20,.25) 66%,rgba(3,9,20,0) 100%)!important;
  box-shadow:-18px 0 30px rgba(3,9,20,.3)!important;
}
```

## styles/06-concept-and-art-overrides.css:568

```css
#room-m .room-title,#room-m .room-desc{text-shadow:0 2px 18px rgba(0,0,0,.95)!important}
```

## styles/06-concept-and-art-overrides.css:569

```css
#room-m .m-input-wrap{grid-column:1;grid-row:3;align-self:end;width:100%;max-width:none!important;padding:28px 30px 30px!important;background:rgba(5,13,26,.62);border:1px solid rgba(168,184,200,.14);backdrop-filter:blur(16px)}
```

## styles/06-concept-and-art-overrides.css:570

```css
#room-m .m-input-wrap::before{content:'ADD A CONSTELLATION';display:block;margin-bottom:12px;font:10px 'Cormorant Garamond',serif;letter-spacing:.3em;color:rgba(168,184,200,.52)}
```

## styles/06-concept-and-art-overrides.css:571

```css
#room-m .m-input-wrap textarea{min-height:108px!important}
```

## styles/06-concept-and-art-overrides.css:572

```css
#room-m .m-stats{grid-column:3;grid-row:1;justify-self:end!important;align-self:start!important;display:grid!important;gap:18px!important;margin:0!important;padding:18px 22px 18px 28px!important;border-left:1px solid rgba(168,184,200,.16)!important;background:linear-gradient(90deg,rgba(3,9,20,.42),rgba(3,9,20,.16))!important;backdrop-filter:none!important;text-align:left!important}
```

## styles/06-concept-and-art-overrides.css:573

```css
#room-m .m-stat{font:11px 'Noto Sans TC',sans-serif!important;letter-spacing:.18em!important;color:rgba(232,230,225,.43)!important}
```

## styles/06-concept-and-art-overrides.css:574

```css
#room-m .m-stat #m-count{display:block;font:54px/.9 'Cormorant Garamond',serif!important;letter-spacing:0!important;color:rgba(232,230,225,.9)!important;margin-bottom:8px}
```

## styles/06-concept-and-art-overrides.css:575

```css
#room-m #star-canvas{z-index:0!important;opacity:.96}
```

## styles/06-concept-and-art-overrides.css:576

```css
#room-m .room-letter{left:auto!important;right:3vw!important;top:50%!important;transform:translateY(-50%)!important;font-size:min(43vw,640px)!important;opacity:.035!important}
```

## styles/06-concept-and-art-overrides.css:636

```css
#room-h{padding:clamp(136px,13vw,196px) clamp(28px,8vw,132px)!important;text-align:center!important;background:radial-gradient(circle at 50% 20%,rgba(242,232,217,.045),transparent 35%),linear-gradient(180deg,#0b1723,#070810 55%,#030407)!important}
```

## styles/06-concept-and-art-overrides.css:637

```css
#room-h::after{
  content:'THE LAST CHAPTER';position:absolute;left:32px;right:auto;top:50%;
  width:auto;height:auto;background:none!important;
  writing-mode:vertical-rl;transform:translateY(-50%);
  font:10px 'Cormorant Garamond',serif;letter-spacing:.42em;color:rgba(242,232,217,.16)
}
```

## styles/06-concept-and-art-overrides.css:643

```css
#room-h>.room-tag{margin-left:auto!important;margin-right:auto!important}
```

## styles/06-concept-and-art-overrides.css:644

```css
#room-h>.room-title-wrap{justify-content:center!important;border:0!important;margin:0 auto 24px!important}
```

## styles/06-concept-and-art-overrides.css:645

```css
#room-h>.desc-wrap{margin:0 auto 96px!important;max-width:430px!important;text-align:left!important}
```

## styles/06-concept-and-art-overrides.css:663

```css
#room-m .room-content{display:block!important;padding:112px 24px 64px!important}
```

## styles/06-concept-and-art-overrides.css:664

```css
#room-m .m-stats{position:absolute!important;top:118px;right:24px!important}
```

## styles/06-concept-and-art-overrides.css:665

```css
#room-m .m-input-wrap{margin-top:34vh!important}
```

## styles/06-concept-and-art-overrides.css:681

```css
#room-h::after{display:none!important}
```

## styles/06-concept-and-art-overrides.css:683

```css
#room-m .m-stats{position:static!important;margin:24px 0!important;padding-left:16px!important}
```

## styles/06-concept-and-art-overrides.css:683

```css
#room-m .m-input-wrap{margin-top:28vh!important}
```

## styles/06-concept-and-art-overrides.css:687

```css
.room .room-letter,
.scroll-hint,
.behance-float,
.warmth-pulse,
.echo-heart,
.lighthouse-flame,
.presence-spark.show,
.lux-input-spark::after {animation-play-state:paused!important}
```

## styles/06-concept-and-art-overrides.css:723

```css
#room-h>.room-tag,#room-h>.room-title-wrap,#room-h>.desc-wrap,#room-h>.h-journey-arc,#room-h>.h-journey{position:relative!important;z-index:1!important}
```

## styles/06-concept-and-art-overrides.css:724

```css
#room-h .h-journey-arc{
  width:min(100%,1040px)!important;margin:24px auto 112px!important;padding:48px 0 40px!important;
  border-top:1px solid rgba(242,232,217,.12)!important;border-bottom:1px solid rgba(242,232,217,.07)!important;
  text-align:left!important;
}
```

## styles/06-concept-and-art-overrides.css:729

```css
.h-journey-arc-head{display:grid!important;grid-template-columns:150px minmax(0,1fr)!important;column-gap:32px!important;align-items:baseline!important;margin-bottom:44px!important}
```

## styles/06-concept-and-art-overrides.css:730

```css
.h-journey-arc-index{grid-row:1/3!important;margin:0!important;color:rgba(201,168,76,.48)!important;font:10px 'Cormorant Garamond',serif!important;letter-spacing:.32em!important}
```

## styles/06-concept-and-art-overrides.css:731

```css
.h-journey-arc-head h3{margin:0!important;color:rgba(242,232,217,.9)!important;font:400 clamp(30px,4vw,48px)/1.1 'Noto Serif TC',serif!important;letter-spacing:.1em!important}
```

## styles/06-concept-and-art-overrides.css:732

```css
.h-journey-arc-head>p:last-child{margin:12px 0 0!important;color:rgba(242,232,217,.38)!important;font-size:12px!important;letter-spacing:.08em!important}
```

## styles/06-concept-and-art-overrides.css:733

```css
.h-journey-arc-canvas{min-height:210px!important;position:relative!important}
```

## styles/06-concept-and-art-overrides.css:734

```css
.h-journey-arc-canvas svg{display:block!important;width:100%!important;height:auto!important;overflow:visible!important}
```

## styles/06-concept-and-art-overrides.css:735

```css
.h-arc-path{fill:none!important;stroke:rgba(201,168,76,.28)!important;stroke-width:1.2!important;vector-effect:non-scaling-stroke!important}
```

## styles/06-concept-and-art-overrides.css:736

```css
.h-arc-node-ring{fill:#070810!important;stroke:rgba(242,232,217,.28)!important;stroke-width:1!important;vector-effect:non-scaling-stroke!important}
```

## styles/06-concept-and-art-overrides.css:737

```css
.h-arc-node-core{fill:var(--gold)!important;opacity:.72!important}
```

## styles/06-concept-and-art-overrides.css:738

```css
.h-arc-node-label{fill:rgba(242,232,217,.84)!important;font:30px 'Cormorant Garamond',serif!important;text-anchor:middle!important}
```

## styles/06-concept-and-art-overrides.css:739

```css
.h-arc-node-order{fill:rgba(242,232,217,.35)!important;font:9px 'Noto Sans TC',sans-serif!important;letter-spacing:.14em!important;text-anchor:middle!important}
```

## styles/06-concept-and-art-overrides.css:740

```css
.h-arc-empty{height:170px!important;display:flex!important;align-items:center!important;justify-content:center!important;border:1px dashed rgba(242,232,217,.08)!important;color:rgba(242,232,217,.3)!important;font:italic 13px/2 'Noto Serif TC',serif!important;letter-spacing:.1em!important;text-align:center!important}
```

## styles/06-concept-and-art-overrides.css:741

```css
.data-state{
  width:100%!important;min-height:112px!important;display:flex!important;flex-direction:column!important;
  align-items:center!important;justify-content:center!important;gap:16px!important;padding:24px!important;
  color:rgba(232,230,225,.38)!important;font:400 12px/2 'Noto Serif TC',serif!important;
  letter-spacing:.12em!important;text-align:center!important;border-top:1px solid rgba(232,230,225,.06)!important;
}
```

## styles/06-concept-and-art-overrides.css:747

```css
.data-state[hidden]{display:none!important}
```

## styles/06-concept-and-art-overrides.css:748

```css
.data-state::before{content:'✦';font:14px/1 'Cormorant Garamond',serif;color:rgba(201,168,76,.42)}
```

## styles/06-concept-and-art-overrides.css:749

```css
.data-state[data-status="loading"]::before{animation:dataStateBreath 2.8s ease-in-out infinite}
```

## styles/06-concept-and-art-overrides.css:750

```css
.data-state[data-status="error"]{color:rgba(232,230,225,.58)!important}
```

## styles/06-concept-and-art-overrides.css:751

```css
.data-state[data-status="error"]::before{content:'—';color:rgba(201,168,76,.58)}
```

## styles/06-concept-and-art-overrides.css:753

```css
.data-state-retry{
  min-height:44px!important;padding:0 18px!important;border:1px solid rgba(201,168,76,.28)!important;
  border-radius:2px!important;background:transparent!important;color:rgba(232,230,225,.68)!important;
  font:500 10px/1 'Noto Sans TC',sans-serif!important;letter-spacing:.22em!important;cursor:pointer!important;
  transition:border-color .45s ease,color .45s ease,background .45s ease!important;
}
```

## styles/06-concept-and-art-overrides.css:759

```css
.data-state-retry:hover,.data-state-retry:focus-visible{border-color:rgba(201,168,76,.58)!important;color:#fff!important;background:rgba(201,168,76,.06)!important}
```

## styles/06-concept-and-art-overrides.css:760

```css
#room-m .data-state{position:absolute!important;left:50%!important;top:50%!important;z-index:4!important;width:min(78vw,460px)!important;transform:translate(-50%,-50%)!important;border:0!important;pointer-events:none!important}
```

## styles/06-concept-and-art-overrides.css:761

```css
#room-m .data-state-retry{pointer-events:auto!important}
```

## styles/06-concept-and-art-overrides.css:764

```css
.data-state{min-height:96px!important;padding:24px 16px!important;letter-spacing:.08em!important}
```

## styles/06-concept-and-art-overrides.css:765

```css
#room-m .data-state{top:46%!important;width:86vw!important}
```

## styles/06-concept-and-art-overrides.css:773

```css
#room-h .h-journey-arc{margin:8px auto 80px!important;padding:40px 0 28px!important}
```

## styles/06-concept-and-art-overrides.css:774

```css
.h-journey-arc-head{display:block!important;margin-bottom:30px!important}
```

## styles/06-concept-and-art-overrides.css:775

```css
.h-journey-arc-index{margin-bottom:14px!important}
```

## styles/06-concept-and-art-overrides.css:776

```css
.h-journey-arc-head h3{font-size:30px!important}
```

## styles/06-concept-and-art-overrides.css:777

```css
.h-journey-arc-canvas{min-height:170px!important;overflow-x:auto!important;padding-bottom:10px!important}
```

## styles/06-concept-and-art-overrides.css:778

```css
.h-journey-arc-canvas svg{min-width:620px!important}
```

## styles/07-responsive-and-layout.css:8

```css
nav:not(:where(.home-surface, .home-surface *)) {padding-left:max(18px,var(--empath-safe-left))!important;padding-right:max(18px,var(--empath-safe-right))!important;padding-top:max(10px,var(--empath-safe-top))!important}
```

## styles/07-responsive-and-layout.css:14

```css
.room {width:100%!important;max-width:100%!important;overflow-x:clip!important}
```

## styles/07-responsive-and-layout.css:16

```css
#room-e,#room-p,#room-t,#room-h{height:auto!important;min-height:var(--empath-vh)!important;overflow-y:visible!important}
```

## styles/07-responsive-and-layout.css:17

```css
#room-m{height:auto!important;min-height:var(--empath-vh)!important;overflow-x:clip!important}
```

## styles/07-responsive-and-layout.css:19

```css
.room-content,.room>.room-content,.step-wrapper,.desc-wrap,.t-layout,.t-panel,.t-send-panel,.h-journey,.sync-box,.lighthouse,.share-action-box{width:100%!important;max-width:100%!important;min-width:0!important}
```

## styles/07-responsive-and-layout.css:20

```css
.room-title-wrap{width:100%!important;max-width:100%!important;overflow:visible!important}
```

## styles/07-responsive-and-layout.css:21

```css
.room-title{max-width:100%!important;overflow:visible!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.15!important}
```

## styles/07-responsive-and-layout.css:22

```css
.room-desc{max-width:100%!important;overflow-wrap:anywhere!important}
```

## styles/07-responsive-and-layout.css:23

```css
textarea,input,select,button{max-width:100%!important}
```

## styles/07-responsive-and-layout.css:24

```css
textarea,input,select{font-size:16px!important}
```

## styles/07-responsive-and-layout.css:32

```css
#room-m .room-content{height:auto!important;min-height:var(--empath-vh)!important;padding-top:calc(104px + var(--empath-safe-top))!important;padding-bottom:calc(64px + var(--empath-safe-bottom))!important}
```

## styles/07-responsive-and-layout.css:33

```css
#room-m .m-input-wrap{width:100%!important;max-width:100%!important;margin-top:clamp(180px,28svh,260px)!important}
```

## styles/07-responsive-and-layout.css:34

```css
#room-m .m-stats{max-width:100%!important;flex-wrap:wrap!important}
```

## styles/07-responsive-and-layout.css:35

```css
#star-canvas{max-width:100vw!important}
```

## styles/07-responsive-and-layout.css:53

```css
#room-h{padding-left:max(20px,var(--empath-safe-left))!important;padding-right:max(20px,var(--empath-safe-right))!important;padding-bottom:calc(80px + var(--empath-safe-bottom))!important}
```

## styles/07-responsive-and-layout.css:70

```css
.send-btn {width:100%!important;min-width:0!important;white-space:normal!important;text-align:center!important}
```

## styles/07-responsive-and-layout.css:82

```css
nav:not(:where(.home-surface, .home-surface *)) {
    top:0!important;right:0!important;bottom:auto!important;left:0!important;
    width:100%!important;height:calc(64px + var(--empath-safe-top))!important;
    min-height:calc(64px + var(--empath-safe-top))!important;
    padding:var(--empath-safe-top) max(18px,var(--empath-safe-right)) 0 max(18px,var(--empath-safe-left))!important;
    display:flex!important;align-items:center!important;justify-content:space-between!important;
    background:rgba(2,7,11,.94)!important;border-bottom:1px solid rgba(255,255,255,.07)!important;
    backdrop-filter:blur(18px) saturate(110%)!important;-webkit-backdrop-filter:blur(18px) saturate(110%)!important;
  }
```

## styles/07-responsive-and-layout.css:122

```css
#room-m{padding:0!important;padding-bottom:0!important;min-height:auto!important;overflow:clip!important}
```

## styles/07-responsive-and-layout.css:123

```css
#room-m .room-content{min-height:var(--empath-vh)!important;padding:calc(92px + var(--empath-safe-top)) 20px calc(72px + var(--empath-safe-bottom))!important}
```

## styles/07-responsive-and-layout.css:124

```css
#room-m .m-input-wrap{margin-top:clamp(380px,46svh,500px)!important}
```

## styles/07-responsive-and-layout.css:125

```css
#room-m .m-stats{margin-top:18px!important}
```

## styles/07-responsive-and-layout.css:139

```css
#room-m .room-content{padding-left:18px!important;padding-right:18px!important}
```

## styles/07-responsive-and-layout.css:146

```css
#room-h {
  overflow: visible !important;
}
```

## styles/07-responsive-and-layout.css:262

```css
.room-title,
.h-journey-arc-head h3 {
  text-wrap: balance;
}
```

## styles/07-responsive-and-layout.css:267

```css
.room-desc {
  max-width: var(--empath-reading-measure) !important;
  color: rgba(232,230,225,.68) !important;
  line-height: 2.05 !important;
  text-wrap: pretty;
}
```

## styles/07-responsive-and-layout.css:274

```css
.desc-wrap {
  max-width: var(--empath-reading-measure) !important;
}
```

## styles/07-responsive-and-layout.css:278

```css
textarea,
.e-msg,
.sand-msg,
.warmth-item,
.shard-text,
.sync-box p {
  line-height: 1.9 !important;
}
```

## styles/07-responsive-and-layout.css:308

```css
.room-desc {
    font-size: 14px !important;
    line-height: 1.95 !important;
  }
```

## styles/07-responsive-and-layout.css:317

```css
#room-m .m-input-wrap {
    margin-top: clamp(220px,32svh,300px) !important;
  }
```

## styles/07-responsive-and-layout.css:321

```css
#room-p,
  #room-t,
  #room-h {
    padding: 104px var(--empath-mobile-gutter) 76px !important;
  }
```

## styles/07-responsive-and-layout.css:362

```css
#room-h > .desc-wrap {
    margin-bottom: 64px !important;
  }
```

## styles/07-responsive-and-layout.css:366

```css
#room-h .h-journey-arc {
    margin-bottom: 60px !important;
  }
```

## styles/07-responsive-and-layout.css:423

```css
.room-title {
    font-size: clamp(32px,10vw,40px) !important;
  }
```

## styles/07-responsive-and-layout.css:511

```css
.h-path-nav {
  width: min(100%, 920px);
  margin: 64px auto 72px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-block: 1px solid rgba(201,168,76,.2);
}
```

## styles/07-responsive-and-layout.css:519

```css
.h-path-nav a {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 14px;
  padding: 22px 20px;
  color: rgba(232,230,225,.68);
  text-decoration: none;
  transition: background .3s ease, color .3s ease;
}
```

## styles/07-responsive-and-layout.css:530

```css
.h-path-nav a + a { border-left: 1px solid rgba(255,255,255,.08); }
```

## styles/07-responsive-and-layout.css:531

```css
.h-path-nav a:hover,
.h-path-nav a:focus-visible { background: rgba(201,168,76,.07); color: var(--white); }
```

## styles/07-responsive-and-layout.css:533

```css
.h-path-nav span { grid-row: 1 / 3; color: rgba(201,168,76,.48); font: 12px 'Cormorant Garamond',serif; letter-spacing: .16em; }
```

## styles/07-responsive-and-layout.css:534

```css
.h-path-nav b { font: 400 17px 'Noto Serif TC',serif; letter-spacing: .12em; }
```

## styles/07-responsive-and-layout.css:535

```css
.h-path-nav small { margin-top: 7px; color: rgba(232,230,225,.38); font-size: 11px; letter-spacing: .06em; line-height: 1.5; }
```

## styles/07-responsive-and-layout.css:546

```css
#h-journey-arc,
#emotion-week,
#emotion-year,
#h-long-term { scroll-margin-top: 110px; }
```

## styles/07-responsive-and-layout.css:552

```css
.h-path-nav { grid-template-columns: 1fr; margin: 44px auto 58px; }
```

## styles/07-responsive-and-layout.css:553

```css
.h-path-nav a + a { border-left: 0; border-top: 1px solid rgba(255,255,255,.08); }
```

## styles/07-responsive-and-layout.css:554

```css
.h-path-nav a { padding: 18px 12px; }
```

## styles/07-responsive-and-layout.css:558

```css
:where(button, a, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
}
```

## styles/08-room-and-community-refinements.css:4

```css
.emotion-week {
  position: relative;
  width: min(980px, calc(100% - 40px));
  margin-inline: auto;
  border: 1px solid rgba(201,168,76,.22);
  background:
    radial-gradient(circle at 12% 0%, rgba(201,168,76,.09), transparent 36%),
    linear-gradient(145deg, rgba(18,20,26,.92), rgba(8,10,14,.84));
  box-shadow: 0 28px 80px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.025);
  overflow: hidden;
}
```

## styles/08-room-and-community-refinements.css:16

```css
.emotion-week::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .18;
  background-image: radial-gradient(rgba(255,255,255,.55) .5px, transparent .6px);
  background-size: 19px 19px;
  mask-image: linear-gradient(to bottom, #000, transparent 74%);
}
```

## styles/08-room-and-community-refinements.css:27

```css
.emotion-week > * { position: relative; z-index: 1; }
```

## styles/08-room-and-community-refinements.css:29

```css
.emotion-week-kicker,
.tonight-echo-kicker {
  margin: 0 0 10px;
  color: var(--gold);
  font: 600 10px/1.4 'Noto Sans TC', sans-serif;
  letter-spacing: .24em;
  text-transform: uppercase;
}
```

## styles/08-room-and-community-refinements.css:37

```css
.emotion-week h3,
.tonight-echo h2 {
  margin: 0;
  color: var(--white);
  font-family: 'Noto Serif TC', 'Cormorant Garamond', serif;
  font-weight: 500;
}
```

## styles/08-room-and-community-refinements.css:45

```css
.emotion-week {
  margin-top: 34px;
  margin-bottom: 36px;
  padding: clamp(24px, 4vw, 42px);
  border-radius: 24px 3px 24px 3px;
}
```

## styles/08-room-and-community-refinements.css:51

```css
.emotion-week-head { display: flex; align-items: end; justify-content: space-between; gap: 32px; }
```

## styles/08-room-and-community-refinements.css:52

```css
.emotion-week h3 { font-size: clamp(22px, 3vw, 31px); letter-spacing: .08em; }
```

## styles/08-room-and-community-refinements.css:53

```css
.emotion-week-head > p { max-width: 410px; margin: 0; color: rgba(255,255,255,.43); font-size: 12px; line-height: 1.8; }
```

## styles/08-room-and-community-refinements.css:54

```css
.emotion-week-grid { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap: 8px; margin-top: 28px; }
```

## styles/08-room-and-community-refinements.css:55

```css
.emotion-day {
  min-width: 0;
  min-height: 128px;
  padding: 14px 8px 12px;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 16px 3px 16px 3px;
  background: rgba(255,255,255,.025);
  text-align: center;
}
```

## styles/08-room-and-community-refinements.css:64

```css
.emotion-day.is-today { border-color: rgba(201,168,76,.46); background: rgba(201,168,76,.06); }
```

## styles/08-room-and-community-refinements.css:65

```css
.emotion-day.is-empty { opacity: .55; }
```

## styles/08-room-and-community-refinements.css:66

```css
.emotion-day-name { display: block; color: rgba(255,255,255,.38); font-size: 9px; letter-spacing: .12em; }
```

## styles/08-room-and-community-refinements.css:67

```css
.emotion-day-icon { display: block; min-height: 35px; margin: 11px 0 4px; color: var(--gold); font-size: 23px; line-height: 1.4; }
```

## styles/08-room-and-community-refinements.css:68

```css
.emotion-day-label { display: block; overflow: hidden; color: rgba(255,255,255,.67); font: 11px/1.45 'Noto Serif TC', serif; text-overflow: ellipsis; white-space: nowrap; }
```

## styles/08-room-and-community-refinements.css:69

```css
.emotion-day-room { display: block; margin-top: 7px; color: rgba(201,168,76,.62); font: 9px/1 'Noto Sans TC', sans-serif; letter-spacing: .16em; }
```

## styles/08-room-and-community-refinements.css:70

```css
.emotion-week-insight { margin: 22px 0 0; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.07); color: rgba(255,255,255,.52); font: 13px/1.9 'Noto Serif TC', serif; }
```

## styles/08-room-and-community-refinements.css:106

```css
.emotion-week { width: calc(100% - 24px); padding: 26px 16px; }
```

## styles/08-room-and-community-refinements.css:107

```css
.emotion-week-head { align-items: start; flex-direction: column; gap: 12px; }
```

## styles/08-room-and-community-refinements.css:108

```css
.emotion-week-grid { grid-template-columns: repeat(4, minmax(72px,1fr)); overflow-x: auto; padding-bottom: 5px; }
```

## styles/08-room-and-community-refinements.css:109

```css
.emotion-day { min-height: 116px; }
```

## styles/08-room-and-community-refinements.css:114

```css
.emotion-week-grid { grid-template-columns: repeat(7, 78px); }
```

## styles/08-room-and-community-refinements.css:265

```css
.silent-invitation {
  width: min(920px, calc(100% - 36px));
  margin: 46px auto 0;
  padding: clamp(24px,4vw,38px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 34px;
  border: 1px solid rgba(242,232,217,.12);
  border-radius: 24px 3px 24px 3px;
  background: radial-gradient(circle at 82% 30%,rgba(242,232,217,.07),transparent 36%),rgba(3,7,13,.36);
}
```

## styles/08-room-and-community-refinements.css:277

```css
.silent-invitation-kicker,
.silent-company-kicker,
.emotion-year-kicker { margin: 0 0 12px; color: rgba(201,168,76,.58); font: 10px/1.4 'Noto Sans TC',sans-serif; letter-spacing: .27em; }
```

## styles/08-room-and-community-refinements.css:280

```css
.silent-invitation h2 { margin: 0 0 10px; color: rgba(242,232,217,.9); font: 400 clamp(22px,3vw,31px)/1.4 'Noto Serif TC',serif; letter-spacing: .08em; }
```

## styles/08-room-and-community-refinements.css:281

```css
.silent-invitation div > p:last-child { max-width: 600px; margin: 0; color: rgba(232,230,225,.45); font: 12px/1.9 'Noto Serif TC',serif; }
```

## styles/08-room-and-community-refinements.css:282

```css
.silent-enter-btn,
.silent-exit-btn {
  min-height: 48px;
  padding: 0 22px;
  border: 1px solid rgba(242,232,217,.38);
  border-radius: 999px;
  background: transparent;
  color: rgba(242,232,217,.82);
  font: 12px 'Noto Serif TC',serif;
  letter-spacing: .12em;
  cursor: pointer;
  transition: background .25s ease,color .25s ease,border-color .25s ease;
}
```

## styles/08-room-and-community-refinements.css:295

```css
.silent-enter-btn:hover,.silent-enter-btn:focus-visible,
.silent-exit-btn:hover,.silent-exit-btn:focus-visible { border-color: var(--gold); background: rgba(201,168,76,.1); color: #fff0bd; }
```

## styles/08-room-and-community-refinements.css:434

```css
.h-path-nav { grid-template-columns: repeat(2,minmax(0,1fr)); }
```

## styles/08-room-and-community-refinements.css:435

```css
.h-path-nav a:nth-child(3) { border-left: 0; border-top: 1px solid rgba(255,255,255,.08); }
```

## styles/08-room-and-community-refinements.css:436

```css
.h-path-nav a:nth-child(4) { border-top: 1px solid rgba(255,255,255,.08); }
```

## styles/08-room-and-community-refinements.css:439

```css
.silent-invitation,.emotion-year-head { align-items: stretch; flex-direction: column; }
```

## styles/08-room-and-community-refinements.css:440

```css
.silent-enter-btn { width: 100%; }
```

## styles/08-room-and-community-refinements.css:442

```css
.h-path-nav { grid-template-columns: 1fr; }
```

## styles/08-room-and-community-refinements.css:443

```css
.h-path-nav a:nth-child(3),.h-path-nav a:nth-child(4) { border-left: 0; border-top: 1px solid rgba(255,255,255,.08); }
```

## styles/08-room-and-community-refinements.css:537

```css
#room-m .m-input-wrap {
    margin-top: 420px !important;
  }
```

## styles/08-room-and-community-refinements.css:540

```css
#room-m .room-desc,
  #room-h .room-desc {
    font-size: 15px !important;
    line-height: 2 !important;
    letter-spacing: .04em !important;
  }
```

## styles/08-room-and-community-refinements.css:546

```css
#room-m .m-stats {
    position: static !important;
    display: flex !important;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px !important;
    margin-top: 28px !important;
  }
```

## styles/08-room-and-community-refinements.css:554

```css
#room-m .m-stat { max-width: 100%; overflow-wrap: anywhere; line-height: 1.8 !important; }
```

## styles/08-room-and-community-refinements.css:555

```css
#room-m #m-brightest { font-size: 15px; line-height: 1.8; }
```

## styles/08-room-and-community-refinements.css:557

```css
#room-h .h-journey-arc-canvas {
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
  }
```

## styles/08-room-and-community-refinements.css:562

```css
#room-h .h-journey-arc-canvas svg { min-width: 0 !important; }
```

## styles/08-room-and-community-refinements.css:563

```css
#room-h .h-arc-node-core { display: none; }
```

## styles/08-room-and-community-refinements.css:564

```css
#room-h .h-arc-node-order {
    text-anchor: start !important;
    font-size: 14px !important;
    letter-spacing: .04em !important;
  }
```

## styles/08-room-and-community-refinements.css:569

```css
#room-h .h-journey-arc-head h3,
  #room-h .h-long-term-head h3 { line-height: 1.5 !important; }
```

## styles/08-room-and-community-refinements.css:571

```css
#room-h .h-journey-arc-head > p:last-child { line-height: 1.9 !important; }
```

## styles/08-room-and-community-refinements.css:572

```css
#room-h .emotion-week,
  #room-h .emotion-year {
    width: 100%;
    max-width: 100%;
    margin: 40px auto 56px;
    padding: 28px 16px;
    box-sizing: border-box;
  }
```

## styles/08-room-and-community-refinements.css:580

```css
#room-h .emotion-week-head,
  #room-h .emotion-year-head { flex-direction: column; align-items: stretch; gap: 18px; }
```

## styles/08-room-and-community-refinements.css:582

```css
#room-h .emotion-week-grid { grid-template-columns: 1fr; gap: 12px; overflow: visible; }
```

## styles/08-room-and-community-refinements.css:583

```css
#room-h .emotion-day {
    display: grid;
    grid-template-columns: 42px 32px minmax(0,1fr);
    grid-template-rows: auto auto;
    column-gap: 12px;
    row-gap: 6px;
    align-items: center;
    min-height: 80px;
    padding: 16px 12px;
    text-align: left;
  }
```

## styles/08-room-and-community-refinements.css:594

```css
#room-h .emotion-day-name { grid-row: 1 / 3; font-size: 12px; letter-spacing: 0; }
```

## styles/08-room-and-community-refinements.css:595

```css
#room-h .emotion-day-icon { grid-row: 1 / 3; margin: 0; min-height: 0; text-align: center; }
```

## styles/08-room-and-community-refinements.css:596

```css
#room-h .emotion-day-label { font-size: 14px; line-height: 1.6; white-space: normal; overflow-wrap: anywhere; }
```

## styles/08-room-and-community-refinements.css:597

```css
#room-h .emotion-day-room { grid-column: 3; margin: 0; font-size: 10px; line-height: 1.5; }
```

## styles/08-room-and-community-refinements.css:604

```css
.private-weather { text-align: left; padding-bottom: 36px; margin-bottom: 36px; border-bottom: 1px solid rgba(201,168,76,.22); }
```

## styles/08-room-and-community-refinements.css:605

```css
.private-weather .weather-explanation,
.private-weather .weather-summary { color: rgba(242,232,217,.78); font-size: 14px; line-height: 1.9; letter-spacing: .03em; margin: 20px 0; }
```

## styles/08-room-and-community-refinements.css:607

```css
.private-weather button { min-height: 48px; padding: 12px 18px; border: 1px solid rgba(201,168,76,.4); border-radius: 4px; background: transparent; color: var(--fog); font: inherit; font-size: 13px; line-height: 1.6; cursor: pointer; white-space: normal; }
```

## styles/08-room-and-community-refinements.css:608

```css
.private-weather button:hover,
.private-weather button[aria-pressed="true"] { color: var(--gold); background: rgba(201,168,76,.1); border-color: var(--gold); }
```

## styles/08-room-and-community-refinements.css:610

```css
.private-weather .weather-status,
.private-weather .weather-note { color: rgba(242,232,217,.6); font-size: 12px; line-height: 1.9; letter-spacing: .02em; margin: 18px 0; }
```

## styles/08-room-and-community-refinements.css:612

```css
.weather-period { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
```

## styles/08-room-and-community-refinements.css:613

```css
.weather-rooms { list-style: none; padding: 0; margin: 24px 0; display: grid; gap: 18px; }
```

## styles/08-room-and-community-refinements.css:614

```css
.weather-rooms[hidden], .weather-clear-confirm[hidden] { display: none; }
```

## styles/08-room-and-community-refinements.css:615

```css
.weather-rooms li { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px 16px; font-size: 14px; line-height: 1.7; color: rgba(242,232,217,.85); }
```

## styles/08-room-and-community-refinements.css:616

```css
.weather-room-days { color: var(--gold); white-space: nowrap; }
```

## styles/08-room-and-community-refinements.css:617

```css
.weather-track { grid-column: 1 / -1; height: 3px; background: rgba(255,255,255,.09); }
```

## styles/08-room-and-community-refinements.css:618

```css
.weather-track > span { display: block; height: 100%; background: var(--gold); }
```

## styles/08-room-and-community-refinements.css:619

```css
.private-weather .weather-clear { border-color: rgba(242,232,217,.25); }
```

## styles/08-room-and-community-refinements.css:620

```css
.weather-clear-confirm { margin-top: 20px; padding: 18px; background: rgba(201,168,76,.06); border: 1px solid rgba(201,168,76,.3); }
```

## styles/08-room-and-community-refinements.css:621

```css
.weather-clear-confirm p { font-size: 13px; line-height: 1.9; margin-bottom: 16px; }
```

## styles/08-room-and-community-refinements.css:622

```css
.weather-clear-confirm button { margin: 0 8px 8px 0; }
```

## styles/08-room-and-community-refinements.css:624

```css
.private-weather button { max-width: 100%; }
```

## styles/08-room-and-community-refinements.css:625

```css
.private-weather > button { width: 100%; }
```

## styles/08-room-and-community-refinements.css:626

```css
.weather-period button { flex: 1; }
```

## styles/08-room-and-community-refinements.css:627

```css
.weather-rooms li { font-size: 13px; gap: 10px; }
```

## styles/08-room-and-community-refinements.css:628

```css
.weather-clear-confirm button { width: 100%; margin-right: 0; }
```

## styles/08-room-and-community-refinements.css:632

```css
#room-h .h-path-nav {
  position: relative !important;
  inset: auto !important;
  display: grid !important;
  height: auto !important;
  min-height: 0 !important;
  padding: 0 !important;
  align-items: stretch !important;
  justify-content: normal !important;
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transform: none !important;
  z-index: 1;
}
```

