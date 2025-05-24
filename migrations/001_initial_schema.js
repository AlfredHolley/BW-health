export function up(db) {
    // Création de la table des patients
    db.prepare(`
        CREATE TABLE IF NOT EXISTS patients (
            code TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            startDate TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            isAdmin INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Création de la table des migrations
    db.prepare(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Création d'un index sur startDate pour optimiser les requêtes de date
    db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_patients_startDate 
        ON patients(startDate)
    `).run();
}

export function down(db) {
    db.prepare('DROP TABLE IF EXISTS patients').run();
    db.prepare('DROP TABLE IF EXISTS migrations').run();
} 