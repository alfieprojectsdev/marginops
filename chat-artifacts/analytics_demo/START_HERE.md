# START HERE — MarginOps demo

A small offline dashboard. No accounts, no coding. Two clicks to run.

## 1. Unzip
Double-click `MarginOps-Demo.zip` so you get a normal folder.
- **Windows:** before unzipping, right-click the zip > Properties > tick **Unblock** > OK. Then Extract All.

## 2. Run
Open the folder and double-click:
- **macOS:** `run_mac.command`
- **Windows:** `run_win.bat`

## 3. Approve the one-time prompt
The first run shows a safety prompt (normal for any downloaded tool):
- **macOS:** if it says "unidentified developer", **right-click `run_mac.command` > Open > Open**.
- **Windows:** if a blue box appears, click **More info > Run anyway**.

The script sets everything up (needs internet the first time) and opens the
dashboard in your browser. Leave the black window open while you use it.

## What you should see
Each ad platform looks healthy (ROAS around 4x, green), but the blended
**LTV:CAC is about 0.6x in red** — the business is paying more to acquire a
customer than that customer is worth. Switch the date window to 7 days and the
red number drops further: the recent weeks bleed faster.

## To stop
Close the browser tab, then click the black window and press `Ctrl + C`.

## If it won't run (locked-down work laptop)
See `SETUP.md` for the one-line manual install (`brew install uv` on macOS,
`winget install astral-sh.uv` on Windows), then `uv run streamlit run app.py`.
