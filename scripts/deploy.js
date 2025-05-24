import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
    const dbPath = process.env.NODE_ENV === 'production' 
        ? '/data/database.sqlite'
        : path.join(__dirname, '..', 'database.sqlite');

    // Vérifier si le dossier existe en production
    if (process.env.NODE_ENV === 'production') {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Créer les tables si elles n'existent pas
    await db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            date_naissance TEXT NOT NULL,
            email TEXT UNIQUE,
            telephone TEXT,
            adresse TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Vérifier si un admin existe déjà
    const admin = await db.get('SELECT * FROM admin LIMIT 1');
    if (!admin) {
        // Créer un admin par défaut si aucun n'existe
        await db.run(`
            INSERT INTO admin (username, password)
            VALUES (?, ?)
        `, ['admin', '$2b$10$YourHashedPasswordHere']); // Remplacez par le hash réel
    }

    await db.close();
    console.log('Base de données initialisée avec succès');
}

initializeDatabase().catch(console.error); 