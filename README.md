# pi-proto-prompt

Estensione Pi: note in un riquadro modale, aggiunte in coda al prompt senza inviarlo al modello.

## Installazione globale

```sh
pi install git:github.com/orfaust/pi-proto-prompt
```

Eseguire `/reload` nelle sessioni già aperte.

## Uso

- `Ctrl+Invio`: apre il riquadro modale centrato.
- `Invio`: chiude e accoda le note al prompt corrente, separate da una nuova riga.
- `Shift+Invio` (oppure `Ctrl+J`): nuova riga nelle note.
- `Esc`: chiude senza modificare il prompt, conservando le note alla riapertura.
- `/proto-prompt`: apertura alternativa senza hotkey.

Le note restano in memoria alla riapertura, anche dopo Invio; vengono perse con `/reload` o al riavvio di Pi. Confermare nuovamente accoda nuovamente le note.
Le note vuote o di soli spazi vengono ignorate. Nessuna nota viene salvata su disco.
Disponibile nella TUI interattiva, non in modalità RPC/print.

## Hotkey globale

Creare `pi-proto-prompt.json` nella directory utente di Pi (normalmente `~/.pi/agent`, oppure quella indicata da `PI_CODING_AGENT_DIR`):

```json
{
  "shortcut": "ctrl+enter"
}
```

Per esempio, usare `"ctrl+alt+n"` per cambiare combinazione in tutti i progetti.
Applicare con `/reload`. In assenza di configurazione il valore è `ctrl+enter`;
configurazioni non valide producono un avviso e ripristinano il default.

Il terminale deve distinguere `Ctrl+Invio` da `Invio` (ad esempio tramite il
protocollo tastiera Kitty). Se non lo supporta, configurare una combinazione
alternativa come `ctrl+alt+n`, oppure usare `/proto-prompt`.

Pi blocca le shortcut riservate: ad esempio `Ctrl+K` è assegnato a
`tui.editor.deleteToLineEnd` e richiede una rimappatura prima di poterlo usare.
Anche sistema operativo, terminale o altre estensioni possono intercettare una
combinazione. Verificare con `/hotkeys`.
La configurazione è globale e non legge override di progetto.

## Sviluppo

```sh
npm install
npm run check
npm test
pi -e .
```

Verifica manuale: digitare un prompt, aprire la modale, scrivere note multilinea,
confermare e verificare che il prompt originale sia conservato e non inviato.
Ripetere annullando con Esc, con testo Unicode, terminale stretto e ridimensionamento.
