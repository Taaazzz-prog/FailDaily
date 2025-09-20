// JavaScript pour le site CGU FailDaily

document.addEventListener('DOMContentLoaded', function() {
    // Menu hamburger
    initHamburgerMenu();
    
    // Navigation smooth scroll
    initSmoothScrolling();
    
    // Gestion des cookies
    initCookieManagement();
    
    // Animations d'entrée
    initScrollAnimations();
    
    // Navigation active
    initActiveNavigation();
    
    // Accordéons pour mobile
    initMobileAccordions();
});

/**
 * Menu hamburger pour mobile
 */
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!hamburgerBtn || !mainNav) return;
    
    // Toggle menu
    hamburgerBtn.addEventListener('click', function() {
        const isOpen = hamburgerBtn.classList.contains('active');
        
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Fermer le menu quand on clique sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // Fermer le menu avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && hamburgerBtn.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', function(e) {
        if (!hamburgerBtn.contains(e.target) && !mainNav.contains(e.target)) {
            closeMenu();
        }
    });
    
    function openMenu() {
        hamburgerBtn.classList.add('active');
        mainNav.classList.add('active');
        document.body.classList.add('menu-open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
    
    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Navigation smooth scroll
 */
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Mise à jour de l'URL sans reload
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

/**
 * Gestion des cookies et préférences
 */
function initCookieManagement() {
    // Vérifier si les préférences cookies existent
    checkCookieConsent();
}

function checkCookieConsent() {
    const consent = localStorage.getItem('faildaily_cookie_consent');
    
    if (!consent) {
        showCookieBanner();
    }
}

function showCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-banner-content">
            <div class="cookie-banner-text">
                <h4>🍪 Gestion des cookies</h4>
                <p>Ce site utilise des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences.</p>
            </div>
            <div class="cookie-banner-actions">
                <button onclick="acceptAllCookies()" class="btn-primary">Tout accepter</button>
                <button onclick="openCookieSettings()" class="btn-secondary">Personnaliser</button>
                <button onclick="rejectOptionalCookies()" class="btn-secondary">Essentiels seulement</button>
            </div>
        </div>
    `;
    
    // Styles pour la bannière
    const style = document.createElement('style');
    style.textContent = `
        .cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--bg-dark);
            color: var(--text-inverse);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-xl);
            z-index: 1000;
            border-top: 3px solid var(--primary-color);
        }
        
        .cookie-banner-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--spacing-lg);
            flex-wrap: wrap;
        }
        
        .cookie-banner-text h4 {
            margin: 0 0 var(--spacing-sm) 0;
            font-size: 1.125rem;
        }
        
        .cookie-banner-text p {
            margin: 0;
            opacity: 0.9;
            font-size: 0.875rem;
        }
        
        .cookie-banner-actions {
            display: flex;
            gap: var(--spacing-md);
            flex-wrap: wrap;
        }
        
        .cookie-banner-actions button {
            padding: var(--spacing-sm) var(--spacing-md);
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-weight: 500;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .cookie-banner-content {
                flex-direction: column;
                text-align: center;
            }
            
            .cookie-banner-actions {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(banner);
}

function acceptAllCookies() {
    const preferences = {
        essential: true,
        functional: true,
        analytics: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('faildaily_cookie_consent', JSON.stringify(preferences));
    hideCookieBanner();
    
    console.log('✅ Tous les cookies acceptés');
}

function rejectOptionalCookies() {
    const preferences = {
        essential: true,
        functional: false,
        analytics: false,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('faildaily_cookie_consent', JSON.stringify(preferences));
    hideCookieBanner();
    
    console.log('✅ Seuls les cookies essentiels acceptés');
}

function openCookieSettings() {
    hideCookieBanner();
    showCookieModal();
}

function showCookieModal() {
    const modal = document.createElement('div');
    modal.className = 'cookie-modal';
    modal.innerHTML = `
        <div class="cookie-modal-content">
            <div class="cookie-modal-header">
                <h3>🍪 Paramètres des cookies</h3>
                <button onclick="closeCookieModal()" class="close-btn">&times;</button>
            </div>
            
            <div class="cookie-modal-body">
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>🔒 Cookies essentiels</h4>
                        <span class="required-label">Requis</span>
                    </div>
                    <p>Nécessaires au fonctionnement du site (authentification, sécurité).</p>
                    <input type="checkbox" checked disabled>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>⚙️ Cookies fonctionnels</h4>
                        <input type="checkbox" id="functional-cookies" checked>
                    </div>
                    <p>Mémorisation de vos préférences (langue, thème, paramètres).</p>
                </div>
                
                <div class="cookie-category">
                    <div class="cookie-category-header">
                        <h4>📊 Cookies analytiques</h4>
                        <input type="checkbox" id="analytics-cookies">
                    </div>
                    <p>Mesure d'audience anonyme pour améliorer le site.</p>
                </div>
            </div>
            
            <div class="cookie-modal-footer">
                <button onclick="saveCookiePreferences()" class="btn-primary">Sauvegarder mes préférences</button>
                <button onclick="closeCookieModal()" class="btn-secondary">Annuler</button>
            </div>
        </div>
    `;
    
    // Styles pour le modal
    const style = document.createElement('style');
    style.textContent = `
        .cookie-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: var(--spacing-lg);
        }
        
        .cookie-modal-content {
            background: var(--bg-primary);
            border-radius: var(--border-radius-lg);
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
        }
        
        .cookie-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--border-color);
        }
        
        .cookie-modal-header h3 {
            margin: 0;
            color: var(--primary-color);
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-muted);
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .close-btn:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .cookie-modal-body {
            padding: var(--spacing-lg);
        }
        
        .cookie-category {
            margin-bottom: var(--spacing-lg);
            padding: var(--spacing-md);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
        }
        
        .cookie-category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-sm);
        }
        
        .cookie-category h4 {
            margin: 0;
            font-size: 1rem;
            color: var(--text-primary);
        }
        
        .required-label {
            background: var(--success-color);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .cookie-category p {
            margin: 0;
            font-size: 0.875rem;
            color: var(--text-muted);
            line-height: 1.5;
        }
        
        .cookie-modal-footer {
            padding: var(--spacing-lg);
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: var(--spacing-md);
            justify-content: flex-end;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Charger les préférences existantes
    loadCookiePreferences();
}

function loadCookiePreferences() {
    const consent = localStorage.getItem('faildaily_cookie_consent');
    
    if (consent) {
        const preferences = JSON.parse(consent);
        
        document.getElementById('functional-cookies').checked = preferences.functional || false;
        document.getElementById('analytics-cookies').checked = preferences.analytics || false;
    }
}

function saveCookiePreferences() {
    const preferences = {
        essential: true,
        functional: document.getElementById('functional-cookies').checked,
        analytics: document.getElementById('analytics-cookies').checked,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('faildaily_cookie_consent', JSON.stringify(preferences));
    closeCookieModal();
    
    console.log('✅ Préférences cookies sauvegardées:', preferences);
}

function closeCookieModal() {
    const modal = document.querySelector('.cookie-modal');
    if (modal) {
        modal.remove();
    }
}

function hideCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
        banner.remove();
    }
}

/**
 * Animations d'entrée au scroll
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    const elementsToAnimate = document.querySelectorAll('.legal-article, .quick-nav-card, .contact-card, .right-detail');
    elementsToAnimate.forEach(el => observer.observe(el));
    
    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
        .legal-article, .quick-nav-card, .contact-card, .right-detail {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Navigation active selon la section
 */
function initActiveNavigation() {
    const sections = document.querySelectorAll('.legal-section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                updateActiveNavLink(sectionId);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
    
    function updateActiveNavLink(activeSectionId) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeSectionId}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Style pour le lien actif
    const style = document.createElement('style');
    style.textContent = `
        .nav-link.active {
            background-color: rgba(255, 255, 255, 0.3) !important;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Accordéons pour mobile
 */
function initMobileAccordions() {
    if (window.innerWidth <= 768) {
        const articles = document.querySelectorAll('.legal-article');
        
        articles.forEach(article => {
            const title = article.querySelector('h3');
            if (title && !title.hasAttribute('data-accordion-init')) {
                title.style.cursor = 'pointer';
                title.setAttribute('data-accordion-init', 'true');
                
                // Fonction de toggle améliorée
                const toggleAccordion = () => {
                    const isCollapsed = article.classList.contains('collapsed');
                    
                    if (isCollapsed) {
                        // Ouvrir
                        article.classList.remove('collapsed');
                        article.style.maxHeight = '';
                        article.style.overflow = '';
                    } else {
                        // Fermer
                        article.classList.add('collapsed');
                    }
                };
                
                title.addEventListener('click', toggleAccordion);
                
                // Initialiser l'état collapsed par défaut (sauf le premier)
                const allArticles = Array.from(articles);
                const articleIndex = allArticles.indexOf(article);
                if (articleIndex > 0) {
                    article.classList.add('collapsed');
                }
            }
        });
        
        // Styles améliorés pour les accordéons
        if (!document.getElementById('accordion-styles')) {
            const style = document.createElement('style');
            style.id = 'accordion-styles';
            style.textContent = `
                @media (max-width: 768px) {
                    .legal-article {
                        transition: all 0.3s ease;
                        margin-bottom: var(--spacing-lg);
                        border-radius: var(--border-radius);
                        overflow: hidden;
                    }
                    
                    .legal-article.collapsed {
                        max-height: 60px;
                        overflow: hidden;
                        position: relative;
                        border: 1px solid var(--border-color);
                    }
                    
                    .legal-article.collapsed::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 20px;
                        background: linear-gradient(transparent, var(--bg-primary));
                        pointer-events: none;
                    }
                    
                    .legal-article h3 {
                        position: relative;
                        padding-right: 30px;
                        user-select: none;
                    }
                    
                    .legal-article h3::after {
                        content: ' ▼';
                        position: absolute;
                        right: 0;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 0.8em;
                        transition: transform 0.3s ease;
                        color: var(--primary-color);
                    }
                    
                    .legal-article.collapsed h3::after {
                        transform: translateY(-50%) rotate(-90deg);
                    }
                    
                    .legal-article h3:hover {
                        color: var(--primary-color);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/**
 * Utilitaires
 */

// Copier un lien vers le presse-papiers
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ Lien copié dans le presse-papiers');
    }).catch(() => {
        console.log('Erreur lors de la copie');
    });
}

// Afficher une notification temporaire
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--border-radius);
            color: white;
            font-weight: 500;
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        }
        
        .notification-success {
            background: var(--success-color);
        }
        
        .notification-error {
            background: var(--error-color);
        }
        
        .notification.show {
            transform: translateX(0);
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Imprimer la page
function printPage() {
    window.print();
}

// Partager la page
function sharePage() {
    if (navigator.share) {
        navigator.share({
            title: 'CGU & Documents Légaux - FailDaily',
            text: 'Conditions d\'utilisation et politique de confidentialité de FailDaily',
            url: window.location.href
        });
    } else {
        copyToClipboard(window.location.href);
    }
}

// Export pour utilisation globale
window.FailDailyLegal = {
    acceptAllCookies,
    rejectOptionalCookies,
    openCookieSettings,
    copyToClipboard,
    printPage,
    sharePage
};