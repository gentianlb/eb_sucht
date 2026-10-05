# eb_sucht

## Web-Version

Die aktuelle GitHub-Pages-Version ist unter:

https://gentianlb.github.io/eb_sucht/

verfügbar.

Die Web-Version enthält eine optionale Diktatfunktion mit **Whisper Small**. Beim ersten Diktat wird das Modell über das Internet geladen und anschließend im Browser verwendet. Die Audioaufnahme wird lokal im Browser verarbeitet und nicht an einen externen Spracherkennungsdienst übertragen.

Nach der Transkription wird der resultierende Brief zunächst als **Diktat-Vorschau** angezeigt. Er wird erst mit **Übernehmen** in den Brief geschrieben und kann vorher bearbeitet oder mit **Verwerfen** verworfen werden.

Unterstützte Diktatbefehle umfassen unter anderem:

- Punkt, Komma, Doppelpunkt, Semikolon
- Fragezeichen, Ausrufezeichen
- neuer Absatz, neue Zeile
- Klammer auf / Klammer zu, Bindestrich
- lösche letzten Satz
- lösche letzten Absatz
- lösche letztes Wort

Zusätzlich wird das Transkript lokal durch eine medizinische Vokabularschicht für häufige Psychopharmaka und suchtmedizinische Medikamente normalisiert.

## Offline-Einzeldatei

Die Offline-Version enthält **keine Diktatfunktion** und kein Sprachmodell. Sie bleibt dadurch klein und vollständig unabhängig vom Internet.

Bei jedem Push auf `main` läuft der Workflow **Build Offline HTML**. Danach:

1. GitHub-Repository öffnen.
2. **Actions** öffnen.
3. Den neuesten erfolgreichen Lauf **Build Offline HTML** auswählen.
4. Unter **Artifacts** auf **eb-sucht-offline** klicken.
5. ZIP entpacken.
6. `eb-sucht-offline.html` per Doppelklick im Browser öffnen oder weitergeben.

Lokal erzeugen:

```bash
npm install
npm run build:offline
```

Die fertige Datei liegt anschließend unter:

```
dist-offline/eb-sucht-offline.html
```

Der Kopierbutton verwendet bei lokal per `file://` geöffneter HTML-Datei einen Fallback, falls die moderne Clipboard-API nicht verfügbar ist.
