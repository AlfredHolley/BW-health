import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { config } from './config.js';

// Pour obtenir __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction de logging
function log(level, message, data = null) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevel = levels.indexOf(config.logging.level);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel <= configLevel) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        if (data) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }
}

const app = express();
app.use(express.json());

// Autoriser encrypted-media et autoplay dans les iframes
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'encrypted-media=(self), autoplay=(self)');
    next();
});

// Initialiser la connexion à la base de données pour les patients
const db = new Database(config.database.path);
log('info', `Base de données initialisée: ${config.database.path}`);

// Initialiser la base de données
try {
  // Créer la table patients si elle n'existe pas
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      startDate TEXT,
      language TEXT DEFAULT 'FR',
      patient_group TEXT,
      active INTEGER DEFAULT 1,
      isAdmin INTEGER DEFAULT 0,
      progress TEXT DEFAULT '{}'
    )
  `);

  // Vérifier et ajouter la colonne progress si elle n'existe pas
  const tableInfo = db.prepare("PRAGMA table_info(patients)").all();
  const hasProgressColumn = tableInfo.some(column => column.name === 'progress');
  
  if (!hasProgressColumn) {
    db.exec("ALTER TABLE patients ADD COLUMN progress TEXT DEFAULT '{}'");
    console.log('Colonne progress ajoutée à la table patients');
  }

  console.log('Base de données initialisée avec succès');
} catch (error) {
  console.error('Erreur lors de l\'initialisation de la base de données:', error);
}

// Stockage des tentatives de connexion
const loginAttempts = new Map();

// Fonction pour vérifier si un utilisateur est bloqué
function isUserBlocked(code) {
    const attempts = loginAttempts.get(code);
    if (!attempts) return false;
    
    if (attempts.count >= config.security.maxLoginAttempts) {
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
        const lockoutTime = config.security.lockoutDuration * 60 * 1000;
        
        if (timeSinceLastAttempt < lockoutTime) {
            return true;
        } else {
            loginAttempts.delete(code);
            return false;
        }
    }
    return false;
}

// Fonction pour enregistrer une tentative de connexion
function recordLoginAttempt(code) {
    const attempts = loginAttempts.get(code) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(code, attempts);
    log('warn', `Tentative de connexion échouée pour ${code}`, { attempts: attempts.count });
}

// Servir frontend statique
app.use(express.static(path.join(__dirname, 'frontend')));

// Rediriger la racine vers la page de connexion
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Login route
app.post('/login', async (req, res) => {
    const { code, password } = req.body;
    if (!code || !password) {
        log('warn', 'Tentative de connexion sans code ou mot de passe');
        return res.status(400).json({ error: 'Code et mot de passe requis' });
    }

    if (isUserBlocked(code)) {
        const attempts = loginAttempts.get(code);
        const remainingTime = Math.ceil((config.security.lockoutDuration * 60 * 1000 - (Date.now() - attempts.lastAttempt)) / 1000 / 60);
        log('warn', `Utilisateur ${code} bloqué`, { remainingTime });
        return res.status(429).json({ 
            error: `Trop de tentatives de connexion. Réessayez dans ${remainingTime} minutes.` 
        });
    }

    const patient = db.prepare('SELECT * FROM patients WHERE code = ?').get(code);
    if (!patient) {
        recordLoginAttempt(code);
        return res.status(401).json({ error: 'Code patient invalide' });
    }

    const isValidPassword = await bcrypt.compare(password, patient.password);
    if (!isValidPassword) {
        recordLoginAttempt(code);
        return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    loginAttempts.delete(code);
    const token = jwt.sign(
        { code }, 
        config.jwtSecret, 
        { expiresIn: config.security.tokenExpiration }
    );
    
    // Log de débogage pour voir le contenu complet de patient
    console.log('Patient object:', JSON.stringify(patient, null, 2));
    
    log('info', `Connexion réussie pour ${code}`, { 
        isAdmin: !!patient.isAdmin,
        language: patient.language,
        startDate: patient.startDate,
        patient_group: patient.patient_group,
        active: patient.active
    });
    res.json({ 
        message: 'Authentification réussie', 
        token, 
        isAdmin: !!patient.isAdmin 
    });
});

// Middleware authentification
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        log('warn', 'Tentative d\'accès sans token');
        return res.status(401).json({ error: 'Token manquant' });
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            log('warn', 'Token invalide', { error: err.message });
            return res.status(403).json({ error: 'Token invalide' });
        }
        req.user = user;
        next();
    });
}

// Route pour obtenir le contenu du programme
app.get('/program-content', authenticateToken, (req, res) => {
    try {
        const patient = db.prepare('SELECT * FROM patients WHERE code = ?').get(req.user.code);
        if (!patient) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf-8'));
        res.json({
            days: content.days,
            title: content.title,
            description: content.description,
            language: patient.language,
            startDate: patient.startDate
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du contenu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour sauvegarder la progression d'un utilisateur
app.post('/save-progress', authenticateToken, (req, res) => {
    try {
        const { dayNumber, completed } = req.body;
        
        if (!dayNumber || !Array.isArray(completed)) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        const patient = db.prepare('SELECT * FROM patients WHERE code = ?').get(req.user.code);
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        // Récupérer la progression existante ou créer un objet vide
        let progress = {};
        if (patient.progress) {
            try {
                progress = JSON.parse(patient.progress);
            } catch (e) {
                console.error('Erreur parsing progression:', e);
                progress = {};
            }
        }
        
        // Clé unique par jour seulement (sans langue)
        const progressKey = `day${dayNumber}`;
        progress[progressKey] = {
            completed: completed,
            lastUpdated: new Date().toISOString()
        };

        // Sauvegarder dans la base de données
        const updateStmt = db.prepare('UPDATE patients SET progress = ? WHERE code = ?');
        updateStmt.run(JSON.stringify(progress), req.user.code);

        res.json({ success: true, message: 'Progression sauvegardée' });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la progression:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer la progression d'un utilisateur
app.get('/get-progress', authenticateToken, (req, res) => {
    try {
        const patient = db.prepare('SELECT * FROM patients WHERE code = ?').get(req.user.code);
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        // Parser la progression depuis la base de données
        let progress = {};
        if (patient.progress) {
            try {
                progress = JSON.parse(patient.progress);
                
                // Migration : convertir les anciennes clés avec langue vers les nouvelles sans langue
                let hasOldFormat = false;
                const newProgress = {};
                
                Object.keys(progress).forEach(key => {
                    // Vérifier si c'est l'ancien format (day1_FR)
                    const oldMatch = key.match(/day(\d+)_(\w+)/);
                    if (oldMatch) {
                        const dayNumber = oldMatch[1];
                        const newKey = `day${dayNumber}`;
                        
                        // Si la nouvelle clé n'existe pas encore, utiliser les données de l'ancienne
                        if (!newProgress[newKey] && !progress[newKey]) {
                            newProgress[newKey] = progress[key];
                            hasOldFormat = true;
                        }
                    } else {
                        // C'est déjà le nouveau format
                        newProgress[key] = progress[key];
                    }
                });
                
                // Si on a trouvé des données à migrer, sauvegarder la nouvelle progression
                if (hasOldFormat) {
                    const updateStmt = db.prepare('UPDATE patients SET progress = ? WHERE code = ?');
                    updateStmt.run(JSON.stringify(newProgress), req.user.code);
                    progress = newProgress;
                    console.log(`Migration de progression pour patient ${req.user.code}`);
                }
                
            } catch (e) {
                console.error('Erreur parsing progression:', e);
                progress = {};
            }
        }

        res.json({ progress: progress });
    } catch (error) {
        console.error('Erreur lors de la récupération de la progression:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir le profil utilisateur
app.get('/user-profile', authenticateToken, (req, res) => {
    const patient = db.prepare('SELECT * FROM patients WHERE code = ?').get(req.user.code);
    if (!patient) {
        return res.status(404).json({ error: 'Patient non trouvé' });
    }

    res.json({
        code: patient.code,
        startDate: patient.startDate,
        language: patient.language,
        patient_group: patient.patient_group,
        active: patient.active,
        isAdmin: !!patient.isAdmin
    });
});

// Route admin protégée
app.get('/admin/patients', authenticateToken, (req, res) => {
    const patient = db.prepare('SELECT * FROM patients WHERE code = ?').get(req.user.code);
    if (!patient || !patient.isAdmin) {
        log('warn', `Tentative d'accès admin non autorisée par ${req.user.code}`);
        return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const patients = db.prepare('SELECT code, startDate, active as isActive, patient_group FROM patients').all();
    log('info', `Liste des patients récupérée par ${req.user.code}`);
    res.json({ patients });
});

// Route pour obtenir la liste des patients
app.get('/patients', (req, res) => {
    try {
        const patients = db.prepare('SELECT * FROM patients').all();
        log('info', 'Liste des patients récupérée');
        res.json(patients);
    } catch (error) {
        log('error', 'Erreur lors de la lecture des patients', { error: error.message });
        res.status(500).json({ error: 'Erreur lors de la lecture des patients' });
    }
});

// Route pour ajouter un nouveau patient
app.post('/patients', async (req, res) => {
    try {
        const { code, password, startDate, language = 'FR', patient_group = 'CONTROL' } = req.body;
        
        if (!code || !password || !startDate) {
            log('warn', 'Tentative d\'ajout de patient avec données manquantes');
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        // Valider la langue
        if (language && !['FR', 'EN', 'DE', 'SP'].includes(language)) {
            log('warn', `Tentative d'ajout de patient avec langue invalide: ${language}`);
            return res.status(400).json({ error: 'Langue invalide. Valeurs acceptées: FR, EN, DE, SP' });
        }

        const existingPatient = db.prepare('SELECT code FROM patients WHERE code = ?').get(code);
        if (existingPatient) {
            log('warn', `Tentative d'ajout de patient avec code existant: ${code}`);
            return res.status(400).json({ error: 'Ce code patient existe déjà' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
            INSERT INTO patients (code, password, startDate, active, language, patient_group)
            VALUES (?, ?, ?, 1, ?, ?)
        `).run(code, hashedPassword, new Date(startDate).toISOString(), language, patient_group);

        log('info', `Nouveau patient ajouté: ${code}`, { language, patient_group });
        res.status(201).json({ message: 'Patient ajouté avec succès' });
    } catch (error) {
        log('error', 'Erreur lors de l\'ajout du patient', { error: error.message });
        res.status(500).json({ error: 'Erreur lors de l\'ajout du patient' });
    }
});

// Route pour supprimer un patient
app.delete('/patients/:code', (req, res) => {
    try {
        const { code } = req.params;
        const result = db.prepare('DELETE FROM patients WHERE code = ?').run(code);
        
        if (result.changes === 0) {
            log('warn', `Tentative de suppression de patient inexistant: ${code}`);
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        log('info', `Patient supprimé: ${code}`);
        res.json({ message: 'Patient supprimé avec succès' });
    } catch (error) {
        log('error', 'Erreur lors de la suppression du patient', { error: error.message });
        res.status(500).json({ error: 'Erreur lors de la suppression du patient' });
    }
});

// Route pour mettre à jour un patient
app.put('/admin/patients/:code', authenticateToken, (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        const adminPatient = db.prepare('SELECT * FROM patients WHERE code = ?').get(req.user.code);
        if (!adminPatient || !adminPatient.isAdmin) {
            log('warn', `Tentative de mise à jour de patient non autorisée par ${req.user.code}`);
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        const { code } = req.params;
        const { startDate, isActive } = req.body;
        
        // Vérifier que le patient existe
        const existingPatient = db.prepare('SELECT * FROM patients WHERE code = ?').get(code);
        if (!existingPatient) {
            log('warn', `Tentative de mise à jour de patient inexistant: ${code}`);
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        // Préparer les données de mise à jour
        const updates = {};
        if (startDate !== undefined) {
            updates.startDate = new Date(startDate).toISOString();
        }
        if (isActive !== undefined) {
            updates.active = isActive ? 1 : 0;
        }

        // Construire la requête de mise à jour dynamiquement
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]);
        values.push(code);

        const stmt = db.prepare(`UPDATE patients SET ${setClause} WHERE code = ?`);
        const result = stmt.run(...values);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        // Récupérer le patient mis à jour
        const updatedPatient = db.prepare('SELECT code, startDate, active as isActive, patient_group FROM patients WHERE code = ?').get(code);
        
        log('info', `Patient mis à jour: ${code}`, { startDate, isActive });
        res.json({ 
            message: 'Patient mis à jour avec succès',
            patient: updatedPatient
        });
    } catch (error) {
        log('error', 'Erreur lors de la mise à jour du patient', { error: error.message });
        res.status(500).json({ error: 'Erreur lors de la mise à jour du patient' });
    }
});

app.listen(config.server.port, () => {
    log('info', `Serveur démarré sur le port ${config.server.port} en mode ${config.server.env}`);
});
