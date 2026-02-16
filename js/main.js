// YLASS — Young Leaders Academy of South Sudan
// Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initStatsCounter();
  initDarkMode();
});

// --- Navigation ---
function initNavigation() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const links = navLinks.querySelectorAll('a');

  // Scroll-based nav background (skip on pages with nav-solid)
  const isSolidNav = nav.classList.contains('nav-solid');
  function updateNav() {
    if (!isSolidNav) {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile menu on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active section highlighting
  const sections = document.querySelectorAll('section[id]');
  function highlightNav() {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      const link = navLinks.querySelector(`a[href="#${id}"]`);
      if (link) {
        if (scrollY >= top && scrollY < bottom) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }

  window.addEventListener('scroll', highlightNav, { passive: true });
}

// --- Scroll Animations ---
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// --- Stats Counter Animation ---
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.hero-stat-number[data-target]');
  let animated = false;

  function animateCounters() {
    if (animated) return;
    animated = true;

    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'), 10);
      const duration = 2000;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        stat.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    });
  }

  // Start counter when hero stats are visible
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Small delay so animation is noticeable
          setTimeout(animateCounters, 400);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(heroStats);
  }
}

// --- Dark Mode ---
function initDarkMode() {
  const saved = localStorage.getItem('ylass-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Create toggle button and add to nav
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.className = 'dark-mode-toggle';
  btn.setAttribute('aria-label', 'Toggle dark mode');

  function updateIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark ? '&#9728;' : '&#9789;';
  }

  updateIcon();

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('ylass-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('ylass-theme', 'dark');
    }
    updateIcon();
  });

  li.appendChild(btn);
  navLinks.appendChild(li);
}
