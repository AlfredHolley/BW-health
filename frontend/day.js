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

            // Vérifier si le jour est débloqué
            const startDate = new Date(data.startDate || new Date());
            const today = new Date();
            const dayStart = new Date(startDate);
            dayStart.setDate(dayStart.getDate() + (this.dayNumber - 1));
            
            if (today < dayStart) {
                this.error = 'Ce jour n\'est pas encore débloqué';
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