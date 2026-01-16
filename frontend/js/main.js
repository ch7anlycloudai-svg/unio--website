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
    // Mobile Navigation
    // ========================================
    const initMobileNav = () => {
        const navToggle = document.getElementById('navToggle');
        const mainNav = document.getElementById('mainNav');

        if (!navToggle || !mainNav) return;

        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('nav--open');

            // Update aria-expanded
            const isOpen = mainNav.classList.contains('nav--open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when clicking on a link
        const navLinks = mainNav.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('nav--open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && mainNav.classList.contains('nav--open')) {
                mainNav.classList.remove('nav--open');
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

                    // Optional: Close other items in the same accordion
                    // items.forEach(otherItem => {
                    //     otherItem.classList.remove('accordion__item--active');
                    // });

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

                // Filter items
                newsItems.forEach(item => {
                    const category = item.dataset.category;

                    if (filter === 'all' || category === filter) {
                        item.style.display = '';
                        // Add fade-in animation
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        item.style.display = 'none';
                    }
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

        // Membership Form
        const membershipForm = document.getElementById('membershipForm');
        const formSuccess = document.getElementById('formSuccess');

        if (membershipForm) {
            membershipForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (!validateForm(membershipForm)) return;

                const submitBtn = membershipForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'جاري الإرسال...';
                submitBtn.disabled = true;

                // Collect form data
                const formData = {
                    full_name: membershipForm.querySelector('#fullName')?.value || membershipForm.querySelector('[name="fullName"]')?.value,
                    email: membershipForm.querySelector('#memberEmail')?.value || membershipForm.querySelector('[name="email"]')?.value,
                    phone: membershipForm.querySelector('#memberPhone')?.value || membershipForm.querySelector('[name="phone"]')?.value,
                    university: membershipForm.querySelector('#university')?.value || membershipForm.querySelector('[name="university"]')?.value,
                    major: membershipForm.querySelector('#major')?.value || membershipForm.querySelector('[name="major"]')?.value,
                    academic_level: membershipForm.querySelector('#level')?.value || membershipForm.querySelector('[name="level"]')?.value,
                    wilaya: membershipForm.querySelector('#wilaya')?.value || membershipForm.querySelector('[name="wilaya"]')?.value
                };

                try {
                    const response = await fetch(`${API_BASE}/memberships`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    const data = await response.json();

                    if (data.success) {
                        membershipForm.reset();
                        formSuccess.style.display = 'block';
                        setTimeout(() => { formSuccess.style.display = 'none'; }, 5000);
                    } else {
                        alert(data.message || 'حدث خطأ في تسجيل العضوية');
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
    // Header Scroll Effect
    // ========================================
    const initHeaderScroll = () => {
        const header = document.querySelector('.header');

        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.boxShadow = '';
            }

            lastScroll = currentScroll;
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

        // Load dynamic content based on current page
        const currentPage = detectCurrentPage();
        if (currentPage) {
            loadPageContent(currentPage);
        }

        // Load news if on news page or home page
        if (currentPage === 'home' || currentPage === 'news') {
            loadNews();
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
