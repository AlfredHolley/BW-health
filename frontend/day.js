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
            isReadingDay: false,
            // Questionnaire
            showQuestionnaire: false,
            questionnaire: null,
            answers: {},
            isQuestionnaireCompleted: false
        };
    },
    computed: {
        percentCompleted() {
            if (this.isReadingDay) {
                // Pour les jours de lecture avec questionnaire
                if (this.day?.questionnaire) {
                    return this.isQuestionnaireCompleted ? 100 : 0;
                }
                return 100; // Les jours de lecture sans questionnaire sont toujours "complétés"
            }
            
            // Pour les jours avec instructions normales
            if (!this.translatedInstructions.length && !this.day?.questionnaire) return 0;
            
            let totalTasks = this.translatedInstructions.length;
            let completedTasks = this.completed.filter(Boolean).length;
            
            // Ajouter le questionnaire aux tâches si présent
            if (this.day?.questionnaire) {
                totalTasks += 1;
                if (this.isQuestionnaireCompleted) {
                    completedTasks += 1;
                }
            }
            
            return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
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
                    },
                    questionnaire: {
                        title: t('day.questionnaire.title', this.currentLanguage),
                        completed: t('day.questionnaire.completed', this.currentLanguage),
                        fillOut: t('day.questionnaire.fillOut', this.currentLanguage),
                        submit: t('day.questionnaire.submit', this.currentLanguage),
                        cancel: t('day.questionnaire.cancel', this.currentLanguage),
                        close: t('day.questionnaire.close', this.currentLanguage),
                        pleaseAnswer: t('day.questionnaire.pleaseAnswer', this.currentLanguage),
                        submitSuccess: t('day.questionnaire.submitSuccess', this.currentLanguage),
                        questions: {
                            wellbeing: t('day.questionnaire.questions.wellbeing', this.currentLanguage),
                            wellbeing_final: t('day.questionnaire.questions.wellbeing_final', this.currentLanguage),
                            difficulty: t('day.questionnaire.questions.difficulty', this.currentLanguage),
                            difficulty_final: t('day.questionnaire.questions.difficulty_final', this.currentLanguage),
                            motivation: t('day.questionnaire.questions.motivation', this.currentLanguage),
                            motivation_final: t('day.questionnaire.questions.motivation_final', this.currentLanguage),
                            obstacles: t('day.questionnaire.questions.obstacles', this.currentLanguage),
                            obstacles_final: t('day.questionnaire.questions.obstacles_final', this.currentLanguage)
                        },
                        labels: {
                            veryLow: t('day.questionnaire.labels.veryLow', this.currentLanguage),
                            excellent: t('day.questionnaire.labels.excellent', this.currentLanguage),
                            veryEasy: t('day.questionnaire.labels.veryEasy', this.currentLanguage),
                            veryDifficult: t('day.questionnaire.labels.veryDifficult', this.currentLanguage)
                        },
                        options: {
                            yes: t('day.questionnaire.options.yes', this.currentLanguage),
                            no: t('day.questionnaire.options.no', this.currentLanguage),
                            mixed: t('day.questionnaire.options.mixed', this.currentLanguage)
                        }
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
        },
        // Méthodes pour le questionnaire
        async openQuestionnaire() {
            // Vérifier d'abord si le questionnaire est déjà complété
            if (this.isQuestionnaireCompleted) {
                console.log('Questionnaire déjà complété, ouverture bloquée');
                return;
            }
            
            if (this.day?.questionnaire) {
                this.questionnaire = this.day.questionnaire;
                
                // Debug: Afficher les données du questionnaire
                console.log('Debug - Questionnaire original:', this.questionnaire);
                console.log('Debug - Langue actuelle:', this.currentLanguage);
                console.log('Debug - Traductions disponibles:', this.translations.day?.questionnaire);
                
                await this.loadQuestionnaireAnswers();
                this.showQuestionnaire = true;
            }
        },
        closeQuestionnaire() {
            this.showQuestionnaire = false;
            this.questionnaire = null;
            this.answers = {};
        },
        updateAnswer(questionId, value) {
            this.answers[questionId] = value;
        },
        getQuestionText(question) {
            // Debug
            console.log('Debug - getQuestionText appelé avec:', question);
            console.log('Debug - Traductions disponibles:', this.translations.day?.questionnaire?.questions);
            console.log('Debug - Langue actuelle:', this.currentLanguage);
            
            // Chercher d'abord dans les traductions
            const translatedQuestion = this.translations.day?.questionnaire?.questions?.[question.id];
            if (translatedQuestion) {
                console.log('Debug - Traduction trouvée:', translatedQuestion);
                return translatedQuestion;
            }
            
            // Si pas de traduction trouvée, essayer avec le texte original de la question
            if (question.question) {
                console.log('Debug - Utilisation du texte original:', question.question);
                return question.question;
            }
            
            // Si aucun texte n'est disponible, afficher un message par défaut basé sur l'ID
            console.warn(`Aucune traduction trouvée pour la question: ${question.id}`);
            
            // Fallback basé sur l'ID de la question
            const fallbackTexts = {
                'wellbeing': 'Évaluez votre niveau de bien-être',
                'wellbeing_final': 'Évaluez votre niveau de bien-être final',
                'difficulty': 'Évaluez la difficulté',
                'difficulty_final': 'Évaluez la difficulté finale',
                'motivation': 'Votre motivation',
                'motivation_final': 'Votre motivation finale',
                'obstacles': 'Avez-vous rencontré des obstacles ?',
                'obstacles_final': 'Avez-vous rencontré des obstacles ?'
            };
            
            return fallbackTexts[question.id] || `Question: ${question.id}`;
        },
        getScaleLabel(question, type) {
            // Chercher d'abord dans les traductions génériques
            if (type === 'min') {
                // Pour les questions de bien-être
                if (question.id.includes('wellbeing')) {
                    return this.translations.day?.questionnaire?.labels?.veryLow || question.labels?.min || '';
                }
                // Pour les questions de difficulté
                if (question.id.includes('difficulty')) {
                    return this.translations.day?.questionnaire?.labels?.veryEasy || question.labels?.min || '';
                }
            }
            if (type === 'max') {
                // Pour les questions de bien-être
                if (question.id.includes('wellbeing')) {
                    return this.translations.day?.questionnaire?.labels?.excellent || question.labels?.max || '';
                }
                // Pour les questions de difficulté
                if (question.id.includes('difficulty')) {
                    return this.translations.day?.questionnaire?.labels?.veryDifficult || question.labels?.max || '';
                }
            }
            // Fallback sur les labels originaux
            return question.labels?.[type] || '';
        },
        getOptionText(option) {
            // Mapper les options vers les traductions - inclure toutes les langues possibles
            const optionMap = {
                // Français
                'Oui': this.translations.day?.questionnaire?.options?.yes,
                'Non': this.translations.day?.questionnaire?.options?.no,
                'Mitigé': this.translations.day?.questionnaire?.options?.mixed,
                // Anglais
                'Yes': this.translations.day?.questionnaire?.options?.yes,
                'No': this.translations.day?.questionnaire?.options?.no,
                'Mixed': this.translations.day?.questionnaire?.options?.mixed,
                // Espagnol
                'Sí': this.translations.day?.questionnaire?.options?.yes,
                'Si': this.translations.day?.questionnaire?.options?.yes,
                'Mixto': this.translations.day?.questionnaire?.options?.mixed
            };
            
            // Retourner la traduction si elle existe, sinon retourner l'option originale
            return optionMap[option] || option;
        },
        getYesText() {
            return this.translations.day?.questionnaire?.options?.yes || '';
        },
        getNoText() {
            return this.translations.day?.questionnaire?.options?.no || '';
        },
        async loadQuestionnaireAnswers() {
            const userCode = this.getUserCodeFromToken();
            if (!userCode) return;

            const key = `questionnaire_${userCode}_day${this.dayNumber}`;
            const saved = localStorage.getItem(key);
            
            if (saved) {
                try {
                    const savedData = JSON.parse(saved);
                    // Si c'est le nouveau format avec la structure complète
                    if (savedData.answers) {
                        this.answers = savedData.answers;
                    } else {
                        // Sinon, c'est directement les réponses (ancien format)
                        this.answers = savedData;
                    }
                    return; // On a trouvé des données locales, pas besoin d'aller sur le serveur
                } catch (e) {
                    console.error('Erreur lors du chargement des réponses locales:', e);
                }
            }

            // Si pas de données locales, essayer de charger depuis le serveur
            await this.loadQuestionnaireAnswersFromServer();

            // Si toujours pas de données, initialiser avec des valeurs par défaut
            if (!this.answers || Object.keys(this.answers).length === 0) {
                this.answers = {};
                if (this.questionnaire?.questions) {
                    this.questionnaire.questions.forEach(question => {
                        if (question.type === 'scale') {
                            this.answers[question.id] = question.min;
                        }
                    });
                }
            }
        },
        async submitQuestionnaire() {
            const userCode = this.getUserCodeFromToken();
            if (!userCode) return;

            // Vérifier que toutes les questions ont une réponse
            const allAnswered = this.questionnaire.questions.every(question => {
                return this.answers[question.id] !== undefined && this.answers[question.id] !== '';
            });

            if (!allAnswered) {
                alert(this.translations.day?.questionnaire?.pleaseAnswer || 'Veuillez répondre à toutes les questions avant de valider.');
                return;
            }

            // Sauvegarder localement
            const key = `questionnaire_${userCode}_day${this.dayNumber}`;
            const dataToSave = {
                answers: this.answers,
                completedAt: new Date().toISOString(),
                dayNumber: this.dayNumber
            };
            
            localStorage.setItem(key, JSON.stringify(dataToSave));

            // Sauvegarder sur le serveur
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/save-questionnaire', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(dataToSave)
                });

                if (response.ok) {
                    console.log('Questionnaire sauvegardé avec succès');
                } else {
                    console.error('Erreur lors de la sauvegarde du questionnaire');
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du questionnaire:', error);
            }

            // Fermer le questionnaire
            this.closeQuestionnaire();
            
            // Afficher un message de confirmation
            alert(this.translations.day?.questionnaire?.submitSuccess || 'Questionnaire envoyé avec succès !');
            
            // Mettre à jour le statut du questionnaire
            await this.checkQuestionnaireStatus();
        },
        async checkQuestionnaireStatus() {
            if (!this.day?.questionnaire) {
                this.isQuestionnaireCompleted = false;
                return;
            }
            
            const userCode = this.getUserCodeFromToken();
            if (!userCode) {
                this.isQuestionnaireCompleted = false;
                return;
            }

            // D'abord, vérifier dans localStorage
            const key = `questionnaire_${userCode}_day${this.dayNumber}`;
            const saved = localStorage.getItem(key);
            
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.isQuestionnaireCompleted = data.answers && Object.keys(data.answers).length > 0;
                    if (this.isQuestionnaireCompleted) {
                        return; // Pas besoin de vérifier le serveur si on a les données localement
                    }
                } catch (e) {
                    console.error('Erreur lors de la vérification du questionnaire local:', e);
                }
            }

            // Si pas de données locales, vérifier sur le serveur
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.isQuestionnaireCompleted = false;
                    return;
                }

                const response = await fetch('/get-progress', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const questionnaireKey = `questionnaire_day${this.dayNumber}`;
                    
                    if (data.progress && data.progress[questionnaireKey]) {
                        const serverData = data.progress[questionnaireKey];
                        this.isQuestionnaireCompleted = serverData.answers && Object.keys(serverData.answers).length > 0;
                        
                        // Sauvegarder les données du serveur en local pour éviter de refaire la requête
                        if (this.isQuestionnaireCompleted) {
                            localStorage.setItem(key, JSON.stringify(serverData));
                        }
                    } else {
                        this.isQuestionnaireCompleted = false;
                    }
                } else {
                    console.error('Erreur lors de la récupération des données du serveur');
                    this.isQuestionnaireCompleted = false;
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du questionnaire sur le serveur:', error);
                this.isQuestionnaireCompleted = false;
            }
        },
        async loadQuestionnaireAnswersFromServer() {
            const userCode = this.getUserCodeFromToken();
            if (!userCode) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('/get-progress', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const questionnaireKey = `questionnaire_day${this.dayNumber}`;
                    
                    if (data.progress && data.progress[questionnaireKey]) {
                        const serverData = data.progress[questionnaireKey];
                        
                        // Charger les réponses depuis le serveur
                        if (serverData.answers) {
                            this.answers = serverData.answers;
                            
                            // Sauvegarder en local
                            const key = `questionnaire_${userCode}_day${this.dayNumber}`;
                            localStorage.setItem(key, JSON.stringify(serverData));
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement du questionnaire depuis le serveur:', error);
            }
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

        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
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
            
            // Récupérer la langue depuis localStorage si elle existe, sinon utiliser celle du serveur
            const storedLanguage = localStorage.getItem('language');
            if (storedLanguage) {
                // L'utilisateur a choisi une langue, on la respecte
                this.currentLanguage = storedLanguage;
                console.log('Debug - Utilisation de la langue stockée:', storedLanguage);
            } else if (data.language) {
                // Pas de langue stockée, on utilise celle du serveur
                this.currentLanguage = data.language;
                localStorage.setItem('language', data.language);
                console.log('Debug - Utilisation de la langue du serveur:', data.language);
            }
            
            // Mettre à jour les traductions après avoir défini la langue
            this.updateTranslations();
            
            const dayData = data.days.find(d => d.day === this.dayNumber);
            
            if (!dayData) {
                this.error = t('day.errors.dayNotFound', this.currentLanguage);
                return;
            }

            console.log('Debug - Données du jour:', dayData);
            this.day = dayData;
            
            // Vérifier si c'est un jour de lecture
            this.isReadingDay = dayData.type === 'reading';
            
            // Vérifier si le jour est débloqué
            if (!this.isDayUnlocked(this.dayNumber)) {
                this.error = t('day.errors.dayLocked', this.currentLanguage);
                this.loading = false;
                return;
            }
            
            // Mettre à jour les traductions après avoir chargé les données du jour
            this.updateTranslations();
            
            // Charger la progression depuis le serveur seulement si ce n'est pas un jour de lecture
            if (!this.isReadingDay) {
                await this.loadProgressFromServer();
            }
            
            // Vérifier le statut du questionnaire
            await this.checkQuestionnaireStatus();
            
            console.log('Debug - Instructions traduites:', this.translatedInstructions);
            console.log('Debug - Jour de lecture:', this.isReadingDay);
            console.log('Debug - Langue détectée:', this.currentLanguage);
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
    },
    mounted() {
        // Écouter les changements de langue depuis localStorage (quand l'utilisateur change la langue sur app.html)
        window.addEventListener('storage', (e) => {
            if (e.key === 'language' && e.newValue !== this.currentLanguage) {
                console.log('Changement de langue détecté:', e.newValue);
                this.currentLanguage = e.newValue;
                this.updateTranslations();
            }
        });

        // Vérifier périodiquement les changements de langue (au cas où storage event ne marche pas)
        this.languageCheckInterval = setInterval(() => {
            const storedLanguage = localStorage.getItem('language');
            if (storedLanguage && storedLanguage !== this.currentLanguage) {
                console.log('Changement de langue détecté (polling):', storedLanguage);
                this.currentLanguage = storedLanguage;
                this.updateTranslations();
            }
        }, 1000);
    },
    beforeUnmount() {
        // Nettoyer l'interval au démontage du composant
        if (this.languageCheckInterval) {
            clearInterval(this.languageCheckInterval);
        }
    }
}).mount('#app');