/**
 * Mauritanian Students' Union Website
 * Main JavaScript File
 */

(function() {
    'use strict';


    // ========================================
    // API Configuration
    // ========================================
    const API_BASE = '/api';

    // ========================================
    // Dynamic Content Loading
    // ========================================

    /**
     * Load page content from API and update DOM
     * @param {string} pageName - Name of the page (home, about, etc.)
     */
    const loadPageContent = async (pageName) => {
        try {
            const response = await fetch(`${API_BASE}/pages/${pageName}`);
            const data = await response.json();

            if (data.success) {
                updatePageContent(data.data);
            }
        } catch (error) {
            console.log('Using static content (API not available)');
        }
    };

    /**
     * Update DOM elements with content from API
     * @param {Object} content - Content object with section_id as keys
     */
    const updatePageContent = (content) => {
        Object.entries(content).forEach(([sectionId, sectionData]) => {
            // Try to find element by data-content attribute
            const element = document.querySelector(`[data-content="${sectionId}"]`);

            if (element) {
                if (sectionData.type === 'html') {
                    element.innerHTML = sectionData.content;
                } else {
                    element.textContent = sectionData.content;
                }
            }
        });
    };

    /**
     * Load news from API
     * @param {number} limit - Number of news items to load
     * @param {string} category - Category filter (optional)
     */
    const loadNews = async (limit = 10, category = 'all') => {
        const newsGrid = document.getElementById('newsGrid');
        const latestNews = document.getElementById('latestNews');

        if (!newsGrid && !latestNews) return;

        try {
            let url = `${API_BASE}/news?limit=${limit}`;
            if (category && category !== 'all') {
                url += `&category=${category}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                if (newsGrid) {
                    renderNewsGrid(newsGrid, data.data);
                }
                if (latestNews) {
                    renderLatestNews(latestNews, data.data.slice(0, 3));
                }
            }
        } catch (error) {
            console.log('Using static news (API not available)');
        }
    };

    /**
     * Render news items to grid
     */
    const renderNewsGrid = (container, newsItems) => {
        container.innerHTML = newsItems.map(news => `
            <article class="card" data-category="${news.category}">
                ${news.image_url ? `
                    <div class="card__image">
                        <img src="${escapeHtml(news.image_url)}" alt="${escapeHtml(news.title)}">
                    </div>
                ` : ''}
                <div class="card__body">
                    <span class="tag tag--${getCategoryClass(news.category)}">${getCategoryLabel(news.category)}</span>
                    <h3 class="card__title">${escapeHtml(news.title)}</h3>
                    <p class="card__text">${escapeHtml(news.content.substring(0, 150))}...</p>
                    <div class="card__meta">
                        <span>${formatDate(news.created_at)}</span>
                        ${news.location ? `<span>${escapeHtml(news.location)}</span>` : ''}
                    </div>
                </div>
            </article>
        `).join('');
    };

    /**
     * Render latest news section (home page)
     */
    const renderLatestNews = (container, newsItems) => {
        container.innerHTML = newsItems.map(news => `
            <article class="card">
                <div class="card__body">
                    <span class="tag tag--${getCategoryClass(news.category)}">${getCategoryLabel(news.category)}</span>
                    <h3 class="card__title">${escapeHtml(news.title)}</h3>
                    <p class="card__text">${escapeHtml(news.content.substring(0, 100))}...</p>
                    <div class="card__meta">
                        <span>${formatDate(news.created_at)}</span>
                    </div>
                </div>
            </article>
        `).join('');
    };

    // Helper functions for news
    const getCategoryLabel = (category) => {
        const labels = { 'news': 'أخبار', 'event': 'فعاليات', 'announcement': 'إعلانات' };
        return labels[category] || category;
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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // ========================================
    // Mobile Navigation with Backdrop
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
            if (backdrop) {
                backdrop.classList.add('nav__backdrop--visible');
            }
        };

        const closeMenu = () => {
            mainNav.classList.remove('nav--open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
            if (backdrop) {
                backdrop.classList.remove('nav__backdrop--visible');
            }
        };

        navToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.contains('nav--open');
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu when clicking on a link
        const navLinks = mainNav.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close menu when clicking backdrop
        if (backdrop) {
            backdrop.addEventListener('click', closeMenu);
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && mainNav.classList.contains('nav--open')) {
                closeMenu();
            }
        });
    };

    // ========================================
    // Accordion
    // ========================================
    const initAccordions = () => {
        const accordions = document.querySelectorAll('.accordion');

        accordions.forEach(accordion => {
            const items = accordion.querySelectorAll('.accordion__item');

            items.forEach(item => {
                const header = item.querySelector('.accordion__header');

                if (!header) return;

                header.addEventListener('click', () => {
                    const isActive = item.classList.contains('accordion__item--active');

                    // Toggle current item
                    if (isActive) {
                        item.classList.remove('accordion__item--active');
                    } else {
                        item.classList.add('accordion__item--active');
                    }
                });
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

        const filterTabs = filterContainer.querySelectorAll('.filter-tab');
        const newsItems = newsGrid.querySelectorAll('.card');

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;

                // Update active tab
                filterTabs.forEach(t => t.classList.remove('filter-tab--active'));
                tab.classList.add('filter-tab--active');

                // Filter items (no animation)
                newsItems.forEach(item => {
                    const category = item.dataset.category;
                    item.style.display = (filter === 'all' || category === filter) ? '' : 'none';
                });
            });
        });
    };

    // ========================================
    // Form Handling (Connected to API)
    // ========================================
    const initForms = () => {
        // Contact Form
        const contactForm = document.getElementById('contactForm');
        const contactSuccess = document.getElementById('contactSuccess');

        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Basic validation
                if (!validateForm(contactForm)) return;

                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'جاري الإرسال...';
                submitBtn.disabled = true;

                // Collect form data
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
                        alert(data.message || 'حدث خطأ في إرسال الرسالة');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('حدث خطأ في الاتصال بالخادم');
                }

                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        }

    };

    // Form Validation
    const validateForm = (form) => {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

        // Remove previous error states
        form.querySelectorAll('.form-error').forEach(el => el.remove());
        form.querySelectorAll('.form-input--error, .form-textarea--error').forEach(el => {
            el.classList.remove('form-input--error', 'form-textarea--error');
        });

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                showError(input, 'هذا الحقل مطلوب');
            } else if (input.type === 'email' && !isValidEmail(input.value)) {
                isValid = false;
                showError(input, 'البريد الإلكتروني غير صالح');
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

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // ========================================
    // Smooth Scroll
    // ========================================
    const initSmoothScroll = () => {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');

                if (targetId === '#') return;

                const target = document.querySelector(targetId);

                if (target) {
                    e.preventDefault();
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };

    // ========================================
    // Glassmorphism Header with Shrink
    // ========================================
    const initHeaderScroll = () => {
        const header = document.querySelector('.header');

        if (!header) return;

        let ticking = false;

        const onScroll = () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                header.classList.add('header--scrolled');
            } else {
                header.classList.remove('header--scrolled');
            }

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(onScroll);
                ticking = true;
            }
        }, { passive: true });
    };

    // ========================================
    // Make Reveal Elements Visible (no animation)
    // ========================================
    const initScrollReveal = () => {
        // Make all elements visible immediately without animation
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('reveal--visible');
        });
        document.querySelectorAll('.reveal-stagger').forEach(el => {
            el.classList.add('reveal-stagger--visible');
        });
    };

    // ========================================
    // Stats Counter (show values immediately)
    // ========================================
    const initStatsCounter = () => {
        const statNumbers = document.querySelectorAll('.stat__number[data-target]');
        statNumbers.forEach(el => {
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            el.textContent = target + suffix;
        });
    };

    // ========================================
    // Back to Top Button
    // ========================================
    const initBackToTop = () => {
        const btn = document.getElementById('backToTop');

        if (!btn) return;

        let ticking = false;

        const onScroll = () => {
            if (window.pageYOffset > 400) {
                btn.classList.add('back-to-top--visible');
            } else {
                btn.classList.remove('back-to-top--visible');
            }
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(onScroll);
                ticking = true;
            }
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    };


    // ========================================
    // Load More (News page)
    // ========================================
    const initLoadMore = () => {
        const loadMoreBtn = document.getElementById('loadMore');

        if (!loadMoreBtn) return;

        loadMoreBtn.addEventListener('click', () => {
            // Simulate loading more content
            loadMoreBtn.textContent = 'جاري التحميل...';
            loadMoreBtn.disabled = true;

            setTimeout(() => {
                loadMoreBtn.textContent = 'لا يوجد المزيد';
                loadMoreBtn.disabled = true;
                loadMoreBtn.style.opacity = '0.5';
            }, 1000);
        });
    };

    // ========================================
    // Hero Carousel
    // ========================================
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

        // Load slides from API
        const loadSlides = async () => {
            try {
                const response = await fetch(`${API_BASE}/media/hero`);
                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    renderSlides(data.data);
                }
            } catch (error) {
                console.log('Using default hero slide');
            }
        };

        // Render slides
        const renderSlides = (slidesData) => {
            // Clear existing slides
            slidesContainer.innerHTML = '';
            dotsContainer.innerHTML = '';

            slidesData.forEach((slide, index) => {
                // Create slide
                const slideEl = document.createElement('div');
                slideEl.className = `hero-carousel__slide ${index === 0 ? 'hero-carousel__slide--active' : ''}`;
                slideEl.dataset.slide = index;

                slideEl.innerHTML = `
                    ${slide.image_url ? `<img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title || '')}" class="hero-carousel__image" loading="${index === 0 ? 'eager' : 'lazy'}">` : ''}
                    <div class="hero-carousel__overlay">
                        <div class="hero-carousel__content">
                            ${slide.title ? `<h1 class="hero-carousel__title">${escapeHtml(slide.title)}</h1>` : ''}
                            ${slide.subtitle ? `<p class="hero-carousel__subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
                            ${slide.link_url ? `
                                <div class="btn-group btn-group--center">
                                    <a href="${escapeHtml(slide.link_url)}" class="btn btn--secondary btn--lg">${escapeHtml(slide.link_text || 'المزيد')}</a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;

                slidesContainer.appendChild(slideEl);

                // Create dot
                const dot = document.createElement('button');
                dot.className = `hero-carousel__dot ${index === 0 ? 'hero-carousel__dot--active' : ''}`;
                dot.dataset.slide = index;
                dot.setAttribute('aria-label', `الشريحة ${index + 1}`);
                dotsContainer.appendChild(dot);
            });

            // Update slides array
            slides = slidesContainer.querySelectorAll('.hero-carousel__slide');

            // Show navigation if more than 1 slide
            if (slides.length > 1) {
                prevBtn.style.display = 'flex';
                nextBtn.style.display = 'flex';
                startAutoplay();
            }

            // Add dot click handlers
            dotsContainer.querySelectorAll('.hero-carousel__dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    goToSlide(parseInt(dot.dataset.slide));
                });
            });
        };

        // Go to specific slide
        const goToSlide = (index) => {
            if (slides.length === 0) return;

            slides[currentSlide].classList.remove('hero-carousel__slide--active');
            dotsContainer.children[currentSlide]?.classList.remove('hero-carousel__dot--active');

            currentSlide = (index + slides.length) % slides.length;

            slides[currentSlide].classList.add('hero-carousel__slide--active');
            dotsContainer.children[currentSlide]?.classList.add('hero-carousel__dot--active');
        };

        // Next slide
        const nextSlide = () => goToSlide(currentSlide + 1);

        // Previous slide
        const prevSlide = () => goToSlide(currentSlide - 1);

        // Autoplay
        const startAutoplay = () => {
            stopAutoplay();
            autoplayInterval = setInterval(nextSlide, 5000);
        };

        const stopAutoplay = () => {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        };

        // Event listeners
        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });

        // Pause autoplay on hover
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', () => {
            if (slides.length > 1) startAutoplay();
        });

        // Load slides
        loadSlides();
    };

    // ========================================
    // Specialties Loading
    // ========================================
    const initSpecialties = () => {
        const grid = document.getElementById('specialtiesGrid');
        if (!grid) return;

        const loadSpecialties = async () => {
            try {
                const response = await fetch(`${API_BASE}/media/specialties`);
                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    renderSpecialties(data.data);
                }
            } catch (error) {
                console.log('Using static specialties');
            }
        };

        const renderSpecialties = (specialties) => {
            // Remove fallback cards
            grid.querySelectorAll('[data-fallback="true"]').forEach(el => el.remove());

            specialties.forEach(spec => {
                const card = document.createElement('div');
                card.className = 'specialty-card';
                card.dataset.id = spec.id;

                const items = Array.isArray(spec.items) ? spec.items : [];

                card.innerHTML = `
                    ${spec.image_url
                        ? `<img src="${escapeHtml(spec.image_url)}" alt="${escapeHtml(spec.name_ar)}" class="specialty-card__image" loading="lazy">`
                        : `<div class="specialty-card__placeholder">${escapeHtml(spec.icon || '📚')}</div>`
                    }
                    <div class="specialty-card__body">
                        <h3 class="specialty-card__title">${escapeHtml(spec.icon || '')} ${escapeHtml(spec.name_ar)}</h3>
                        ${spec.description ? `<p class="specialty-card__description">${escapeHtml(spec.description)}</p>` : ''}
                        ${items.length > 0 ? `
                            <ul class="specialty-card__items">
                                ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${spec.duration ? `<p class="specialty-card__duration">مدة الدراسة: ${escapeHtml(spec.duration)}</p>` : ''}
                        ${spec.video_url ? `
                            <button class="specialty-card__video-btn" data-video="${escapeHtml(spec.video_url)}" data-type="${escapeHtml(spec.video_type || 'youtube')}">
                                ▶️ شاهد فيديو تعريفي
                            </button>
                        ` : ''}
                    </div>
                `;

                grid.appendChild(card);
            });

            // Add video button handlers
            grid.querySelectorAll('.specialty-card__video-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    openVideoModal(btn.dataset.video, btn.dataset.type);
                });
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

        // Close modal
        const closeModal = () => {
            modal.classList.remove('video-modal--open');
            if (iframe) iframe.src = '';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('video-modal--open')) {
                closeModal();
            }
        });

        // Make openVideoModal available globally
        window.openVideoModal = (url, type) => {
            if (!iframe) return;

            let embedUrl = url;

            // Parse URL based on type
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

    // Helper function for openVideoModal (accessible outside IIFE)
    function openVideoModal(url, type) {
        if (window.openVideoModal) {
            window.openVideoModal(url, type);
        }
    }

    // ========================================
    // Initialize Everything
    // ========================================
    const init = () => {
        // Initialize UI components
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

        // Load dynamic content based on current page
        const currentPage = detectCurrentPage();
        if (currentPage) {
            loadPageContent(currentPage);
        }

        // Page-specific initializations
        if (currentPage === 'home') {
            initHeroCarousel();
            loadNews();
        }

        if (currentPage === 'news') {
            loadNews();
        }

        if (currentPage === 'programs') {
            initSpecialties();
        }

        console.log('Website initialized successfully');
    };

    /**
     * Detect current page from URL
     * @returns {string} Page name
     */
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

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
