import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
SHUTDOWN_TIMEOUT_SECONDS = 8


def start_process(command, cwd, *, shell=False):
    options = {
        "cwd": cwd,
        "shell": shell,
    }
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        options["start_new_session"] = True
    return subprocess.Popen(command, **options)


def stop_process(process):
    if process.poll() is not None:
        return

    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=SHUTDOWN_TIMEOUT_SECONDS)
    except (OSError, ProcessLookupError):
        process.terminate()
    except subprocess.TimeoutExpired:
        process.terminate()

    try:
        process.wait(timeout=SHUTDOWN_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def main():
    if shutil.which("npm") is None:
        print("npm was not found. Install Node.js and npm, then run this command again.", file=sys.stderr)
        return 1

    venv_python = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    python = str(venv_python) if venv_python.is_file() else sys.executable
    processes = []

    try:
        print("Starting backend at http://localhost:8000")
        processes.append(start_process(
            [
                python,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8000",
                "--reload",
            ],
            BACKEND_DIR,
        ))

        print("Starting frontend at http://localhost:5173")
        processes.append(start_process(
            "npm run dev -- --host 0.0.0.0",
            FRONTEND_DIR,
            shell=True,
        ))
        print("Press Ctrl+C to stop both services.")

        while True:
            for process in processes:
                exit_code = process.poll()
                if exit_code is not None:
                    return exit_code
            time.sleep(0.25)
    except KeyboardInterrupt:
        print("\nStopping backend and frontend...")
        return 0
    finally:
        for process in reversed(processes):
            stop_process(process)


if __name__ == "__main__":
    raise SystemExit(main())
