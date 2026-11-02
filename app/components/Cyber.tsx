// app/components/Cyber.tsx
// Shared cyberpunk building blocks, lifted from the home page so other pages
// (plan, dashboard, check-in…) can reuse the exact same look.
// Colors follow the accent chosen on the Appearance page via --accent-400.
import type { ReactNode } from "react";

export const CYBER_CSS = `
.cp{--c1:var(--accent-600,#059669);--c2:#0891b2;--c3:#db2777;
  --cp-bg:#f4f7fb;--cp-surface:#ffffff;--cp-fg:#0f172a;--cp-muted:#475569;--cp-faint:#64748b;
  --cp-line:rgba(15,23,42,.16);--cp-tint:rgba(15,23,42,.04);--cp-btn-fg:#ffffff;--cp-blend:multiply;color-scheme:light}
.dark .cp{--c1:var(--accent-400,#34d399);--c2:#00e5ff;--c3:#ff2e97;
  --cp-bg:#05060a;--cp-surface:#070a11;--cp-fg:#f5f5f4;--cp-muted:#d6d3d1;--cp-faint:#a8a29e;
  --cp-line:rgba(255,255,255,.14);--cp-tint:rgba(255,255,255,.04);--cp-btn-fg:#021014;--cp-blend:screen;color-scheme:dark}
.cp-frame{background:linear-gradient(135deg,var(--c1),var(--cp-tint) 45%,var(--c2));padding:1px;
  clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.cp-inner{background:var(--cp-surface);
  clip-path:polygon(0 0,calc(100% - 15px) 0,100% 15px,100% 100%,15px 100%,0 calc(100% - 15px))}
.cp-glow{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c1) 55%,transparent))}
.cp-glow-c{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c2) 55%,transparent))}
.cp-btn{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:linear-gradient(90deg,var(--c1),var(--c2));color:var(--cp-btn-fg);font-weight:900;letter-spacing:.12em;
  text-transform:uppercase;transition:filter .2s,transform .2s}
.cp-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.cp-btn:disabled{opacity:.6;pointer-events:none}
.cp-scan{background:repeating-linear-gradient(0deg,color-mix(in oklab,var(--cp-fg) 4%,transparent) 0,color-mix(in oklab,var(--cp-fg) 4%,transparent) 1px,transparent 1px,transparent 3px)}
.cp-floor{background-image:linear-gradient(var(--c1) 1px,transparent 1px),linear-gradient(90deg,var(--c1) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(420px) rotateX(62deg);transform-origin:center top;
  animation:cp-grid 2.2s linear infinite;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%,#000);mask-image:linear-gradient(to bottom,transparent,#000 35%,#000)}
.cp-glitch{position:relative;display:inline-block;text-shadow:0 0 22px color-mix(in oklab,var(--c1) 55%,transparent)}
.cp-glitch::before,.cp-glitch::after{content:attr(data-text);position:absolute;inset:0;pointer-events:none}
.cp-glitch::before{color:var(--c2);animation:cp-glitch-a 5s infinite steps(1);mix-blend-mode:var(--cp-blend)}
.cp-glitch::after{color:var(--c3);animation:cp-glitch-b 5s infinite steps(1);mix-blend-mode:var(--cp-blend)}
.cp-tab{clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
  background:var(--cp-tint);box-shadow:inset 0 0 0 1px var(--cp-line);color:var(--cp-muted);
  font-family:var(--font-geist-mono),monospace;font-size:11px;font-weight:700;letter-spacing:.18em;
  text-transform:uppercase;padding:.55rem .95rem;transition:background .2s,color .2s,box-shadow .2s}
.cp-tab:hover{color:var(--cp-fg);box-shadow:inset 0 0 0 1px var(--c2)}
.cp-tab[aria-selected="true"],.cp-tab[aria-pressed="true"]{background:color-mix(in oklab,var(--c1) 16%,transparent);color:var(--c1);
  box-shadow:inset 0 0 0 1px var(--c1)}
.cp-btn-ghost{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
  background:var(--cp-tint);box-shadow:inset 0 0 0 1px var(--c2);color:var(--c2);font-weight:800;
  letter-spacing:.12em;text-transform:uppercase;transition:background .2s}
.cp-btn-ghost:hover{background:color-mix(in oklab,var(--c2) 12%,transparent)}
.cp-btn-ghost:disabled{opacity:.35;pointer-events:none}
.cp-opt{clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  background:var(--cp-tint);box-shadow:inset 0 0 0 1px var(--cp-line);text-align:left;
  padding:.75rem;transition:background .2s,box-shadow .2s}
.cp-opt:hover{box-shadow:inset 0 0 0 1px var(--c2)}
.cp-opt[aria-pressed="true"]{background:color-mix(in oklab,var(--c1) 14%,transparent);box-shadow:inset 0 0 0 1px var(--c1)}
.cp-input{width:100%;background:var(--cp-tint);border:1px solid var(--cp-line);color:var(--cp-fg);
  padding:.6rem .8rem;font-size:.875rem;outline:none;
  clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
  transition:border-color .2s,box-shadow .2s}
.cp-input::placeholder{color:var(--cp-faint)}
.cp-input:focus{border-color:var(--c2);box-shadow:inset 0 0 0 1px var(--c2)}
@keyframes cp-grid{from{background-position:0 0}to{background-position:0 64px}}
@keyframes cp-blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes cp-glitch-a{0%,90%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  91%{transform:translate(-5px,1px);clip-path:inset(8% 0 58% 0)}93%{transform:translate(4px,-1px);clip-path:inset(62% 0 6% 0)}
  96%{transform:translate(-3px,0);clip-path:inset(30% 0 42% 0)}}
@keyframes cp-glitch-b{0%,88%,100%{transform:translate(0);clip-path:inset(0 0 0 0)}
  89%{transform:translate(5px,-1px);clip-path:inset(50% 0 20% 0)}92%{transform:translate(-4px,1px);clip-path:inset(12% 0 64% 0)}
  95%{transform:translate(3px,0);clip-path:inset(72% 0 4% 0)}}
@media (prefers-reduced-motion:reduce){.cp *,.cp *::before,.cp *::after{animation:none!important}}
`;

export function CyberStyles(): React.JSX.Element {
  return <style>{CYBER_CSS}</style>;
}

/** Page shell: dark backdrop, glowing blobs, perspective grid and scanlines. */
export function CyberShell({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="cp relative -m-4 min-h-screen overflow-hidden bg-[var(--cp-bg)] text-[color:var(--cp-fg)] lg:-m-6">
      <CyberStyles />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full opacity-10 dark:opacity-25 blur-[120px]"
          style={{ background: "var(--c1)" }}
        />
        <div
          className="absolute -right-48 top-1/4 h-[520px] w-[520px] rounded-full opacity-10 dark:opacity-20 blur-[120px]"
          style={{ background: "var(--c3)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-[0.07] dark:opacity-15 blur-[120px]"
          style={{ background: "var(--c2)" }}
        />
        <div className="absolute inset-x-0 top-40 h-[26rem] overflow-hidden opacity-[0.08] dark:opacity-[0.18]">
          <div className="cp-floor h-[160%] w-full" />
        </div>
        <div className="cp-scan absolute inset-0" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function HudLabel({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--c2)]">
      {children}
    </p>
  );
}

/** Clipped-corner gradient frame. */
export function Frame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`cp-frame ${className}`}>
      <div className="cp-inner h-full">{children}</div>
    </div>
  );
}

export function SectionHead({
  code,
  title,
}: {
  code: string;
  title: string;
}): React.JSX.Element {
  return (
    <div className="mb-5 text-left">
      <HudLabel>{`// ${code}`}</HudLabel>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[color:var(--cp-fg)] sm:text-3xl">
        {title}
      </h2>
      <div
        className="mt-3 h-px w-24"
        style={{ background: "linear-gradient(90deg,var(--c1),transparent)" }}
      />
    </div>
  );
}
