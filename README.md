# eb_sucht

## Offline-Einzeldatei

Die Anwendung kann vollständig offline als **eine einzige HTML-Datei** verwendet und weitergegeben werden.

### Automatisch über GitHub Actions

Bei jedem Push auf `main` läuft der Workflow **Build Offline HTML**. Danach:

1. GitHub-Repository öffnen.
2. **Actions** öffnen.
3. Den neuesten erfolgreichen Lauf **Build Offline HTML** auswählen.
4. Unter **Artifacts** auf **eb-sucht-offline** klicken.
5. Das ZIP entpacken.
6. Die enthaltene `eb-sucht-offline.html` per Doppelklick im Browser öffnen oder weitergeben.

Die Datei benötigt keinen Webserver und keine Internetverbindung.

### Lokal erzeugen

```bash
npm install
npm run build:offline
```

Danach liegt die fertige Einzeldatei unter:

```
dist-offline/eb-sucht-offline.html
```

Der Kopierbutton verwendet bei lokal per `file://` geöffneter HTML-Datei einen Browser-Fallback, falls die moderne Clipboard-API nicht verfügbar ist.


## Lokales Diktat

Die Offline-Einzeldatei enthält zusätzlich ein lokales, deutschsprachiges Whisper-Modell für Speech-to-Text. Audio und Transkription bleiben im Browser; für das Diktat werden keine externen Sprachdienste benötigt.

Unterstützte Sprachbefehle sind unter anderem:

- Punkt, Komma, Doppelpunkt, Semikolon
- Fragezeichen, Ausrufezeichen
- neuer Absatz, neue Zeile
- Klammer auf / Klammer zu, Bindestrich
- lösche letzten Satz
- lösche letzten Absatz
- lösche letztes Wort

Nach der Transkription wird der Text lokal durch eine medizinische Vokabularschicht normalisiert. Sie enthält häufige Psychopharmaka und suchtmedizinische Medikamente, beispielsweise Venlafaxin, Sertralin, Quetiapin, Rivotril, Methadon, L-Polamidon und Buprenorphin.

Das ist keine medizinische Entscheidungslogik und kein echtes Modell-Fine-Tuning. Ein belastbares Fine-Tuning würde ein geeignetes, geprüftes Audio-/Transkript-Trainingsdataset erfordern.

Da Sprachmodell, ONNX-Laufzeit und Anwendung vollständig in derselben Datei eingebettet sind, ist die Offline-HTML deutlich größer als die reine Anwendung. Beim ersten Start der Spracherkennung kann die Initialisierung auf älteren Rechnern einige Zeit benötigen.
