# TinaBot

TinaBot è un bot Hipchat basato su Hubot.

Ci permette di gestire gli ordini del TuttoBene tenendo una lista giornaliera
degli ordini di ognuno, stampandola quando richiesto.

I comandi che possono essere inviati (citandolo) al bot sono:

* `@tinabot per me <ordine>` - aggiunge <ordine> all'ordine dell'utente
* `@tinabot per me niente` - cancella il proprio ordine
* `@tinabot ordine` - pubblica i dishes ordinati

Inoltre, nelle stanze in cui è attivo, tinabot è in ascolto delle parole `TB`
(case-sensitive) o `TuttoBene` (case-insensitive)

## Sviluppo

Hubot richiede npm 0.10.x installato.

Per iniziare clonare il repository e installare i pacchetti NPM necessari con
`npm install`.

Lo script che fa tutto il lavoro è `scripts/listapranzo.js`. Si può modificare
quello script o aggiungerne di nuovi.

### Provarlo in locale

Per provare TinaBot è sufficiente lanciare:

```
export HUBOT_HIPCHAT_JID="<utente del bot>"
export HUBOT_HIPCHAT_PASSWORD="<password del bot>"

./bin/hubot --adapter hipchat
```

Verrà lanciata la shell interattiva di TinaBot. Si può iniziare a guardarsi
intorno con `tinabot help`.

Anche senza le variabili d'ambiente è comunque possibile interagire col bot
direttamente dalla console.

## Deployment

TinaBot è hostato presso Heroku. Fate riferimento alle istruzioni standard di
Hubot per Heroku. È richiesta l'installazione di RedisToGo (basta la versione free).
Il processo principale viene avviato da Heroku leggendo il file `Procfile`.

Sono richieste alcune variabili d'ambiente su Heroku:

```
HEROKU_URL:                      http://tinabot.herokuapp.com
HUBOT_HEROKU_KEEPALIVE_URL:      https://tinabot.herokuapp.com/
HUBOT_HIPCHAT_JID:               <utente del bot>
HUBOT_HIPCHAT_JOIN_PUBLIC_ROOMS: false
HUBOT_HIPCHAT_PASSWORD:          <password del bot>
HUBOT_HIPCHAT_ROOMS:             <Lista delle stanze in cui stare in ascolto (comma-separated)>
REDISTOGO_URL:                   <impostato da heroku>
```

`HUBOT_HIPCHAT_ROOMS` richiede il valore `XMPP JID` delle stanze, si trova nel
sito di Hipchat.

Il remote GIT di Heroku è:

```
[remote "heroku"]
  url = https://git.heroku.com/tinabot.git
  fetch = +refs/heads/*:refs/remotes/heroku/*
```

Per vedere i log o riavviare il bot i comandi necessari sono `heroku logs` e
`heroku restart`. È necessario aver installato la Heroku CLI.

### Hubot Heroku Keepalive

Dato che su Heroku i processi free si fermano se non c'è attività per 30 minuti
viene usato `hubot-heroku-keepalive` per tenere attivo TinaBot.
