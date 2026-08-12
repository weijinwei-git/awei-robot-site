import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ---------------- 平滑滚动 ---------------- */

export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  return lenis;
}

/* ---------------- 锚点导航走 lenis ---------------- */

export function initAnchorNav() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href') || '');
      if (!target) return;
      e.preventDefault();
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      if (lenis) {
        lenis.scrollTo(target as HTMLElement, { offset: -64, duration: 1.2 });
      } else {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ---------------- Hero 标题遮罩入场 ---------------- */

export function initHeroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'circ.out' } });
  tl.from('.hero-title-line', {
    yPercent: 110,
    duration: 1.1,
    stagger: 0.12,
  })
    .from('.hero-badge', { opacity: 0, y: 14, duration: 0.5 }, '-=0.6')
    .from('.hero-desc', { opacity: 0, y: 22, duration: 0.7 }, '-=0.4')
    .from('.hero-cta', { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 }, '-=0.5')
    .from('.hero-scroll', { opacity: 0, duration: 0.5 }, '-=0.3');
}

/* ---------------- 通用滚动渐显（GSAP 版，替代旧 reveal） ---------------- */

export function initScrollReveal() {
  gsap.utils.toArray<HTMLElement>('.reveal-gsap').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%' },
      }
    );
  });
}

/* ---------------- 作品卡滚动缩放揭示（窗帘拉开） ---------------- */

export function initWorksReveal() {
  gsap.utils.toArray<HTMLElement>('.work-media').forEach((media) => {
    gsap.fromTo(
      media,
      { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)' },
      {
        clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)',
        duration: 1.4,
        ease: 'power4.out',
        scrollTrigger: { trigger: media, start: 'top 85%' },
      }
    );
  });
}

/* ---------------- SVG draw-on 下划线 ---------------- */

export function initSvgDraw() {
  document.querySelectorAll<SVGPathElement>('path[data-draw]').forEach((path) => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: path, start: 'top 85%' },
    });
  });
}

/* ---------------- 自定义 HUD 光标（三层滞差，无十字线） ---------------- */

export function initRadarCursor() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return;

  const cursor = document.createElement('div');
  cursor.className = 'hud-cursor';
  const core = document.createElement('div');
  core.className = 'hud-core';
  const ring = document.createElement('div');
  ring.className = 'hud-ring';
  const diamond = document.createElement('div');
  diamond.className = 'hud-diamond';
  const diamondSpin = document.createElement('div');
  diamondSpin.className = 'hud-diamond-spin';
  diamond.appendChild(diamondSpin);
  const label = document.createElement('div');
  label.className = 'hud-label';
  cursor.appendChild(core);
  cursor.appendChild(ring);
  cursor.appendChild(diamond);
  cursor.appendChild(label);
  document.body.appendChild(cursor);

  let visible = false;

  const moveCore = gsap.quickTo(core, 'x', { duration: 0.08, ease: 'power2.out' });
  const moveCoreY = gsap.quickTo(core, 'y', { duration: 0.08, ease: 'power2.out' });
  const moveRing = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
  const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  const moveDiamond = gsap.quickTo(diamond, 'x', { duration: 0.9, ease: 'power3.out' });
  const moveDiamondY = gsap.quickTo(diamond, 'y', { duration: 1.15, ease: 'power3.out' });

  window.addEventListener('mousemove', (e) => {
    if (!visible) {
      visible = true;
      gsap.to(cursor, { opacity: 1, duration: 0.4 });
    }
    moveCore(e.clientX);
    moveCoreY(e.clientY);
    moveRing(e.clientX);
    moveRingY(e.clientY);
    moveDiamond(e.clientX);
    moveDiamondY(e.clientY);
  });

  document.addEventListener('mouseleave', () => {
    visible = false;
    gsap.to(cursor, { opacity: 0, duration: 0.35 });
  });

  const setLabel = (text: string) => {
    label.textContent = text;
  };

  document.addEventListener('mouseover', (e) => {
    const t = e.target as HTMLElement;
    const link = t.closest<HTMLElement>('a, button');
    const video = t.closest('video');
    const card = t.closest('.work-card');

    cursor.classList.add('hud-active');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('tel:')) setLabel('CALL://');
      else if (href.startsWith('#')) setLabel('OPEN://');
      else setLabel('EXECUTE');
    } else if (video) {
      setLabel('PLAY');
    } else if (card) {
      setLabel('VIEW://' + (card.dataset.index || ''));
    } else {
      cursor.classList.remove('hud-active');
      label.textContent = '';
    }
  });

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('a, button, video, .work-card')) {
      gsap.fromTo(
        ring,
        { scale: 1.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  });
}

/* ---------------- 横滚产品线时间轴（桌面 pin + 横向位移） ---------------- */

export function initTimeline() {
  const section = document.querySelector<HTMLElement>('[data-timeline]');
  if (!section) return;

  const tracks = section.querySelectorAll<HTMLElement>('.timeline-track');
  if (!tracks.length) return;

  if (!window.matchMedia('(min-width: 1024px)').matches) return;

  const track = tracks[0];

  const scrollDist = () => {
    const rect = section.getBoundingClientRect();
    void rect;
    return Math.max(0, track.scrollWidth - window.innerWidth);
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${scrollDist() + window.innerHeight * 0.35}`,
      scrub: 1,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  tl.to(track, {
    x: () => -Math.max(0, track.scrollWidth - window.innerWidth),
    ease: 'power1.inOut',
    duration: 10,
  });
}

/* ---------------- Footer 机械 wiggle ---------------- */

export function initMechanicalWiggle() {
  document.querySelectorAll<HTMLElement>('[data-wiggle]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      gsap.to(el, {
        rotation: () => gsap.utils.random(-6, 6),
        duration: 0.08,
        repeat: 4,
        yoyo: true,
        ease: 'steps(1)',
        onComplete: () => gsap.to(el, { rotation: 0, duration: 0.3, ease: 'power2.out' }),
      });
    });
  });
}
