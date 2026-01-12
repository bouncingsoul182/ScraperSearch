# ScraperSearch

Local search site for the TM44 Excel sheet. Data stays on the machine; the app loads the Excel into a SQLite database and exposes a small search UI.

## Quick start

1) Import the Excel data into SQLite:

```bash
npm run import
```

2) Start the local server:

```bash
npm start
```

3) Open `http://localhost:3000` in a browser.

## LAN usage (fileserver)

To make the app reachable on your local network, bind to all interfaces:

```bash
npm run start:lan
```

Then browse to `http://<fileserver-ip>:3000` from any machine on the LAN. Make sure port 3000 is allowed through the fileserver firewall.

### Windows notes

If you see `'HOST' is not recognized`, install dependencies (including cross-env) and re-run:

```powershell
npm install
npm run start:lan
```

You can also run without the script in PowerShell:

```powershell
$env:HOST = '0.0.0.0'
$env:PORT = '3000'
node server.js
```

`setx` updates the registry for future shells; open a new PowerShell window after running `setx`.

## Run at startup (no external tools)

1) Create a task that runs at startup with highest privileges.
2) Action: `Start a program`
3) Program/script: `scripts\\windows\\start-lan.cmd`
4) Start in: `C:\\Users\\Administrator.ACILOCAL\\Documents\\ScraperSearch`
5) Check `Run whether user is logged on or not` and `Run with highest privileges`.

This uses only built-in Windows tools and will start the app on boot.

## Friendly LAN address (hostname)

For a professional LAN URL, create a DNS record (recommended) or hosts entry:

- DNS: add an A-record like `tm44-search` pointing to the fileserver IP.
- Hosts file (each client): add `192.168.1.50 tm44-search` to `C:\\Windows\\System32\\drivers\\etc\\hosts`.

Then browse to: `http://tm44-search:3000`

## Frontend styling

Tailwind builds the UI stylesheet from `public/input.css` into `public/styles.css`.

```bash
npm run build:css
```

If you want live updates while editing styles:

```bash
npm run watch:css
```

## Notes

- The importer reads the first worksheet from the Excel file and stores all columns as text.
- If you need to re-import, re-run `npm run import` to rebuild the SQLite database.
- Set `DB_PATH` if you want the database in a different location.
