import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
    try {
        const dbPath = process.env.NODE_ENV === 'production' 
            ? '/data/database.sqlite'
            : path.join(__dirname, '..', 'database.sqlite');

        console.log(`Initialisation de la base de données à: ${dbPath}`);

        // Vérifier si le dossier existe en production
        if (process.env.NODE_ENV === 'production') {
            const dir = path.dirname(dbPath);
            try {
                if (!fs.existsSync(dir)) {
                    console.log(`Création du dossier: ${dir}`);
                    fs.mkdirSync(dir, { recursive: true });
                }
                // Vérifier les permissions
                fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
                console.log('Permissions du dossier vérifiées avec succès');
            } catch (error) {
                console.error(`Erreur d'accès au dossier ${dir}:`, error);
                throw new Error(`Impossible d'accéder au dossier ${dir}. Vérifiez les permissions.`);
            }
        }

        console.log('Connexion à la base de données...');
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('Création des tables...');
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
            console.log('Création du compte admin par défaut...');
            const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            
            await db.run(`
                INSERT INTO admin (username, password)
                VALUES (?, ?)
            `, ['admin', hashedPassword]);
            
            console.log('Compte admin créé avec succès');
            if (process.env.NODE_ENV === 'production') {
                console.log('ATTENTION: Mot de passe admin par défaut utilisé. Veuillez le changer immédiatement.');
            }
        }

        await db.close();
        console.log('Base de données initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
    }
}

// Exécuter l'initialisation
initializeDatabase().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
}); 