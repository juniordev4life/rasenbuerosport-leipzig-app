[← Zurück zur Übersicht](../../README.md)

# 🤖 KI-Features

Drei KI-Features machen RasenBürosport einzigartig — angetrieben von **Claude** (Anthropic).

---

## 1. FC26-Stats-Extraktion (Claude Vision)

<div align="center">
<img src="../screenshots/game-match-stats.jpg" width="450" />
</div>

### Was passiert

Nach einem FC26-Match kannst du den **Nachspiel-Statistik-Screen** fotografieren und in die App hochladen. **Claude Vision** analysiert das Bild und extrahiert automatisch alle Statistik-Werte.

### Extrahierte Statistiken

| Kategorie | Werte |
|-----------|-------|
| **Ballkontrolle** | Ballbesitz (%), Pässe, Passgenauigkeit (%) |
| **Offensive** | Schüsse, Expected Goals (xG), Schusspräzision (%), Dribblings (%) |
| **Defensive** | Zweikämpfe, Gewonnene Zweikämpfe, Abfangaktionen, Paraden |
| **Disziplin** | Fouls, Ecken, Gelbe Karten |

### Wie es funktioniert

1. **Im Wizard** (Schritt 3): Optionales Foto direkt beim Spielerfassen anhängen
2. **Nachträglich**: Auf der Spieldetailseite den Upload-Bereich nutzen
3. Das Bild wird in **Supabase Storage** gespeichert
4. **Claude Vision** analysiert den Screenshot und gibt strukturierte Daten zurück
5. Die Statistiken werden als JSONB im Spiel gespeichert

### Technischer Ablauf

```
Screenshot → Supabase Storage → Claude Vision API → JSON-Extraktion → Datenbank
```

> Die Extraktion funktioniert mit FC26-Screenshots auf Deutsch und Englisch. Das KI-Modell erkennt die Tabellen-Struktur automatisch.

---

## 2. KI-Match-Vorhersage

<div align="center">
<img src="../screenshots/match-prediction.png" width="320" />
</div>

### Was passiert

Sobald im Spielassistenten **Spieler und Teams** feststehen (Schritt 3), wird **automatisch** eine Match-Vorhersage generiert — noch bevor das Spiel beginnt.

### Datengrundlage

Die KI berücksichtigt für jeden Spieler:

| Datenquelle | Beispiel |
|-------------|---------|
| **Karriere-Statistiken** | 50 Spiele, 64% Siegquote |
| **Aktuelle Form** | 2 Niederlagen in Folge |
| **xG-Effizienz** | 1,08x (trifft mehr als erwartet) |
| **Head-to-Head** | 19 Siege in 31 Duellen gegen LisaKicker |
| **Lieblingsteam** | Spielt mit RB Leipzig — extra motiviert? |
| **Spielmodus** | 1v1 oder 2v2 |

### Beispiel-Output

> *"AnnaAbwehr und LisaKicker sind zwar beide in heißer Form mit zwei Siegen am Stück, aber MaxMustermann ist trotz seiner aktuellen Pechsträhne der routinierte Kicker mit 64% Winrate. Besonders pikant: MaxMustermann spielt gegen sein Lieblingsteam RB Leipzig! Tendenz geht knapp an Hamburg — geschätzter Score: 2:1 für den HSV."*

### Eigenschaften

- **Automatisch** — kein Button, keine Interaktion nötig
- **Auf Deutsch** — der Ton ist locker und unterhaltsam
- **Datenbasiert** — echte Karrieredaten fließen ein
- **Einmalig** — pro Spiel eine Vorhersage, keine Regenerierung

---

## 3. KI-Spielbericht

<div align="center">
<img src="../screenshots/match-report.png" width="320" />
</div>

### Was passiert

Nach dem Spiel, sobald **FC26-Statistiken** vorliegen, wird **automatisch** ein Spielbericht generiert. Der Bericht liest sich wie ein Sportkommentar und basiert auf echten Daten.

### Datengrundlage

| Quelle | Verwendung |
|--------|-----------|
| **Spielergebnis** | Score, Spielverlauf, Ergebnistyp |
| **Match-Stats** | Ballbesitz, xG, Pässe, Zweikämpfe |
| **Karrieredaten** | Siegquote, xG-Effizienz, aktuelle Serie jedes Spielers |
| **Kontext** | Underdog-Situationen, persönliche Bestleistungen |

### Narrative die erkannt werden

Die KI erkennt automatisch besondere Situationen und webt sie in den Bericht ein:

- **Aufholjagd** — Team lag zurück und dreht das Spiel
- **Underdog-Sieg** — Gewonnen trotz deutlich weniger Ballbesitz
- **xG-Überperformance** — Mehr Tore als statistisch erwartet
- **Chancentod** — Viele Chancen, wenig Tore
- **Serienbruch** — Eine Sieges- oder Niederlagenserie endet
- **Karriere-Meilensteine** — Torjäger-Marke geknackt, Stammspieler-Status erreicht

### Beispiel-Output

> *"Was für eine verrückte Aufholjagd von Borussia Dortmund! Atletico Madrid mit MaxMustermann und TestUser dominierte 80 Minuten lang das Spiel mit 80% Ballbesitz und führte bereits 2:0, doch dann schlug das Dortmunder Duo AnnaAbwehr und LisaKicker gnadenlos zurück. Trotz nur 20% Ballbesitz drehten die beiden BVB-Spielerinnen die Partie völlig und gewannen..."*

### Eigenschaften

- **Automatisch** — wird generiert sobald Match-Stats vorhanden sind
- **Gespeichert** — der Bericht wird in der Datenbank gespeichert und beim nächsten Besuch direkt angezeigt
- **Personalisiert** — bezieht die Karrieredaten jedes Spielers mit ein
- **3-5 Sätze** — kurz, knackig, unterhaltsam

---

## Technologie

| Komponente | Technologie |
|------------|------------|
| **KI-Modell** | Claude (Anthropic) |
| **Vision** | Claude Vision API für Screenshot-Analyse |
| **Text** | Claude Text API für Berichte & Vorhersagen |
| **Prompts** | Im Backend-Code als Konstanten hinterlegt |
| **Caching** | Generierte Berichte werden in der DB gespeichert |
| **Sprache** | Alle Outputs auf Deutsch |

---

[← Profil](PROFILE.md) · [Zurück zur Übersicht](../../README.md)
