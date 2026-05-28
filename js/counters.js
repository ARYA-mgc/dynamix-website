/* ============================================================
   Counter Animations
   IntersectionObserver-based count-up animations for stat numbers
   ============================================================ */

class CounterAnimator {
  constructor() {
    this.counters = document.querySelectorAll('[data-count]');
    if (this.counters.length === 0) return;
    this.setupObserver();
  }

  setupObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          this.animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    this.counters.forEach(counter => observer.observe(counter));
  }

  animateCounter(element) {
    const target = element.dataset.count;
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    const isNumber = !isNaN(parseInt(target));

    if (!isNumber) {
      // For non-numeric like "∞"
      element.textContent = prefix + target + suffix;
      element.style.opacity = '1';
      return;
    }

    const end = parseInt(target);
    const duration = 2000;
    const startTime = performance.now();

    const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.floor(easedProgress * end);

      element.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = prefix + end + suffix;
      }
    };

    requestAnimationFrame(step);
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new CounterAnimator();
});
