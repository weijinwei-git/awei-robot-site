import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  suffix?: string;
  label: string;
  decimal?: number;
}

export default function Counter({ value, suffix = '', label, decimal = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const dur = 1600;
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(value * eased);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="group">
      <div className="font-display text-5xl font-black tracking-tight text-ivory sm:text-6xl">
        <span className="text-neon">{display.toFixed(decimal)}</span>
        <span className="text-neon">{suffix}</span>
      </div>
      <div className="mt-2 text-sm uppercase tracking-[0.2em] text-dim">{label}</div>
      <div className="mt-3 h-px w-10 bg-neon/40 transition-all duration-500 group-hover:w-full" />
    </div>
  );
}
