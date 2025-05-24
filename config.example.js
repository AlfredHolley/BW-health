// Exemple de configuration - À copier vers config.js et personnaliser
export const config = {
    // Clé secrète pour JWT - À CHANGER EN PRODUCTION
    jwtSecret: process.env.JWT_SECRET || 'changez_moi_en_production',
    
    // Configuration de la base de données
    database: {
        path: 'database.sqlite'
    },
    
    // Configuration du serveur
    server: {
        port: process.env.PORT || 3000
    }
}; 