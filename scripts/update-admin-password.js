import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { config } from '../config.js';

async function updateAdminPassword() {
    const db = new Database(config.database.path);
    
    try {
        // Vérifier si l'admin existe
        const admin = db.prepare('SELECT * FROM patients WHERE code = ?').get('admin');
        
        if (!admin) {
            console.log('Création du compte admin...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.prepare(`
                INSERT INTO patients (code, password, startDate, isAdmin, language)
                VALUES (?, ?, ?, ?, ?)
            `).run('admin', hashedPassword, new Date().toISOString(), 1, 'EN');
            console.log('Compte admin créé avec succès !');
        } else {
            console.log('Mise à jour du mot de passe admin...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.prepare(`
                UPDATE patients 
                SET password = ?, isAdmin = 1
                WHERE code = ?
            `).run(hashedPassword, 'admin');
            console.log('Mot de passe admin mis à jour avec succès !');
        }
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        db.close();
    }
}

updateAdminPassword(); 