# CSV-Definitionen für Phishing-Analyse

**VERBINDLICHE DATENQUELLE**

Diese Definitionen sind die einzige Wahrheit für die Datenverarbeitung.
Keine Annahmen, Erweiterungen oder Interpretationen außerhalb dieser Regeln.

---

## 📁 CSV 1 – phishing_scenario_statistics.csv

### Zweck
Analyse pro Phishing-Szenario (Art des Angriffs, Wirksamkeit, Psychologie).

### Spalten (case-sensitive)

#### Szenario-Informationen
- `scenario_id`
- `scenario_description`
- `scenario_exploit_type`
- `scenario_psychological_factors`
- `scenario_level`
- `success_rate`
- `report_rate`

#### Angriffsdaten
- `attacks_sent`
- `attacks_successful`
- `attacks_reported`
- `attacks_clicked`
- `attacks_logins`
- `attacks_files_opened`
- `attacks_macros_executed`

#### Level-Daten (X = 1–5)
- `level_X_attacks_sent`
- `level_X_attacks_successful`
- `level_X_attacks_reported`
- `level_X_employees`

#### Awareness
- `e_trainings_completed`
- `e_trainings_started`
- `e_trainings_not_started`

### Logik (Szenario)
Ein Phishing-Szenario gilt als **erfolgreich**, wenn mindestens eine der folgenden Bedingungen erfüllt ist:
- `attacks_clicked > 0`
- `attacks_logins > 0`
- `attacks_files_opened > 0`
- `attacks_macros_executed > 0`

---

## 📁 CSV 2 – user_statistics.csv

### Zweck
Analyse des Benutzerverhaltens, **ausschließlich aggregiert und anonymisiert**.

### Spalten

#### Benutzerdaten
- `employee_id`
- `employee_email`
- `employee_level`
- `most_effective_psychological_factors`

#### Angriffsdaten
- `attacks_sent`
- `attacks_successful`
- `attacks_reported`
- `attacks_clicked`
- `attacks_logins`
- `attacks_files_opened`
- `attacks_macros_executed`

#### Awareness
- `e_trainings_completed`
- `e_trainings_started`
- `e_trainings_not_started`

### Logik (Benutzer)
Ein Benutzer gilt als **anfällig**, wenn mindestens eine der folgenden Bedingungen erfüllt ist:
- `attacks_clicked > 0`
- `attacks_successful > 0`

### ❗ DATENSCHUTZ
- **Keine personenbezogenen Informationen im PDF**
- **Benutzer-E-Mails dürfen nicht sichtbar sein**
- Nur aggregierte Statistiken verwenden

---

## 📁 CSV 3 – company_statistics.csv

### Zweck
Gesamtübersicht über den Sicherheitsstatus des Unternehmens.

### Spalten

#### Unternehmenskennzahlen
- `esi`
- `most_effective_psychological_factors`

#### Angriffsdaten
- `attacks_sent`
- `attacks_successful`
- `attacks_reported`
- `attacks_clicked`
- `attacks_logins`
- `attacks_files_opened`
- `attacks_macros_executed`

#### Level-Daten (X = 1–5)
- `level_X_attacks_sent`
- `level_X_attacks_successful`
- `level_X_attacks_reported`
- `level_X_employees`

#### Awareness
- `e_trainings_completed`
- `e_trainings_started`
- `e_trainings_not_started`

---

## 📊 VERBINDLICHE BERECHNUNGEN

Die Webapp muss folgende Kennzahlen ermitteln:

### 1. Gesamtklickrate
```
Gesamtklickrate = (attacks_clicked / attacks_sent) × 100
```

### 2. Erfolgsquote der Angriffe
```
Erfolgsquote = (attacks_successful / attacks_sent) × 100
```

### 3. Verhältnis erfolgreich vs. gemeldet
```
Meldequote = (attacks_reported / attacks_successful) × 100
```

### 4. Top-Szenarien
- Sortierung nach `success_rate` (absteigend)
- Top 3 anzeigen

### 5. Klickrate nach Sicherheitslevel
Für jedes Level (1-5):
```
Level_X_Klickrate = (level_X_attacks_successful / level_X_attacks_sent) × 100
```

### 6. Sicherheitsbewertung des Unternehmens
Basierend auf Erfolgsquote:
- **Niedrig**: Erfolgsquote < 30%
- **Mittel**: Erfolgsquote 30-50%
- **Hoch**: Erfolgsquote > 50%

---

## ⚠️ GRUNDREGELN FÜR DIE AUSWERTUNG

1. **Fehlende numerische Werte gelten als 0**
2. **Zusätzliche Spalten werden ignoriert**
3. **Fehlende Pflichtspalten führen zum Abbruch**
4. **Jede CSV wird nur in ihrem vorgesehenen Kontext verwendet**
5. **Keine Querverknüpfung über mehrere ZIP-Dateien hinweg**

---

## 🎯 VERWENDUNG IN DER WEBAPP

### CSV-Erkennung
- **Szenario-CSV**: Dateiname enthält "scenario" oder "phishing"
- **Benutzer-CSV**: Dateiname enthält "user" oder "employee"
- **Unternehmens-CSV**: Dateiname enthält "company" oder "enterprise"

### Validierung
- Prüfe auf Pflichtspalten
- Bei fehlenden Spalten: Abbruch mit klarer Fehlermeldung
- Fehlende Werte: Als 0 behandeln

### Anonymisierung
- Niemals `employee_email` im PDF anzeigen
- Niemals `employee_id` im PDF anzeigen
- Nur aggregierte Zahlen verwenden

---

**Diese Definitionen sind die alleinige fachliche Wahrheit.**
