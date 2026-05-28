/* ============================================================
   Main JavaScript — DynamiX-Labs Website
   Navigation, scroll effects, project carousel, scroll reveal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAVBAR SCROLL EFFECT ----
  const navbar = document.querySelector('.navbar');
  const handleNavScroll = () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ---- ACTIVE NAV LINK ----
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  const highlightNav = () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 200;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });

  // ---- MOBILE MENU ----
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-menu a');

  const toggleMenu = () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  };

  hamburger?.addEventListener('click', toggleMenu);
  mobileOverlay?.addEventListener('click', toggleMenu);
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) toggleMenu();
    });
  });

  // ---- SMOOTH SCROLL ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const position = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    });
  });

  // ---- SCROLL REVEAL ----
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // ---- PROJECT IMAGE CAROUSEL ----
  const carousels = document.querySelectorAll('.project-images');
  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll('img');
    const dots = carousel.querySelectorAll('.carousel-dot');
    if (images.length <= 1) return;

    let currentIndex = 0;
    let interval;

    const showImage = (index) => {
      images.forEach(img => img.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      images[index].classList.add('active');
      dots[index]?.classList.add('active');
      currentIndex = index;
    };

    const nextImage = () => {
      showImage((currentIndex + 1) % images.length);
    };

    // Auto-advance every 4s
    const startInterval = () => {
      interval = setInterval(nextImage, 4000);
    };

    const stopInterval = () => {
      clearInterval(interval);
    };

    // Dot clicks
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopInterval();
        showImage(index);
        startInterval();
      });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopInterval);
    carousel.addEventListener('mouseleave', startInterval);

    // Initialize
    showImage(0);
    startInterval();
  });

  // ---- HERO TYPING EFFECT ----
  const typingElement = document.querySelector('.hero-tagline');
  if (typingElement) {
    const text = typingElement.textContent;
    typingElement.textContent = '';
    typingElement.style.borderRight = '2px solid rgba(0, 212, 255, 0.7)';

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      typingElement.textContent += text[charIndex];
      charIndex++;
      if (charIndex >= text.length) {
        clearInterval(typeInterval);
        // Blink cursor then remove
        setTimeout(() => {
          typingElement.style.borderRight = 'none';
        }, 2000);
      }
    }, 60);
  }

  // ---- CONTACT FORM HANDLER ----
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Sending...';
      submitBtn.disabled = true;

      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const subject = document.getElementById('contact-subject').value;
      const message = document.getElementById('contact-message').value;

      try {
        // Change this to your live backend URL once deployed (e.g., 'https://dynamix-backend.up.railway.app/api/contact')
        const res = await fetch('http://localhost:3001/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });
        
        if (res.ok) {
          submitBtn.innerText = 'Sent Successfully!';
          submitBtn.style.background = '#00d4ff';
          submitBtn.style.color = '#000';
          contactForm.reset();
        } else {
          submitBtn.innerText = 'Error sending';
        }
      } catch (err) {
        submitBtn.innerText = 'Network error';
      }

      setTimeout(() => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        submitBtn.style = '';
      }, 3000);
    });
  }

  // ---- PARALLAX ON SCROLL (subtle) ----
  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    if (heroContent) {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.15}px)`;
        heroContent.style.opacity = 1 - (scrolled / (window.innerHeight * 0.8));
      }
    }
  }, { passive: true });

});
