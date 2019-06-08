# backend

Questo è il vero core di tutto il progetto. È scritto interamente in TypeScript, che ci ha permesso di scrivere in modo sicuro codice tipato in JS.

### Cosa serve?

* avere node e npm installato
* installare TypeScript `npm install -g typescript`
* scaricare tutte le dipendenze con `npm install`

### Development

Per eseguire il backend bisogna prima di tutto compilarlo e puoi farlo con `npm run compile`. Ora puoi lanciare il comando è `npm run start` per eseguirlo. Tutto il codice sorgente TypeScript è contenuto nella cartella `src` e la versione compilata verrà creata all'interno di `dist`.

Fra i `npm run-script` è anche presente `postinstall`: ci è stato necessario per fare il deploy del progetto su [Heroku](https://heroku.com). Di conseguenza abbiamo scelto di utilizzare un database (mongodb) direttamente su cloud con [mLab.com](https://mlab.com).

Per il funzionamento del progetto sono necessarie delle variabili d'ambiente che bisogna inserire nel file `.env`:

| Nome variabile  |  Descrizione | Tipo  | 
|---|---|---|
| MONGODB_URI | URL di connessione al database mongodb | string |
| JWT_SECRET | Chiave privata per verificare validità dei token | string | 
| PORT | Porta su cui esporre il servizio, di default 8080 (opzionale) | int | 

All'interno di `server.ts` abbiamo creato un semplice script da eseguire al primo avvio del server per popolare il database. Permetterà di avere diversi utenti con ruoli diversi, alcuni piatti e bibite d'esempio ed anche due tavoli. Attualmente è commentato, ma per eseguirlo basterà rimuovere il commento dalla riga `475` alla riga `555`.
