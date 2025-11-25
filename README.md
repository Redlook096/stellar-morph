# AI Orb Animation

A TypeScript-first creative project that renders beautiful, generative orb animations in the browser. AI Orb Animation focuses on visual polish, performance and a smooth local development experience — including one-click helper scripts for Windows that install dependencies and start a local dev server reliably.

[Optional Badges Placeholder]
- Build: ![build-status](https://img.shields.io/badge/build-pending-lightgrey)
- License: ![license](https://img.shields.io/badge/license-MIT-blue)

Quick Links
- Repo name: AI Orb Animation
- Scripts: install-deps.bat (install), start-project.bat (start & open browser)

Table of contents
- Features
- Prerequisites
- Quick start (Windows)
- What the helper scripts do
- Custom scripts & ports
- Troubleshooting
- Rename repository (GitHub)
- Commit & push (how to add these files)
- Contributing & license
- Contact

Features
- Fast onboarding for Windows developers (supports pnpm, yarn, npm)
- Robust dependency installer with safe retries and cache repair
- Deterministic dev server startup: waits until the server responds before opening the browser to avoid "browser refused to connect"
- Diagnostics: server output is saved to devserver.log for quick triage

Prerequisites
- Windows 10 or later
- Node.js v16+ (LTS recommended): https://nodejs.org/
- Git (optional; required to push changes to GitHub)

Quick start — Windows (recommended)
1. Clone the repository:
   - git clone https://github.com/<your-username>/AI-Orb-Animation.git
   - cd AI-Orb-Animation

2. Install dependencies:
   - Double-click install-deps.bat or run in a terminal:
     .\install-deps.bat

3. Start the project and open the browser:
   - Double-click start-project.bat or run:
     .\start-project.bat

What the helper scripts do
- install-deps.bat
  - Verifies Node.js presence and detects package manager from lockfiles or installed clients.
  - Uses pnpm → yarn → npm heuristics, runs a safe install and performs limited auto-repair if needed.
  - If installation keeps failing, prints clear next steps.

- start-project.bat
  - Ensures dependencies are installed (calls install-deps.bat).
  - Detects the most appropriate start script in package.json (dev/start/serve/preview) and common framework ports.
  - Starts the dev server in a new window and logs output to devserver.log.
  - Polls candidate ports until a responsive HTTP endpoint is discovered and then opens the browser.
  - If the server doesn't become reachable, prints recent server logs and attempts a safe reinstall + retry a limited number of times.

Custom scripts & ports
- If your project uses a custom script (e.g., npm run dev:ui) or custom port, either:
  1. Add an alias to package.json, e.g.:
     "scripts": { "dev": "npm run dev:ui" }
  2. Or edit start-project.bat and set CMD_OVERRIDE and/or PORT_OVERRIDE variables at the top (instructions are in the script header).

Troubleshooting
- "node is not recognized": install Node.js and re-open your terminal before re-running install-deps.bat.
- Install failures: try running the script in an elevated Administrator terminal, delete node_modules and the lockfile that matches your package manager, and re-run install-deps.bat.
- Browser refuses to connect:
  - start-project.bat waits for a responsive HTTP endpoint before opening the browser. If you still see connection errors:
    - Check local firewall or security software blocking the port.
    - Ensure your dev server binds to localhost (127.0.0.1) or 0.0.0.0 as intended.
    - Inspect devserver.log for errors — the start script prints the last lines when a failure occurs.

Rename the repository on GitHub
1. On GitHub, go to your repository Settings → Repository name → rename to "AI-Orb-Animation".
2. Update local clones:
   - git remote set-url origin git@github.com:<your-username>/AI-Orb-Animation.git
   - or
   - git remote set-url origin https://github.com/<your-username>/AI-Orb-Animation.git

Commit & push — copy-paste (recommended)
1. Create a branch and add files:
   - git checkout -b docs/rename-readme-and-scripts
   - git add README.md install-deps.bat start-project.bat
2. Commit:
   - git commit -m "chore: rename project to AI Orb Animation; add polished README and Windows helper scripts"
3. Push and open a PR:
   - git push -u origin docs/rename-readme-and-scripts
   - Then open a Pull Request on GitHub and merge.

If you prefer to commit directly to main (not recommended without review):
   - git add README.md install-deps.bat start-project.bat
   - git commit -m "chore: rename project to AI Orb Animation; add polished README and Windows helper scripts"
   - git push origin main

Contributing
- Contributions welcome! Please open issues and PRs for improvements to the visuals, performance, docs, or scripts.

License
- Add a LICENSE file to the repo root to indicate the open-source license you prefer.

Contact
- Open an issue on the repository with questions or share package.json if you’d like the helper scripts further customized to the exact start script and port.

Enjoy building with AI Orb Animation — polished visuals, fast iteration, and straightforward setup.
