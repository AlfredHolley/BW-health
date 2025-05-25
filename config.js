// Configuration de l'application
export const config = {
    // Clé secrète pour JWT
    jwtSecret: process.env.JWT_SECRET,
    
    // Vérification de la clé secrète
    validateConfig() {
        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET doit être défini dans les variables d\'environnement');
        }
        if (this.jwtSecret.length < 32) {
            throw new Error('JWT_SECRET doit faire au moins 32 caractères');
        }
    },
    
    // Configuration de la base de données
    database: {
        path: process.env.NODE_ENV === 'production' ? '/data/database.sqlite' : 'database.sqlite'
    },
    
    // Configuration du serveur
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },

    // Configuration du logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        levels: ['error', 'warn', 'info', 'debug']
    },

    // Configuration de la sécurité
    security: {
        maxLoginAttempts: 5,
        lockoutDuration: 15, // en minutes
        tokenExpiration: '24h',
        // Rotation de la clé JWT
        keyRotationInterval: '30d', // Rotation tous les 30 jours
        // Liste des clés précédentes pour la rotation
        previousKeys: []
    }
};

// Validation de la configuration au démarrage
config.validateConfig(); 