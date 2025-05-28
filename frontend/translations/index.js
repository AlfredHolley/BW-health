import fr from './fr.js';
import sp from './sp.js';
import en from './en.js';
import de from './de.js';

const translations = {
    FR: fr,
    SP: sp,
    EN: en,
    DE: de
};

export function getTranslation(lang) {
    return translations[lang] || translations.FR;
}

export function t(key, lang) {
    const translation = getTranslation(lang);
    const keys = key.split('.');
    let value = translation;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            console.warn(`Translation key not found: ${key} for language: ${lang}`);
            return key;
        }
    }
    
    return value;
} 