// 轻量滚动渐显：所有带 .reveal 的元素进入视口时加上 .is-visible
export function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  for (const el of els) io.observe(el);
  return () => io.disconnect();
}
