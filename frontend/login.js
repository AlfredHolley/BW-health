const { createApp } = Vue;

createApp({
    data() {
        return {
            code: '',
            password: '',
            loading: false,
            error: '',
            success: ''
        };
    },
    methods: {
        async login() {
            this.error = '';
            this.success = '';
            
            if (!this.code || !this.password) {
                this.error = 'Veuillez remplir tous les champs';
                return;
            }

            this.loading = true;

            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        code: this.code, 
                        password: this.password 
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    this.error = data.error || 'Erreur de connexion';
                } else {
                    this.success = 'Connexion réussie !';
                    // Stocker le token
                    localStorage.setItem('token', data.token);
                    // Rediriger selon le type d'utilisateur
                    setTimeout(() => {
                        if (data.isAdmin) {
                            window.location.href = '/admin.html';
                        } else {
                            window.location.href = '/app.html';
                        }
                    }, 1000);
                }
            } catch (e) {
                this.error = 'Erreur de connexion au serveur';
            } finally {
                this.loading = false;
            }
        }
    }
}).mount('#app'); 