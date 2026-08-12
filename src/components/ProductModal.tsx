import { useEffect, useState } from 'react';

interface ModalProduct {
  id: string;
  name: string;
  en: string;
  type: string;
  tag: string;
  image: string;
  desc: string;
  specs: { label: string; value: string }[];
  price: number;
  taxNote: string;
  video?: string;
}

const BASE = import.meta.env.BASE_URL;

export default function ProductModal() {
  const [product, setProduct] = useState<ModalProduct | null>(null);

  useEffect(() => {
    const open = (e: Event) => {
      const detail = (e as CustomEvent).detail as ModalProduct;
      if (!detail || !detail.id) return;
      setProduct(detail);
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      setProduct(null);
      document.body.style.overflow = '';
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('aw:open-product', open);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('aw:open-product', open);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-void/85 p-4 backdrop-blur-md"
      style={{ animation: 'pm-fade 0.25s ease both' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          document.body.style.overflow = '';
          setProduct(null);
        }
      }}
    >
      <div
        className="relative grid max-h-[92vh] w-full max-w-5xl grid-cols-1 overflow-y-auto border border-neon bg-card md:grid-cols-2"
        style={{ animation: 'pm-pop 0.3s cubic-bezier(0.2, 0.9, 0.25, 1) both' }}
      >
        <button
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center border border-line bg-void/80 font-display text-lg text-neon transition-colors hover:border-neon"
          onClick={() => {
            document.body.style.overflow = '';
            setProduct(null);
          }}
          aria-label="关闭"
        >
          ✕
        </button>

        <div className="relative min-h-[240px] md:min-h-0">
          <img
            src={BASE + product.image.slice(1)}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute left-4 top-4 border border-neon bg-void/80 px-3 py-1 font-display text-xs font-bold tracking-widest text-neon">
            {product.tag}
          </span>
        </div>

        <div className="p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-neon">/ {product.type}</p>
          <div className="mt-2 flex items-baseline gap-4">
            <h3 className="font-display text-4xl font-black tracking-tight text-ivory">
              {product.name}
            </h3>
            <span className="text-sm uppercase tracking-[0.25em] text-dim">{product.en}</span>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-dim">{product.desc}</p>

          <div className="mt-6 border border-line">
            {product.specs.map((s, i) => (
              <div
                key={s.label}
                className="grid grid-cols-2 border-line px-4 py-3 text-sm"
                style={i > 0 ? { borderTopWidth: 1 } : undefined}
              >
                <span className="text-dim">{s.label}</span>
                <span className="text-right font-bold text-ivory">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="price-glow mt-7 font-display text-5xl font-black tracking-tight text-neon">
            ¥{product.price.toLocaleString()}
            <span className="ml-2 align-middle text-sm font-normal tracking-normal text-dim">
              {product.taxNote}
            </span>
          </div>

          {product.video && (
            <div className="mt-8">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-dim">动态演示</p>
              <video
                src={BASE + product.video}
                muted
                loop
                playsinline
                controls
                preload="none"
                className="aspect-video w-full border border-line bg-black object-cover"
              />
            </div>
          )}

          <a
            href="#contact"
            className="mt-8 inline-block border border-neon px-6 py-3 font-display text-sm font-bold tracking-widest text-neon transition-all hover:bg-neon hover:text-void"
            onClick={() => {
              document.body.style.overflow = '';
              setProduct(null);
            }}
          >
            咨询定制 →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pm-pop {
          from { opacity: 0; transform: scale(0.92) translateY(16px) }
          to { opacity: 1; transform: scale(1) translateY(0) }
        }
      `}</style>
    </div>
  );
}
