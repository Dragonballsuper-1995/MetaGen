"""
Master test runner for all Model & API Expansion phases.
"""

import subprocess
import sys
from pathlib import Path

# Fix Windows console unicode issues
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

TEST_SCRIPTS = [
    "tests/verify_gemini.py",
    "tests/verify_opencode_zen.py",
    "tests/verify_openrouter.py",
    "tests/verify_cascade.py",
    "tests/verify_dynamic_models.py",
    "tests/verify_llama3_notebook.py",
    "tests/verify_qwen_notebook.py",
    "tests/verify_phi4_notebook.py",
]

def run_all():
    print("==========================================================")
    print("🚀 RUNNING FULL EXPANSION VERIFICATION SUITE")
    print("==========================================================\n")

    root = Path(__file__).resolve().parent.parent
    failed = []

    for script in TEST_SCRIPTS:
        script_path = root / script
        print(f"\n--- Running {script} ---")
        res = subprocess.run([sys.executable, str(script_path)], cwd=str(root))
        if res.returncode != 0:
            print(f"❌ {script} FAILED (exit code {res.returncode})")
            failed.append(script)
        else:
            print(f"✅ {script} PASSED")

    print("\n==========================================================")
    if failed:
        print(f"❌ {len(failed)}/{len(TEST_SCRIPTS)} tests failed: {failed}")
        sys.exit(1)
    else:
        print(f"🎉 ALL {len(TEST_SCRIPTS)} VERIFICATION TESTS PASSED PERFECTLY!")
        print("==========================================================")

if __name__ == "__main__":
    run_all()
