import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour obtenir la liste des migrations appliquées
function getAppliedMigrations(db) {
    return db.prepare('SELECT name FROM migrations ORDER BY id').all()
        .map(row => row.name);
}

// Fonction pour appliquer une migration
async function applyMigration(db, migrationFile) {
    const migrationPath = path.join(__dirname, migrationFile);
    const migration = await import(`file://${migrationPath}`);
    const migrationName = path.basename(migrationFile, '.js');

    // Vérifier si la migration a déjà été appliquée
    const applied = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migrationName);
    if (applied) {
        console.log(`Migration ${migrationName} déjà appliquée`);
        return;
    }

    // Appliquer la migration dans une transaction
    const transaction = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
    });

    try {
        transaction();
        console.log(`Migration ${migrationName} appliquée avec succès`);
    } catch (error) {
        console.error(`Erreur lors de l'application de la migration ${migrationName}:`, error);
        throw error;
    }
}

// Fonction pour revenir en arrière d'une migration
async function rollbackMigration(db, migrationFile) {
    const migrationPath = path.join(__dirname, migrationFile);
    const migration = await import(`file://${migrationPath}`);
    const migrationName = path.basename(migrationFile, '.js');

    // Vérifier si la migration a été appliquée
    const applied = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migrationName);
    if (!applied) {
        console.log(`Migration ${migrationName} non appliquée`);
        return;
    }

    // Revenir en arrière dans une transaction
    const transaction = db.transaction(() => {
        migration.down(db);
        db.prepare('DELETE FROM migrations WHERE name = ?').run(migrationName);
    });

    try {
        transaction();
        console.log(`Migration ${migrationName} annulée avec succès`);
    } catch (error) {
        console.error(`Erreur lors de l'annulation de la migration ${migrationName}:`, error);
        throw error;
    }
}

// Fonction principale de migration
async function migrate() {
    const db = new Database(config.database.path);
    
    try {
        // Créer la table des migrations si elle n'existe pas
        db.prepare(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Obtenir la liste des migrations appliquées
        const appliedMigrations = getAppliedMigrations(db);

        // Obtenir la liste des fichiers de migration
        const migrationFiles = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.js') && file !== 'migrate.js')
            .sort();

        // Appliquer les migrations non appliquées
        for (const file of migrationFiles) {
            if (!appliedMigrations.includes(path.basename(file, '.js'))) {
                await applyMigration(db, file);
            }
        }

        console.log('Toutes les migrations ont été appliquées avec succès');
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Exécuter la migration si le script est appelé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    migrate();
}

export { migrate }; 