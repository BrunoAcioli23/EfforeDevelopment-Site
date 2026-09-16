const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Tema claro/escuro
// O <head> já grava data-theme antes da pintura; aqui ficam o botão e a troca do sistema
const themeToggle = document.getElementById('themeToggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function readStoredTheme() {
    try {
        return localStorage.getItem('theme');
    } catch (e) {
        return null;
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
}

applyTheme(document.documentElement.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light'));

themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
        localStorage.setItem('theme', next);
    } catch (e) {
        // Sem storage (aba anônima bloqueada): o tema vale só para esta visita
    }
});

// Enquanto o visitante não escolher, acompanha o tema do sistema
systemDark.addEventListener('change', (e) => {
    if (!readStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

// Menu mobile
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const setMenu = (open) => {
        menuToggle.classList.toggle('active', open);
        navMenu.classList.toggle('active', open);
        backdrop.classList.toggle('active', open);
        document.body.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    };

    menuToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('active')));
    backdrop.addEventListener('click', () => setMenu(false));
    navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            setMenu(false);
            menuToggle.focus();
        }
    });

    // Ao voltar para a largura de desktop o menu lateral não pode ficar aberto
    window.matchMedia('(min-width: 969px)').addEventListener('change', (e) => {
        if (e.matches) setMenu(false);
    });
}

// Navbar: borda ao rolar + barra de progresso de leitura (um único rAF por frame)
const navbar = document.querySelector('.navbar');
let scrollTicking = false;

function onScrollFrame() {
    const scrolled = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    navbar?.classList.toggle('scrolled', scrolled > 8);
    navbar?.style.setProperty('--progress', max > 0 ? Math.min(scrolled / max, 1).toFixed(4) : '0');
    scrollTicking = false;
}

window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScrollFrame);
}, { passive: true });

window.addEventListener('resize', onScrollFrame, { passive: true });
onScrollFrame();

// Link ativo da navegação conforme a seção visível (só na página com âncoras locais)
const localNavLinks = document.querySelectorAll('.nav-link[href^="#"]');

if (localNavLinks.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            localNavLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('section[id]').forEach(section => sectionObserver.observe(section));
}

// Hero: a grade acende em volta do ponteiro
const hero = document.querySelector('.hero');

if (hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pointerFrame = 0;

    hero.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = requestAnimationFrame(() => {
            const rect = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            hero.style.setProperty('--my', `${e.clientY - rect.top}px`);
            hero.classList.add('is-pointing');
        });
    });

    hero.addEventListener('pointerleave', () => {
        cancelAnimationFrame(pointerFrame);
        hero.classList.remove('is-pointing');
    });
}

// Contadores dos números. O HTML já traz o valor final (sem JS continua correto);
// aqui ele só é animado de 0 até o alvo quando entra na tela.
function animateCounter(element) {
    const target = parseInt(element.dataset.target, 10);
    const suffix = element.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
}

const statsSection = document.querySelector('.about-stats');

if (statsSection && !prefersReducedMotion.matches) {
    const counters = statsSection.querySelectorAll('.stat-number[data-target]');
    counters.forEach(counter => {
        counter.textContent = `0${counter.dataset.suffix || ''}`;
    });

    const statsObserver = new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        counters.forEach(animateCounter);
        obs.disconnect();
    }, { threshold: 0.5 });

    statsObserver.observe(statsSection);
}

// Formulário de contato: monta a mensagem e abre o WhatsApp já preenchido
const contactForm = document.getElementById('contactForm');
const WHATSAPP_NUMBER = '5511942138664';

if (contactForm) {
    const status = contactForm.querySelector('.form-status');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!contactForm.reportValidity()) return;

        const data = new FormData(contactForm);
        const text = [
            `Olá! Meu nome é ${data.get('name').trim()} (${data.get('email').trim()}).`,
            '',
            `*Assunto:* ${data.get('subject').trim()}`,
            '',
            data.get('message').trim()
        ].join('\n');

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
        const opened = window.open(url, '_blank', 'noopener');

        if (status) {
            status.textContent = opened
                ? 'Abrimos o WhatsApp com a sua mensagem. É só confirmar o envio por lá.'
                : 'O navegador bloqueou a nova aba. Escreva para efforedevelopment@gmail.com ou libere pop-ups e tente de novo.';
            status.style.color = opened ? '' : 'var(--danger)';
        }
    });
}

// Botão "Copiar" (e-mail do contato)
document.querySelectorAll('[data-copy]').forEach(button => {
    const label = button.textContent;
    let resetTimer = 0;

    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(button.dataset.copy);
            button.textContent = 'Copiado';
            button.classList.add('is-done');
        } catch (e) {
            button.textContent = 'Selecione e copie';
        }

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            button.textContent = label;
            button.classList.remove('is-done');
        }, 2000);
    });
});

// Ano do rodapé
document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
});

// Filtro do portfólio (portfolio.html)
const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item-full');

if (filterButtons.length > 0 && portfolioItems.length > 0) {
    const emptyState = document.querySelector('.portfolio-empty');
    const resultCount = document.querySelector('.portfolio-result-count');

    // data-category aceita várias categorias separadas por espaço ("web software")
    const categoriesOf = item => (item.getAttribute('data-category') || '').trim().split(/\s+/);

    const matches = (item, filter) => filter === 'all' || categoriesOf(item).includes(filter);

    function applyFilter(filter, { updateHistory = true } = {}) {
        const button = [...filterButtons].find(btn => btn.dataset.filter === filter);
        if (!button) return;

        filterButtons.forEach(btn => {
            const isActive = btn === button;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });

        let visible = 0;
        portfolioItems.forEach(item => {
            const show = matches(item, filter);
            item.classList.toggle('hidden', !show);
            // Tira do fluxo de foco os cards escondidos
            item.toggleAttribute('inert', !show);
            if (show) visible++;
        });

        if (emptyState) emptyState.hidden = visible > 0;
        if (resultCount) {
            resultCount.textContent = visible === 1 ? '1 projeto' : `${visible} projetos`;
        }

        if (updateHistory) {
            const url = new URL(window.location.href);
            if (filter === 'all') {
                url.searchParams.delete('filtro');
            } else {
                url.searchParams.set('filtro', filter);
            }
            history.replaceState(null, '', url);
        }
    }

    filterButtons.forEach(button => {
        // Preenche a contagem de cada filtro a partir dos cards reais
        const count = [...portfolioItems].filter(item => matches(item, button.dataset.filter)).length;
        const countEl = button.querySelector('.filter-count');
        if (countEl) countEl.textContent = count;

        // Categoria sem nenhum case publicado não aparece como opção
        button.hidden = count === 0;

        button.addEventListener('click', () => applyFilter(button.dataset.filter));
    });

    // Respeita ?filtro=web ao abrir/compartilhar o link
    const initial = new URLSearchParams(window.location.search).get('filtro');
    const isKnown = initial && [...filterButtons].some(btn => btn.dataset.filter === initial && !btn.hidden);
    applyFilter(isKnown ? initial : 'all', { updateHistory: false });
}

// Carrega os previews (iframes de modelo e vídeos) só quando entram na viewport
const lazyFrames = document.querySelectorAll('iframe[data-src], video[data-src]');

if (lazyFrames.length > 0) {
    const frameObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            if (el.tagName === 'VIDEO') {
                const source = el.querySelector('source');
                if (source) {
                    source.src = el.dataset.src;
                    el.load();
                }
            } else {
                el.src = el.dataset.src;
            }
            el.removeAttribute('data-src');
            obs.unobserve(el);
        });
    }, { rootMargin: '300px' });

    lazyFrames.forEach(frame => frameObserver.observe(frame));
}

// Carrossel do celular: avança sozinho, pausa com o ponteiro/foco em cima e aceita clique nos pontos
const phone = document.querySelector('.phone-frame');

if (phone) {
    const track = phone.querySelector('.phone-slides');
    const slides = phone.querySelectorAll('.phone-slide');
    const dots = phone.querySelectorAll('.phone-dots .dot');
    let current = 0;
    let timer = 0;

    const goTo = (index) => {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === current);
            dot.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
    };

    const stop = () => clearInterval(timer);
    const play = () => {
        stop();
        if (!prefersReducedMotion.matches) timer = setInterval(() => goTo(current + 1), 3500);
    };

    dots.forEach((dot, i) => dot.addEventListener('click', () => {
        goTo(i);
        play();
    }));

    phone.addEventListener('pointerenter', stop);
    phone.addEventListener('pointerleave', play);
    phone.addEventListener('focusin', stop);
    phone.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

    goTo(0);
    play();
}
