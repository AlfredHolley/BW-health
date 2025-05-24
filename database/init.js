import Database from 'better-sqlite3';
import { config } from '../config.js';

function initializeDatabase() {
    const db = new Database(config.database.path);

    // Création de la table patients
    db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
            code TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            startDate TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            isAdmin INTEGER DEFAULT 0,
            language TEXT DEFAULT 'FR',
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Création d'un admin par défaut si aucun n'existe
    const adminExists = db.prepare('SELECT COUNT(*) as count FROM patients WHERE code = ?').get('admin');
    if (adminExists.count === 0) {
        db.prepare(`
            INSERT INTO patients (code, password, startDate, isAdmin, language)
            VALUES (?, ?, ?, ?, ?)
        `).run('admin', 'admin123', new Date().toISOString(), 1, 'EN');
    }

    db.close();
    console.log('Base de données initialisée avec succès');
}

initializeDatabase(); 