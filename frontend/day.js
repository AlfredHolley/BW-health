import { t } from './translations/index.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            day: null,
            loading: true,
            error: '',
            dayNumber: null,
            currentLanguage: localStorage.getItem('language') || 'FR',
            translations: {},
            translatedInstructions: []
        };
    },
    methods: {
        updateTranslations() {
            if (!this.dayNumber) return;
            
            this.translations = {
                day: {
                    title: t('day.title', this.currentLanguage).replace('{{ dayNumber }}', this.dayNumber),
                    back: t('day.back', this.currentLanguage),
                    loading: t('day.loading', this.currentLanguage),
                    error: t('day.error', this.currentLanguage),
                    resources: {
                        title: t('day.resources.title', this.currentLanguage),
                        video: t('day.resources.video', this.currentLanguage)
                    },
                    podcast: {
                        title: t('day.podcast.title', this.currentLanguage),
                        notAvailable: t('day.podcast.notAvailable', this.currentLanguage)
                    },
                    instructions: {
                        title: t('day.instructions.title', this.currentLanguage)
                    },
                    errors: {
                        invalidDay: t('day.errors.invalidDay', this.currentLanguage),
                        dayNotFound: t('day.errors.dayNotFound', this.currentLanguage),
                        dayLocked: t('day.errors.dayLocked', this.currentLanguage),
                        loadError: t('day.errors.loadError', this.currentLanguage),
                        unauthorized: t('day.errors.unauthorized', this.currentLanguage)
                    },
                    navigation: {
                        nextDay: t('day.navigation.nextDay', this.currentLanguage),
                        previousDay: t('day.navigation.previousDay', this.currentLanguage),
                        backToCalendar: t('day.navigation.backToCalendar', this.currentLanguage)
                    },
                    status: {
                        completed: t('day.status.completed', this.currentLanguage),
                        inProgress: t('day.status.inProgress', this.currentLanguage),
                        locked: t('day.status.locked', this.currentLanguage),
                        available: t('day.status.available', this.currentLanguage)
                    },
                    actions: {
                        start: t('day.actions.start', this.currentLanguage),
                        continue: t('day.actions.continue', this.currentLanguage),
                        complete: t('day.actions.complete', this.currentLanguage),
                        save: t('day.actions.save', this.currentLanguage),
                        cancel: t('day.actions.cancel', this.currentLanguage)
                    }
                }
            };

            // Traduire la description du jour
            if (this.day) {
                const translatedContent = t(`content.days.${this.dayNumber}`, this.currentLanguage);
                if (translatedContent && translatedContent.description) {
                    this.day.description = translatedContent.description;
                }
            }

            // Traduire les instructions si le jour est chargé
            if (this.day && this.day.instructions) {
                console.log('Debug - Instructions originales:', this.day.instructions);
                this.translatedInstructions = this.day.instructions.map((instruction, index) => {
                    const translationKey = `day.instructions.list.${this.dayNumber}.instruction${index + 1}`;
                    // Chercher la traduction de l'instruction
                    const translation = t(translationKey, this.currentLanguage);
                    // Si la traduction n'existe pas ou est la clé elle-même, retourner l'instruction originale
                    return (translation && translation !== translationKey) ? translation : instruction;
                });
            } else {
                console.log('Debug - Pas d\'instructions trouvées:', { day: this.day, instructions: this.day?.instructions });
                this.translatedInstructions = [];
            }
        },
        renderPodcast(podcast) {
            if (typeof podcast === 'string') {
                return `<p>${this.translations.day.podcast.notAvailable}</p>`;
            }
            if (podcast.embed) {
                return `
                    <iframe 
                        style="${podcast.style || 'border-radius:12px'}"
                        src="${podcast.embed}"
                        width="100%"
                        height="${podcast.height || 352}"
                        frameborder="0"
                        allowfullscreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy">
                    </iframe>`;
            }
            return `<p>${this.translations.day.podcast.notAvailable}</p>`;
        },
        isDayUnlocked(dayNumber) {
            const startDate = new Date(localStorage.getItem('startDate') || new Date());
            const today = new Date();
            
            // Normaliser les dates pour ignorer les heures
            const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            // Calculer le nombre de jours depuis le début
            const diffTime = current.getTime() - start.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            console.log('Debug - Date de début:', start.toISOString());
            console.log('Debug - Date actuelle:', current.toISOString());
            console.log('Debug - Jours écoulés:', diffDays);
            console.log('Debug - Jour demandé:', dayNumber);
            console.log('Debug - Jour débloqué:', dayNumber <= (diffDays + 1));
            
            // Un jour est débloqué si son numéro est inférieur ou égal au nombre de jours écoulés + 1
            return dayNumber <= (diffDays + 1);
        }
    },
    async created() {
        // Récupérer le numéro du jour depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        this.dayNumber = parseInt(urlParams.get('day'));
        
        if (!this.dayNumber || this.dayNumber < 1 || this.dayNumber > 21) {
            this.error = t('day.errors.invalidDay', this.currentLanguage);
            this.loading = false;
            return;
        }

        // Mettre à jour les traductions après avoir défini dayNumber
        this.updateTranslations();

        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Vérifier si le jour est débloqué
        if (!this.isDayUnlocked(this.dayNumber)) {
            this.error = t('day.errors.dayLocked', this.currentLanguage);
            this.loading = false;
            return;
        }

        try {
            const res = await fetch('/program-content', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(t('day.errors.loadError', this.currentLanguage));
            }

            const data = await res.json();
            const dayData = data.days.find(d => d.day === this.dayNumber);
            
            if (!dayData) {
                this.error = t('day.errors.dayNotFound', this.currentLanguage);
                return;
            }

            console.log('Debug - Données du jour:', dayData);
            this.day = dayData;
            
            // Mettre à jour les traductions après avoir chargé les données du jour
            this.updateTranslations();
            console.log('Debug - Instructions traduites:', this.translatedInstructions);
        } catch (e) {
            this.error = t('day.errors.loadError', this.currentLanguage);
        } finally {
            this.loading = false;
        }
    },
    watch: {
        currentLanguage: {
            immediate: true,
            handler(newLang) {
                if (this.dayNumber) {
                    this.updateTranslations();
                }
            }
        }
    }
}).mount('#app'); 