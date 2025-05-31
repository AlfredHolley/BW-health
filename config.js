// Configuration de l'application
export const config = {
    // Clé secrète pour JWT - À CHANGER EN PRODUCTION
    jwtSecret: process.env.JWT_SECRET || 'changez_moi_en_production',
    
    database: {
        // 1) on laisse la main à DB_PATH si elle est définie
        // 2) sinon, en production on utilise le volume : /data/webapp_data.db
        // 3) en dev on reste sur un fichier local : webapp_data.db
        path:
          process.env.DB_PATH ||
          (process.env.NODE_ENV === 'production'
            ? '/data/webapp_data.db'
            : 'webapp_data.db')
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