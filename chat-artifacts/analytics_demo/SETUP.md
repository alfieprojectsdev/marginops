# Running the MarginOps Python demo

Offline after the first install. No accounts, no API keys.

## Easiest: double-click

- **macOS:** double-click `run_mac.command`.
  First time only, macOS blocks downloaded scripts: **right-click the file > Open > Open**. After that, double-click works.
- **Windows:** double-click `run_win.bat`.
  First time only, Windows may show a blue SmartScreen box: **More info > Run anyway**.

The script installs `uv` if it is missing, sets up everything, and opens the
dashboard in your browser. Leave the black window open while presenting; close
the browser tab and press `Ctrl+C` in the window to stop.

## What it needs

- Internet **once** (to install `uv` + the libraries). Offline thereafter.
- Nothing pre-installed. `uv` fetches its own Python and dependencies.

## If a script is blocked (locked-down work laptop)

Install `uv` once, by hand, then run the two commands:

```bash
# macOS
brew install uv            # or:  curl -LsSf https://astral.sh/uv/install.sh | sh
uv run streamlit run app.py
```
```powershell
# Windows (PowerShell)
winget install astral-sh.uv   # or:  irm https://astral.sh/uv/install.ps1 | iex
uv run streamlit run app.py
```

## Two views

- `uv run streamlit run app.py` — interactive dashboard (toggles + date slider). The live demo.
- `uv run dashboard.py` — writes a single `dashboard.png` (good for slides/handouts).
- `uv run mock_streams.py` — regenerates the four platform CSVs in `data/`.

## pip instead of uv

`requirements.txt` is provided as a fallback. uv is recommended: on the latest
macOS/Windows, plain `pip install` into the system Python is blocked
(externally-managed-environment) and trips up most non-developers. uv avoids
that by managing its own isolated environment.
