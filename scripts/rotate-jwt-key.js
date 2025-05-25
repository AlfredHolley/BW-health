import { config } from '../config.js';
import { generateSecureKey } from './generate-jwt-secret.js';

async function rotateJWTKey() {
    try {
        // Générer une nouvelle clé
        const newKey = generateSecureKey();
        
        // Sauvegarder l'ancienne clé
        config.security.previousKeys.push(config.jwtSecret);
        
        // Limiter le nombre de clés précédentes (garder les 3 dernières)
        if (config.security.previousKeys.length > 3) {
            config.security.previousKeys.shift();
        }
        
        // Mettre à jour la clé actuelle
        config.jwtSecret = newKey;
        
        // Mettre à jour le fichier .env
        updateEnvFile(newKey);
        
        console.log('Rotation de la clé JWT effectuée avec succès');
    } catch (error) {
        console.error('Erreur lors de la rotation de la clé JWT:', error);
        process.exit(1);
    }
}

// Exécuter la rotation si le script est appelé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    rotateJWTKey();
}

export { rotateJWTKey }; 