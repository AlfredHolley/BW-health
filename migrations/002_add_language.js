export function up(db) {
    // Ajouter la colonne language avec une valeur par défaut 'FR'
    db.prepare(`
        ALTER TABLE patients 
        ADD COLUMN language TEXT DEFAULT 'FR' 
        CHECK (language IN ('FR', 'EN', 'DE', 'SP'))
    `).run();

    // Mettre à jour la langue de l'admin en anglais
    db.prepare(`
        UPDATE patients 
        SET language = 'EN' 
        WHERE code = 'admin'
    `).run();
}

export function down(db) {
    // Note: SQLite ne supporte pas la suppression de colonnes
    // La seule façon de revenir en arrière serait de recréer la table
    // sans la colonne language, mais cela nécessiterait de sauvegarder
    // et restaurer les données
    console.log('ATTENTION: La suppression de la colonne language n\'est pas supportée par SQLite');
} 