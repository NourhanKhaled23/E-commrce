#!/usr/bin/env bash
# ============================================================
# clean-commit-messages.sh
# Rewrites commit messages to remove AI tool keywords.
# SAFETY: Only message text is changed. No code is touched.
# ============================================================
#
# Keywords removed/replaced (case-insensitive):
#   Claude, Replit, ChatGPT, GPT, Gemini, AI, Copilot
#
# HOW TO RUN:
#   1. Clone the repo fresh (or use your existing local copy)
#   2. chmod +x clean-commit-messages.sh
#   3. ./clean-commit-messages.sh
#   4. Review with: git log --oneline
#   5. Force-push:  git push origin main --force
#
# BACKUP FIRST (recommended):
#   git branch backup-main
# ============================================================

set -e

echo ""
echo "========================================"
echo "  Git commit message cleanup script"
echo "========================================"
echo ""

# --- Safety check: must be in a git repo ---
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "ERROR: Not inside a git repository. cd into your repo first."
  exit 1
fi

# --- Backup reminder ---
echo "⚠  WARNING: This rewrites git history and requires a force-push."
echo "   A backup branch 'backup-main' will be created automatically."
echo ""
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# Create backup branch
git branch -f backup-main HEAD
echo "✓ Backup branch 'backup-main' created."
echo ""

# --- Method 1: git filter-repo (preferred, faster, safer) ---
if command -v git-filter-repo &> /dev/null; then
  echo "Using git-filter-repo..."

  git filter-repo --force --message-callback '
import re

replacements = [
    # Strip "in Replit" / "in replit" phrases
    (r"\bin [Rr]eplit\b\s*[—–-]?\s*", ""),
    # Strip "Replit " prefix
    (r"\b[Rr]eplit\s+", ""),
    # Strip trailing " replit" / " Replit"
    (r"\s+[Rr]eplit\b", ""),
    # Strip "replit." (filename like replit.nix)
    (r"replit\.", "."),
    # Other keywords — replace with nothing or generic term
    (r"\b[Cc]laude\b", ""),
    (r"\b[Cc]hat[Gg][Pp][Tt]\b", ""),
    (r"\b[Gg][Pp][Tt]-?\d*\b", ""),
    (r"\b[Gg]emini\b", ""),
    (r"\b[Cc]opilot\b", ""),
    (r"\b[Aa][Ii]\b", ""),
]

msg = message.decode("utf-8")
for pattern, replacement in replacements:
    msg = re.sub(pattern, replacement, msg)

# Clean up double spaces and leading/trailing spaces per line
lines = [" ".join(line.split()) for line in msg.splitlines()]
msg = "\n".join(lines).strip() + "\n"

return msg.encode("utf-8")
'

  echo ""
  echo "✓ Done with git-filter-repo."

# --- Method 2: Python script fallback (no extra tools needed) ---
else
  echo "git-filter-repo not found. Using Python-based rewrite..."
  echo "(Install git-filter-repo for faster rewrites: pip install git-filter-repo)"
  echo ""

  python3 - <<'PYEOF'
import subprocess
import re
import sys

KEYWORDS = [
    (r"\bin [Rr]eplit\b\s*[—–-]?\s*", ""),
    (r"\b[Rr]eplit\s+", ""),
    (r"\s+[Rr]eplit\b", ""),
    (r"replit\.", "."),
    (r"\b[Cc]laude\b", ""),
    (r"\b[Cc]hat[Gg][Pp][Tt]\b", ""),
    (r"\b[Gg][Pp][Tt]-?\d*\b", ""),
    (r"\b[Gg]emini\b", ""),
    (r"\b[Cc]opilot\b", ""),
    (r"\b[Aa][Ii]\b", ""),
]

def clean_msg(msg):
    for pattern, repl in KEYWORDS:
        msg = re.sub(pattern, repl, msg)
    lines = [" ".join(l.split()) for l in msg.splitlines()]
    return "\n".join(lines).strip()

# Get all commits oldest-first
log = subprocess.check_output(
    ["git", "log", "--format=%H %s", "--reverse"],
    text=True
).strip().splitlines()

flagged = []
for line in log:
    sha, *rest = line.split(" ", 1)
    msg_short = rest[0] if rest else ""
    cleaned = clean_msg(msg_short)
    if cleaned != msg_short:
        flagged.append((sha, msg_short, cleaned))

if not flagged:
    print("No commit messages contain the target keywords. Nothing to do.")
    sys.exit(0)

print(f"Found {len(flagged)} commit(s) to update:")
for sha, old, new in flagged:
    print(f"  {sha[:7]}  OLD: {old}")
    print(f"         NEW: {new}")
    print()

# Write filter script
import tempfile, os
script = """
import sys, re, subprocess

KEYWORDS = [
    (r"\\\\bin [Rr]eplit\\\\b\\\\s*[—–-]?\\\\s*", ""),
    (r"\\\\b[Rr]eplit\\\\s+", ""),
    (r"\\\\s+[Rr]eplit\\\\b", ""),
    (r"replit\\\\.", "."),
    (r"\\\\b[Cc]laude\\\\b", ""),
    (r"\\\\b[Cc]hat[Gg][Pp][Tt]\\\\b", ""),
    (r"\\\\b[Gg][Pp][Tt]-?\\\\d*\\\\b", ""),
    (r"\\\\b[Gg]emini\\\\b", ""),
    (r"\\\\b[Cc]opilot\\\\b", ""),
    (r"\\\\b[Aa][Ii]\\\\b", ""),
]

msg = sys.stdin.read()
for p, r in KEYWORDS:
    msg = re.sub(p, r, msg)
lines = [" ".join(l.split()) for l in msg.splitlines()]
print("\\\\n".join(lines).strip())
"""

subprocess.run([
    "git", "filter-branch", "-f", "--msg-filter",
    "python3 -c \"\nimport sys, re\nKEYWORDS = [\n    (r'\\\\bin [Rr]eplit\\\\b\\\\s*[—–-]?\\\\s*', ''),\n    (r'\\\\b[Rr]eplit\\\\s+', ''),\n    (r'\\\\s+[Rr]eplit\\\\b', ''),\n    (r'replit\\\\.', '.'),\n    (r'\\\\b[Cc]laude\\\\b', ''),\n    (r'\\\\b[Cc]hat[Gg][Pp][Tt]\\\\b', ''),\n    (r'\\\\b[Gg][Pp][Tt]-?\\\\d*\\\\b', ''),\n    (r'\\\\b[Gg]emini\\\\b', ''),\n    (r'\\\\b[Cc]opilot\\\\b', ''),\n    (r'\\\\b[Aa][Ii]\\\\b', ''),\n]\nmsg = sys.stdin.read()\nfor p, r in KEYWORDS:\n    msg = re.sub(p, r, msg)\nlines = [' '.join(l.split()) for l in msg.splitlines()]\nprint('\\\\n'.join(lines).strip())\n\"",
    "--", "--all"
], check=True)

print("Done.")
PYEOF

fi

echo ""
echo "========================================"
echo "  Review changes before pushing"
echo "========================================"
echo ""
git log --oneline | head -20
echo ""
echo "If everything looks correct, force-push with:"
echo ""
echo "  git push origin main --force"
echo ""
echo "To undo everything and restore from backup:"
echo ""
echo "  git reset --hard backup-main"
echo "  git push origin main --force"
echo ""
