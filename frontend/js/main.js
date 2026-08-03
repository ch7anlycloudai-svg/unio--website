/**
 * Mauritanian Students' Union Website
 * Main JavaScript File - Bilingual (Arabic / French)
 */

(function() {
    'use strict';

    const API_BASE = '/api';

    // ========================================
    // INTERNATIONALIZATION (i18n)
    // ========================================

    const SUPPORTED_LANGS = ['ar', 'fr'];
    const DEFAULT_LANG = 'ar';

    /** Get current language from localStorage */
    const getLang = () => {
        const stored = localStorage.getItem('lang');
        return SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
    };

    /** Set language and reload page */
    const setLang = (lang) => {
        if (!SUPPORTED_LANGS.includes(lang)) return;
        localStorage.setItem('lang', lang);
        applyLanguage(lang);
    };

    /** Apply language to the document */
    const applyLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Update all static translatable elements
        document.querySelectorAll('[data-ar][data-fr]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (!text) return;

            // Check if the translation contains HTML tags
            if (text.includes('<')) {
                el.innerHTML = text;
                return;
            }

            // Preserve child elements (e.g. SVGs inside buttons)
            const childElements = Array.from(el.children);
            if (childElements.length > 0) {
                // Find the text node and update it, keeping child elements
                let hasTextNode = false;
                for (const node of el.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        node.textContent = text;
                        hasTextNode = true;
                        break;
                    }
                }
                if (!hasTextNode) {
                    // Insert text before first child
                    el.insertBefore(document.createTextNode(text), el.firstChild);
                }
            } else {
                el.textContent = text;
            }
        });

        // Update placeholders for inputs/textareas
        document.querySelectorAll(`[data-${lang}-placeholder]`).forEach(el => {
            el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
        });

        // Update language switcher active state
        const switcher = document.getElementById('langSwitcher');
        if (switcher) {
            switcher.querySelectorAll('.lang-switcher__btn').forEach(btn => {
                btn.classList.toggle('lang-switcher__btn--active', btn.dataset.lang === lang);
            });
        }

        // Reload dynamic content for the new language
        const currentPage = detectCurrentPage();
        if (currentPage) loadPageContent(currentPage);
        if (currentPage === 'home') {
            loadNews();
            loadHeroSlides();
            loadHomepageSpecialties();
        }
        if (currentPage === 'news') loadNews();
        if (currentPage === 'programs') loadSpecialties();
    };

    /** Get localized field from an object: t(obj, 'title') returns obj.title_ar or obj.title_fr */
    const t = (obj, field) => {
        const lang = getLang();
        return obj[`${field}_${lang}`] || obj[`${field}_ar`] || '';
    };

    // ========================================
    // Static UI translations
    // ========================================
    const UI = {
        ar: {
            read_more: '\u0627\u0642\u0631\u0623 \u0627\u0644\u0645\u0632\u064a\u062f',
            loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
            no_more: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0627\u0644\u0645\u0632\u064a\u062f',
            sending: '\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644...',
            field_required: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628',
            invalid_email: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
            send_error: '\u062d\u062f\u062b \u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645',
            cat_news: '\u0623\u062e\u0628\u0627\u0631',
            cat_event: '\u0641\u0639\u0627\u0644\u064a\u0627\u062a',
            cat_announcement: '\u0625\u0639\u0644\u0627\u0646\u0627\u062a',
            know_us: '\u062a\u0639\u0631\u0641 \u0639\u0644\u064a\u0646\u0627',
            student_guide: '\u062f\u0644\u064a\u0644 \u0627\u0644\u0637\u0627\u0644\u0628',
            study_duration: '\u0645\u062f\u0629 \u0627\u0644\u062f\u0631\u0627\u0633\u0629',
            watch_video: '\u25b6\ufe0f \u0634\u0627\u0647\u062f \u0641\u064a\u062f\u064a\u0648 \u062a\u0639\u0631\u064a\u0641\u064a',
            slide_label: '\u0627\u0644\u0634\u0631\u064a\u062d\u0629'
        },
        fr: {
            read_more: 'Lire la suite',
            loading: 'Chargement...',
            no_more: 'Plus de r\u00e9sultats',
            sending: 'Envoi en cours...',
            field_required: 'Ce champ est requis',
            invalid_email: 'Email invalide',
            send_error: 'Erreur de connexion au serveur',
            cat_news: 'Actualit\u00e9s',
            cat_event: '\u00c9v\u00e9nements',
            cat_announcement: 'Annonces',
            know_us: 'D\u00e9couvrez-nous',
            student_guide: 'Guide \u00e9tudiant',
            study_duration: 'Dur\u00e9e des \u00e9tudes',
            watch_video: '\u25b6\ufe0f Voir la vid\u00e9o',
            slide_label: 'Diapositive'
        }
    };

    const ui = (key) => {
        const lang = getLang();
        return (UI[lang] && UI[lang][key]) || UI.ar[key] || key;
    };

    // ========================================
    // Language Switcher Init
    // ========================================
    const initLanguageSwitcher = () => {
        const switcher = document.getElementById('langSwitcher');
        if (!switcher) return;

        const lang = getLang();

        // Set initial active state
        switcher.querySelectorAll('.lang-switcher__btn').forEach(btn => {
            btn.classList.toggle('lang-switcher__btn--active', btn.dataset.lang === lang);

            btn.addEventListener('click', () => {
                const target = btn.dataset.lang;
                if (target !== getLang()) {
                    setLang(target);
                }
            });
        });
    };

    // ========================================
    // Dynamic Content Loading (bilingual)
    // ========================================

    const loadPageContent = async (pageName) => {
        try {
            const response = await fetch(`${API_BASE}/pages/${pageName}`);
            const data = await response.json();
            if (data.success) updatePageContent(data.data);
        } catch (error) {
            console.log('Using static content (API not available)');
        }
    };

    const updatePageContent = (content) => {
        const lang = getLang();
        Object.entries(content).forEach(([sectionId, sectionData]) => {
            const element = document.querySelector(`[data-content="${sectionId}"]`);
            if (!element) return;

            const text = sectionData[`content_${lang}`] || sectionData.content_ar || '';

            if (sectionData.type === 'html') {
                element.innerHTML = text;
            } else {
                if (element.classList.contains('accordion__header')) {
                    const iconSpan = element.querySelector('.accordion__icon');
                    element.innerHTML = text;
                    if (iconSpan) {
                        element.appendChild(iconSpan);
                    } else {
                        const newIcon = document.createElement('span');
                        newIcon.className = 'accordion__icon';
                        newIcon.textContent = '+';
                        element.appendChild(newIcon);
                    }
                } else {
                    element.textContent = text;
                }
            }
        });
    };

    // ========================================
    // News (bilingual)
    // ========================================

    const loadNews = async (limit = 10, category = 'all') => {
        const newsGrid = document.getElementById('newsGrid');
        const latestNews = document.getElementById('latestNews');
        if (!newsGrid && !latestNews) return;

        try {
            let url = `${API_BASE}/news?limit=${limit}`;
            if (category && category !== 'all') url += `&category=${category}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                if (newsGrid) renderNewsGrid(newsGrid, data.data);
                if (latestNews) renderLatestNews(latestNews, data.data.slice(0, 3));
            }
        } catch (error) {
            console.log('Using static news (API not available)');
        }
    };

    const renderNewsGrid = (container, newsItems) => {
        container.innerHTML = newsItems.map(news => `
            <article class="card" data-category="${news.category}">
                ${news.image_url ? `
                    <div class="card__image">
                        <img src="${sanitizeUrl(news.image_url)}" alt="${escapeHtml(t(news, 'title'))}">
                    </div>
                ` : ''}
                <div class="card__body">
                    <span class="tag tag--${getCategoryClass(news.category)}">${getCategoryLabel(news.category)}</span>
                    <h3 class="card__title">${escapeHtml(t(news, 'title'))}</h3>
                    <p class="card__text">${escapeHtml(t(news, 'content').substring(0, 150))}...</p>
                    <div class="card__meta">
                        <span>${formatDate(news.created_at)}</span>
                        ${news.location ? `<span>${escapeHtml(news.location)}</span>` : ''}
                    </div>
                </div>
            </article>
        `).join('');
    };

    const renderLatestNews = (container, newsItems) => {
        container.innerHTML = newsItems.map((news, index) => `
            <article class="news-card" data-aos="fade-up" data-aos-delay="${index * 100}">
                ${news.image_url ? `
                    <div class="news-card__image">
                        <img src="${sanitizeUrl(news.image_url)}" alt="${escapeHtml(t(news, 'title'))}" loading="lazy">
                    </div>
                ` : ''}
                <div class="news-card__body">
                    <div class="news-card__date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${formatDate(news.created_at)}
                    </div>
                    <span class="news-card__tag news-card__tag--${getCategoryClass(news.category)}">${getCategoryLabel(news.category)}</span>
                    <h3 class="news-card__title">${escapeHtml(t(news, 'title'))}</h3>
                    <p class="news-card__text">${escapeHtml(t(news, 'content').substring(0, 120))}...</p>
                    <div class="news-card__footer">
                        <span class="news-card__meta">${news.location ? escapeHtml(news.location) : ''}</span>
                        <a href="news.html" class="news-card__link">
                            ${ui('read_more')}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        </a>
                    </div>
                </div>
            </article>
        `).join('');

        if (typeof AOS !== 'undefined') AOS.refresh();
    };

    const getCategoryLabel = (category) => {
        const key = 'cat_' + category;
        return ui(key) || category;
    };

    const getCategoryClass = (category) => {
        const classes = { 'news': 'primary', 'event': 'success', 'announcement': 'warning' };
        return classes[category] || 'primary';
    };

    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const sanitizeUrl = (url) => {
        if (!url) return '';
        if (/^(https?:\/\/|\/)/i.test(url)) return url;
        return '';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const lang = getLang();
        const locale = lang === 'fr' ? 'fr-FR' : 'ar-DZ';
        return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // ========================================
    // Mobile Navigation
    // ========================================
    const initMobileNav = () => {
        const navToggle = document.getElementById('navToggle');
        const mainNav = document.getElementById('mainNav');
        const backdrop = document.getElementById('navBackdrop');
        if (!navToggle || !mainNav) return;

        const openMenu = () => {
            mainNav.classList.add('nav--open');
            navToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
            if (backdrop) backdrop.classList.add('nav__backdrop--visible');
        };

        const closeMenu = () => {
            mainNav.classList.remove('nav--open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
            if (backdrop) backdrop.classList.remove('nav__backdrop--visible');
        };

        navToggle.addEventListener('click', () => {
            mainNav.classList.contains('nav--open') ? closeMenu() : openMenu();
        });

        mainNav.querySelectorAll('.nav__link').forEach(link => link.addEventListener('click', closeMenu));
        if (backdrop) backdrop.addEventListener('click', closeMenu);
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && mainNav.classList.contains('nav--open')) closeMenu();
        });
    };

    // ========================================
    // Accordion
    // ========================================
    const initAccordions = () => {
        document.querySelectorAll('.accordion').forEach(accordion => {
            accordion.querySelectorAll('.accordion__item').forEach(item => {
                const header = item.querySelector('.accordion__header');
                if (!header) return;
                header.addEventListener('click', () => item.classList.toggle('accordion__item--active'));
            });
        });
    };

    // ========================================
    // News Filter
    // ========================================
    const initNewsFilter = () => {
        const filterContainer = document.getElementById('newsFilter');
        const newsGrid = document.getElementById('newsGrid');
        if (!filterContainer || !newsGrid) return;

        filterContainer.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                filterContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('filter-tab--active'));
                tab.classList.add('filter-tab--active');
                newsGrid.querySelectorAll('.card').forEach(item => {
                    item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
                });
            });
        });
    };

    // ========================================
    // Form Handling
    // ========================================
    const initForms = () => {
        const contactForm = document.getElementById('contactForm');
        const contactSuccess = document.getElementById('contactSuccess');
        if (!contactForm) return;

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(contactForm)) return;

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = ui('sending');
            submitBtn.disabled = true;

            const formData = {
                name: contactForm.querySelector('#name')?.value || contactForm.querySelector('[name="name"]')?.value,
                email: contactForm.querySelector('#email')?.value || contactForm.querySelector('[name="email"]')?.value,
                phone: contactForm.querySelector('#phone')?.value || contactForm.querySelector('[name="phone"]')?.value,
                subject: contactForm.querySelector('#subject')?.value || contactForm.querySelector('[name="subject"]')?.value,
                message: contactForm.querySelector('#message')?.value || contactForm.querySelector('[name="message"]')?.value
            };

            try {
                const response = await fetch(`${API_BASE}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (data.success) {
                    contactForm.reset();
                    contactSuccess.style.display = 'block';
                    setTimeout(() => { contactSuccess.style.display = 'none'; }, 5000);
                } else {
                    alert(data.message || ui('send_error'));
                }
            } catch (error) {
                alert(ui('send_error'));
            }

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };

    const validateForm = (form) => {
        let isValid = true;
        form.querySelectorAll('.form-error').forEach(el => el.remove());
        form.querySelectorAll('.form-input--error, .form-textarea--error').forEach(el => {
            el.classList.remove('form-input--error', 'form-textarea--error');
        });

        form.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                showError(input, ui('field_required'));
            } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                isValid = false;
                showError(input, ui('invalid_email'));
            }
        });
        return isValid;
    };

    const showError = (input, message) => {
        input.classList.add(input.tagName === 'TEXTAREA' ? 'form-textarea--error' : 'form-input--error');
        const error = document.createElement('span');
        error.className = 'form-error';
        error.textContent = message;
        input.parentNode.appendChild(error);
    };

    // ========================================
    // Smooth Scroll, Header, Back to Top
    // ========================================
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
                }
            });
        });
    };

    const initHeaderScroll = () => {
        const header = document.querySelector('.header');
        if (!header) return;
        let ticking = false;
        const onScroll = () => {
            header.classList.toggle('header--scrolled', window.pageYOffset > 80);
            ticking = false;
        };
        onScroll();
        window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
    };

    const initScrollReveal = () => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('reveal--visible'));
        document.querySelectorAll('.reveal-stagger').forEach(el => el.classList.add('reveal-stagger--visible'));
    };

    const initStatsCounter = () => {
        const statNumbers = document.querySelectorAll('.stat-card__number[data-target], .stat__number[data-target]');
        if (statNumbers.length === 0) return;

        const animateCounter = (el) => {
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 2000;
            const startTime = performance.now();
            const update = (currentTime) => {
                const progress = Math.min((currentTime - startTime) / duration, 1);
                el.textContent = Math.round((1 - Math.pow(1 - progress, 3)) * target) + suffix;
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); }
            });
        }, { threshold: 0.5 });
        statNumbers.forEach(el => observer.observe(el));
    };

    const initBackToTop = () => {
        const btn = document.getElementById('backToTop');
        if (!btn) return;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    btn.classList.toggle('back-to-top--visible', window.pageYOffset > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    const initLoadMore = () => {
        const loadMoreBtn = document.getElementById('loadMore');
        if (!loadMoreBtn) return;
        loadMoreBtn.addEventListener('click', () => {
            loadMoreBtn.textContent = ui('loading');
            loadMoreBtn.disabled = true;
            setTimeout(() => {
                loadMoreBtn.textContent = ui('no_more');
                loadMoreBtn.style.opacity = '0.5';
            }, 1000);
        });
    };

    // ========================================
    // Hero Carousel (bilingual)
    // ========================================
    let loadHeroSlides; // forward declaration for language switch

    const initHeroCarousel = () => {
        const carousel = document.getElementById('heroCarousel');
        const slidesContainer = document.getElementById('heroSlides');
        const dotsContainer = document.getElementById('heroDots');
        const prevBtn = document.getElementById('heroPrev');
        const nextBtn = document.getElementById('heroNext');
        if (!carousel || !slidesContainer) return;

        let currentSlide = 0;
        let slides = [];
        let autoplayInterval = null;

        loadHeroSlides = async () => {
            try {
                const response = await fetch(`${API_BASE}/media/hero`);
                const data = await response.json();
                if (data.success && data.data.length > 0) renderSlides(data.data);
            } catch (error) {
                console.log('Using default hero slide');
            }
        };

        const renderSlides = (slidesData) => {
            slidesContainer.innerHTML = '';
            dotsContainer.innerHTML = '';

            slidesData.forEach((slide, index) => {
                const slideEl = document.createElement('div');
                slideEl.className = `hero-carousel__slide ${index === 0 ? 'hero-carousel__slide--active' : ''}`;
                slideEl.dataset.slide = index;

                const title = t(slide, 'title');
                const subtitle = t(slide, 'subtitle');
                const btnText = t(slide, 'button_text');

                slideEl.innerHTML = `
                    ${slide.image_url ? `<img src="${sanitizeUrl(slide.image_url)}" alt="${escapeHtml(title)}" class="hero-carousel__image" loading="${index === 0 ? 'eager' : 'lazy'}">` : ''}
                    <div class="hero-carousel__overlay">
                        <div class="hero-carousel__content">
                            ${title ? `<h1 class="hero-carousel__title animate-fade-up">${escapeHtml(title)}</h1>` : ''}
                            ${subtitle ? `<p class="hero-carousel__subtitle animate-fade-up animate-delay-1">${escapeHtml(subtitle)}</p>` : ''}
                            <div class="btn-group btn-group--center animate-fade-up animate-delay-2">
                                <a href="about.html" class="btn btn--gold btn--lg">${ui('know_us')}</a>
                                <a href="guide.html" class="btn btn--outline-white btn--lg">${ui('student_guide')}</a>
                            </div>
                        </div>
                    </div>
                `;
                slidesContainer.appendChild(slideEl);

                const dot = document.createElement('button');
                dot.className = `hero-carousel__dot ${index === 0 ? 'hero-carousel__dot--active' : ''}`;
                dot.dataset.slide = index;
                dot.setAttribute('aria-label', `${ui('slide_label')} ${index + 1}`);
                dotsContainer.appendChild(dot);
            });

            slides = slidesContainer.querySelectorAll('.hero-carousel__slide');

            if (slides.length > 1) {
                prevBtn.style.display = 'flex';
                nextBtn.style.display = 'flex';
                startAutoplay();
            }

            dotsContainer.querySelectorAll('.hero-carousel__dot').forEach(dot => {
                dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide)));
            });
        };

        const goToSlide = (index) => {
            if (slides.length === 0) return;
            slides[currentSlide].classList.remove('hero-carousel__slide--active');
            dotsContainer.children[currentSlide]?.classList.remove('hero-carousel__dot--active');
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('hero-carousel__slide--active');
            dotsContainer.children[currentSlide]?.classList.add('hero-carousel__dot--active');
        };

        const nextSlide = () => goToSlide(currentSlide + 1);
        const prevSlide = () => goToSlide(currentSlide - 1);
        const startAutoplay = () => { stopAutoplay(); autoplayInterval = setInterval(nextSlide, 5000); };
        const stopAutoplay = () => { if (autoplayInterval) { clearInterval(autoplayInterval); autoplayInterval = null; } };

        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', () => { if (slides.length > 1) startAutoplay(); });

        loadHeroSlides();
    };

    // ========================================
    // Specialties - Homepage (bilingual)
    // ========================================
    let loadHomepageSpecialties;

    const initHomepageSpecialties = () => {
        const grid = document.getElementById('specialtiesGrid');
        if (!grid) return;

        loadHomepageSpecialties = async () => {
            try {
                const response = await fetch(`${API_BASE}/media/specialties`);
                const data = await response.json();
                if (data.success && data.data.length > 0) renderHomepageSpecialties(grid, data.data);
            } catch (error) {
                console.log('Using static specialties');
            }
        };

        const renderHomepageSpecialties = (container, specialties) => {
            container.querySelectorAll('[data-fallback="true"]').forEach(el => el.remove());
            // Clear any previously rendered cards
            container.querySelectorAll('.specialty-card-new:not([data-fallback])').forEach(el => el.remove());

            specialties.forEach((spec, index) => {
                const card = document.createElement('div');
                card.className = 'specialty-card-new';
                card.dataset.id = spec.id;
                card.setAttribute('data-aos', 'fade-up');
                card.setAttribute('data-aos-delay', (index * 100).toString());

                const name = t(spec, 'name');
                const desc = t(spec, 'description');

                card.innerHTML = `
                    <div class="specialty-card-new__image-wrap">
                        ${spec.image_url
                            ? `<img src="${sanitizeUrl(spec.image_url)}" alt="${escapeHtml(name)}" loading="lazy">`
                            : `<div class="specialty-card-new__placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>
                               </div>`
                        }
                    </div>
                    <div class="specialty-card-new__body">
                        <h3 class="specialty-card-new__title">${escapeHtml(spec.icon || '')} ${escapeHtml(name)}</h3>
                        ${desc ? `<p class="specialty-card-new__desc">${escapeHtml(desc)}</p>` : ''}
                    </div>
                `;
                container.appendChild(card);
            });

            if (typeof AOS !== 'undefined') AOS.refresh();
        };

        loadHomepageSpecialties();
    };

    // ========================================
    // Specialties - Programs page (bilingual)
    // ========================================
    let loadSpecialties;

    const initSpecialties = () => {
        const grid = document.getElementById('specialtiesGrid');
        if (!grid) return;

        loadSpecialties = async () => {
            try {
                const response = await fetch(`${API_BASE}/media/specialties`);
                const data = await response.json();
                if (data.success && data.data.length > 0) renderSpecialties(data.data);
            } catch (error) {
                console.log('Using static specialties');
            }
        };

        const renderSpecialties = (specialties) => {
            grid.querySelectorAll('[data-fallback="true"]').forEach(el => el.remove());
            grid.querySelectorAll('.specialty-card').forEach(el => el.remove());

            const lang = getLang();

            specialties.forEach(spec => {
                const card = document.createElement('div');
                card.className = 'specialty-card';
                card.dataset.id = spec.id;

                const name = t(spec, 'name');
                const desc = t(spec, 'description');
                const duration = t(spec, 'duration');
                const items = lang === 'fr' ? (spec.items_fr || []) : (spec.items_ar || []);
                const itemsList = Array.isArray(items) ? items : [];

                card.innerHTML = `
                    ${spec.image_url
                        ? `<img src="${sanitizeUrl(spec.image_url)}" alt="${escapeHtml(name)}" class="specialty-card__image" loading="lazy">`
                        : `<div class="specialty-card__placeholder">${escapeHtml(spec.icon || '')}</div>`
                    }
                    <div class="specialty-card__body">
                        <h3 class="specialty-card__title">${escapeHtml(spec.icon || '')} ${escapeHtml(name)}</h3>
                        ${desc ? `<p class="specialty-card__description">${escapeHtml(desc)}</p>` : ''}
                        ${itemsList.length > 0 ? `
                            <ul class="specialty-card__items">
                                ${itemsList.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${duration ? `<p class="specialty-card__duration">${ui('study_duration')}: ${escapeHtml(duration)}</p>` : ''}
                        ${spec.video_url ? `
                            <button class="specialty-card__video-btn" data-video="${sanitizeUrl(spec.video_url)}" data-type="${escapeHtml(spec.video_type || 'youtube')}">
                                ${ui('watch_video')}
                            </button>
                        ` : ''}
                    </div>
                `;
                grid.appendChild(card);
            });

            grid.querySelectorAll('.specialty-card__video-btn').forEach(btn => {
                btn.addEventListener('click', () => openVideoModal(btn.dataset.video, btn.dataset.type));
            });
        };

        loadSpecialties();
    };

    // ========================================
    // Video Modal
    // ========================================
    const initVideoModal = () => {
        const modal = document.getElementById('videoModal');
        const closeBtn = document.getElementById('videoModalClose');
        const iframe = document.getElementById('videoFrame');
        if (!modal) return;

        const closeModal = () => { modal.classList.remove('video-modal--open'); if (iframe) iframe.src = ''; };
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('video-modal--open')) closeModal(); });

        window.openVideoModal = (url, type) => {
            if (!iframe) return;
            let embedUrl = url;
            if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
                const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
            } else if (type === 'vimeo' || url.includes('vimeo.com')) {
                const match = url.match(/(?:vimeo\.com\/)(\d+)/);
                if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
            } else if (type === 'drive' || url.includes('drive.google.com')) {
                const match = url.match(/(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
                if (match) embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
            }
            iframe.src = embedUrl;
            modal.classList.add('video-modal--open');
        };
    };

    function openVideoModal(url, type) {
        if (window.openVideoModal) window.openVideoModal(url, type);
    }

    // ========================================
    // AOS
    // ========================================
    const initAOS = () => {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800, easing: 'ease-out-cubic', once: true, offset: 50,
                disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            });
        }
    };

    // ========================================
    // Initialize Everything
    // ========================================
    const init = () => {
        // Apply stored language first
        const lang = getLang();
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        initAOS();
        initLanguageSwitcher();
        initMobileNav();
        initAccordions();
        initNewsFilter();
        initForms();
        initSmoothScroll();
        initHeaderScroll();
        initLoadMore();
        initScrollReveal();
        initStatsCounter();
        initBackToTop();
        initVideoModal();

        const currentPage = detectCurrentPage();
        if (currentPage) loadPageContent(currentPage);

        if (currentPage === 'home') {
            initHeroCarousel();
            loadNews();
            initHomepageSpecialties();
        }
        if (currentPage === 'news') loadNews();
        if (currentPage === 'programs') initSpecialties();
        if (currentPage === 'guide') loadPageContent('guide');
        if (currentPage === 'services') loadPageContent('services');
        if (currentPage === 'contact') loadPageContent('contact');

        // Update static translatable elements
        document.querySelectorAll('[data-ar][data-fr]').forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });

        console.log('Website initialized (lang: ' + lang + ')');
    };

    const detectCurrentPage = () => {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('about')) return 'about';
        if (path.includes('news')) return 'news';
        if (path.includes('guide')) return 'guide';
        if (path.includes('programs')) return 'programs';
        if (path.includes('services')) return 'services';
        if (path.includes('contact')) return 'contact';
        return 'home';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
