import { useEffect, useRef, useState } from "react";

/**
 * Home screen for CommunityCleanUp.
 * Buttons open the Login page (#login) or the Register form (#register) by default.
 * You can also pass your own handlers: <Home onLogin={...} onRegister={...} />
 * No extra dependencies. Icons are inline SVG / emoji.
 */

const ORBIT = ["🧴", "📰", "🔋", "🍎", "💡", "🥫"];

const WHY = [
  { icon: "🌍", title: "Cleaner streets, healthier people", text: "Overflowing bins and illegal dumps spread disease, attract pests and pollute water. Reporting them early keeps neighbourhoods safe." },
  { icon: "⚡", title: "Problems reach the right people fast", text: "Reports go straight to staff and admins with a type, location and priority, so urgent hazards are handled first." },
  { icon: "♻️", title: "More waste gets recycled", text: "Tagging waste as recyclable, organic, electronic or hazardous helps the community sort it properly instead of landfilling it." },
  { icon: "🤝", title: "Everyone can see progress", text: "Upvote, comment and follow each report from pending to resolved. Nothing disappears into a black hole." },
];

const STEPS = [
  { t: "Report", d: "Snap a photo, pick the waste type and pin the location." },
  { t: "Review", d: "Staff check the report and start work on it." },
  { t: "Resolve", d: "The issue is cleared and marked resolved for all to see." },
];

const STATS = [
  { n: 3, label: "Waste reports tracked" },
  { n: 5, label: "Waste categories" },
  { n: 3, label: "Roles working together" },
  { n: 24, suffix: "h", label: "Target response time" },
];

function useReveal() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on];
}

function Counter({ to, suffix = "" }) {
  const [ref, on] = useReveal();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / 1400);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, to]);
  return <b ref={ref}>{v}{suffix}</b>;
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, on] = useReveal();
  return (
    <div ref={ref} className={`rv ${on ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Home({
  onLogin = () => { window.location.hash = "login"; },
  onRegister = () => { window.location.hash = "register"; },
}) {
  return (
    <div className="home">
      <style>{css}</style>

      {/* floating leaves in the background */}
      <div className="bg" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${12 + (i % 5) * 3}s`, fontSize: `${14 + (i % 4) * 6}px` }}>🍃</span>
        ))}
      </div>

      <header className="top">
        <div className="logo"><RecycleIcon size={30} /> CommunityCleanUp</div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>
            <span className="line" style={{ animationDelay: ".1s" }}>Report it.</span>
            <span className="line" style={{ animationDelay: ".35s" }}>Track it.</span>
            <span className="line g" style={{ animationDelay: ".6s" }}>Clean it up.</span>
          </h1>
          <p className="lead">
            CommunityCleanUp lets residents report waste problems and lets staff fix them, all in one place where everyone can follow the progress.
          </p>
          <div className="cta">
            <button className="btn solid" onClick={onRegister}>Create an account</button>
            <button className="btn ghost" onClick={onLogin}>Log in</button>
          </div>
        </div>

        <div className="orbit" aria-hidden="true">
          <div className="ring r1" />
          <div className="ring r2" />
          <div className="core"><RecycleIcon size={84} spin /></div>
          <div className="spin">
            {ORBIT.map((e, i) => (
              <span key={i} className="item" style={{ "--a": `${i * (360 / ORBIT.length)}deg` }}>
                <i>{e}</i>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="sec">
        <Reveal><h2>Why a waste reporting system matters</h2></Reveal>
        <Reveal delay={80}>
          <p className="sub">Waste problems get worse the longer nobody notices them. This system makes sure someone always does.</p>
        </Reveal>
        <div className="why">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 120}>
              <article className="tile">
                <div className="ico">{w.icon}</div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        {STATS.map((s) => (
          <div key={s.label}>
            <Counter to={s.n} suffix={s.suffix} />
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS (a real sequence) */}
      <section className="sec">
        <Reveal><h2>How it works</h2></Reveal>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 200} className="stepw">
              <div className="step">
                <div className="dot">{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec closing">
        <Reveal>
          <h2>Your neighbourhood is waiting.</h2>
          <p className="sub">Join in and make the next report count.</p>
        </Reveal>
      </section>

      {/* STICKY BOTTOM BAR */}
      <nav className="bar" aria-label="Account">
        <button className="btn ghost" onClick={onLogin}>Login</button>
        <button className="btn solid pulse" onClick={onRegister}>Register</button>
      </nav>
    </div>
  );
}

function RecycleIcon({ size = 32, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={spin ? "rot" : ""} aria-hidden="true">
      <path d="M7 19H4.8a1.8 1.8 0 0 1-1.5-2.7L5 13.5" />
      <path d="m11 15-3 4 3 4" transform="translate(0 -3)" />
      <path d="M11 4.5 12.2 3a1.8 1.8 0 0 1 3 0l2.6 4.5" />
      <path d="m14 7 5-1 1 5" transform="translate(-1 -1)" />
      <path d="M17 19h2.2a1.8 1.8 0 0 0 1.6-2.6L19.5 14" />
      <path d="m7.5 8.5-2.7 4.7" />
    </svg>
  );
}

const css = `
/* remove the white edges on the sides */
html,body,#root{margin:0;padding:0;width:100%;min-height:100vh;background:#070b14}
body{display:block;min-width:320px}
#root{max-width:none;text-align:left}

.home{--g:#16a34a;--gl:#4ade80;--txt:#e6edf3;--mut:#94a3b8;--card:#131c2b;--line:rgba(148,163,184,.18);
  font-family:'Segoe UI',Tahoma,sans-serif;color:var(--txt);line-height:1.6;min-height:100vh;width:100%;position:relative;overflow-x:hidden;
  background:radial-gradient(circle at top,#14213a 0%,#0b1220 55%,#070b14 100%) fixed;padding-bottom:110px}
.home *{box-sizing:border-box;margin:0}
.bg{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.bg span{position:absolute;top:-40px;opacity:.28;animation:fall linear infinite}
@keyframes fall{0%{transform:translateY(-40px) rotate(0)}100%{transform:translateY(110vh) rotate(360deg)}}
.home>*:not(.bg){position:relative;z-index:1}
.top{max-width:1200px;margin:0 auto;padding:22px 24px}
.logo{display:flex;align-items:center;gap:10px;font-size:1.4rem;font-weight:700}

.hero{max-width:1200px;margin:0 auto;padding:30px 24px 70px;display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:center}
h1{font-size:clamp(2.6rem,7vw,5rem);line-height:1.02;font-weight:800;letter-spacing:-1.5px}
.line{display:block;opacity:0;transform:translateY(40px);animation:up .8s cubic-bezier(.2,.8,.2,1) forwards}
.line.g{background:linear-gradient(90deg,#4ade80,#22d3ee,#4ade80);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:up .8s .6s cubic-bezier(.2,.8,.2,1) forwards,shine 4s linear infinite}
@keyframes up{to{opacity:1;transform:none}}
@keyframes shine{to{background-position:200% 0}}
.lead{margin:24px 0 30px;color:#b6c2d1;font-size:1.15rem;max-width:520px;opacity:0;animation:up .8s 1s forwards}
.cta{display:flex;gap:14px;flex-wrap:wrap;opacity:0;animation:up .8s 1.2s forwards}

.btn{font:600 16px inherit;padding:13px 28px;border-radius:12px;border:2px solid transparent;cursor:pointer;color:var(--txt);transition:transform .2s,box-shadow .2s,background .2s}
.btn:hover{transform:translateY(-3px)}
.btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
.solid{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff}
.solid:hover{box-shadow:0 8px 24px rgba(34,197,94,.4)}
.ghost{background:transparent;border-color:var(--gl);color:var(--gl)}
.ghost:hover{background:var(--gl);color:#0b1220}

/* orbit */
.orbit{position:relative;width:min(440px,86vw);aspect-ratio:1;margin:0 auto;display:grid;place-items:center}
.ring{position:absolute;border-radius:50%;border:1px dashed rgba(74,222,128,.35)}
.r1{inset:6%;animation:pulse 4s ease-in-out infinite}
.r2{inset:26%;border-style:solid;border-color:rgba(74,222,128,.18)}
@keyframes pulse{50%{transform:scale(1.04);border-color:rgba(74,222,128,.7)}}
.core{width:34%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:rgba(22,163,74,.15);box-shadow:0 0 60px rgba(74,222,128,.35)}
.rot{animation:rot 9s linear infinite}
@keyframes rot{to{transform:rotate(360deg)}}
.spin{position:absolute;inset:0;animation:rot 24s linear infinite}
.item{position:absolute;top:50%;left:50%;width:0;height:0;transform:rotate(var(--a))}
.item i{position:absolute;left:-24px;top:calc(-1 * min(220px,43vw) - 24px);width:48px;height:48px;display:grid;place-items:center;font-style:normal;font-size:1.5rem;
  background:var(--card);border:1px solid var(--line);border-radius:50%;box-shadow:0 6px 20px rgba(0,0,0,.5);animation:counter 24s linear infinite}
.item{--a:0deg}
@keyframes counter{to{transform:rotate(-360deg)}}
.item i{transform:rotate(calc(-1 * var(--a)))}

/* sections */
.sec{max-width:1200px;margin:0 auto;padding:60px 24px}
h2{font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.15;margin-bottom:12px}
.sub{color:var(--mut);max-width:620px;font-size:1.05rem}
.rv{opacity:0;transform:translateY(28px);transition:opacity .7s,transform .7s cubic-bezier(.2,.8,.2,1)}
.rv.in{opacity:1;transform:none}
.why{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px;margin-top:36px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;height:100%}
.ico{font-size:2rem;margin-bottom:12px;display:inline-block;animation:bob 3s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-6px)}}
.tile h3{font-size:1.15rem;margin-bottom:8px}
.tile p{color:#b6c2d1;font-size:.96rem}

.stats{max-width:1200px;margin:0 auto;padding:40px 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;text-align:center;
  border-block:1px solid var(--line)}
.stats b{display:block;font-size:3rem;color:var(--gl);font-variant-numeric:tabular-nums}
.stats span{color:var(--mut)}

.steps{display:flex;gap:26px;margin-top:40px;flex-wrap:wrap;position:relative}
.stepw{flex:1;min-width:230px}
.step{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;height:100%}
.dot{width:44px;height:44px;border-radius:50%;background:var(--g);display:grid;place-items:center;font-weight:700;margin-bottom:14px;box-shadow:0 0 0 0 rgba(74,222,128,.6);animation:ping 2.4s infinite}
@keyframes ping{70%{box-shadow:0 0 0 14px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
.step h3{margin-bottom:6px}.step p{color:#b6c2d1}
.closing{text-align:center}.closing .sub{margin:0 auto}

/* bottom bar */
.bar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;gap:14px;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));
  background:rgba(11,18,32,.88);backdrop-filter:blur(12px);border-top:1px solid rgba(74,222,128,.25)}
.bar .btn{flex:1;max-width:240px}
.pulse{animation:glow 2.2s ease-in-out infinite}
@keyframes glow{50%{box-shadow:0 0 22px rgba(34,197,94,.65)}}

@media(max-width:860px){.hero{grid-template-columns:1fr;text-align:center}.lead{margin-inline:auto}.cta{justify-content:center}}
@media(prefers-reduced-motion:reduce){.home *{animation:none!important;transition:none!important}.line,.lead,.cta,.rv{opacity:1;transform:none}}
`;