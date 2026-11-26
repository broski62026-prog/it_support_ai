# IT Support AI Agent

## Run the application

From the project root, start the backend and frontend together:

```powershell
python run.py
```

The backend runs at `http://localhost:8000` and the frontend at
`http://localhost:5173`. Both services display their logs in the same terminal.
Press **Ctrl+C** to stop both.

To open the frontend from another device on the same private network, browse to
`http://<server-lan-ip>:5173`. The frontend will connect to the backend on that
same host at port `8000`.

Before the first run, install backend dependencies with
`backend\.venv\Scripts\python -m pip install -r backend\requirements.txt` when
that virtual environment exists (the launcher prefers it); otherwise use
`python -m pip install -r backend\requirements.txt`. Install frontend
dependencies with `npm install` from `frontend`, and configure the backend
environment as required by the project.
