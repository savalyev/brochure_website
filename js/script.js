document.addEventListener('DOMContentLoaded', function () {

  /* ===== BURGER MENU ===== */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  burger.addEventListener('click', function () {
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
    });
  });

  /* ===== HEADER SHADOW ON SCROLL ===== */
  const header = document.getElementById('header');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
    } else {
      header.style.boxShadow = 'none';
    }
  });

  /* ===== ACCORDION / FAQ ===== */
  const accordionItems = document.querySelectorAll('.accordion__item');

  accordionItems.forEach(function (item) {
    const header = item.querySelector('.accordion__header');
    const body = item.querySelector('.accordion__body');

    header.addEventListener('click', function () {
      const isActive = item.classList.contains('active');

      accordionItems.forEach(function (el) {
        el.classList.remove('active');
        el.querySelector('.accordion__body').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ===== SCROLL REVEAL ANIMATION ===== */
  const revealTargets = document.querySelectorAll(
    '.card, .process__step, .advantage, .case-card, .about__quote'
  );

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  /* ===== REQUEST FORM SUBMISSION =====
     TODO (заполнить перед запуском):
     1) EMAIL_ENDPOINT — URL вашего email-сервиса (например, Formspree, EmailJS API endpoint,
        или собственный backend, который отправляет письмо).
     2) TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID — для отправки заявки в Telegram-бота.
        ВАЖНО: не хранить токен бота в клиентском JS в продакшене — вызывать через
        собственный backend-эндпоинт (например, /api/lead), который проксирует запрос
        в Telegram Bot API (метод sendMessage), либо в связку aiogram-бота.
        Ниже — заготовка с понятной точкой расширения (submitToBackend).
  */

  const EMAIL_ENDPOINT = ''; // TODO: вставить endpoint для отправки на email
  const BACKEND_LEAD_ENDPOINT = ''; // TODO: вставить endpoint своего backend (email + telegram сразу)

  const form = document.getElementById('request-form');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      message: formData.get('message')
    };

    if (!payload.name || !payload.phone) {
      status.textContent = 'Заполните имя и телефон.';
      return;
    }

    status.textContent = 'Отправка...';

    submitLead(payload)
      .then(function () {
        status.textContent = 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.';
        form.reset();
      })
      .catch(function () {
        status.textContent = 'Не удалось отправить заявку. Попробуйте позже или свяжитесь напрямую.';
      });
  });

  function submitLead(payload) {
    // TODO: заменить на реальный вызов backend/email/telegram, когда появятся эндпоинты.
    if (!BACKEND_LEAD_ENDPOINT && !EMAIL_ENDPOINT) {
      // Временная заглушка — просто логируем локально, чтобы форма работала визуально.
      console.log('Lead payload (заготовка, endpoint не настроен):', payload);
      return Promise.resolve();
    }

    return fetch(BACKEND_LEAD_ENDPOINT || EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

});


/* ============================================= */
/* ============  WOW ENHANCEMENTS  ============= */
/* ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ----- Preloader ----- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', function () {
    setTimeout(function () {
      preloader.classList.add('hide');
    }, 400);
  });
  // fallback in case load event already fired
  setTimeout(function () { preloader.classList.add('hide'); }, 1500);

  /* ----- Cursor glow follow ----- */
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateGlow() {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      cursorGlow.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* ----- Animated number counters ----- */
  const counters = document.querySelectorAll('.stat__num[data-count]');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) { counterObserver.observe(el); });

  /* ----- Reveal animation for headers/pretitles ----- */
  const revealHeaders = document.querySelectorAll('[data-reveal]');
  const headerObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        headerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  revealHeaders.forEach(function (el) { headerObserver.observe(el); });

  /* ----- Parallax blobs on scroll ----- */
  const blobs = document.querySelectorAll('.blob');
  window.addEventListener('scroll', function () {
    const scrollY = window.scrollY;
    blobs.forEach(function (blob, i) {
      const speed = 0.03 + (i % 3) * 0.01;
      blob.style.transform = 'translateY(' + (scrollY * speed) + 'px)';
    });
  });

});
