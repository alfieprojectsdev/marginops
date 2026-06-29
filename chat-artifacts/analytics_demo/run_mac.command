#!/bin/bash
# MarginOps Python demo — macOS launcher.
# Double-click in Finder. First run: right-click > Open (Gatekeeper asks once).
# Installs uv if needed, then builds the venv + deps and opens the dashboard.
set -uo pipefail
cd "$(dirname "$0")"

pause_close() {
  echo
  echo "If something looks wrong, screenshot this window and send it to Alfie."
  read -n 1 -s -r -p "Press any key to close."
  echo
}
trap 'pause_close' EXIT

echo "MarginOps Python demo — setup and launch"
echo

# Make sure uv is on PATH (it may already be installed but not visible yet).
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv (one time, needs internet)..."
  curl -LsSf https://astral.sh/uv/install.sh | sh || {
    echo "uv install failed. Try once in Terminal:  brew install uv"
    exit 1
  }
  export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
fi

echo "uv: $(command -v uv)"
echo "Preparing data..."
uv run mock_streams.py || { echo "Data step failed."; exit 1; }

echo
echo "Opening the dashboard in your browser. Leave this window open."
echo "To stop the demo: close the browser tab, then press Ctrl+C here."
echo
uv run streamlit run app.py
