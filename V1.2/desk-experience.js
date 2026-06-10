/**
 * Velodesk — Desk Experience
 * Transições fluidas, animações e polish de interação.
 */
(function () {
    'use strict';

    const STAGGER_SEL = '.kpi-card, .stat-card, .eco-card, .chart-card, .config-welcome-card, .eco-kpi-pill, .eco-workspace-grid > .eco-card';

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    }

    function boot() {
        patchNavigation();
        patchConfigTabs();
        initStaggerObserver();
        enhanceLogin();
        polishNotifications();
        animateActivePage();
    }

    function patchConfigTabs() {
        const orig = window.switchConfigTab;
        if (!orig || orig.__deskPatched) return;
        window.switchConfigTab = function (tabName) {
            orig.apply(this, arguments);
            const panelId = window.CONFIG_TAB_PANEL_IDS?.[tabName];
            const panel = panelId ? document.getElementById(panelId) : null;
            if (panel) {
                panel.style.animation = 'none';
                void panel.offsetWidth;
                panel.style.animation = 'configTabIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
                staggerChildren(panel);
            }
        };
        window.switchConfigTab.__deskPatched = true;
    }

    function patchNavigation() {
        const wrap = (fn) => {
            if (!fn || fn.__deskPatched) return fn;
            const wrapped = function (page) {
                const outgoing = document.querySelector('.page.active');
                if (outgoing && outgoing.id !== page) {
                    outgoing.classList.add('desk-page-leaving');
                    setTimeout(() => outgoing.classList.remove('desk-page-leaving'), 220);
                }
                const result = fn.apply(this, arguments);
                requestAnimationFrame(() => {
                    const incoming = document.getElementById(page);
                    if (incoming) {
                        incoming.classList.remove('desk-page-enter');
                        void incoming.offsetWidth;
                        incoming.classList.add('desk-page-enter');
                        setTimeout(() => incoming.classList.remove('desk-page-enter'), 500);
                        staggerChildren(incoming);
                    }
                    syncSidebarActive(page);
                });
                return result;
            };
            wrapped.__deskPatched = true;
            return wrapped;
        };

        window.navigateToPage = wrap(window.navigateToPage);
        window.navigateToPageMobile = wrap(window.navigateToPageMobile);
    }

    function syncSidebarActive(page) {
        document.querySelectorAll('#mainSidebar .nav-item[data-page]').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });
    }

    function staggerChildren(container) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const items = container.querySelectorAll(STAGGER_SEL);
        items.forEach((el, i) => {
            el.classList.remove('desk-stagger-in');
            el.style.animationDelay = `${Math.min(i * 0.06, 0.4)}s`;
            void el.offsetWidth;
            el.classList.add('desk-stagger-in');
        });
    }

    function initStaggerObserver() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const obs = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    if (node.matches?.(STAGGER_SEL)) {
                        node.classList.add('desk-stagger-in');
                    }
                    node.querySelectorAll?.(STAGGER_SEL).forEach((el, i) => {
                        el.style.animationDelay = `${Math.min(i * 0.05, 0.35)}s`;
                        el.classList.add('desk-stagger-in');
                    });
                });
            });
        });

        obs.observe(document.body, { childList: true, subtree: true });

        const active = document.querySelector('.page.active');
        if (active) staggerChildren(active);
    }

    function animateActivePage() {
        const active = document.querySelector('.page.active');
        if (active) {
            active.classList.add('desk-page-enter');
            staggerChildren(active);
        }
    }

    function enhanceLogin() {
        const btn = document.querySelector('#loginForm .btn-primary');
        if (!btn) return;
        const orig = window.fazerLogin;
        if (!orig || orig.__deskLogin) return;

        window.fazerLogin = function () {
            const login = document.getElementById('loginScreen');
            const app = document.getElementById('mainApp');
            if (login && login.style.display !== 'none') {
                login.style.animation = 'deskPageOut 0.35s ease forwards';
                setTimeout(() => {
                    orig.apply(this, arguments);
                    if (app) {
                        app.style.opacity = '0';
                        requestAnimationFrame(() => {
                            app.style.transition = 'opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
                            app.style.opacity = '1';
                        });
                    }
                }, 300);
            } else {
                orig.apply(this, arguments);
            }
        };
        window.fazerLogin.__deskLogin = true;
    }

    function polishNotifications() {
        const orig = window.toggleNotificationPanel;
        if (!orig || orig.__deskPolish) return;

        window.toggleNotificationPanel = function () {
            orig.apply(this, arguments);
            const panel = document.getElementById('notificationPanel');
            if (panel?.classList.contains('show')) {
                panel.querySelectorAll('.notification-item').forEach((item, i) => {
                    item.style.animation = `deskStaggerIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.05}s both`;
                });
            }
        };
        window.toggleNotificationPanel.__deskPolish = true;
    }

    window.DeskExperience = { staggerChildren, syncSidebarActive };
    init();
})();
