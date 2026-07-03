// Lightweight in-page i18n: swaps text/attributes marked with data-i18n*
// against the dictionary in translations.js (window.I18N). English is the
// source — it's read straight from the DOM, so the dictionary only carries es/de.
(function () {
    const KEY = 'natladev-lang';
    const SUPPORTED = ['en', 'es', 'de', 'zh'];
    const root = document.documentElement;
    const T = window.I18N || {};

    function readLang() {
        // An explicit ?lang= in the URL wins over everything (used e.g. as the
        // App Store Connect privacy-policy URL for a specific locale).
        try {
            const q = new URLSearchParams(location.search).get('lang');
            if (SUPPORTED.indexOf(q) >= 0) return q;
        } catch (e) { /* very old browser */ }
        // A saved choice always wins.
        try {
            const saved = localStorage.getItem(KEY);
            if (SUPPORTED.indexOf(saved) >= 0) return saved;
        } catch (e) { /* private mode */ }
        // Otherwise fall back to the visitor's browser language.
        const prefs = (navigator.languages && navigator.languages.length)
            ? navigator.languages
            : [navigator.language || navigator.userLanguage || ''];
        for (let i = 0; i < prefs.length; i++) {
            const code = (prefs[i] || '').slice(0, 2).toLowerCase();
            if (SUPPORTED.indexOf(code) >= 0) return code;
        }
        return 'en';
    }
    let lang = readLang();

    // Capture English originals once.
    const textEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
    textEls.forEach(el => { if (el.dataset.en === undefined) el.dataset.en = el.textContent; });
    const htmlEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n-html]'));
    htmlEls.forEach(el => { if (el.dataset.enHtml === undefined) el.dataset.enHtml = el.innerHTML; });

    const ATTRS = [
        ['data-i18n-aria', 'aria-label', 'enAria'],
        ['data-i18n-alt', 'alt', 'enAlt'],
        ['data-i18n-ph', 'placeholder', 'enPh'],
        ['data-i18n-content', 'content', 'enContent']
    ];
    ATTRS.forEach(spec => {
        document.querySelectorAll('[' + spec[0] + ']').forEach(el => {
            if (el.dataset[spec[2]] === undefined) el.dataset[spec[2]] = el.getAttribute(spec[1]) || '';
        });
    });

    function val(key) {
        if (lang === 'en') return null;
        return (T[lang] && T[lang][key] != null) ? T[lang][key] : null;
    }

    function apply() {
        root.setAttribute('lang', lang === 'zh' ? 'zh-Hans' : lang);
        textEls.forEach(el => {
            const t = val(el.getAttribute('data-i18n'));
            el.textContent = (t != null) ? t : el.dataset.en;
        });
        htmlEls.forEach(el => {
            const t = val(el.getAttribute('data-i18n-html'));
            el.innerHTML = (t != null) ? t : el.dataset.enHtml;
        });
        ATTRS.forEach(spec => {
            document.querySelectorAll('[' + spec[0] + ']').forEach(el => {
                const t = val(el.getAttribute(spec[0]));
                el.setAttribute(spec[1], (t != null) ? t : el.dataset[spec[2]]);
            });
        });
        document.querySelectorAll('.lang-btn').forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
        });
        // Let scripts that build their own DOM (e.g. prefs.js) re-translate.
        document.dispatchEvent(new CustomEvent('natladev:langchange', { detail: { lang: lang } }));
    }

    function setLang(l) {
        if (SUPPORTED.indexOf(l) < 0) return;
        lang = l;
        try { localStorage.setItem(KEY, l); } catch (e) { /* private mode */ }
        apply();
    }

    document.querySelectorAll('.lang-btn').forEach(b => {
        b.addEventListener('click', () => setLang(b.dataset.lang));
    });

    apply();
    window.setSiteLang = setLang;
    window.getSiteLang = function () { return lang; };
})();
