// Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for navigation links - Version améliorée
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                // Calcul de position basé sur le layout actuel (gère les transforms/parallax)
                const navbarEl = document.querySelector('.navbar') || document.querySelector('nav') || document.getElementById('navbar');
                const navbarHeight = (navbarEl ? navbarEl.offsetHeight : 70) + 20; // marge de confort

                const elementTop = target.getBoundingClientRect().top + window.pageYOffset;
                const scrollToY = Math.max(0, elementTop - navbarHeight);

                window.scrollTo({ top: scrollToY, behavior: 'smooth' });
                
                // Fermer le menu mobile si ouvert
                const navMenu = document.getElementById('nav-menu');
                const navToggle = document.getElementById('nav-toggle');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
                if (navToggle && navToggle.classList.contains('active')) {
                    navToggle.classList.remove('active');
                }
                
                // Mise à jour immédiate de l'état actif
                setTimeout(() => {
                    updateActiveNav();
                }, 100);
            }
        });
    });

    // Active navigation link - Version corrigée avec priorité home
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 70;
        const scrollPos = window.scrollY;
        
        let currentSection = '';
        
        // Cas spécial : si on est tout en haut (moins de 200px), forcer home
        if (scrollPos < 200) {
            currentSection = 'home';
        } else {
            // Calcul normal pour les autres sections
            const checkPos = scrollPos + navbarHeight + 50;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                // Pour les sections autres que home, vérifier si on est dedans
                if (sectionId !== 'home' && checkPos >= sectionTop && checkPos < sectionTop + sectionHeight) {
                    currentSection = sectionId;
                }
            });
            
            // Si aucune section trouvée, calculer la plus proche
            if (!currentSection) {
                let closestSection = '';
                let closestDistance = Infinity;
                
                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionId = section.getAttribute('id');
                    const distance = Math.abs(checkPos - sectionTop);
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestSection = sectionId;
                    }
                });
                currentSection = closestSection;
            }
        }
        
        // Mettre à jour les liens de navigation
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => link.classList.remove('active'));
        
        if (currentSection) {
            const activeNavLink = document.querySelector(`.nav-link[href="#${currentSection}"]`);
            if (activeNavLink) {
                activeNavLink.classList.add('active');
            }
        }
    }

    window.addEventListener('scroll', updateActiveNav);
    
    // Attendre que la page soit complètement chargée avant d'initialiser
    setTimeout(() => {
        updateActiveNav(); // Run on page load
    }, 500); // Délai pour s'assurer que tout est chargé
});

// Image modal (ouvrir en taille réelle)
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('image-modal-img');
    const modalClose = document.querySelector('.image-modal-close');
    const modalBackdrop = document.querySelector('.image-modal-backdrop');

    function openModal(src, alt) {
        if (!modal || !modalImg) return;
        modalImg.src = src;
        modalImg.alt = alt || 'Aperçu';
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
        // Laisser l'image se décharger si nécessaire
        setTimeout(() => { if (modalImg) modalImg.src = modalImg.src; }, 0);
    }

    // Clic sur l'image de la maquette (écran de téléphone)
    const phoneScreen = document.querySelector('.phone-screen') || document.querySelector('.mockup-image');
    if (phoneScreen) {
        phoneScreen.addEventListener('click', function() {
            const src = this.getAttribute('src');
            const alt = this.getAttribute('alt') || 'Aperçu';
            openModal(src, alt);
        });
    }

    // Fermetures
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeModal();
        }
    });
});

// Tabs functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
});

// Copy code functionality
document.addEventListener('DOMContentLoaded', function() {
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const codeBlock = this.closest('.code-block').querySelector('code');
            const textToCopy = codeBlock.textContent;

            navigator.clipboard.writeText(textToCopy).then(function() {
                // Visual feedback
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.style.background = 'rgba(16, 185, 129, 0.2)';
                button.style.borderColor = 'rgba(16, 185, 129, 0.5)';

                setTimeout(function() {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                    button.style.background = '';
                    button.style.borderColor = '';
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy: ', err);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                // Visual feedback
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(function() {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
    });
});

// Scroll reveal animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    // Add scroll reveal to elements
    const elementsToReveal = document.querySelectorAll(`
        .content-card,
        .tech-item,
        .stat-card,
        .feature-card,
        .component-card,
        .feature-highlight,
        .api-section,
        .result-card,
        .flow-step,
        .infra-card
    `);

    elementsToReveal.forEach(element => {
        element.classList.add('scroll-reveal');
        observer.observe(element);
    });
});

// Counter animation for statistics
function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialize counter animations when stats come into view
document.addEventListener('DOMContentLoaded', function() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const text = entry.target.textContent;
                const number = parseInt(text.replace(/[^\d]/g, ''));
                
                if (!isNaN(number) && number > 0) {
                    entry.target.textContent = '0';
                    animateCounter(entry.target, 0, number, 2000);
                }
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => {
        // Only animate numeric stats
        const text = stat.textContent;
        if (/\d/.test(text)) {
            statsObserver.observe(stat);
        }
    });
});

// Performance metrics animation
document.addEventListener('DOMContentLoaded', function() {
    const metricBars = document.querySelectorAll('.level-bar');
    
    const metricsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                const currentWidth = entry.target.style.width;
                entry.target.style.width = '0%';
                
                setTimeout(() => {
                    entry.target.style.transition = 'width 1.5s ease-out';
                    entry.target.style.width = currentWidth;
                }, 100);
            }
        });
    }, { threshold: 0.5 });

    metricBars.forEach(bar => {
        metricsObserver.observe(bar);
    });
});

// Parallax effect for hero section (safe: only inner elements)
document.addEventListener('DOMContentLoaded', function() {
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');

    function applyParallax() {
        const isDesktop = window.innerWidth > 768;
        if (!isDesktop) {
            if (heroContent) heroContent.style.transform = '';
            if (heroImage) heroImage.style.transform = '';
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        const rateContent = Math.max(-30, Math.min(30, scrollTop * -0.15));
        const rateImage = Math.max(-40, Math.min(40, scrollTop * -0.25));
        if (heroContent) heroContent.style.transform = `translateY(${rateContent}px)`;
        if (heroImage) heroImage.style.transform = `translateY(${rateImage}px)`;
    }

    if (heroContent || heroImage) {
        window.addEventListener('scroll', applyParallax, { passive: true });
        window.addEventListener('resize', applyParallax);
        applyParallax();
    }
});

// Tech stack icons rotation on hover
document.addEventListener('DOMContentLoaded', function() {
    const techIcons = document.querySelectorAll('.tech-icon');
    
    techIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'rotateY(180deg)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'rotateY(0deg)';
        });
    });
});

// API endpoints interactive effects
document.addEventListener('DOMContentLoaded', function() {
    const endpoints = document.querySelectorAll('.endpoint');
    
    endpoints.forEach(endpoint => {
        endpoint.addEventListener('click', function() {
            // Add click effect
            this.style.transform = 'scale(0.98)';
            this.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            // Show more details (could expand this)
            const description = this.querySelector('.description');
            if (description) {
                description.style.fontWeight = '600';
                setTimeout(() => {
                    description.style.fontWeight = 'normal';
                }, 1000);
            }
        });
    });
});

// Loading animation for performance metrics
document.addEventListener('DOMContentLoaded', function() {
    const performanceMetrics = document.querySelectorAll('.metric-value');
    
    const loadMetrics = () => {
        performanceMetrics.forEach((metric, index) => {
            setTimeout(() => {
                metric.style.opacity = '0';
                metric.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    metric.style.transition = 'all 0.5s ease';
                    metric.style.opacity = '1';
                    metric.style.transform = 'translateY(0)';
                }, index * 100);
            }, index * 50);
        });
    };
    
    const metricsSection = document.querySelector('#database');
    if (metricsSection) {
        const metricsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMetrics();
                    metricsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        metricsObserver.observe(metricsSection);
    }
});

// Keyboard navigation
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(e) {
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
        
        // Escape to close mobile menu
        if (e.key === 'Escape') {
            const navToggle = document.getElementById('nav-toggle');
            const navMenu = document.getElementById('nav-menu');
            
            if (navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
});

// Feature highlights interactive behavior
document.addEventListener('DOMContentLoaded', function() {
    const featureHighlights = document.querySelectorAll('.feature-highlight');
    
    featureHighlights.forEach(feature => {
        const visual = feature.querySelector('.feature-visual');
        const content = feature.querySelector('.feature-content');
        
        feature.addEventListener('mouseenter', function() {
            visual.style.transform = 'scale(1.05)';
            visual.style.transition = 'transform 0.3s ease';
        });
        
        feature.addEventListener('mouseleave', function() {
            visual.style.transform = 'scale(1)';
        });
    });
});

// Search functionality (basic implementation)
document.addEventListener('DOMContentLoaded', function() {
    // Add search button to navigation (if needed)
    function addSearchFunctionality() {
        const searchableContent = document.querySelectorAll('h1, h2, h3, h4, p, .endpoint, .feature-list li');
        
        window.searchSite = function(query) {
            if (!query) return;
            
            searchableContent.forEach(element => {
                const text = element.textContent.toLowerCase();
                const queryLower = query.toLowerCase();
                
                if (text.includes(queryLower)) {
                    element.style.background = 'rgba(255, 255, 0, 0.3)';
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    setTimeout(() => {
                        element.style.background = '';
                    }, 3000);
                    
                    return;
                }
            });
        };
    }
    
    addSearchFunctionality();
});

// Error handling for images and external resources
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = '<i class="fas fa-image"></i><p>Image non disponible</p>';
            this.parentNode.insertBefore(placeholder, this);
        });
    });
});

// Print optimization
window.addEventListener('beforeprint', function() {
    // Expand all collapsed sections
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        pane.style.display = 'block';
    });
    
    // Ensure all animations are complete
    const animatedElements = document.querySelectorAll('.scroll-reveal');
    animatedElements.forEach(element => {
        element.classList.add('revealed');
    });
});

window.addEventListener('afterprint', function() {
    // Restore tab functionality
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        if (!pane.classList.contains('active')) {
            pane.style.display = 'none';
        }
    });
});

// Performance monitoring
document.addEventListener('DOMContentLoaded', function() {
    // Basic performance logging
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                console.log(`Page loaded in ${loadTime}ms`);
                
                // Could send this data to analytics
                if (loadTime > 3000) {
                    console.warn('Page load time is slower than expected');
                }
            }, 0);
        });
    }
});

// Accessibility enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Aller au contenu principal';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 9999;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add proper ARIA labels
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            link.setAttribute('aria-label', `Naviguer vers la section ${targetId}`);
        }
    });
    
    // Add role attributes
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.setAttribute('role', 'navigation');
    
    const main = document.querySelector('.main-content');
    if (main) {
        main.setAttribute('role', 'main');
        main.setAttribute('id', 'main-content');
    }
});

// Console welcome message
console.log(`
🚀 FailDaily - Présentation Technique
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Stack: Angular 20 + Node.js + MySQL
🔧 Tests: 100% API Coverage
⚡ Performance: <100ms Response Time
🐳 Deploy: Docker + CI/CD Ready

Développé avec ❤️ pour transformer les échecs en apprentissages
`);

// Diagrammes interactifs
document.addEventListener('DOMContentLoaded', function() {
    // Animation des entités ERD au hover
    const entities = document.querySelectorAll('.entity');
    
    entities.forEach(entity => {
        entity.addEventListener('mouseenter', function() {
            const entityName = this.getAttribute('data-entity');
            
            // Highlight des relations
            highlightRelations(entityName);
            
            // Tooltip avec informations
            showEntityTooltip(entity, entityName);
        });
        
        entity.addEventListener('mouseleave', function() {
            clearHighlights();
            hideTooltip();
        });
    });
    
    // Animation des couches d'architecture au hover
    const layers = document.querySelectorAll('.layer');
    
    layers.forEach(layer => {
        layer.addEventListener('mouseenter', function() {
            const layerName = this.getAttribute('data-layer');
            showLayerInfo(layer, layerName);
        });
        
        layer.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
    
    function highlightRelations(entityName) {
        // Logic pour highlight des relations spécifiques
        const relations = {
            'users': ['fails', 'reactions', 'comments', 'user_points', 'user_badges'],
            'fails': ['users', 'reactions', 'comments', 'moderation', 'categories'],
            'reactions': ['users', 'fails'],
            'comments': ['users', 'fails'],
            'user_badges': ['users', 'badges'],
            'moderation': ['fails']
        };
        
        if (relations[entityName]) {
            relations[entityName].forEach(relatedEntity => {
                const element = document.querySelector(`[data-entity="${relatedEntity}"]`);
                if (element) {
                    element.style.opacity = '0.7';
                    element.style.filter = 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.5))';
                }
            });
        }
    }
    
    function clearHighlights() {
        entities.forEach(entity => {
            entity.style.opacity = '1';
            entity.style.filter = '';
        });
    }
    
    function showEntityTooltip(element, entityName) {
        const tooltipData = {
            'users': 'Table principale des utilisateurs avec authentification et profils',
            'fails': 'Publications d\'échecs avec modération et catégorisation',
            'reactions': 'Système de réactions (courage, apprentissage, soutien, inspiration)',
            'comments': 'Commentaires constructifs sur les fails',
            'user_badges': 'Système de badges et gamification',
            'moderation': 'Modération IA avec OpenAI pour analyse du contenu',
            'user_points': 'Points de courage et système de niveaux',
            'badges': 'Définition des badges avec récompenses XP',
            'categories': 'Catégories de fails (professionnel, personnel, technique, etc.)'
        };
        
        createTooltip(element, tooltipData[entityName] || 'Entité de base de données');
    }
    
    function showLayerInfo(element, layerName) {
        const layerData = {
            'client': 'Interface utilisateur - Angular 20 + Ionic 8 + PWA + Mobile',
            'balancer': 'Reverse Proxy - Traefik v3.0 avec SSL automatique et service discovery',
            'api': 'Couche API - Node.js + Express + JWT + OpenAI + 16 endpoints',
            'data': 'Couche données - MySQL + Redis + Storage + Backups automatiques',
            'monitoring': 'Surveillance - Prometheus + Grafana + CI/CD GitHub Actions'
        };
        
        createTooltip(element, layerData[layerName] || 'Couche système');
    }
    
    function createTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'diagram-tooltip';
        tooltip.textContent = text;
        
        tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-dark);
            color: var(--text-inverse);
            padding: var(--spacing-md);
            border-radius: var(--border-radius);
            font-size: var(--font-size-sm);
            max-width: 300px;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.bottom + 10 + 'px';
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 100);
    }
    
    function hideTooltip() {
        const tooltip = document.querySelector('.diagram-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }
    }
});

// Animation de la démo IA modération
document.addEventListener('DOMContentLoaded', function() {
    const demoSteps = document.querySelectorAll('.demo-step');
    
    // Animation progressive des étapes
    const demoObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const steps = entry.target.querySelectorAll('.demo-step');
                steps.forEach((step, index) => {
                    setTimeout(() => {
                        step.style.opacity = '1';
                        step.style.transform = 'translateX(0)';
                        
                        // Animation spéciale pour l'analyse de sentiment
                        const sentimentBar = step.querySelector('.sentiment-bar');
                        if (sentimentBar) {
                            animateSentimentBar(sentimentBar);
                        }
                        
                        // Animation des suggestions
                        const suggestions = step.querySelectorAll('.suggestion');
                        suggestions.forEach((suggestion, suggestionIndex) => {
                            setTimeout(() => {
                                suggestion.style.opacity = '1';
                                suggestion.style.transform = 'translateY(0)';
                            }, suggestionIndex * 200);
                        });
                        
                    }, index * 500);
                });
                
                demoObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    const demoContainer = document.querySelector('.ai-moderation-demo');
    if (demoContainer) {
        // Initialiser les styles pour l'animation
        demoSteps.forEach(step => {
            step.style.opacity = '0';
            step.style.transform = 'translateX(-30px)';
            step.style.transition = 'all 0.6s ease';
        });
        
        const suggestions = document.querySelectorAll('.suggestion');
        suggestions.forEach(suggestion => {
            suggestion.style.opacity = '0';
            suggestion.style.transform = 'translateY(20px)';
            suggestion.style.transition = 'all 0.4s ease';
        });
        
        demoObserver.observe(demoContainer);
    }
    
    function animateSentimentBar(sentimentBar) {
        const bars = sentimentBar.querySelectorAll('div');
        bars.forEach((bar, index) => {
            const originalWidth = bar.style.width;
            bar.style.width = '0%';
            bar.style.transition = 'width 1s ease-out';
            
            setTimeout(() => {
                bar.style.width = originalWidth;
            }, index * 300 + 500);
        });
    }
});

// Simulation interactive de la modération IA
document.addEventListener('DOMContentLoaded', function() {
    const demoContainer = document.querySelector('.ai-moderation-demo');
    
    if (demoContainer) {
        // Ajouter un bouton pour rejouer la démo
        const replayButton = document.createElement('button');
        replayButton.textContent = '🔄 Rejouer la Démo';
        replayButton.className = 'btn btn-secondary replay-demo-btn';
        replayButton.style.cssText = `
            margin-top: var(--spacing-lg);
            display: block;
            margin-left: auto;
            margin-right: auto;
        `;
        
        replayButton.addEventListener('click', function() {
            // Reset et rejouer l'animation
            const steps = document.querySelectorAll('.demo-step');
            const suggestions = document.querySelectorAll('.suggestion');
            
            // Reset styles
            steps.forEach(step => {
                step.style.opacity = '0';
                step.style.transform = 'translateX(-30px)';
            });
            
            suggestions.forEach(suggestion => {
                suggestion.style.opacity = '0';
                suggestion.style.transform = 'translateY(20px)';
            });
            
            // Reset sentiment bars
            const sentimentBars = document.querySelectorAll('.sentiment-bar div');
            sentimentBars.forEach(bar => {
                const originalWidth = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = originalWidth;
                }, 2000);
            });
            
            // Rejouer l'animation
            setTimeout(() => {
                steps.forEach((step, index) => {
                    setTimeout(() => {
                        step.style.opacity = '1';
                        step.style.transform = 'translateX(0)';
                        
                        const stepSuggestions = step.querySelectorAll('.suggestion');
                        stepSuggestions.forEach((suggestion, suggestionIndex) => {
                            setTimeout(() => {
                                suggestion.style.opacity = '1';
                                suggestion.style.transform = 'translateY(0)';
                            }, suggestionIndex * 200);
                        });
                    }, index * 500);
                });
            }, 100);
        });
        
        demoContainer.appendChild(replayButton);
    }
});

// Click sur les entités ERD pour afficher plus d'informations
document.addEventListener('DOMContentLoaded', function() {
    const entities = document.querySelectorAll('.entity');
    
    entities.forEach(entity => {
        entity.addEventListener('click', function() {
            const entityName = this.getAttribute('data-entity');
            showEntityDetails(entityName);
        });
    });
    
    function showEntityDetails(entityName) {
        const entityInfo = {
            'users': {
                name: 'USERS',
                description: 'Table principale des utilisateurs avec système d\'authentification complet',
                fields: [
                    'id (PK) - Identifiant unique auto-incrémenté',
                    'email - Email unique avec validation',
                    'password_hash - Mot de passe hashé avec bcrypt',
                    'display_name - Nom d\'affichage public',
                    'account_status - Statut du compte (active, suspended, etc.)',
                    'created_at - Date de création',
                    'updated_at - Date de dernière modification'
                ],
                relationships: [
                    '1:N avec FAILS (un utilisateur peut créer plusieurs fails)',
                    '1:N avec REACTIONS (un utilisateur peut réagir à plusieurs fails)',
                    '1:N avec COMMENTS (un utilisateur peut commenter plusieurs fails)',
                    '1:1 avec USER_POINTS (un utilisateur a un profil de points)',
                    '1:N avec USER_BADGES (un utilisateur peut avoir plusieurs badges)'
                ]
            },
            'fails': {
                name: 'FAILS',
                description: 'Publications d\'échecs avec système de modération intégré',
                fields: [
                    'id (PK) - Identifiant unique',
                    'user_id (FK) - Référence vers l\'auteur',
                    'title - Titre du fail (max 200 caractères)',
                    'description - Description détaillée',
                    'category - Catégorie du fail',
                    'moderation_status - Statut de modération (pending, approved, rejected)',
                    'is_public - Visibilité publique',
                    'created_at - Date de publication'
                ],
                relationships: [
                    'N:1 avec USERS (plusieurs fails par utilisateur)',
                    '1:N avec REACTIONS (un fail peut avoir plusieurs réactions)',
                    '1:N avec COMMENTS (un fail peut avoir plusieurs commentaires)',
                    '1:1 avec MODERATION (un fail a une analyse de modération)'
                ]
            },
            'reactions': {
                name: 'REACTIONS',
                description: 'Système de réactions pour encourager et soutenir',
                fields: [
                    'fail_id (FK) - Référence vers le fail',
                    'user_id (FK) - Référence vers l\'utilisateur',
                    'reaction_type - Type (courage, apprentissage, soutien, inspiration)',
                    'created_at - Date de la réaction',
                    'is_active - Statut actif'
                ],
                relationships: [
                    'N:1 avec FAILS (plusieurs réactions par fail)',
                    'N:1 avec USERS (plusieurs réactions par utilisateur)'
                ]
            },
            'comments': {
                name: 'COMMENTS',
                description: 'Commentaires constructifs pour aider la communauté',
                fields: [
                    'id (PK) - Identifiant unique',
                    'fail_id (FK) - Référence vers le fail commenté',
                    'user_id (FK) - Référence vers l\'auteur du commentaire',
                    'content - Contenu du commentaire',
                    'is_helpful - Marqueur d\'utilité',
                    'created_at - Date de création',
                    'updated_at - Date de modification'
                ],
                relationships: [
                    'N:1 avec FAILS (plusieurs commentaires par fail)',
                    'N:1 avec USERS (plusieurs commentaires par utilisateur)'
                ]
            },
            'badges': {
                name: 'BADGES',
                description: 'Système de récompenses pour motiver les utilisateurs',
                fields: [
                    'id (PK) - Identifiant unique',
                    'badge_key - Clé unique du badge',
                    'name - Nom du badge',
                    'description - Description détaillée',
                    'xp_reward - Points d\'expérience accordés',
                    'category - Catégorie du badge',
                    'rarity - Rareté (common, rare, epic, legendary)'
                ],
                relationships: [
                    '1:N avec USER_BADGES (un badge peut être détenu par plusieurs utilisateurs)'
                ]
            },
            'user_badges': {
                name: 'USER_BADGES',
                description: 'Association entre utilisateurs et badges débloqués',
                fields: [
                    'user_id (FK) - Référence vers l\'utilisateur',
                    'badge_key (FK) - Référence vers le badge',
                    'unlocked_at - Date de déblocage',
                    'progress - Progression vers le badge',
                    'is_displayed - Affiché sur le profil'
                ],
                relationships: [
                    'N:1 avec USERS (un utilisateur peut avoir plusieurs badges)',
                    'N:1 avec BADGES (un badge peut être détenu par plusieurs utilisateurs)'
                ]
            },
            'user_points': {
                name: 'USER_POINTS',
                description: 'Système de points et progression des utilisateurs',
                fields: [
                    'user_id (FK) - Référence vers l\'utilisateur',
                    'courage_points - Points de courage accumulés',
                    'level - Niveau actuel de l\'utilisateur',
                    'total_given - Total de points donnés aux autres',
                    'weekly_given - Points donnés cette semaine',
                    'last_reset - Dernière remise à zéro hebdomadaire',
                    'streak_days - Jours consécutifs d\'activité'
                ],
                relationships: [
                    '1:1 avec USERS (chaque utilisateur a un profil de points unique)'
                ]
            },
            'moderation': {
                name: 'MODERATION',
                description: 'Modération IA avec analyse OpenAI du contenu',
                fields: [
                    'id (PK) - Identifiant unique',
                    'fail_id (FK) - Référence vers le fail modéré',
                    'ai_score - Score qualité de 0 à 100',
                    'ai_feedback - Retour et suggestions de l\'IA',
                    'status - Statut (approved, rejected, pending)',
                    'moderated_at - Date de modération',
                    'reviewer_id - ID du modérateur humain (optionnel)',
                    'sentiment_analysis - Analyse de sentiment détaillée'
                ],
                relationships: [
                    '1:1 avec FAILS (chaque fail a une analyse de modération)'
                ]
            },
            'categories': {
                name: 'CATEGORIES',
                description: 'Catégories pour classifier les types d\'échecs',
                fields: [
                    'id (PK) - Identifiant unique',
                    'name - Nom de la catégorie',
                    'emoji - Emoji représentatif',
                    'description - Description de la catégorie',
                    'is_active - Statut actif',
                    'sort_order - Ordre d\'affichage',
                    'color - Couleur associée'
                ],
                relationships: [
                    '1:N avec FAILS (une catégorie peut contenir plusieurs fails)'
                ]
            }
        };
        
        const info = entityInfo[entityName];
        if (info) {
            createEntityModal(info);
        }
    }
    
    function createEntityModal(info) {
        // Créer le modal
        const modal = document.createElement('div');
        modal.className = 'entity-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${info.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="entity-description">${info.description}</p>
                    
                    <div class="entity-section">
                        <h4>📋 Champs</h4>
                        <ul class="field-list">
                            ${info.fields.map(field => `<li>${field}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="entity-section">
                        <h4>🔗 Relations</h4>
                        <ul class="relationship-list">
                            ${info.relationships.map(rel => `<li>${rel}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: var(--bg-primary);
            border-radius: var(--border-radius-lg);
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        const modalHeader = modal.querySelector('.modal-header');
        modalHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-xl);
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-gradient);
            color: var(--text-inverse);
            border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
        `;
        
        const modalBody = modal.querySelector('.modal-body');
        modalBody.style.cssText = `
            padding: var(--spacing-xl);
        `;
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-inverse);
            font-size: var(--font-size-2xl);
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s ease;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
        
        // Fermer le modal
        const closeModal = () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.9)';
            setTimeout(() => {
                modal.remove();
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });
        
        // Afficher le modal
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 100);
    }
});

// Analytics Dashboard interactions
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = document.querySelector('.analytics-dashboard');
    
    if (dashboard) {
        // Animation progressive des métriques
        const dashboardObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateDashboard();
                    dashboardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        dashboardObserver.observe(dashboard);
        
        // Interactivité des boutons de période
        const chartButtons = document.querySelectorAll('.chart-btn');
        chartButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                chartButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Simulation du changement de données
                animateChartUpdate();
            });
        });
        
        // Hover effects sur les points de données
        const dataPoints = document.querySelectorAll('.data-point');
        dataPoints.forEach((point, index) => {
            point.addEventListener('mouseenter', function() {
                showDataTooltip(this, index);
            });
            
            point.addEventListener('mouseleave', function() {
                hideDataTooltip();
            });
        });
        
        // Hover effects sur les segments du donut
        const donutSegments = document.querySelectorAll('.donut-segment');
        donutSegments.forEach((segment, index) => {
            segment.addEventListener('mouseenter', function() {
                showDonutTooltip(this, index);
            });
            
            segment.addEventListener('mouseleave', function() {
                hideDataTooltip();
            });
        });
        
        // Interactivité de la heatmap
        const heatmapCells = document.querySelectorAll('.heatmap-cell');
        heatmapCells.forEach(cell => {
            cell.addEventListener('click', function() {
                const category = this.querySelector('.cell-value').textContent;
                const value = this.getAttribute('data-value');
                showCategoryDetails(category, value);
            });
        });
    }
    
    function animateDashboard() {
        // Animation des métriques
        const metricValues = document.querySelectorAll('.metric-value');
        metricValues.forEach((metric, index) => {
            setTimeout(() => {
                metric.style.opacity = '0';
                metric.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    metric.style.transition = 'all 0.6s ease';
                    metric.style.opacity = '1';
                    metric.style.transform = 'translateY(0)';
                    
                    // Animation des chiffres
                    const text = metric.textContent;
                    const number = parseInt(text.replace(/[^\d]/g, ''));
                    if (!isNaN(number) && number > 0) {
                        animateCounter(metric, 0, number, 1500);
                    }
                }, 100);
            }, index * 200);
        });
        
        // Animation des graphiques
        setTimeout(() => {
            const trendLine = document.querySelector('.trend-line');
            if (trendLine) {
                trendLine.style.animation = 'none';
                setTimeout(() => {
                    trendLine.style.animation = 'drawLine 2s ease-out';
                }, 100);
            }
            
            const donutSegments = document.querySelectorAll('.donut-segment');
            donutSegments.forEach((segment, index) => {
                segment.style.animation = 'none';
                setTimeout(() => {
                    segment.style.animation = `drawDonut 1.5s ease-out ${index * 0.2}s both`;
                }, 100);
            });
        }, 800);
    }
    
    function animateChartUpdate() {
        const trendLine = document.querySelector('.trend-line');
        if (trendLine) {
            trendLine.style.opacity = '0.5';
            trendLine.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                trendLine.style.transition = 'all 0.5s ease';
                trendLine.style.opacity = '1';
                trendLine.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    function showDataTooltip(element, index) {
        const dataValues = ['342', '445', '567', '623', '789', '856', '923'];
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title">${days[index]}</div>
            <div class="tooltip-value">${dataValues[index]} interactions</div>
            <div class="tooltip-change">+${Math.floor(Math.random() * 20 + 5)}% vs jour précédent</div>
        `;
        
        tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-dark);
            color: var(--text-inverse);
            padding: var(--spacing-md);
            border-radius: var(--border-radius);
            font-size: var(--font-size-sm);
            z-index: 1000;
            box-shadow: var(--shadow-lg);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 100);
    }
    
    function showDonutTooltip(element, index) {
        const reactions = [
            { name: 'Courage', value: '6,250', percentage: '40%' },
            { name: 'Apprentissage', value: '4,687', percentage: '30%' },
            { name: 'Soutien', value: '3,125', percentage: '20%' },
            { name: 'Inspiration', value: '1,562', percentage: '10%' }
        ];
        
        const data = reactions[index];
        if (!data) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title">${data.name}</div>
            <div class="tooltip-value">${data.value} réactions</div>
            <div class="tooltip-percentage">${data.percentage} du total</div>
        `;
        
        tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-dark);
            color: var(--text-inverse);
            padding: var(--spacing-md);
            border-radius: var(--border-radius);
            font-size: var(--font-size-sm);
            z-index: 1000;
            box-shadow: var(--shadow-lg);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 100);
    }
    
    function hideDataTooltip() {
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }
    }
    
    function showCategoryDetails(category, value) {
        const categoryDetails = {
            'Professionnel': {
                description: 'Échecs liés au monde du travail et à la carrière',
                trends: '+15% ce mois',
                topFails: ['Entretien raté', 'Présentation échouée', 'Négociation manquée'],
                engagement: '95%'
            },
            'Personnel': {
                description: 'Échecs dans la vie personnelle et relationnelle',
                trends: '+8% ce mois',
                topFails: ['Résolution abandonnée', 'Conflit familial', 'Objectif manqué'],
                engagement: '78%'
            },
            'Technique': {
                description: 'Échecs technologiques et de développement',
                trends: '+22% ce mois',
                topFails: ['Bug en production', 'Code non fonctionnel', 'Architecture défaillante'],
                engagement: '89%'
            }
        };
        
        const details = categoryDetails[category];
        if (!details) return;
        
        const modal = document.createElement('div');
        modal.className = 'category-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 ${category} - ${value}% d'activité</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="category-description">${details.description}</p>
                    
                    <div class="category-section">
                        <h4>📈 Tendance</h4>
                        <p class="trend-value">${details.trends}</p>
                    </div>
                    
                    <div class="category-section">
                        <h4>🔥 Fails les plus populaires</h4>
                        <ul class="top-fails">
                            ${details.topFails.map(fail => `<li>${fail}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="category-section">
                        <h4>⚡ Engagement</h4>
                        <div class="engagement-bar">
                            <div class="engagement-fill" style="width: ${details.engagement}"></div>
                            <span class="engagement-text">${details.engagement}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Styles pour le contenu du modal
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.cssText = `
            background: var(--bg-primary);
            border-radius: var(--border-radius-lg);
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        `;
        
        // Fermer le modal
        const closeModal = () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.9)';
            setTimeout(() => {
                modal.remove();
            }, 300);
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });
        
        // Afficher le modal
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 100);
    }
});

// Navigation bouton Architecture - Fix spécifique
document.addEventListener('DOMContentLoaded', function() {
    const exploreBtn = document.getElementById('explore-architecture-btn');
    const architectureSection = document.getElementById('architecture');
    
    if (exploreBtn && architectureSection) {
        exploreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Utiliser le comportement d'ancre standard, le handler global gère l'offset
            architectureSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Effet visuel temporaire
            architectureSection.style.transition = 'all 0.3s ease';
            architectureSection.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
            setTimeout(() => {
                architectureSection.style.backgroundColor = '';
            }, 2000);
        });
    }
});

// Export functions for external use if needed
window.FailDailyPresentation = {
    searchSite: window.searchSite,
    animateCounter: animateCounter,
    version: '1.0.0'
};
