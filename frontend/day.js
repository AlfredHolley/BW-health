const { createApp } = Vue;

createApp({
    data() {
        return {
            day: null,
            loading: true,
            error: '',
            dayNumber: null
        };
    },
    methods: {
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
            this.error = 'Jour invalide';
            this.loading = false;
            return;
        }

        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Vérifier si le jour est débloqué
        if (!this.isDayUnlocked(this.dayNumber)) {
            this.error = 'Ce jour n\'est pas encore débloqué';
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
                throw new Error('Erreur lors du chargement du contenu');
            }

            const data = await res.json();
            const dayData = data.days.find(d => d.day === this.dayNumber);
            
            if (!dayData) {
                this.error = 'Jour non trouvé';
                return;
            }

            this.day = dayData;
        } catch (e) {
            this.error = 'Erreur lors du chargement du contenu';
        } finally {
            this.loading = false;
        }
    }
}).mount('#app'); 