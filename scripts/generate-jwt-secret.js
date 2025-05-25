import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateSecureKey(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

function updateEnvFile(newKey) {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';

    try {
        // Lire le fichier .env existant
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Mettre à jour ou ajouter JWT_SECRET
        if (envContent.includes('JWT_SECRET=')) {
            envContent = envContent.replace(
                /JWT_SECRET=.*/,
                `JWT_SECRET=${newKey}`
            );
        } else {
            envContent += `\nJWT_SECRET=${newKey}`;
        }

        // Écrire le fichier .env
        fs.writeFileSync(envPath, envContent);
        console.log('Clé JWT mise à jour avec succès dans .env');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du fichier .env:', error);
        process.exit(1);
    }
}

// Générer une nouvelle clé
const newKey = generateSecureKey();
updateEnvFile(newKey); 