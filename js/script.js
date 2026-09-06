const API_ENDPOINT = "https://proverkarest.ru/api/lead";


const header = document.getElementById("header");

const onScrollHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
};
window.addEventListener("scroll", onScrollHeader, { passive: true });
onScrollHeader();

const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

const toggleMenu = (force) => {
    const open = force ?? !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
};

burger.addEventListener("click", () => toggleMenu());
nav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => toggleMenu(false))
);

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav__link");

const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) =>
                link.classList.toggle(
                    "is-active",
                    link.getAttribute("href") === `#${entry.target.id}`
                )
            );
        });
    }, { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => sectionObserver.observe(s));

const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const animateCounter = (el) => {
    const target = Number(el.dataset.counter);
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 }
);
document.querySelectorAll("[data-counter]").forEach((el) => counterObserver.observe(el));

const parallaxBlocks = document.querySelectorAll("[data-parallax]");
const PARALLAX_SPEED = 0.12; 
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const updateParallax = () => {
    const viewportH = window.innerHeight;

    parallaxBlocks.forEach((bg) => {
        const rect = bg.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewportH) return; 

        const progress = (rect.top + rect.height / 2 - viewportH / 2) / (viewportH / 2);
        const offset = progress * rect.height * PARALLAX_SPEED;
        bg.style.transform = `translateY(${offset.toFixed(1)}px)`;
    });
};

if (!reduceMotion && parallaxBlocks.length) {
    let parallaxTicking = false;
    const onScrollParallax = () => {
        if (parallaxTicking) return;
        parallaxTicking = true;
        requestAnimationFrame(() => {
            updateParallax();
            parallaxTicking = false;
        });
    };
    window.addEventListener("scroll", onScrollParallax, { passive: true });
    window.addEventListener("resize", onScrollParallax);
    updateParallax();
}

const modal = document.getElementById("modal");
const formState = modal.querySelector('[data-state="form"]');
const successState = modal.querySelector('[data-state="success"]');
const errorState = modal.querySelector('[data-state="error"]');
let lastFocused = null;

const setModalState = (state) => {
    formState.hidden = state !== "form";
    successState.hidden = state !== "success";
    errorState.hidden = state !== "error";
};

const openModal = () => {
    lastFocused = document.activeElement;
    setModalState("form");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    setTimeout(() => modal.querySelector("#f-name") ?.focus(), 350);
};

const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    lastFocused ?.focus();
};

document.querySelectorAll("[data-modal-open]").forEach((btn) =>
    btn.addEventListener("click", openModal)
);
modal.querySelectorAll("[data-modal-close]").forEach((el) =>
    el.addEventListener("click", closeModal)
);
modal.querySelector("[data-back-to-form]").addEventListener("click", () =>
    setModalState("form")
);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

const phoneInput = document.getElementById("f-phone");

const formatPhone = (digits) => {
    let result = "+7";
    if (digits.length > 1) result += " (" + digits.slice(1, 4);
    if (digits.length >= 4) result += ") " + digits.slice(4, 7);
    if (digits.length > 7) result += "-" + digits.slice(7, 9);
    if (digits.length > 9) result += "-" + digits.slice(9, 11);
    return result;
};

phoneInput.addEventListener("focus", () => {
    if (!phoneInput.value) {
        phoneInput.value = "+7 (";
        requestAnimationFrame(() =>
            phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length)
        );
    }
});

phoneInput.addEventListener("input", () => {
    let digits = phoneInput.value.replace(/\D/g, "");

    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11); 

    phoneInput.value = formatPhone(digits);
});

phoneInput.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && phoneInput.value.replace(/\D/g, "").length <= 1) {
        e.preventDefault();
        phoneInput.value = "";
    }
});

phoneInput.addEventListener("blur", () => {
    if (phoneInput.value.replace(/\D/g, "").length <= 1) phoneInput.value = "";
});

const form = document.getElementById("lead-form");
const submitBtn = document.getElementById("submit-btn");

form.querySelector("#f-consent").addEventListener("change", (e) =>
  setFieldError(e.target, false)
);

const setFieldError = (input, hasError) => {
    input.closest(".field").classList.toggle("has-error", hasError);
};

const validate = () => {
    const name = form.name;
    const phone = form.phone;
    const restaurant = form.restaurant;
    let valid = true;

    const nameOk = name.value.trim().length >= 2;
    setFieldError(name, !nameOk);
    valid = valid && nameOk;

    const phoneOk = phone.value.replace(/\D/g, "").length === 11;
    setFieldError(phone, !phoneOk);
    valid = valid && phoneOk;

    const restOk = restaurant.value.trim().length >= 2;
    setFieldError(restaurant, !restOk);
    valid = valid && restOk;

    const consent = form.querySelector("#f-consent");
    const consentOk = consent.checked;
    setFieldError(consent, !consentOk);
    valid = valid && consentOk;

    return valid;
};

form.querySelectorAll("input, textarea").forEach((input) =>
    input.addEventListener("input", () => setFieldError(input, false))
);

form.addEventListener("submit", async(e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        restaurant: form.restaurant.value.trim(),
        comment: form.comment.value.trim(),
    };

    submitBtn.classList.add("is-loading");

    try {
        if (!API_ENDPOINT) {
            console.log("[lead-form] payload:", payload);
            await new Promise((r) => setTimeout(r, 900));
        } else {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        }

        form.reset();
        setModalState("success");
    } catch (err) {
        console.error("[lead-form] Ошибка отправки:", err);
        setModalState("error");
    } finally {
        submitBtn.classList.remove("is-loading");
    }
});

const casesTrack = document.getElementById("cases-track");
const casesPrev = document.getElementById("cases-prev");
const casesNext = document.getElementById("cases-next");
const casesBar = document.getElementById("cases-bar");

if (casesTrack && casesPrev && casesNext && casesBar) {
    const getStep = () => {
        const card = casesTrack.querySelector(".case");
        if (!card) return casesTrack.clientWidth;
        const gap = parseFloat(getComputedStyle(casesTrack).gap) || 20;
        return card.getBoundingClientRect().width + gap;
    };

    const updateCasesNav = () => {
        const maxScroll = casesTrack.scrollWidth - casesTrack.clientWidth;
        casesPrev.disabled = casesTrack.scrollLeft <= 5;
        casesNext.disabled = casesTrack.scrollLeft >= maxScroll - 5;

        const progress = maxScroll > 0 ? casesTrack.scrollLeft / maxScroll : 1;
        const visibleRatio = casesTrack.clientWidth / casesTrack.scrollWidth;
        casesBar.style.width = `${(visibleRatio + (1 - visibleRatio) * progress) * 100}%`;
    };

    casesPrev.addEventListener("click", () =>
        casesTrack.scrollBy({ left: -getStep(), behavior: "smooth" })
    );
    casesNext.addEventListener("click", () =>
        casesTrack.scrollBy({ left: getStep(), behavior: "smooth" })
    );

    casesTrack.addEventListener("scroll", updateCasesNav, { passive: true });
    window.addEventListener("resize", updateCasesNav);
    updateCasesNav();

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    casesTrack.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse") return;
        isDown = true;
        moved = false;
        startX = e.clientX;
        startScroll = casesTrack.scrollLeft;
    });

    window.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 6) {
            moved = true;
            casesTrack.classList.add("is-dragging");
        }
        if (moved) casesTrack.scrollLeft = startScroll - dx;
    });

    window.addEventListener("pointerup", () => {
        isDown = false;
        casesTrack.classList.remove("is-dragging");
    });
}