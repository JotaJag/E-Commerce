import { describe, it, expect, beforeEach } from 'vitest';
import {
    cookiesAceptadas,
    puedeUsarCookiesAnaliticas,
    puedeUsarCookiesMarketing,
    getPreferenciasCookies,
    guardarPreferenciasCookies,
    resetearPreferenciasCookies,
} from '../utils/cookies';

beforeEach(() => {
    localStorage.clear();
});

describe('cookiesAceptadas', () => {
    it('devuelve false si no hay preferencias guardadas', () => {
        expect(cookiesAceptadas()).toBe(false);
    });

    it('devuelve true cuando se han aceptado las cookies', () => {
        localStorage.setItem('cookiesAceptadas', 'true');
        expect(cookiesAceptadas()).toBe(true);
    });
});

describe('puedeUsarCookiesAnaliticas', () => {
    it('devuelve false por defecto', () => {
        expect(puedeUsarCookiesAnaliticas()).toBe(false);
    });

    it('devuelve true cuando están activadas', () => {
        localStorage.setItem('cookiesAnaliticas', 'true');
        expect(puedeUsarCookiesAnaliticas()).toBe(true);
    });
});

describe('puedeUsarCookiesMarketing', () => {
    it('devuelve false por defecto', () => {
        expect(puedeUsarCookiesMarketing()).toBe(false);
    });

    it('devuelve true cuando están activadas', () => {
        localStorage.setItem('cookiesMarketing', 'true');
        expect(puedeUsarCookiesMarketing()).toBe(true);
    });
});

describe('guardarPreferenciasCookies', () => {
    it('marca cookiesAceptadas y cookiesNecesarias siempre como true', () => {
        guardarPreferenciasCookies({ analiticas: false, marketing: false });
        expect(localStorage.getItem('cookiesAceptadas')).toBe('true');
        expect(localStorage.getItem('cookiesNecesarias')).toBe('true');
    });

    it('guarda preferencias analíticas y de marketing correctamente', () => {
        guardarPreferenciasCookies({ analiticas: true, marketing: false });
        expect(localStorage.getItem('cookiesAnaliticas')).toBe('true');
        expect(localStorage.getItem('cookiesMarketing')).toBe('false');
    });

    it('guarda false en analíticas y marketing cuando se rechazan', () => {
        guardarPreferenciasCookies({ analiticas: false, marketing: false });
        expect(localStorage.getItem('cookiesAnaliticas')).toBe('false');
        expect(localStorage.getItem('cookiesMarketing')).toBe('false');
    });
});

describe('getPreferenciasCookies', () => {
    it('devuelve todas las preferencias en false sin datos guardados', () => {
        const prefs = getPreferenciasCookies();
        expect(prefs).toEqual({
            aceptadas: false,
            necesarias: false,
            analiticas: false,
            marketing: false,
        });
    });

    it('refleja correctamente las preferencias guardadas', () => {
        guardarPreferenciasCookies({ analiticas: true, marketing: true });
        const prefs = getPreferenciasCookies();
        expect(prefs.aceptadas).toBe(true);
        expect(prefs.necesarias).toBe(true);
        expect(prefs.analiticas).toBe(true);
        expect(prefs.marketing).toBe(true);
    });
});

describe('resetearPreferenciasCookies', () => {
    it('elimina todas las preferencias del localStorage', () => {
        guardarPreferenciasCookies({ analiticas: true, marketing: true });
        resetearPreferenciasCookies();
        expect(localStorage.getItem('cookiesAceptadas')).toBeNull();
        expect(localStorage.getItem('cookiesNecesarias')).toBeNull();
        expect(localStorage.getItem('cookiesAnaliticas')).toBeNull();
        expect(localStorage.getItem('cookiesMarketing')).toBeNull();
    });

    it('hace que cookiesAceptadas devuelva false tras resetear', () => {
        guardarPreferenciasCookies({ analiticas: true, marketing: true });
        resetearPreferenciasCookies();
        expect(cookiesAceptadas()).toBe(false);
    });
});
