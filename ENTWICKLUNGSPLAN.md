# Entwicklungsplan: Phishing-Analyse-Webapp

## Übersicht

Dieser Plan beschreibt den logischen Aufbau einer Webanwendung zur automatisierten Auswertung von Phishing-Simulationen. Die Anwendung verarbeitet ZIP-Dateien mit CSV-Statistiken, analysiert das Klickverhalten, erstellt professionelle PDF-Reports und versendet diese automatisch per E-Mail.

---

## Phase 1: Zieldefinition & Abgrenzung

### 1.1 Kernziel definieren

**Was die Anwendung tut:**
- Automatisierte Auswertung von Phishing-Simulationen
- Erstellung professioneller, anonymisierter Reports
- Automatischer Versand der Reports per E-Mail

**Was die Anwendung NICHT tut:**
- Keine Einzelbenutzer-Auswertungen
- Keine personenbezogenen Daten verarbeiten
- Keine Echtzeit-Überwachung
- Keine Phishing-Simulationen durchführen (nur auswerten)

**Begründung:** Klare Abgrenzung verhindert Feature-Creep und stellt sicher, dass die Anwendung fokussiert und datenschutzkonform bleibt.

### 1.2 Grundprinzipien festlegen

**Prinzip 1: Anonymität**
- Alle Auswertungen sind aggregiert
- Keine Rückschlüsse auf Einzelpersonen möglich

**Prinzip 2: Einfachheit**
- Ein Kunde = Ein Name
- Ein Upload = Ein Report
- Klarer, linearer Workflow

**Prinzip 3: Automatisierung**
- Keine manuellen Zwischenschritte
- Vollständige Verarbeitung von ZIP bis E-Mail

**Begründung:** Diese Prinzipien leiten alle späteren Entscheidungen und verhindern Komplexität.

---

## Phase 2: Benutzer- und Kundenlogik

### 2.1 Authentifizierung definieren

**Wer darf die Anwendung nutzen:**
- Nur authentifizierte Benutzer
- Login mit Username und Passwort
- Session-basierte Authentifizierung

**Begründung:** Schutz sensibler Daten und klare Zugriffskontrolle.

### 2.2 Kundenkonzept festlegen

**Was ist ein Kunde:**
- Ein Kunde ist eine Organisation/Firma
- Ein Kunde hat nur einen Namen (keine weiteren Daten)
- Jeder Report wird genau einem Kunden zugeordnet

**Kundenverwaltung:**
- Kunden können angelegt werden
- Kunden können gelöscht werden
- Kunden können angezeigt werden

**Begründung:** Minimale Datenhaltung, maximale Flexibilität. Der Kundenname dient nur der Zuordnung von Reports.

### 2.3 Beziehung Kunde-Report

**Regel:**
- Ein Report gehört zu genau einem Kunden
- Ein Kunde kann mehrere Reports haben
- Reports können nicht zwischen Kunden verschoben werden

**Begründung:** Klare Datenstruktur, keine Mehrdeutigkeiten.

---

## Phase 3: ZIP-Workflow definieren

### 3.1 ZIP-Anforderungen festlegen

**Pflicht-Inhalt:**
- Genau 3 CSV-Dateien
- Keine mehr, keine weniger

**Die 3 CSV-Dateien:**
1. Phishing-Szenario-Statistiken
2. Benutzer-Statistiken (aggregiert)
3. Unternehmens-Statistiken

**Begründung:** Feste Struktur ermöglicht zuverlässige Verarbeitung und verhindert Fehler durch unvollständige Daten.

### 3.2 Upload-Prozess definieren

**Schritt 1: Benutzer wählt Kunde**
- Kunde muss vor Upload existieren
- Dropdown-Auswahl aus vorhandenen Kunden

**Schritt 2: Optional E-Mail-Empfänger angeben**
- Wenn angegeben: Report wird automatisch versendet
- Wenn leer: Nur Report erstellen, kein Versand

**Schritt 3: ZIP-Datei hochladen**
- Datei wird auf Server übertragen
- Sofortige Validierung

**Begründung:** Klare Reihenfolge verhindert Fehler. Kunde muss existieren, bevor Report erstellt werden kann.

### 3.3 Validierungsregeln

**Regel 1: ZIP-Struktur prüfen**
- Ist es eine gültige ZIP-Datei?
- Enthält sie genau 3 CSV-Dateien?

**Regel 2: CSV-Erkennung**
- Dateinamen müssen Schlüsselwörter enthalten:
  - "phishing" oder "scenario" → Szenario-Datei
  - "user" oder "benutzer" → Benutzer-Datei
  - "company" oder "unternehmen" → Unternehmens-Datei

**Regel 3: Bei Fehler abbrechen**
- Fehlermeldung anzeigen
- Keine teilweise Verarbeitung
- ZIP-Datei verwerfen

**Begründung:** Frühe Validierung verhindert fehlerhafte Analysen und gibt sofortiges Feedback.

---

## Phase 4: CSV-Auswertung definieren

### 4.1 Szenario-CSV auswerten

**Relevante Spalten:**
- `scenario_name`: Name des Phishing-Szenarios
- `clicks`: Anzahl Klicks auf Phishing-Link
- `logins`: Anzahl Login-Versuche
- `file_opens`: Anzahl Datei-Öffnungen
- `macro_executions`: Anzahl Makro-Ausführungen
- `reported`: Anzahl Meldungen als Phishing
- `psychological_factor`: Psychologischer Angriffsfaktor

**Begründung:** Diese Daten zeigen, wie erfolgreich einzelne Szenarien waren und welche Taktiken funktionieren.

### 4.2 Benutzer-CSV auswerten

**Zweck:**
- Gesamtanzahl Benutzer ermitteln
- Basis für Prozentberechnungen

**Wichtig:**
- Keine Einzelpersonen auswerten
- Nur Gesamtzahl relevant

**Begründung:** Anonymität wahren, aber Bezugsgröße für Statistiken haben.

### 4.3 Unternehmens-CSV auswerten

**Zweck:**
- Unternehmensweite Metriken
- Kontext für die Analyse

**Begründung:** Gesamtbild des Sicherheitsbewusstseins im Unternehmen.

---

## Phase 5: Analysekennzahlen definieren

### 5.1 Erfolgsquote eines Angriffs

**Definition:**
Ein Phishing-Angriff gilt als erfolgreich, wenn mindestens eines dieser Ereignisse eintritt:
- Klick auf Link
- Login-Versuch
- Datei geöffnet
- Makro ausgeführt

**Berechnung:**
- Erfolgsquote = (Anzahl erfolgreicher Szenarien / Gesamtanzahl Szenarien) × 100

**Begründung:** Klare Definition verhindert Interpretationsspielraum. Ein einziger Klick reicht für "erfolgreich".

### 5.2 Klickrate berechnen

**Definition:**
- Klickrate = (Gesamtanzahl Klicks / Gesamtanzahl Benutzer) × 100

**Begründung:** Zeigt, wie viele Benutzer grundsätzlich auf Links klicken.

### 5.3 Risikostufe ermitteln

**Kategorien:**
- **Niedrig**: Erfolgsquote < 30%
- **Mittel**: Erfolgsquote 30-50%
- **Hoch**: Erfolgsquote 50-70%
- **Kritisch**: Erfolgsquote > 70%

**Begründung:** Einfache Kategorisierung für schnelle Einschätzung der Gesamtsituation.

### 5.4 Top-3 Szenarien identifizieren

**Regel:**
- Sortiere alle Szenarien nach Erfolgsquote
- Nimm die 3 erfolgreichsten

**Begründung:** Zeigt die gefährlichsten Angriffsvektoren auf einen Blick.

### 5.5 Psychologische Faktoren analysieren

**Vorgehen:**
- Zähle, wie oft jeder psychologische Faktor vorkommt
- Sortiere nach Häufigkeit
- Zeige Top-3

**Begründung:** Identifiziert die wirksamsten psychologischen Manipulationstechniken.

### 5.6 Meldeverhalten auswerten

**Kennzahlen:**
- Anzahl gemeldeter Phishing-Versuche
- Anzahl erfolgreicher Angriffe
- Meldequote = (Gemeldet / Erfolgreich) × 100

**Begründung:** Zeigt, ob Benutzer verdächtige E-Mails erkennen und melden.

---

## Phase 6: PDF-Report-Struktur definieren

### 6.1 Report-Aufbau festlegen

**Seite 1: Titelseite & Übersicht**
- Titel: "Phishing-Analyse Report"
- Datum der Erstellung
- Kundenname
- Gesamtrisikostufe (farblich hervorgehoben)
- Kernkennzahlen (Szenarien, Benutzer, Klickrate, Erfolgsquote)

**Seite 2: Detaillierte Statistiken**
- Gesamt Klicks
- Login-Versuche
- Datei-Öffnungen
- Makro-Ausführungen
- Gemeldete Phishing-Versuche

**Seite 3: Top-3 Szenarien**
- Name des Szenarios
- Erfolgsquote
- Detaillierte Zahlen (Klicks, Logins, etc.)
- Psychologischer Faktor

**Seite 4: Analyse & Empfehlungen**
- Häufigste psychologische Faktoren
- Meldeverhalten
- Awareness-Status
- Konkrete Handlungsempfehlungen

**Begründung:** Logischer Aufbau von allgemein zu spezifisch. Entscheider sehen sofort die Risikostufe, Details folgen danach.

### 6.2 Design-Prinzipien

**Farbschema:**
- Primärfarbe: Dunkelblau (professionell)
- Akzentfarbe: Hellblau
- Risiko-Farben:
  - Kritisch: Rot
  - Hoch: Orange
  - Mittel: Gelb
  - Niedrig: Grün

**Typografie:**
- Überschriften: Groß, fett
- Fließtext: Gut lesbar, linksbündig
- Zahlen: Hervorgehoben, größer

**Layout:**
- Viel Weißraum
- Klare Abschnitte
- Keine überladenen Seiten

**Begründung:** Professionelles, ruhiges Design erhöht Glaubwürdigkeit und Lesbarkeit.

### 6.3 Handlungsempfehlungen

**Logik:**
- Bei Erfolgsquote > 50%: Dringende Maßnahmen
- Bei Erfolgsquote 30-50%: Verbesserungen nötig
- Bei Erfolgsquote < 30%: Niveau halten

**Empfehlungen immer konkret:**
- "Durchführung von Security-Awareness-Trainings"
- "Fokus auf psychologische Faktoren X, Y, Z"
- "Verbesserung der Meldekultur"

**Begründung:** Actionable Insights statt vager Aussagen. Der Report muss zu konkreten Maßnahmen führen.

---

## Phase 7: Automatische Report-Erstellung

### 7.1 Ablauf definieren

**Schritt 1: ZIP validieren**
- Prüfe Struktur
- Bei Fehler: Abbruch mit Fehlermeldung

**Schritt 2: CSV-Dateien parsen**
- Extrahiere alle 3 CSVs aus ZIP
- Parse in Datenstrukturen

**Schritt 3: Analyse durchführen**
- Berechne alle Kennzahlen
- Ermittle Risikostufe
- Identifiziere Top-Szenarien

**Schritt 4: PDF generieren**
- Erstelle PDF mit allen Abschnitten
- Speichere auf Server

**Schritt 5: In Datenbank speichern**
- Speichere Report-Metadaten
- Verknüpfe mit Kunde
- Speichere Szenario-Details

**Schritt 6: E-Mail versenden (optional)**
- Wenn E-Mail-Adresse angegeben
- Hänge PDF an
- Markiere als versendet

**Begründung:** Linearer Ablauf ohne Rücksprünge. Jeder Schritt baut auf dem vorherigen auf.

### 7.2 Fehlerbehandlung

**Regel 1: Fail-Fast**
- Bei Fehler sofort abbrechen
- Keine teilweise Verarbeitung
- Klare Fehlermeldung

**Regel 2: Cleanup**
- Temporäre Dateien löschen
- Keine Dateireste auf Server

**Regel 3: Logging**
- Fehler protokollieren
- Für Debugging verfügbar

**Begründung:** Saubere Fehlerbehandlung verhindert inkonsistente Zustände.

---

## Phase 8: E-Mail-Versand

### 8.1 E-Mail-Inhalt definieren

**Betreff:**
- Format: "Phishing-Analyse Report - [Kundenname]"

**E-Mail-Body:**
- Professionelle Anrede
- Kurze Erklärung des Reports
- Hinweis auf Anhang
- Hinweis auf Anonymisierung
- Signatur

**Anhang:**
- PDF-Report
- Dateiname: `Phishing_Report_[Kunde]_[Datum].pdf`

**Begründung:** Professionelle Kommunikation, klare Benennung für Archivierung.

### 8.2 Versand-Logik

**Wenn E-Mail-Adresse angegeben:**
- Report automatisch versenden
- Status "E-Mail versendet" speichern

**Wenn keine E-Mail-Adresse:**
- Nur Report erstellen
- Benutzer kann später manuell herunterladen

**Bei Versand-Fehler:**
- Report trotzdem speichern
- Fehler protokollieren
- Benutzer informieren

**Begründung:** Flexibilität für verschiedene Workflows. Report geht nie verloren, auch bei E-Mail-Problemen.

---

## Phase 9: Dashboard & Übersicht

### 9.1 Report-Historie

**Anzeige:**
- Liste aller generierten Reports
- Sortierung: Neueste zuerst
- Pro Report anzeigen:
  - Kundenname
  - Datum
  - Risikostufe (farblich)
  - Kernkennzahlen
  - E-Mail-Status
  - Download-Button

**Begründung:** Schneller Überblick über alle durchgeführten Analysen.

### 9.2 Kunden-Übersicht

**Anzeige:**
- Liste aller Kunden
- Pro Kunde:
  - Name
  - Erstellungsdatum
  - Löschen-Button

**Begründung:** Einfache Verwaltung, keine unnötigen Details.

---

## Phase 10: Qualitäts- und Fehlerregeln

### 10.1 Datenqualität

**Regel 1: Keine leeren Werte**
- Alle Zahlen müssen vorhanden sein
- Bei fehlenden Werten: 0 annehmen

**Regel 2: Plausibilitätsprüfung**
- Negative Zahlen nicht erlaubt
- Prozente zwischen 0 und 100

**Begründung:** Robustheit gegen fehlerhafte Eingabedaten.

### 10.2 Sicherheitsregeln

**Regel 1: Keine Einzelpersonen**
- Niemals Namen in Reports
- Nur aggregierte Zahlen

**Regel 2: Zugriffskontrolle**
- Nur eingeloggte Benutzer
- Session-Timeout nach Inaktivität

**Regel 3: Datenspeicherung**
- Reports sicher auf Server
- Keine Uploads dauerhaft speichern

**Begründung:** Datenschutz und Sicherheit von Anfang an.

### 10.3 Benutzerfreundlichkeit

**Regel 1: Klare Fehlermeldungen**
- Nicht: "Fehler 500"
- Sondern: "ZIP-Datei enthält nicht genau 3 CSV-Dateien"

**Regel 2: Feedback bei Aktionen**
- Upload: Fortschrittsanzeige
- Erfolg: Bestätigungsmeldung
- Fehler: Klare Anweisung

**Regel 3: Keine Überraschungen**
- Löschungen bestätigen lassen
- Automatische Aktionen klar kommunizieren

**Begründung:** Vertrauen durch Transparenz und klare Kommunikation.

---

## Zusammenfassung: Entwicklungsreihenfolge

**Phase 1-2:** Grundlagen schaffen (Auth, Kunden)  
**Phase 3:** Upload-Mechanismus  
**Phase 4-5:** Analyse-Logik  
**Phase 6-7:** Report-Generierung  
**Phase 8:** E-Mail-Integration  
**Phase 9:** Dashboard  
**Phase 10:** Qualitätssicherung  

**Wichtig:** Jede Phase muss vollständig abgeschlossen sein, bevor die nächste beginnt. Keine parallele Entwicklung von Features, die voneinander abhängen.

---

## Erfolgskriterien

Die Anwendung ist erfolgreich, wenn:

1. ✅ Ein Benutzer sich einloggen kann
2. ✅ Kunden angelegt und verwaltet werden können
3. ✅ Eine ZIP-Datei hochgeladen und validiert wird
4. ✅ Die Analyse korrekte Kennzahlen berechnet
5. ✅ Ein professioneller PDF-Report erstellt wird
6. ✅ Der Report per E-Mail versendet wird (optional)
7. ✅ Alle Reports im Dashboard angezeigt werden
8. ✅ Keine personenbezogenen Daten im Report erscheinen
9. ✅ Fehlerhafte Uploads klar abgelehnt werden
10. ✅ Die Anwendung stabil und zuverlässig läuft

---

**Ende des Entwicklungsplans**
