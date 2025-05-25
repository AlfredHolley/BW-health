import { config } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkEnvironment() {
    console.log('Vérification de l\'environnement...');

    // Vérifier la configuration JWT
    try {
        config.validateConfig();
        console.log('✅ Configuration JWT valide');
    } catch (error) {
        console.error('❌ Erreur de configuration JWT:', error.message);
        process.exit(1);
    }

    // Vérifier le dossier de données
    const dataDir = process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '..');
    if (!fs.existsSync(dataDir)) {
        console.error(`❌ Le dossier de données ${dataDir} n'existe pas`);
        process.exit(1);
    }
    console.log('✅ Dossier de données accessible');

    // Vérifier les permissions
    try {
        fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
        console.log('✅ Permissions du dossier de données OK');
    } catch (error) {
        console.error('❌ Erreur de permissions sur le dossier de données:', error.message);
        process.exit(1);
    }

    // Vérifier les variables d'environnement
    const requiredEnvVars = ['NODE_ENV', 'PORT'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        console.error('❌ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
        process.exit(1);
    }
    console.log('✅ Variables d\'environnement OK');

    console.log('✅ Vérification de l\'environnement terminée avec succès');
}

// Exécuter la vérification si le script est appelé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    checkEnvironment();
}

export { checkEnvironment }; 