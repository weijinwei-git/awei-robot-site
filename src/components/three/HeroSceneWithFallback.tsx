import { lazy, Suspense, useEffect, useState } from 'react';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

const LazyScene = lazy(() => import('./HeroScene'));

export default function HeroSceneWithFallback() {
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    setWebgl(detectWebGL());
  }, []);

  if (!webgl) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_45%,rgba(199,242,61,0.08),transparent_70%),radial-gradient(ellipse_50%_40%_at_30%_30%,rgba(62,140,255,0.07),transparent_70%)]" />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_45%,rgba(199,242,61,0.08),transparent_70%),radial-gradient(ellipse_50%_40%_at_30%_30%,rgba(62,140,255,0.07),transparent_70%)]" />
      }
    >
      <LazyScene />
    </Suspense>
  );
}
