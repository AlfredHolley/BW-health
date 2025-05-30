import { t } from './translations/index.js';

const { createApp } = Vue;

createApp({
  data() {
    return {
      code: '',
      password: '',
      token: '',
      result: '',
      error: '',
      loading: true,
      loadingContent: false,
      content: { 
        days: [],
        title: '21 Days Study',
        description: '',
        language: 'FR'
      },
      unlockedDays: 0,
      startDate: null,
      currentDay: 1,
      // Installation PWA
      deferredPrompt: null,
      showInstallPrompt: false,
      // Menu d'options
      showOptions: false,
      showLanguageMenu: false,
      showWelcomeModal: false,
      isClosing: false,
      // Calendrier d'activités
      showActivitySelector: false,
      selectedDay: null,
      dayActivities: {},
      calendarDays: [],
      currentLanguage: 'FR',
      activities: {
        free: {
          icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
          text: 'free'
        },
        sport: {
          icon: '<svg enable-background="new 0 0 100 100" height="100px" id="Layer_1" version="1.1" viewBox="0 0 100 100" width="100px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><g><g><g/></g><g/></g></g><path d="M100,43h-7.086c-0.393-2.083-2.22-4-4.416-4h-3C85.327,39,85,38.366,85,38.385v-6.551  C85,29.353,82.979,27,80.498,27h-7C71.017,27,69,29.353,69,31.834V43H31V31.834C31,29.353,28.979,27,26.498,27h-7  C17.017,27,15,29.353,15,31.834v6.613C15,38.428,14.669,39,14.498,39h-3c-2.174,0-3.993,1.947-4.409,4H0v14h7.008  c0.057,2.433,2.044,4,4.49,4h3C14.669,61,15,61.365,15,61.346v7.488C15,71.315,17.017,73,19.498,73h7C28.979,73,31,71.315,31,68.834  V57h38v11.834C69,71.315,71.017,73,73.498,73h7C82.979,73,85,71.315,85,68.834v-7.551C85,61.302,85.327,61,85.498,61h3  c2.425,0,4.394-1.597,4.483-4H100V43z M4,47h3v6H4V47z M15,56.5c0,0.276-0.224,0.5-0.5,0.5h-3c-0.276,0-0.5-0.224-0.5-0.5v-13  c0-0.276,0.224-0.5,0.5-0.5h3c0.276,0,0.5,0.224,0.5,0.5V56.5z M27,68.834C27,69.105,26.769,69,26.498,69h-7  C19.227,69,19,69.105,19,68.834V56.896v-13V31.834C19,31.563,19.227,31,19.498,31h7C26.769,31,27,31.563,27,31.834V68.834z M31,53  v-6h38v6H31z M81,68.834C81,69.105,80.769,69,80.498,69h-7C73.227,69,73,69.105,73,68.834v-37C73,31.563,73.227,31,73.498,31h7  C80.769,31,81,31.563,81,31.834v12v13V68.834z M89,56.5c0,0.276-0.224,0.5-0.5,0.5h-3c-0.276,0-0.5-0.224-0.5-0.5v-13  c0-0.276,0.224-0.5,0.5-0.5h3c0.276,0,0.5,0.224,0.5,0.5V56.5z M96,53h-3v-6h3V53z" fill="#231F20"/></svg>',
          text: 'sport'
        },
        yoga: {
          icon: '<svg viewBox="0 0 24 24"><path d="M12 5.5A2.5 2.5 0 0 0 9.5 8A2.5 2.5 0 0 0 12 10.5A2.5 2.5 0 0 0 14.5 8A2.5 2.5 0 0 0 12 5.5M12.5 2.5h-1V4h1V2.5M18.5 7h-1.5v1h1.5V7M6 7H4.5v1H6V7M12.5 20v1.5h-1V20h1Z"/></svg>',
          text: 'yoga'
        },
        running: {
          icon: '<svg viewBox="0 0 24 24"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>',
          text: 'running'
        },
        sound: {
          icon: '<svg viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/></svg>',
          text: 'sound'
        },
        meditation: {
          icon: '<svg viewBox="0 0 24 24"><path d="M12 3C9.75 3 8 4.75 8 7s1.75 4 4 4 4-1.75 4-4-1.75-4-4-4m0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4"/></svg>',
          text: 'meditation'
        }
      },
      translations: {},
    };
  },
  computed: {
    progressPercentage() {
      return (this.unlockedDays / 21) * 100;
    },
    allDays() {
      // Générer les 21 jours avec les données du backend ou des données par défaut
      return Array.from({ length: 21 }, (_, i) => {
        const dayNumber = i + 1;
        const backendDay = this.content.days.find(d => d.day === dayNumber);
        
        return backendDay || {
          day: dayNumber,
          video: `/videos/jour-${dayNumber}.mp4`,
          podcast: `/podcasts/jour-${dayNumber}.mp3`,
          title: `Jour ${dayNumber}`,
          description: `Contenu du jour ${dayNumber}`
        };
      });
    }
  },
  async created() {
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
          localStorage.removeItem('userData');
          window.location.href = '/login.html';
          return;
        }
        throw new Error('Erreur lors du chargement du contenu');
      }

      const data = await res.json();
      this.content = data;
      
      // Restaurer l'état de la session si disponible
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        const parsedUserData = JSON.parse(savedUserData);
        this.startDate = parsedUserData.startDate ? new Date(parsedUserData.startDate) : null;
        this.unlockedDays = parsedUserData.unlockedDays || 0;
        this.currentDay = parsedUserData.currentDay || 1;
      }
      
      // Stocker les informations de session
      const userData = {
        language: data.language,
        startDate: data.startDate,
        unlockedDays: this.unlockedDays,
        currentDay: this.currentDay
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Vérifier si c'est la première connexion de l'utilisateur
      const isFirstConnection = !localStorage.getItem('hasConnected');
      
      if (isFirstConnection) {
        localStorage.removeItem('language');
        localStorage.setItem('hasConnected', 'true');
      }
      
      // Initialiser la langue avec celle du patient
      const patientLanguage = data.language;
      
      if (isFirstConnection || !localStorage.getItem('language')) {
        this.currentLanguage = patientLanguage;
        localStorage.setItem('language', patientLanguage);
      } else {
        this.currentLanguage = localStorage.getItem('language');
      }
      
      // Mettre à jour les traductions
      await this.updateTranslations();
      
      // Initialiser les activités par défaut pour le calendrier
      const defaultActivities = [
          'free', 'sport', 'sound', 'sport', 'free', 'sport', 'sound', // Semaine 1
          'free', 'sport', 'sound', 'sport', 'free', 'sport', 'sound', // Semaine 2
          'free', 'sport', 'sound', 'sport', 'free', 'sport', 'sound'  // Semaine 3
      ];
      const initialActivities = {};
      for (let i = 0; i < 21; i++) {
           initialActivities[i + 1] = defaultActivities[i];
      }
      this.dayActivities = initialActivities;
      
      // Charger la progression depuis le serveur
      await this.loadProgressFromServer();
      
      // Initialiser la date de début seulement si on n'est pas en mode test
      if (data.startDate) {
        this.startDate = new Date(data.startDate);
        localStorage.setItem('startDate', this.startDate.toISOString());
        this.calculateUnlockedDays();
        this.calculateCurrentDay();
        // Sauvegarder le currentDay dans localStorage
        localStorage.setItem('currentDay', this.currentDay);
        // Générer le calendrier une fois que la date de début est définie
        this.generateCalendar();
      }
    } catch (e) {
      console.error('Erreur lors du chargement:', e);
      this.error = 'Erreur lors du chargement du contenu';
      if (e.message.includes('401') || e.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
      }
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async login() {
      this.error = '';
      this.result = '';
      if (!this.code || !this.password) {
        this.error = 'Code et mot de passe requis';
        return;
      }
      this.loading = true;

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: this.code, password: this.password }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.error = data.error || 'Erreur inconnue';
        } else {
          this.token = data.token;
          localStorage.setItem('token', data.token);
          this.result = 'Connecté avec succès !';
          window.location.href = '/app.html';
        }
      } catch (e) {
        this.error = 'Erreur réseau ou serveur';
      } finally {
        this.loading = false;
      }
    },

    logout() {
      // Récupérer le code utilisateur avant de supprimer le token
      const token = localStorage.getItem('token');
      let userCode = 'unknown';
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userCode = payload.code || 'unknown';
        } catch (e) {
          console.error('Erreur décodage token:', e);
        }
      }

      // Nettoyer les données de progression de cet utilisateur
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`completedTasks_${userCode}_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      });

      // Supprimer le token et autres données utilisateur
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('language');
      localStorage.removeItem('startDate');
      localStorage.removeItem('currentDay');
      localStorage.removeItem('hasConnected');
      
      window.location.href = '/login.html';
    },

    isDayUnlocked(dayNumber) {
      if (!this.startDate) return false;
      
      const today = new Date();
      const start = new Date(this.startDate);
      
      // Normaliser les dates pour ignorer les heures
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      // Calculer le nombre de jours depuis le début
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      
      // Un jour est débloqué si son numéro est inférieur ou égal au nombre de jours écoulés + 1
      return dayNumber <= (diffDays + 1);
    },

    calculateUnlockedDays() {
      if (!this.startDate) return;
      
      const today = new Date();
      const start = new Date(this.startDate);
      
      // Normaliser les dates pour ignorer les heures
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      // Calculer le nombre de jours depuis le début
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      
      // Si la date est dans le futur, aucun jour n'est débloqué
      if (diffDays < 0) {
        this.unlockedDays = 0;
        return;
      }
      
      // Le nombre de jours débloqués est le nombre de jours écoulés + 1
      this.unlockedDays = Math.min(diffDays + 1, 21);
    },
    calculateCurrentDay() {
      if (!this.startDate) return;
      
      const today = new Date();
      const start = new Date(this.startDate);
      
      // Normaliser les dates pour ignorer les heures
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      // Calculer le nombre de jours depuis le début
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));


      // Si la date est dans le futur, le jour actuel n'est pas débloqué
      if (diffDays < 0) {
        this.currentDay = 0;
        return;
      }
      
      // Le jour actuel est le jour écoulé + 1
      this.currentDay = Math.min(diffDays + 1, 21);
    },

    goToDay(dayNumber) {
      if (this.isDayUnlocked(dayNumber)) {
        window.location.href = `/day.html?day=${dayNumber}`;
      }
    },

    getProgressCircle(dayNumber) {
      // Récupérer le code utilisateur depuis le token
      const token = localStorage.getItem('token');
      if (!token) return 0;
      
      let userCode = 'unknown';
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userCode = payload.code || 'unknown';
      } catch (e) {
        console.error('Erreur décodage token:', e);
        return 0;
      }

      // Calculer la circonférence pour le cercle (sport: r=24, audio: r=20)
      const isLargeIcon = [2, 4, 6, 9, 11, 13, 16, 18, 20].includes(dayNumber);
      const radius = isLargeIcon ? 24 : 20;
      const circumference = 2 * Math.PI * radius;

      // Jours avec questionnaire (1 et 21) - progression basée sur le questionnaire
      if ([1, 21].includes(dayNumber)) {
        const questionnaireKey = `questionnaire_${userCode}_day${dayNumber}`;
        const questionnaireData = localStorage.getItem(questionnaireKey);
        
        if (questionnaireData) {
          try {
            const data = JSON.parse(questionnaireData);
            if (data.answers && Object.keys(data.answers).length > 0) {
              return circumference; // 100% si questionnaire completé
            }
          } catch (e) {
            console.error('Erreur parsing questionnaire:', e);
          }
        }
        return 0; // 0% si questionnaire pas completé
      }

      // Jours de lecture (sauf 1 et 21) - toujours 100% de progression
      const readingDays = [5, 8, 12, 19];
      if (readingDays.includes(dayNumber)) {
        return circumference; // 100% de progression
      }

      // Calculer la progression basée sur les tâches completées du jour pour cet utilisateur
      const completedKey = `completedTasks_${userCode}_day${dayNumber}`;
      let completed = [];
      
      try {
        const savedData = localStorage.getItem(completedKey);
        if (savedData && savedData !== 'undefined' && savedData !== 'null') {
          completed = JSON.parse(savedData);
        }
      } catch (e) {
        console.error('Erreur lors du parsing des données de progression:', e);
        completed = [];
      }
      
      const totalTasks = 4; // 4 instructions par jour
      const completedTasks = completed.filter(Boolean).length;
      const percentage = (completedTasks / totalTasks) * 100;
      
      return (percentage / 100) * circumference;
    },

    renderPodcast(podcast) {
      if (typeof podcast === 'string') {
        return `<p>Podcast non disponible</p>`;
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
      return `<p>Podcast non disponible</p>`;
    },

    async installApp() {
      if (!this.deferredPrompt) return;
      
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Application installée avec succès');
      }
      
      this.deferredPrompt = null;
      this.showInstallPrompt = false;
    },

    dismissInstallPrompt() {
      this.showInstallPrompt = false;
    },

    toggleOptions() {
      this.showOptions = !this.showOptions;
    },

    // Fermer le menu si on clique en dehors
    handleClickOutside(event) {
      const optionsContainer = document.querySelector('.options-container');
      if (optionsContainer && !optionsContainer.contains(event.target)) {
        this.showOptions = false;
      }
    },

    openDocumentation() {
      // Vérifier si les traductions sont disponibles
      if (!this.translations || !this.translations.welcome) {
        console.error('Les traductions ne sont pas disponibles');
        return;
      }
      this.showWelcomeModal = true;
      this.isClosing = false;
    },

    closeWelcomeModal() {
      this.isClosing = true;
      setTimeout(() => {
        this.showWelcomeModal = false;
        this.isClosing = false;
        localStorage.setItem('welcomeShown', 'true');
      }, 600);
    },

    generateCalendar() {
        if (!this.startDate) {
            console.error("Start date is not set. Cannot generate calendar.");
            return;
        }

        const daysInChallenge = 21;
        const start = new Date(this.startDate);
        // Déterminer le jour de la semaine de la date de début (0 pour dimanche, 1 pour lundi, etc.)
        // getDay() retourne 0 pour dimanche, 1 pour lundi... on veut que lundi soit 0, mardi 1, ..., dimanche 6
        const startDayOfWeek = (start.getDay() === 0) ? 6 : start.getDay() - 1;

        const calendarDays = [];

        // Ajouter des cellules vides pour le décalage du premier jour
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarDays.push({ day: null, isEmpty: true, week: 0 });
        }

        // Ajouter les jours du challenge
        for (let i = 0; i < daysInChallenge; i++) {
            const currentDayNumber = i + 1;
            const currentDayDate = new Date(start);
            currentDayDate.setDate(start.getDate() + i);
            const weekNumber = Math.floor((startDayOfWeek + i) / 7) + 1; // Calculer le numéro de la semaine

            calendarDays.push({
                day: currentDayNumber, // Jour dans le challenge (1 à 21)
                isEmpty: false,
                week: weekNumber,
                date: currentDayDate, // La date complète
                actualDayOfMonth: currentDayDate.getDate() // Jour du mois réel
            });
        }

        this.calendarDays = calendarDays; // Stocker les jours dans la propriété réactive
    },

    openSelector(day) {
        this.selectedDay = day;
        this.showActivitySelector = true;
    },

    closeSelector() {
        this.showActivitySelector = false;
        this.selectedDay = null;
    },

     setDayActivity(day, activityType) {
        if (activityType === 'clear') {
            delete this.dayActivities[day];
             // Utiliser $에도 pour assurer la réactivité
            this.dayActivities = { ...this.dayActivities };
        } else if (activityType === 'sport' || this.activities[activityType]) {
            this.dayActivities[day] = activityType;
             // Utiliser $에도 pour assurer la réactivité
            this.dayActivities = { ...this.dayActivities };
        }
         // Fermer le sélecteur après sélection
         this.closeSelector();
    },

    toggleLanguageMenu() {
      this.showLanguageMenu = !this.showLanguageMenu;
    },

    changeLanguage(lang) {
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      this.updateTranslations();
      this.showLanguageMenu = false;
    },

    async updateTranslations() {
      try {
        // Importer les traductions en fonction de la langue
        const module = await import(`./translations/${this.currentLanguage.toLowerCase()}.js`);
        this.translations = module.default;
        
        // Vérifier que les traductions sont correctement chargées
        if (!this.translations || !this.translations.welcome) {
          console.error('Erreur lors du chargement des traductions');
          return;
        }
        
        // Mettre à jour le contenu des jours avec les traductions
        this.updateDaysContent();
      } catch (error) {
        console.error('Erreur lors du chargement des traductions:', error);
      }
    },

    updateDaysContent() {
      // Mettre à jour le contenu des jours avec les traductions
      if (this.content && this.content.days) {
        this.content.days = this.content.days.map(day => {
          const translatedContent = this.translations.content?.days[day.day];
          if (translatedContent) {
            return {
              ...day,
              title: translatedContent.title || day.title,
              description: translatedContent.description || day.description,
              instructions: translatedContent.instructions || day.instructions
            };
          }
          // Si pas de traduction spécifique, utiliser les traductions par défaut
          return {
            ...day,
            title: this.translations.content?.days[day.day]?.title || `Jour ${day.day}`,
            description: this.translations.content?.days[day.day]?.description || `Contenu du jour ${day.day}`,
            instructions: this.translations.content?.days[day.day]?.instructions || day.instructions
          };
        });
      }
    },

    async loadProgressFromServer() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Récupérer le code utilisateur depuis le token
        let userCode = 'unknown';
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userCode = payload.code || 'unknown';
        } catch (e) {
          console.error('Erreur décodage token:', e);
          return;
        }

        const response = await fetch('/get-progress', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Synchroniser les données de progression avec localStorage
          if (data.progress) {
            Object.keys(data.progress).forEach(progressKey => {
              const serverProgress = data.progress[progressKey];
              
              // Gérer les tâches journalières (format: day1, day2, etc.)
              const dayMatch = progressKey.match(/^day(\d+)$/);
              if (dayMatch) {
                const dayNumber = dayMatch[1];
                const localKey = `completedTasks_${userCode}_day${dayNumber}`;
                const localTimestamp = localStorage.getItem(`${localKey}_timestamp`);
                
                // Utiliser les données du serveur si elles sont plus récentes ou si pas de données locales
                if (!localTimestamp || new Date(serverProgress.lastUpdated) > new Date(localTimestamp)) {
                  localStorage.setItem(localKey, JSON.stringify(serverProgress.completed));
                  localStorage.setItem(`${localKey}_timestamp`, serverProgress.lastUpdated);
                }
              }
              
              // Gérer les questionnaires (format: questionnaire_day1, questionnaire_day21)
              const questionnaireMatch = progressKey.match(/^questionnaire_day(\d+)$/);
              if (questionnaireMatch) {
                const dayNumber = questionnaireMatch[1];
                const localKey = `questionnaire_${userCode}_day${dayNumber}`;
                const localTimestamp = localStorage.getItem(`${localKey}_timestamp`);
                
                // Utiliser les données du serveur si elles sont plus récentes ou si pas de données locales
                if (!localTimestamp || new Date(serverProgress.completedAt) > new Date(localTimestamp)) {
                  localStorage.setItem(localKey, JSON.stringify(serverProgress));
                  localStorage.setItem(`${localKey}_timestamp`, serverProgress.completedAt);
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
      }
    },
  },
  watch: {
    currentLanguage: {
      immediate: true,
      handler(newLang) {
        this.updateTranslations();
      }
    }
  },
  mounted() {
    // Gestion de l'installation PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt = true;
    });

    window.addEventListener('appinstalled', () => {
      this.showInstallPrompt = false;
      this.deferredPrompt = null;
    });

    // Gestion du menu d'options
    document.addEventListener('click', this.handleClickOutside);

    // Attendre que le DOM soit chargé
    window.addEventListener('DOMContentLoaded', () => {
      // Attendre un court instant pour s'assurer que les données sont chargées
      setTimeout(() => {
        const currentDay = localStorage.getItem('currentDay') || this.currentDay;
        if (!currentDay) return;

        const currentDayElement = document.querySelector(`[data-day="${currentDay}"]`);
        if (currentDayElement) {
          requestAnimationFrame(() => {
            currentDayElement.scrollIntoView({ behavior: 'auto', block: 'center' });
          });
        }
      }, 100);
    });

    // Vérifier si c'est la première visite
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (!welcomeShown) {
      this.showWelcomeModal = true;
    }
  },
  beforeUnmount() {
    // Sauvegarder l'état actuel avant de quitter
    localStorage.setItem('currentDay', this.currentDay);
    document.removeEventListener('click', this.handleClickOutside);
  }
}).mount('#app');
