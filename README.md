# Google Forms Clone — Feedback & Voting (Simple)

## What this is
A simple, minimal Google Forms-like application built with:
- Node.js + Express backend
- SQLite for storage (file `data.sqlite`)
- Vanilla HTML/CSS/JS frontend (no build tools)
- Chart.js for analytics visualization

It's designed to be easy to run locally for hackathons and demos.

## Files
- server.js — Express server & API
- package.json — Node dependencies
- data.sqlite — created after first run
- /public — frontend files (index.html, form.html, dashboard.html, styles.css)
- README.md — this file

## Setup (step-by-step)
1. Install Node.js (v16+ or v18+ recommended): https://nodejs.org/
2. Open a terminal / command prompt.
3. Extract the ZIP you downloaded to a folder.
4. `cd` into the project folder (the one containing server.js and package.json).
5. Run: `npm install`
6. Start the server: `npm start`
7. Open your browser and visit: `http://localhost:3000`

## How to use
- Home page shows existing forms.
- Click "Create Form" to design questions (text or multiple-choice).
- Save form => you get an ID and you can open it to fill.
- Share the link `/form.html?open=<ID>` with attendees to collect responses.
- Visit Dashboard to select a form and view analytics (bar charts for MCQs, list for text answers).

## Customization suggestions (for hackathon)
- Add authentication (optional) to restrict form creation.
- Add CSV export endpoint (`/api/forms/:id/responses` -> CSV).
- Allow multiple selection MCQs or required fields.
- Improve styling or convert UI to React for a polished demo.

## Troubleshooting
- If `npm install` fails, confirm Node.js and npm are installed (`node -v`, `npm -v`).
- If port 3000 is occupied, set `PORT` env var: `PORT=4000 npm start` (Linux/Mac) or use `set PORT=4000 && npm start` on Windows.

## License
MIT — use freely for demo & hackathon.
