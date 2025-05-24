import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7;

async function createBackup() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}.sqlite`);

        fs.copyFileSync(config.database.path, backupPath);
        console.log(`Backup créé: ${backupPath}`);

        cleanupOldBackups();
    } catch (error) {
        console.error('Erreur lors de la création du backup:', error);
        throw error;
    }
}
function cleanupOldBackups() {
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('backup-') && file.endsWith('.sqlite'))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_DIR, file),
                time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); 

        if (backups.length > MAX_BACKUPS) {
            backups.slice(MAX_BACKUPS).forEach(backup => {
                fs.unlinkSync(backup.path);
                console.log(`Ancien backup supprimé: ${backup.name}`);
            });
        }
    } catch (error) {
        console.error('Erreur lors du nettoyage des anciens backups:', error);
    }
}

// Exécuter le backup si le script est appelé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    createBackup();
}

export { createBackup }; 