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
        days: []
      },
      unlockedDays: 0,
      startDate: null,
      // Mode test
      isTestMode: false,
      testDate: new Date(),
      testDaysToUnlock: 1,
      // Installation PWA
      deferredPrompt: null,
      showInstallPrompt: false
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

    // Vérifier si on est en mode test (via l'URL)
    const urlParams = new URLSearchParams(window.location.search);
    this.isTestMode = urlParams.get('test') === 'true';
    
    if (this.isTestMode) {
      // En mode test, on peut définir une date de début personnalisée
      const testStartDate = urlParams.get('startDate');
      if (testStartDate) {
        this.startDate = new Date(testStartDate);
      } else {
        // Par défaut, on utilise la date actuelle
        this.startDate = new Date();
      }
      this.testDaysToUnlock = 1;
      this.unlockedDays = 1;
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
        throw new Error('Erreur lors du chargement du contenu');
      }

      const data = await res.json();
      console.log('Données reçues du serveur:', data);
      this.content = data;
      
      // Initialiser la date de début seulement si on n'est pas en mode test
      if (!this.isTestMode && data.startDate) {
        console.log('Date de début reçue:', data.startDate);
        this.startDate = new Date(data.startDate);
        this.calculateUnlockedDays();
      }
    } catch (e) {
      this.error = 'Erreur lors du chargement du contenu';
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
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    },

    isDayUnlocked(dayNumber) {
      if (!this.startDate) return false;
      
      if (this.isTestMode) {
        return dayNumber <= this.testDaysToUnlock;
      }

      const today = new Date();
      const start = new Date(this.startDate);
      
      // Normaliser les dates pour ignorer les heures
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      // Calculer le nombre de jours depuis le début
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      console.log('Debug - Date de début:', start.toISOString());
      console.log('Debug - Date actuelle:', today.toISOString());
      console.log('Debug - Jours écoulés:', diffDays);
      console.log('Debug - Jour demandé:', dayNumber);
      
      // Un jour est débloqué si son numéro est inférieur ou égal au nombre de jours écoulés + 1
      return dayNumber <= (diffDays + 1);
    },

    calculateUnlockedDays() {
      if (!this.startDate) return;
      
      if (this.isTestMode) {
        this.unlockedDays = this.testDaysToUnlock;
        return;
      }

      const today = new Date();
      const start = new Date(this.startDate);
      
      // Normaliser les dates pour ignorer les heures
      today.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      
      // Calculer le nombre de jours depuis le début
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      console.log('Debug - Calcul des jours débloqués:');
      console.log('Debug - Date de début:', start.toISOString());
      console.log('Debug - Date actuelle:', today.toISOString());
      console.log('Debug - Jours écoulés:', diffDays);
      
      // Si la date est dans le futur, aucun jour n'est débloqué
      if (diffDays < 0) {
        this.unlockedDays = 0;
        return;
      }
      
      // Le nombre de jours débloqués est le nombre de jours écoulés + 1
      this.unlockedDays = Math.min(diffDays + 1, 21);
    },

    // Méthodes de test
    simulateNextDay() {
      if (!this.isTestMode) return;
      if (this.testDaysToUnlock < 21) {
        this.testDaysToUnlock++;
        this.unlockedDays = this.testDaysToUnlock;
      }
    },

    simulatePreviousDay() {
      if (!this.isTestMode) return;
      if (this.testDaysToUnlock > 1) {
        this.testDaysToUnlock--;
        this.unlockedDays = this.testDaysToUnlock;
      }
    },

    resetTest() {
      if (!this.isTestMode) return;
      this.testDaysToUnlock = 1;
      this.unlockedDays = 1;
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
    }
  },
  mounted() {
    if (!this.isTestMode) {
      // Mettre à jour le nombre de jours débloqués chaque jour à minuit
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const timeUntilMidnight = tomorrow - now;
      setTimeout(() => {
        this.calculateUnlockedDays();
        // Mettre à jour toutes les 24 heures
        setInterval(() => this.calculateUnlockedDays(), 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
    }

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
  }
}).mount('#app');
