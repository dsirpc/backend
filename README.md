# backend

Questo è il vero core di tutto il progetto. È scritto interamente in TypeScript, che ci ha permesso di scrivere in modo sicuro codice tipato in JS.
Bisogna comprima compilarlo e puoi farlo con `npm run compile`. Per eseguirlo, invece, il comando è `npm run start`. Tutto il sorgente TypeScript è contenuto nella cartella `src` e la versione compilata verrà creata all'interno di `dist`.

Troverai un `npm script` per `postinstall`, ci è stato necessario per fare il deploy del progetto su [Heroku](https://heroku.com).
A questo abbiamo scelto di utilizzare un database (mongodb) direttamente su cloud con [mLab.com](https://mlab.com).

Per il funzionamento del progetto sono necessarie delle variabili d'ambiente che puoi settare nel tuo file `.env`:

| Nome variabile  |  Descrizione | Tipo  | 
|---|---|---|
| MONGODB_URI | URL di connessione al database mongodb | string |
| JWT_SECRET | Chiave privata per verificare validità dei token | string | 

All'interno di `server.ts` abbiamo creato un semplice script da eseguire al primo avvio del server per popolare il database. Ti permetterà di avere diversi utenti con ruoli diversi, alcuni piatti e bibite d'esempio ed anche due tavoli. Attualmente è commentato, ma se vuoi eseguirlo ti basterà rimuovere il commento dalla riga `475` alla riga `555`.
