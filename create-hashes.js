import fs from 'fs';
import bcrypt from 'bcrypt';

async function generateHashes() {
  // Charge le fichier patients.json actuel (avec seulement les codes)
  const patients = JSON.parse(fs.readFileSync('patients.json', 'utf-8'));

  for (const p of patients) {
    // Remplace 'secret123' par le mot de passe souhaité pour chaque patient
    const hash = await bcrypt.hash('secret123', 10);
    p.password = hash;
  }

  // Écrit le fichier avec les hashes
  fs.writeFileSync('patients.json', JSON.stringify(patients, null, 2));

  console.log('patients.json mis à jour avec les hashes');
}

generateHashes();
