# backend

Questo è il vero core di tutto il progetto. È scritto interamente in TypeScript, che ci ha permesso di scrivere in modo sicuro codice tipato in JS.
Bisogna comprima compilarlo e puoi farlo con `npm run compile`. Per eseguirlo, invece, il comando è `npm run start`.

Troverai un `npm script` per `postinstall`, ci è stato necessario per fare il deploy del progetto su [Heroku](https://heroku.com).
A questo abbiamo scelto di utilizzare un database (mongodb) direttamente su cloud con [mLab.com](https://mlab.com).

Per il funzionamento del progetto sono necessarie delle variabili d'ambiente che puoi settare nel tuo file `.env`:

| Nome variabile  |  Descrizione | Tipo  | 
|---|---|---|
| MONGODB_URI | URL di connessione al database mongodb | string |
| JWT_SECRET | Chiave privata per verificare validità dei token | string | 
