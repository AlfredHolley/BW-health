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
    active INTEGER DEFAULT 1
  );
`);

// Migrer les données des patients depuis le fichier JSON
try {
  const patients = JSON.parse(fs.readFileSync(path.join(__dirname, 'patients.json'), 'utf-8'));
  const insertPatient = db.prepare('INSERT OR REPLACE INTO patients (code, password, startDate, isAdmin, active) VALUES (?, ?, ?, ?, ?)');
  
  for (const patient of patients) {
    // Hasher le mot de passe avec bcrypt
    const hashedPassword = bcrypt.hashSync(patient.password, 10);
    
    insertPatient.run(
      patient.code,
      hashedPassword,
      patient.startDate,
      patient.isAdmin ? 1 : 0,
      patient.active ? 1 : 0
    );
  }

  console.log('Migration des patients terminée avec succès !');
} catch (error) {
  console.error('Erreur lors de la migration:', error);
  console.error('Détails de l\'erreur:', error.message);
}

// Fermer la connexion
db.close(); 