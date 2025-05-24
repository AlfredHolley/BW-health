const { createApp } = Vue;

createApp({
    data() {
        return {
            patients: [],
            loading: true,
            error: '',
            searchQuery: '',
            editingPatient: null
        };
    },
    computed: {
        filteredPatients() {
            if (!this.searchQuery) return this.patients;
            const query = this.searchQuery.toLowerCase();
            return this.patients.filter(patient => 
                patient.code.toLowerCase().includes(query)
            );
        },
        activePatients() {
            return this.patients.filter(p => p.isActive).length;
        },
        averageProgress() {
            if (this.patients.length === 0) return 0;
            const total = this.patients.reduce((sum, p) => sum + p.progress, 0);
            return Math.round(total / this.patients.length);
        }
    },
    methods: {
        async loadPatients() {
            try {
                const res = await fetch('/admin/patients?t=' + new Date().getTime(), {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('token');
                        window.location.href = '/login.html';
                        return;
                    }
                    throw new Error('Erreur lors du chargement des données');
                }

                const data = await res.json();
                console.log('Données reçues du serveur:', data);
                this.patients = data.patients.map(patient => ({
                    ...patient,
                    progress: this.calculateProgress(patient.startDate),
                    startDate: this.formatDate(patient.startDate)
                }));
            } catch (e) {
                this.error = 'Erreur lors du chargement des données';
            } finally {
                this.loading = false;
            }
        },

        calculateProgress(startDate) {
            const start = new Date(startDate);
            const today = new Date();
            const diffTime = today - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0) return 0;
            const progress = Math.min(diffDays + 1, 21);
            return Math.round((progress / 21) * 100);
        },

        formatDate(date) {
            return new Date(date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        logout() {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        },

        startEditing(patient) {
            this.editingPatient = { ...patient };
        },

        cancelEditing() {
            this.editingPatient = null;
        },

        async updatePatient(patient) {
            try {
                const res = await fetch('/admin/patients/' + patient.code, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        startDate: this.editingPatient.startDate,
                        isActive: this.editingPatient.isActive
                    })
                });

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('token');
                        window.location.href = '/login.html';
                        return;
                    }
                    throw new Error('Erreur lors de la mise à jour du patient');
                }

                const data = await res.json();
                console.log('Patient mis à jour:', data);
                this.patients = this.patients.map(p =>
                    p.code === patient.code ? data.patient : p
                );
                this.editingPatient = null;
            } catch (e) {
                this.error = 'Erreur lors de la mise à jour du patient';
            }
        }
    },
    async created() {
        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        await this.loadPatients();
    }
}).mount('#app'); 