export function up(db) {
    // Ajouter la colonne patient_group à la table patients
    db.prepare(`
        ALTER TABLE patients 
        ADD COLUMN patient_group TEXT DEFAULT 'CONTROL'
    `).run();

    // Créer un index sur la colonne patient_group pour optimiser les requêtes
    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_patients_group 
        ON patients(patient_group)
    `).run();
}

export function down(db) {
    // Supprimer l'index
    db.prepare('DROP INDEX IF EXISTS idx_patients_group').run();
    
    // Note: SQLite ne supporte pas la suppression de colonnes
    // Nous devons créer une nouvelle table sans la colonne patient_group
    // et copier les données
    db.prepare(`
        CREATE TABLE patients_new (
            code TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            startDate TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            isAdmin INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Copier les données
    db.prepare(`
        INSERT INTO patients_new 
        SELECT code, password, startDate, active, isAdmin, createdAt, updatedAt 
        FROM patients
    `).run();

    // Supprimer l'ancienne table
    db.prepare('DROP TABLE patients').run();

    // Renommer la nouvelle table
    db.prepare('ALTER TABLE patients_new RENAME TO patients').run();

    // Recréer l'index sur startDate
    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_patients_startDate 
        ON patients(startDate)
    `).run();
} 