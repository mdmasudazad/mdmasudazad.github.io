/* =========================================================
   MD. MASUD AZAD — RESEARCH PORTFOLIO
   Main JavaScript
========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. CURRENT YEAR
    ===================================================== */

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       2. MOBILE NAVIGATION
    ===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-menu a");

    function openMenu() {
        if (!menuToggle || !navMenu) return;

        navMenu.classList.add("active");
        document.body.classList.add("menu-open");

        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation menu");
    }

    function closeMenu() {
        if (!menuToggle || !navMenu) return;

        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
    }

    function toggleMenu() {
        if (!navMenu) return;

        if (navMenu.classList.contains("active")) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", toggleMenu);

        navLinks.forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", (event) => {
            const clickedInsideMenu = navMenu.contains(event.target);
            const clickedToggle = menuToggle.contains(event.target);

            if (
                navMenu.classList.contains("active") &&
                !clickedInsideMenu &&
                !clickedToggle
            ) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (
                event.key === "Escape" &&
                navMenu.classList.contains("active")
            ) {
                closeMenu();
                menuToggle.focus();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760) {
                closeMenu();
            }
        });
    }


    /* =====================================================
       3. SMOOTH INTERNAL NAVIGATION
    ===================================================== */

    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const targetElement = document.querySelector(targetId);

            if (!targetElement) return;

            event.preventDefault();

            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            history.replaceState(null, "", targetId);
        });
    });


    /* =====================================================
       4. SCROLL REVEAL ANIMATION
    ===================================================== */

    const revealSelectors = [
        ".section-heading",
        ".content-card",
        ".research-card",
        ".featured-project-content",
        ".project-dashboard-preview",
        ".project-card",
        ".timeline-item",
        ".education-card",
        ".skill-group",
        ".certification-card",
        ".contact-card"
    ];

    const revealElements = document.querySelectorAll(
        revealSelectors.join(",")
    );

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealElements.forEach((element) => {
            element.classList.add("visible");
        });
    } else {
        revealElements.forEach((element) => {
            element.classList.add("reveal");
        });

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -60px 0px"
            }
        );

        revealElements.forEach((element) => {
            revealObserver.observe(element);
        });
    }


    /* =====================================================
       5. ANIMATED RESEARCH METRICS
    ===================================================== */

    const metricNumbers = document.querySelectorAll(".metric-number");

    function animateMetric(element) {
        const originalText = element.textContent.trim();
        const targetValue = Number.parseInt(originalText, 10);

        if (Number.isNaN(targetValue)) return;

        const suffix = originalText.replace(String(targetValue), "");
        const duration = 1100;
        const startTime = performance.now();

        function updateMetric(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress =
                1 - Math.pow(1 - progress, 3);

            const currentValue = Math.round(
                targetValue * easedProgress
            );

            element.textContent = `${currentValue}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(updateMetric);
            } else {
                element.textContent = originalText;
            }
        }

        window.requestAnimationFrame(updateMetric);
    }

    if (
        metricNumbers.length > 0 &&
        !prefersReducedMotion &&
        "IntersectionObserver" in window
    ) {
        const metricObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    animateMetric(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.6
            }
        );

        metricNumbers.forEach((metric) => {
            metricObserver.observe(metric);
        });
    }


    /* =====================================================
       6. ACTIVE NAVIGATION LINK
    ===================================================== */

    const pageSections = document.querySelectorAll("main section[id]");
    const sectionNavLinks = document.querySelectorAll(
        '.nav-menu a[href^="#"]'
    );

    function updateActiveNavigation(sectionId) {
        sectionNavLinks.forEach((link) => {
            const isActive =
                link.getAttribute("href") === `#${sectionId}`;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    if (
        pageSections.length > 0 &&
        "IntersectionObserver" in window
    ) {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                const visibleSections = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (first, second) =>
                            second.intersectionRatio -
                            first.intersectionRatio
                    );

                if (visibleSections.length > 0) {
                    updateActiveNavigation(
                        visibleSections[0].target.id
                    );
                }
            },
            {
                rootMargin: "-25% 0px -60% 0px",
                threshold: [0.05, 0.2, 0.4]
            }
        );

        pageSections.forEach((section) => {
            sectionObserver.observe(section);
        });
    }


    /* =====================================================
       7. PROFILE IMAGE FALLBACK
    ===================================================== */

    const profileImage = document.querySelector(".profile-image");

    if (profileImage) {
        profileImage.addEventListener("error", () => {
            profileImage.alt =
                "Profile image could not be loaded";

            profileImage.style.display = "none";

            const profileFrame =
                profileImage.closest(".profile-frame");

            if (profileFrame) {
                profileFrame.classList.add(
                    "profile-image-missing"
                );
            }
        });
    }


    /* =====================================================
       8. EXTERNAL LINK SECURITY
    ===================================================== */

    const externalLinks = document.querySelectorAll(
        'a[target="_blank"]'
    );

    externalLinks.forEach((link) => {
        const existingRel = link.getAttribute("rel") || "";
        const relValues = new Set(existingRel.split(" ").filter(Boolean));

        relValues.add("noopener");
        relValues.add("noreferrer");

        link.setAttribute(
            "rel",
            Array.from(relValues).join(" ")
        );
    });


    /* =====================================================
       9. PAGE LOADED STATE
    ===================================================== */

    document.body.classList.add("page-loaded");

});
