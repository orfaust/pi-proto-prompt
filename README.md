# pi-proto-prompt

Estensione Pi: note in un riquadro modale, aggiunte in coda al prompt senza inviarlo al modello.

## Installazione globale

```sh
pi install git:github.com/orfaust/pi-proto-prompt
```

Eseguire `/reload` nelle sessioni già aperte.

## Uso

- `Ctrl+K`: apre il riquadro modale centrato.
- `Invio`: chiude e accoda le note al prompt corrente, separate da una nuova riga.
- `Shift+Invio` (oppure `Ctrl+J`): nuova riga nelle note.
- `Esc`: chiude e scarta le note, lasciando il prompt invariato.
- `/proto-prompt`: apertura alternativa senza hotkey.

Le note vuote o di soli spazi vengono ignorate. Nessuna nota viene salvata su disco.
Disponibile nella TUI interattiva, non in modalità RPC/print.

## Hotkey globale

Creare `pi-proto-prompt.json` nella directory utente di Pi (normalmente `~/.pi/agent`, oppure quella indicata da `PI_CODING_AGENT_DIR`):

```json
{
  "shortcut": "ctrl+k"
}
```

Per esempio, usare `"ctrl+alt+n"` per cambiare combinazione in tutti i progetti.
Applicare con `/reload`. In assenza di configurazione il valore è `ctrl+k`;
configurazioni non valide producono un avviso e ripristinano il default.

**Conflitto:** `Ctrl+K` sostituisce il comando standard di eliminazione fino a fine riga.
Pi può segnalare il conflitto: è previsto. Le hotkey riservate da Pi non sono
sovrascrivibili; anche sistema operativo, terminale o altre estensioni possono
intercettare una combinazione. Verificare con `/hotkeys` e scegliere una combinazione libera.
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
