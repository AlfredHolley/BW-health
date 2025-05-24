import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer la base de données
const db = new Database('database.sqlite');

// Créer la table des patients
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    code TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    startDate TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    language TEXT DEFAULT 'FR'
  );
`);

// Créer l'utilisateur admin
const hashedPassword = bcrypt.hashSync('admin', 10);
const insertAdmin = db.prepare('INSERT OR REPLACE INTO patients (code, password, startDate, isAdmin, active) VALUES (?, ?, ?, ?, ?)');

insertAdmin.run(
  'admin',
  hashedPassword,
  new Date().toISOString(),
  1, // isAdmin
  1  // active
);

console.log('Base de données initialisée avec succès !');
console.log('Utilisateur admin créé avec :');
console.log('- Code: admin');
console.log('- Mot de passe: admin');

// Fermer la connexion
db.close(); 