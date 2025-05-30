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
            translatedInstructions: [],
            completed: [],
            isReadingDay: false
        };
    },
    computed: {
        percentCompleted() {
            if (this.isReadingDay) return 100; // Les jours de lecture sont toujours "complétés"
            if (!this.translatedInstructions.length) return 0;
            const done = this.completed.filter(Boolean).length;
            return Math.round((done / this.translatedInstructions.length) * 100);
        }
    },
    methods: {
        getUserCodeFromToken() {
            const token = localStorage.getItem('token');
            if (!token) return null;
            
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.code || null;
            } catch (e) {
                console.error('Erreur décodage token:', e);
                return null;
            }
        },
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
                    reading: {
                        title: t('day.reading.title', this.currentLanguage)
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

            // Traduire la description et le contenu du jour
            if (this.day) {
                const translatedContent = t(`content.days.${this.dayNumber}`, this.currentLanguage);
                if (translatedContent && translatedContent.description) {
                    this.day.description = translatedContent.description;
                }
                
                // Si c'est un jour de lecture, récupérer le contenu de lecture traduit
                if (this.isReadingDay && translatedContent && translatedContent.readingContent) {
                    this.day.readingContent = translatedContent.readingContent;
                }
            }

            // Traduire les instructions si le jour est chargé et que ce n'est pas un jour de lecture
            if (this.day && this.day.instructions && !this.isReadingDay) {
                console.log('Debug - Instructions originales:', this.day.instructions);
                this.translatedInstructions = this.day.instructions.map((instruction, index) => {
                    const translationKey = `day.instructions.list.${this.dayNumber}.instruction${index + 1}`;
                    const translation = t(translationKey, this.currentLanguage);
                    return (translation && translation !== translationKey) ? translation : instruction;
                });
                // Synchroniser la checklist avec le nombre d'instructions
                this.syncChecklist();
            } else {
                console.log('Debug - Jour de lecture ou pas d\'instructions trouvées:', { day: this.day, isReadingDay: this.isReadingDay });
                this.translatedInstructions = [];
                this.completed = [];
            }
        },
        syncChecklist() {
            // Ne pas synchroniser pour les jours de lecture
            if (this.isReadingDay) return;

            // Récupérer le code utilisateur
            const userCode = this.getUserCodeFromToken();
            if (!userCode) return;

            // Clé unique par utilisateur et jour
            const key = `completedTasks_${userCode}_day${this.dayNumber}`;
            let saved = localStorage.getItem(key);
            let arr = [];
            
            // Migration : si pas de données avec la nouvelle clé, chercher l'ancienne clé sans utilisateur
            if (!saved) {
                const oldKey = `completedTasks_day${this.dayNumber}`;
                const oldSaved = localStorage.getItem(oldKey);
                if (oldSaved) {
                    // Migrer les données vers la nouvelle clé avec utilisateur
                    localStorage.setItem(key, oldSaved);
                    // Ne pas supprimer l'ancienne clé pour éviter de perdre les données d'autres utilisateurs
                    saved = oldSaved;
                    console.log(`Migration des données de progression du jour ${this.dayNumber} pour ${userCode}`);
                }
            }
            
            if (saved) {
                try {
                    arr = JSON.parse(saved);
                } catch {
                    arr = [];
                }
            }
            // Toujours ajuster la taille du tableau
            const n = this.translatedInstructions.length;
            if (arr.length !== n) {
                // On garde les valeurs déjà cochées, on complète avec false
                this.completed = Array.from({length: n}, (_, i) => arr[i] === true);
            } else {
                this.completed = arr;
            }
        },
        saveProgress() {
            // Ne pas sauvegarder pour les jours de lecture
            if (this.isReadingDay) return;

            // Récupérer le code utilisateur
            const userCode = this.getUserCodeFromToken();
            if (!userCode) return;

            const key = `completedTasks_${userCode}_day${this.dayNumber}`;
            localStorage.setItem(key, JSON.stringify(this.completed));
            
            // Synchroniser avec le serveur
            this.syncWithServer();
        },
        async syncWithServer() {
            // Ne pas synchroniser pour les jours de lecture
            if (this.isReadingDay) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('/save-progress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        dayNumber: this.dayNumber,
                        completed: this.completed
                    })
                });

                if (!response.ok) {
                    console.error('Erreur lors de la synchronisation:', response.statusText);
                }
            } catch (error) {
                console.error('Erreur lors de la synchronisation:', error);
            }
        },
        async loadProgressFromServer() {
            // Ne pas charger pour les jours de lecture
            if (this.isReadingDay) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                // Récupérer le code utilisateur
                const userCode = this.getUserCodeFromToken();
                if (!userCode) return;

                const response = await fetch('/get-progress', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const progressKey = `day${this.dayNumber}`;
                    
                    if (data.progress && data.progress[progressKey]) {
                        const serverProgress = data.progress[progressKey];
                        
                        // Vérifier si les données du serveur sont plus récentes
                        const localKey = `completedTasks_${userCode}_day${this.dayNumber}`;
                        const localTimestamp = localStorage.getItem(`${localKey}_timestamp`);
                        
                        if (!localTimestamp || new Date(serverProgress.lastUpdated) > new Date(localTimestamp)) {
                            // Utiliser les données du serveur
                            this.completed = serverProgress.completed || [];
                            localStorage.setItem(localKey, JSON.stringify(this.completed));
                            localStorage.setItem(`${localKey}_timestamp`, serverProgress.lastUpdated);
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la progression:', error);
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
        parseMarkdown(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n• /g, '<br>• ')
                .replace(/\n/g, '<br>');
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
            
            // Vérifier si c'est un jour de lecture
            this.isReadingDay = dayData.type === 'reading';
            
            // Mettre à jour les traductions après avoir chargé les données du jour
            this.updateTranslations();
            
            // Charger la progression depuis le serveur seulement si ce n'est pas un jour de lecture
            if (!this.isReadingDay) {
                await this.loadProgressFromServer();
            }
            
            console.log('Debug - Instructions traduites:', this.translatedInstructions);
            console.log('Debug - Jour de lecture:', this.isReadingDay);
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