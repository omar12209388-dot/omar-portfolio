/**
 * OMAR SAAD PORTFOLIO — "SIGNAL TO INSIGHT"
 * Vanilla ES6 JavaScript with optional GSAP 3.12.5 + ScrollTrigger
 * and full IntersectionObserver / prefers-reduced-motion fallbacks.
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------------------
     1. PORTRAIT IMAGE GRACEFUL MONOGRAM ("OS") FALLBACK
     -------------------------------------------------------------------------- */
  const portraitImg = document.getElementById('portraitImg');
  if (portraitImg) {
    const handleImageError = () => {
      portraitImg.classList.add('img-hidden');
    };
    portraitImg.addEventListener('error', handleImageError);
    if (portraitImg.complete && portraitImg.naturalWidth === 0) {
      handleImageError();
    }
  }

  /* --------------------------------------------------------------------------
     2. DARK / LIGHT THEME TOGGLE
     -------------------------------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const htmlEl = document.documentElement;

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-theme', nextTheme);
    });
  }

  /* --------------------------------------------------------------------------
     3. MOBILE NAVIGATION TOGGLE
     -------------------------------------------------------------------------- */
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileNavToggle && navLinks) {
    mobileNavToggle.addEventListener('click', () => {
      const expanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
      mobileNavToggle.setAttribute('aria-expanded', String(!expanded));
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNavToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. SPLIT-LETTER HERO NAME REVEAL (Accessible to Screen Readers)
     -------------------------------------------------------------------------- */
  const splitTarget = document.querySelector('[data-split-reveal]');
  if (splitTarget && !prefersReducedMotion) {
    const rawText = splitTarget.textContent.trim();
    splitTarget.setAttribute('aria-label', rawText);
    splitTarget.innerHTML = '';

    [...rawText].forEach((char, idx) => {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${idx * 45}ms`;
      splitTarget.appendChild(span);
    });
  }

  /* --------------------------------------------------------------------------
     5. SCROLL PROGRESS HEARTBEAT BAR
     -------------------------------------------------------------------------- */
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const updateScrollProgress = () => {
    if (!scrollProgressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    scrollProgressBar.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* --------------------------------------------------------------------------
     6. HERO CANVAS: ECG WAVEFORM DISSOLVING INTO AI DATA TOKENS ON SCROLL
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('signalCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let phase = 0;
    let scrollMorph = 0;

    const tokens = Array.from({ length: 38 }, (_, i) => ({
      offset: i / 38,
      jitterY: (Math.sin(i * 7.3) * 0.5) * 48,
      radius: (i % 3) + 1.8
    }));

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    window.addEventListener('scroll', () => {
      const heroHeight = canvas.parentElement.offsetHeight || 700;
      scrollMorph = Math.min(1, Math.max(0, window.scrollY / (heroHeight * 0.75)));
    }, { passive: true });

    // Synthetic P-Q-R-S-T clinical waveform generator
    const ecgSample = (t) => {
      const cycle = ((t % 1) + 1) % 1;
      let y = 0;
      // P wave
      y += 0.14 * Math.exp(-Math.pow((cycle - 0.22) / 0.035, 2));
      // Q dip
      y -= 0.18 * Math.exp(-Math.pow((cycle - 0.36) / 0.012, 2));
      // R spike
      y += 0.95 * Math.exp(-Math.pow((cycle - 0.39) / 0.014, 2));
      // S dip
      y -= 0.28 * Math.exp(-Math.pow((cycle - 0.42) / 0.014, 2));
      // T wave
      y += 0.24 * Math.exp(-Math.pow((cycle - 0.60) / 0.045, 2));
      return y;
    };

    const drawSignal = () => {
      ctx.clearRect(0, 0, width, height);
      const midY = height * 0.54;
      const amplitude = Math.min(height * 0.18, 95);

      // Continuous ECG trace (fades slightly as scrollMorph increases)
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(45, 212, 191, ${0.55 * (1 - scrollMorph * 0.65)})`;
      ctx.lineWidth = 2;

      const step = 4;
      for (let x = 0; x <= width; x += step) {
        const normX = x / Math.max(width, 1);
        const signalY = ecgSample(normX * 3.2 - phase);
        const y = midY - signalY * amplitude * (1 - scrollMorph * 0.45);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Token stream nodes (emerge as user scrolls or along right half of viewport)
      tokens.forEach((tok) => {
        const x = ((tok.offset + phase * 0.25) % 1) * width;
        const normX = x / Math.max(width, 1);
        const tokenWeight = Math.min(1, Math.max(scrollMorph, (normX - 0.45) * 1.6));
        if (tokenWeight <= 0.05) return;

        const ecgY = midY - ecgSample(normX * 3.2 - phase) * amplitude;
        const targetY = midY + tok.jitterY * tokenWeight;
        const y = ecgY * (1 - tokenWeight) + targetY * tokenWeight;

        ctx.beginPath();
        ctx.fillStyle = normX > 0.65
          ? `rgba(245, 183, 107, ${0.65 * tokenWeight})`
          : `rgba(45, 212, 191, ${0.65 * tokenWeight})`;
        ctx.arc(x, y, tok.radius + tokenWeight * 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        phase += 0.0045;
        requestAnimationFrame(drawSignal);
      }
    };

    drawSignal();
  }

  /* --------------------------------------------------------------------------
     7. ALLOWED NUMBERS COUNTER ANIMATION
     -------------------------------------------------------------------------- */
  const counters = document.querySelectorAll('.fact-counter');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target) || prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }

    const duration = 700;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = String(target);
      }
    };

    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach((c) => counterObserver.observe(c));
  }

  /* --------------------------------------------------------------------------
     8. AI QUALITY & EVALUATION FILTERABLE CARDS
     -------------------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const aiCards = document.querySelectorAll('#aiCardsGrid .ai-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-filter');

      filterBtns.forEach((b) => {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', String(isCurrent));
      });

      aiCards.forEach((card) => {
        const cats = (card.getAttribute('data-categories') || '').split(',').map((s) => s.trim());
        const show = selected === 'all' || cats.includes(selected);
        card.classList.toggle('hidden-card', !show);
      });
    });
  });

  /* --------------------------------------------------------------------------
     9. ACCESSIBLE RECOMMENDATIONS CAROUSEL (Keyboard + Pause Controls)
     -------------------------------------------------------------------------- */
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const pauseBtn = document.getElementById('carouselPause');
  const pauseBtnText = document.getElementById('pauseBtnText');
  const carouselEl = document.getElementById('recCarousel');

  let currentSlide = 0;
  let isPaused = prefersReducedMotion;
  let carouselTimer = null;

  const showSlide = (index) => {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      const active = idx === currentSlide;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    dots.forEach((dot, idx) => {
      const active = idx === currentSlide;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  };

  const startCarousel = () => {
    stopCarousel();
    if (!isPaused && !prefersReducedMotion) {
      carouselTimer = setInterval(() => {
        showSlide(currentSlide + 1);
      }, 6500);
    }
  };

  const stopCarousel = () => {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  };

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      showSlide(currentSlide - 1);
      startCarousel();
    });

    nextBtn.addEventListener('click', () => {
      showSlide(currentSlide + 1);
      startCarousel();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetIdx = parseInt(dot.getAttribute('data-slide'), 10);
      showSlide(targetIdx);
      startCarousel();
    });
  });

  if (pauseBtn && pauseBtnText) {
    if (prefersReducedMotion) {
      pauseBtn.setAttribute('aria-pressed', 'true');
      pauseBtnText.textContent = 'Play';
    }

    pauseBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      pauseBtn.setAttribute('aria-pressed', String(isPaused));
      pauseBtnText.textContent = isPaused ? 'Play' : 'Pause';
      if (isPaused) {
        stopCarousel();
      } else {
        startCarousel();
      }
    });
  }

  if (carouselEl) {
    carouselEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showSlide(currentSlide - 1);
        startCarousel();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showSlide(currentSlide + 1);
        startCarousel();
      }
    });
  }

  startCarousel();

  /* --------------------------------------------------------------------------
     10. COPY EMAIL BUTTON (Privacy-first, no backend forms)
     -------------------------------------------------------------------------- */
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const copyEmailText = document.getElementById('copyEmailText');

  if (copyEmailBtn && copyEmailText) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = copyEmailBtn.getAttribute('data-email') || 'omar12209388@gmail.com';
      try {
        await navigator.clipboard.writeText(email);
        copyEmailText.textContent = 'Copied: ' + email;
      } catch (_) {
        // Fallback textarea copy
        const temp = document.createElement('textarea');
        temp.value = email;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        copyEmailText.textContent = 'Copied: ' + email;
      }

      setTimeout(() => {
        copyEmailText.textContent = 'Copy email address';
      }, 2800);
    });
  }

  /* --------------------------------------------------------------------------
     11. SUBTLE CARD TILT & MAGNETIC BUTTONS (Disabled on Reduced Motion)
     -------------------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     12. GSAP 3.12.5 + SCROLLTRIGGER OR INTERSECTIONOBSERVER FALLBACK
     -------------------------------------------------------------------------- */
  const initScrollAnimations = () => {
    const splitScene = document.getElementById('splitScene');

    if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
      window.gsap.registerPlugin(window.ScrollTrigger);

      // Reveal cards smoothly
      window.gsap.utils.toArray('.reveal-up').forEach((el) => {
        window.gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%'
            }
          }
        );
      });

      // Merge "Two rooms, one standard" scene on scroll
      if (splitScene) {
        window.ScrollTrigger.create({
          trigger: splitScene,
          start: 'top 70%',
          onEnter: () => splitScene.classList.add('merged'),
          onLeaveBack: () => splitScene.classList.remove('merged')
        });
      }
    } else if ('IntersectionObserver' in window) {
      // Graceful fallback when GSAP CDN is blocked or offline
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('merged');
          }
        });
      }, { threshold: 0.25 });

      if (splitScene) io.observe(splitScene);
    }
  };

  window.addEventListener('load', initScrollAnimations);
})();