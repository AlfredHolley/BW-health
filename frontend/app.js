const { createApp } = Vue;
import config from './config.js';

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
      const res = await fetch(`${config.apiUrl}/program-content`, {
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
      
      if (data.startDate) {
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
        const res = await fetch(`${config.apiUrl}/login`, {
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
        console.log('Application installée');
      }
      
      this.deferredPrompt = null;
      this.showInstallPrompt = false;
    },

    dismissInstallPrompt() {
      this.showInstallPrompt = false;
    }
  },
  mounted() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt = true;
    });
  }
}).mount('#app');
