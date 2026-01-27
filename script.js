// Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Fechar menu ao clicar em um link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Active Nav Link on Scroll
const sections = document.querySelectorAll('section[id]');

function activateNavLink() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`.nav-link[href="#${sectionId}"]`)?.classList.add('active');
        }
    });
}

window.addEventListener('scroll', activateNavLink);

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.service-card, .portfolio-item, .stat-item, .info-card');
    
    fadeElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Counter Animation for Stats
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
}

// Observe stats section
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                animateCounter(counter);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.about-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Contact Form
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };
    
    // Simulate form submission
    console.log('Form submitted:', formData);
    
    // Show success message
    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    
    // Reset form
    contactForm.reset();
    
    // In a real application, you would send this data to a server
    // Example with fetch:
    /*
    fetch('your-api-endpoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Mensagem enviada com sucesso!');
        contactForm.reset();
    })
    .catch(error => {
        alert('Erro ao enviar mensagem. Tente novamente.');
    });
    */
});

// Smooth Scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    const circles = document.querySelectorAll('.gradient-circle');
    
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - (scrolled / 600);
    }
    
    circles.forEach((circle, index) => {
        const speed = 0.3 + (index * 0.1);
        circle.style.transform = `translate(${scrolled * speed}px, ${scrolled * speed}px)`;
    });
});

// Interactive Creative Cursor
if (window.innerWidth > 768) {
    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);
    
    const cursorRing = document.createElement('div');
    cursorRing.classList.add('cursor-ring');
    document.body.appendChild(cursorRing);
    
    const cursorTrail = document.createElement('div');
    cursorTrail.classList.add('cursor-trail');
    document.body.appendChild(cursorTrail);
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let ringX = 0, ringY = 0;
    let isClicking = false;
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Create trail effect
        createTrailDot(e.clientX, e.clientY);
    });
    
    // Cursor animation loop
    function animateCursor() {
        // Smooth cursor movement
        cursorX += (mouseX - cursorX) * 0.3;
        cursorY += (mouseY - cursorY) * 0.3;
        
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
    
    // Trail dots
    let trailDotTimer = 0;
    function createTrailDot(x, y) {
        trailDotTimer++;
        if (trailDotTimer % 3 !== 0) return; // Create every 3rd frame
        
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        cursorTrail.appendChild(dot);
        
        setTimeout(() => {
            dot.remove();
        }, 800);
    }
    
    // Click ripple effect
    document.addEventListener('mousedown', (e) => {
        isClicking = true;
        cursor.classList.add('clicking');
        cursorRing.classList.add('clicking');
        
        // Create ripple
        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
    
    document.addEventListener('mouseup', () => {
        isClicking = false;
        cursor.classList.remove('clicking');
        cursorRing.classList.remove('clicking');
    });
    
    // Interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .btn, .service-card, .portfolio-item, input, textarea, .nav-link');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorRing.classList.add('hover');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorRing.classList.remove('hover');
        });
    });
    
    // Special effect for buttons
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            cursor.classList.add('btn-hover');
            cursorRing.classList.add('btn-hover');
        });
        
        btn.addEventListener('mouseleave', () => {
            cursor.classList.remove('btn-hover');
            cursorRing.classList.remove('btn-hover');
        });
    });
    
    // Text selection effect
    const textElements = document.querySelectorAll('h1, h2, h3, p');
    textElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('text-hover');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('text-hover');
        });
    });
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    interactiveElements.forEach(el => {
        el.style.cursor = 'none';
    });
    
    // Add CSS for cursor
    const style = document.createElement('style');
    style.textContent = `
        body, a, button, input, textarea {
            cursor: none !important;
        }
        
        .custom-cursor {
            position: fixed;
            width: 12px;
            height: 12px;
            background: var(--orange);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease, background 0.3s ease;
            box-shadow: 0 0 20px rgba(250, 118, 8, 0.5);
        }
        
        .cursor-ring {
            position: fixed;
            width: 40px;
            height: 40px;
            border: 2px solid var(--orange);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.3s ease;
            opacity: 0.6;
        }
        
        .custom-cursor.hover {
            width: 6px;
            height: 6px;
            background: var(--white);
            box-shadow: 0 0 30px rgba(250, 118, 8, 0.8);
        }
        
        .cursor-ring.hover {
            width: 60px;
            height: 60px;
            border-width: 3px;
            opacity: 1;
            border-color: var(--orange);
        }
        
        .custom-cursor.btn-hover {
            width: 20px;
            height: 20px;
            background: var(--white);
            box-shadow: 0 0 40px rgba(250, 118, 8, 1);
        }
        
        .cursor-ring.btn-hover {
            width: 80px;
            height: 80px;
            border-color: var(--white);
            opacity: 0.8;
        }
        
        .custom-cursor.text-hover {
            width: 4px;
            height: 30px;
            border-radius: 2px;
            background: var(--orange);
        }
        
        .custom-cursor.clicking {
            width: 8px;
            height: 8px;
            background: var(--white);
        }
        
        .cursor-ring.clicking {
            width: 30px;
            height: 30px;
            border-width: 3px;
        }
        
        .cursor-trail {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        }
        
        .trail-dot {
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--orange);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: trailFade 0.8s ease-out forwards;
            pointer-events: none;
        }
        
        @keyframes trailFade {
            0% {
                opacity: 0.6;
                transform: translate(-50%, -50%) scale(1);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.5);
            }
        }
        
        .cursor-ripple {
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid var(--orange);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9997;
            animation: rippleExpand 0.6s ease-out forwards;
        }
        
        @keyframes rippleExpand {
            0% {
                width: 20px;
                height: 20px;
                opacity: 1;
            }
            100% {
                width: 100px;
                height: 100px;
                opacity: 0;
                border-width: 1px;
            }
        }
        
        /* Magnetic effect for buttons */
        .btn-primary {
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Magnetic button effect
    const magneticButtons = document.querySelectorAll('.btn-primary');
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

// Loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Animate hero elements
    setTimeout(() => {
        document.querySelector('.hero-content')?.classList.add('visible');
    }, 200);
});

// Add particle effect to hero section (optional)
function createParticles() {
    const hero = document.querySelector('.hero');
    const particlesContainer = document.createElement('div');
    particlesContainer.classList.add('particles');
    hero.appendChild(particlesContainer);
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
    
    // Add CSS for particles
    const style = document.createElement('style');
    style.textContent = `
        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--orange);
            border-radius: 50%;
            opacity: 0.3;
            animation: float-particle 15s infinite ease-in-out;
        }
        
        @keyframes float-particle {
            0%, 100% {
                transform: translateY(0) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 0.3;
            }
            90% {
                opacity: 0.3;
            }
            50% {
                transform: translateY(-100vh) translateX(100px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize particles on desktop
if (window.innerWidth > 768) {
    createParticles();
}

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll-heavy functions
const debouncedActivateNav = debounce(activateNavLink, 100);
window.addEventListener('scroll', debouncedActivateNav);

// Portfolio Filter Functionality (for portfolio.html)
const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item-full');

if (filterButtons.length > 0 && portfolioItems.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            portfolioItems.forEach(item => {
                if (filterValue === 'all') {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    const categories = item.getAttribute('data-category');
                    if (categories && categories.includes(filterValue)) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                }
            });
        });
    });
    
    // Initialize portfolio items animation
    portfolioItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        item.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        }, index * 100);
    });
}

// Phone Mockup Swiper - Dots Animation
const phoneDots = document.querySelectorAll('.phone-dots .dot');
const phoneSlides = document.querySelectorAll('.phone-slide');

if (phoneDots.length > 0 && phoneSlides.length > 0) {
    let currentSlide = 0;
    const totalSlides = phoneSlides.length;
    
    // Sync dots with CSS animation (3s per slide)
    setInterval(() => {
        phoneDots.forEach(dot => dot.classList.remove('active'));
        currentSlide = (currentSlide + 1) % totalSlides;
        phoneDots[currentSlide].classList.add('active');
    }, 3000);
}

console.log('Effore Development - Site carregado com sucesso! 🚀');
