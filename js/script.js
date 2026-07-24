/* =========================================================
   EDITKARO.IN — site script
   Handles: mobile nav, portfolio filtering, marquee duplication,
   and form submission to a Google Apps Script Web App which
   appends rows to a Google Sheet (Email list + Contact leads).
   ========================================================= */

// ---------------------------------------------------------
// 1. CONFIG — paste your deployed Apps Script Web App URL here.
//    See README.md -> "Google Sheets integration" for the
//    step-by-step setup (Apps Script code included there).
// ---------------------------------------------------------
const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// ---------------------------------------------------------
// Mobile nav toggle
// ---------------------------------------------------------
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        navToggle.textContent = isOpen ? "✕" : "☰";
    });
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            navToggle.textContent = "☰";
            navToggle.setAttribute("aria-expanded", "false");
        });
    });
}

// Highlight the active nav link based on current page
(function highlightActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(a => {
        const href = a.getAttribute("href");
        if (href === path || (path === "" && href === "index.html")) {
            a.classList.add("active");
        }
    });
})();

// ---------------------------------------------------------
// Duplicate marquee content so the CSS scroll loop is seamless
// ---------------------------------------------------------
document.querySelectorAll(".marquee-track").forEach(track => {
    track.innerHTML += track.innerHTML;
});

// ---------------------------------------------------------
// Portfolio filtering
// ---------------------------------------------------------
const filterBtns = document.querySelectorAll(".filter-btn");
const reelCards = document.querySelectorAll(".reel-card");
if (filterBtns.length) {
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const category = btn.dataset.filter;
            reelCards.forEach(card => {
                const match = category === "all" || card.dataset.category === category;
                card.style.display = match ? "" : "none";
            });
        });
    });
}

// ---------------------------------------------------------
// Generic form submission helper (posts to Apps Script)
// ---------------------------------------------------------
async function submitToSheet(form, statusEl, successMessage, extraFields = {}) {
    const data = { ...Object.fromEntries(new FormData(form).entries()), ...extraFields };

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
        statusEl.textContent =
            "Form is not connected to Google Sheets yet — add your Apps Script URL in js/script.js (see README).";
        statusEl.className = "form-status err";
        console.log("Form data (not sent, no script URL configured):", data);
        return;
    }

    statusEl.textContent = "Sending…";
    statusEl.className = "form-status";

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Apps Script web apps don't return CORS headers by default
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        // With no-cors we can't read the response, so we optimistically confirm.
        statusEl.textContent = successMessage;
        statusEl.className = "form-status ok";
        form.reset();
    } catch (err) {
        statusEl.textContent = "Something went wrong. Please try again in a moment.";
        statusEl.className = "form-status err";
        console.error(err);
    }
}

// Home page — email collector
const subscribeForm = document.getElementById("subscribe-form");
if (subscribeForm) {
    subscribeForm.addEventListener("submit", e => {
        e.preventDefault();
        const statusEl = document.getElementById("subscribe-status");
        submitToSheet(subscribeForm, statusEl, "You're on the list — check your inbox for a welcome note.", {
            formType: "newsletter",
        });
    });
}

// Contact page — full contact form
const contactForm = document.getElementById("contact-form");
if (contactForm) {
    contactForm.addEventListener("submit", e => {
        e.preventDefault();
        const statusEl = document.getElementById("contact-status");
        submitToSheet(contactForm, statusEl, "Message sent — we reply to every enquiry within one business day.", {
            formType: "contact",
        });
    });
}

// ---------------------------------------------------------
// Footer year
// ---------------------------------------------------------
document.querySelectorAll(".year").forEach(el => {
    el.textContent = new Date().getFullYear();
});
