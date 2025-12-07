// Asosiy JavaScript fayli

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            navLinks.style.padding = '1rem';
            navLinks.style.zIndex = '1000';
        });
    }
    
    // Search form
    const searchForm = document.querySelector('.filter-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const searchInput = this.querySelector('input[name="search"]');
            const categorySelect = this.querySelector('select[name="category"]');
            
            // Agar ikkalasi ham bo'sh bo'lsa
            if (!searchInput.value.trim() && !categorySelect.value) {
                e.preventDefault();
                alert('Iltimos, qidirish so\'zi yoki kategoriya tanlang');
            }
        });
    }
    
    // Goal actions
    const joinButtons = document.querySelectorAll('.join-goal-btn');
    joinButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Bu maqsadga qo\'shilmoqchimisiz?')) {
                e.preventDefault();
            }
        });
    });
    
    // Back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: none;
        z-index: 999;
        transition: transform 0.3s;
    `;
    
    document.body.appendChild(backToTopBtn);
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // Form validation
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#f56565';
                    
                    // Error message
                    let errorMsg = field.nextElementSibling;
                    if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = '#f56565';
                        errorMsg.style.fontSize = '0.9rem';
                        errorMsg.style.marginTop = '0.25rem';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                    errorMsg.textContent = 'Bu maydonni to\'ldirish shart';
                } else {
                    field.style.borderColor = '#e2e8f0';
                    const errorMsg = field.nextElementSibling;
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        errorMsg.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });
    
    // Goal filtering
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            
            // Update active state
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Filter goals
            const goalCards = document.querySelectorAll('.goal-card');
            goalCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (category === 'all' || cardCategory === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Loading indicator for AJAX requests
    const ajaxLinks = document.querySelectorAll('a[data-ajax]');
    ajaxLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-ajax') === 'true') {
                e.preventDefault();
                const url = this.href;
                
                // Show loading
                const loading = document.createElement('div');
                loading.className = 'loading';
                loading.style.position = 'fixed';
                loading.style.top = '50%';
                loading.style.left = '50%';
                loading.style.transform = 'translate(-50%, -50%)';
                loading.style.zIndex = '9999';
                document.body.appendChild(loading);
                
                // Fetch content
                fetch(url)
                    .then(response => response.text())
                    .then(html => {
                        // Parse HTML and extract main content
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const mainContent = doc.querySelector('main');
                        
                        if (mainContent) {
                            document.querySelector('main').innerHTML = mainContent.innerHTML;
                            window.history.pushState({}, '', url);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        window.location.href = url;
                    })
                    .finally(() => {
                        loading.remove();
                    });
            }
        });
    });
    
    // Copy link functionality
    const copyButtons = document.querySelectorAll('.copy-link-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            navigator.clipboard.writeText(link)
                .then(() => {
                    const originalText = this.textContent;
                    this.textContent = '✅ Nusxalandi!';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    });
    
    // Theme toggle (optional)
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    
    // Analytics (optional)
    function trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label
            });
        }
    }
    
    // Track page views
    trackEvent('page', 'view', window.location.pathname);
    
    // Track goal views
    const goalTitle = document.querySelector('.goal-title');
    if (goalTitle) {
        const goalName = goalTitle.textContent;
        trackEvent('goal', 'view', goalName);
    }
    
    // Track search
    const searchInputs = document.querySelectorAll('input[name="search"]');
    searchInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value.trim()) {
                trackEvent('search', 'query', this.value);
            }
        });
    });
});