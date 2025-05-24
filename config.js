// Configuration de l'application
export const config = {
    // Clé secrète pour JWT - À CHANGER EN PRODUCTION
    jwtSecret: process.env.JWT_SECRET || 'changez_moi_en_production',
    
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
        tokenExpiration: '24h'
    }
}; 