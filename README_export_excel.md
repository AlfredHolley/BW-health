# 📊 Export Excel - Programme 21 jours

Le système d'export Excel permet aux administrateurs d'exporter toutes les données collectées dans un fichier Excel (.xlsx) bien structuré.

## 🚀 Fonctionnalités

### 📝 **3 Feuilles de données structurées :**

#### 1. **patient_data**
- Code Patient
- Date Début
- Langue (FR, EN, DE, SP)
- Groupe (CONTROL, FBW, FASTEX)
- Statut (Actif/Inactif)
- Admin (Oui/Non)
- Date Création
- Dernière MAJ

#### 2. **progress_data**
- Code Patient
- Groupe
- Jour (1-21)
- Tâches Complétées
- Total Tâches
- Taux Completion (%)
- Dernière MAJ

#### 3. **questionnaire_data**
- Code Patient
- Groupe
- Jour (1 ou 21)
- Date Completion
- Score Bien-être (1-10)
- Score Difficulté (1-10)
- Motivation Constante
- Obstacles Rencontrés

## 🔧 **Utilisation**

### **Accès Admin requis**
1. Connectez-vous avec un compte administrateur
2. Accédez au portail admin (`/admin.html`)
3. Cliquez sur le bouton **"📊 Export Excel Workbook"**
4. Le fichier se télécharge automatiquement

### **Nom du fichier généré**
```
export_donnees_programme21j_2025-05-30-13-45-32.xlsx
```
Format : `export_donnees_programme21j_YYYY-MM-DD-HH-MM-SS.xlsx`

## 📊 **Structure des données**

### **Tri automatique**
- **progress_data** : Trié par Code Patient puis par Jour
- **questionnaire_data** : Trié par Code Patient puis par Jour
- **patient_data** : Ordre d'insertion

### **Formats de données**
- **Dates** : Format français (DD/MM/YYYY)
- **Pourcentages** : Nombre décimal (ex: 85.5)
- **Booléens** : "Oui" / "Non"
- **Timestamps** : Date + Heure française

## 🔒 **Sécurité**

- ✅ Authentification administrateur requise
- ✅ Token JWT vérifié
- ✅ Mots de passe **exclus** de l'export
- ✅ Logging des exports
- ✅ Accès restreint aux admins uniquement

## 🛠️ **Données exportées en temps réel**

L'export inclut automatiquement :
- ✅ Tous les patients enregistrés
- ✅ Toute la progression sauvegardée
- ✅ Tous les questionnaires complétés
- ✅ Données mises à jour en temps réel

## 📈 **Utilisation des données**

Le fichier Excel peut être utilisé pour :
- **Analyse statistique** des résultats
- **Rapports de progression** des patients
- **Évaluation des questionnaires** pré/post programme
- **Comparaison entre groupes** (CONTROL vs INTERVENTION)
- **Suivi longitudinal** des participants

## ⚠️ **Notes importantes**

1. **Confidentialité** : Le fichier contient des données personnelles, à manipuler selon les réglementations en vigueur
2. **Sauvegarde** : Les exports sont générés à la demande, pensez à sauvegarder les fichiers importants
3. **Performance** : L'export peut prendre quelques secondes selon le nombre de patients
4. **Compatible** : Excel 2010+, LibreOffice Calc, Google Sheets

## 🔍 **Dépannage**

### **Erreur d'export**
```
Vérifiez que vous êtes connecté en tant qu'administrateur
Rechargez la page et réessayez
```

### **Fichier vide**
```
Aucun patient n'a été créé ou n'a de données
Vérifiez la base de données
```

### **Téléchargement bloqué**
```
Vérifiez les paramètres de votre navigateur
Autorisez les téléchargements depuis cette application
``` 