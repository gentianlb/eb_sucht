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
