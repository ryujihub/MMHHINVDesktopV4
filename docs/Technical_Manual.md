git clone <repo-url>
# MMH Inventory Desktop — Technical Manual

Generated: 2026-01-07

Purpose
-------
This Technical Manual is intended for developers, IT staff, and system administrators responsible for installing, configuring, maintaining, and troubleshooting the Metro Manila Hills Hardware (MMH) Inventory Desktop application (MMHHINVDesktopV4).

This document covers:
- System overview and architecture
- Hardware and software requirements
- Development and production installation
- Firebase configuration and secrets
- Packaging and distribution (Electron)
- Backup, recovery, and maintenance
- Troubleshooting common errors
- Where to find source files and how to contribute

1. Introduction
----------------
System name: Metro Manila Hills Hardware — Inventory Desktop (MMH Inventory Desktop)

Purpose: Provide a desktop application for managing products, inventory, sales orders, and management reports. The application is a React single-page app (SPA) wrapped in Electron and uses Firebase (Authentication + Firestore) for data storage.

Intended technical users: developers, DevOps engineers, IT administrators, system integrators.

2. System overview
-------------------
Description
- Frontend: React + Material UI (MUI), bundled as a single-page app in `src/` and `public/`.
- Desktop shell: Electron (preload script to safely expose APIs).
- Backend: Firebase (Authentication + Firestore). Data is stored in Firestore collections and the app reads/writes via the client SDK.
- Reports: generated client-side with Recharts; Comprehensive report supports PDF generation via jsPDF + html2canvas.

Main features
- Products and Categories management
- Inventory adjustments and valuation
- Sales Orders creation, fulfillment, and returns
- Reports: Sales, Inventory, Comprehensive Business Report
- User Management with role-based access (Admin / Staff)
- In-app Guide Manual (renders `public/MMHH_User_Manual.md`)

High-level architecture
- Renderer (React) — UI components in `src/pages/`, `src/components/`
- Preload — `preload.js` (exposes a limited `electronAPI` to renderer)
- Main process — `public/electron.js` / `build/electron.js` depending on packaging
- Firebase — client SDK usage in `src/config/firebase.js`, `services/*.js`

3. Hardware requirements
-------------------------
Minimum (small stores / light usage)
- CPU: 2 cores
- RAM: 4 GB
- Storage: 1 GB free for application + space for logs/backups
- Network: stable Internet access for Firebase

Recommended (development / heavy usage)
- CPU: 4 cores or better
- RAM: 8 GB+
- Storage: SSD with 10+ GB free
- Network: reliable low-latency connection for Firestore operations

4. Software requirements
------------------------
- Operating system: Windows 10/11 (packaged app), macOS, or Linux supported by Electron
- Node.js: v16+ (check `package.json` engines if present)
- npm (or yarn) to install dev dependencies
- Python 3.x — optional for the included `tools/generate_manual.py` script
- Firebase CLI (optional, for exports and emulator): `npm install -g firebase-tools`

Important libraries used (select list)
- react, react-dom
- @mui/material (MUI)
- firebase (Firestore, Auth)
- electron, electron-builder (packaging)
- recharts (charts)
- jspdf, html2canvas (PDF export)

5. Installation (development)
------------------------------
Pre-req: Node.js 16+, npm installed.

1. Clone repository:

```powershell
cd C:\path\to\workspace
git clone <repo-url>
cd MMHHINVDesktopV4
```

2. Install dependencies:

```powershell
npm install
```

3. Configure Firebase keys
- Edit `src/config/firebase.js` (or set environment variables if the project supports them). Example placeholders are in the file. Ensure you use a Firestore project and enable Authentication (Email/Password) and Firestore rules. For local testing you can use the Firebase emulator.

4. Run the dev server with Electron (project provides a script):

```powershell
npm run electron-dev
```

This will run the React dev server and open the Electron shell that loads the dev URL. Check console output for dev server port and any errors.

7. Production build & packaging
--------------------------------
1. Build React app:

```powershell
npm run build
```

2. Create the distributable (Windows example):

```powershell
npm run dist
```

The `dist-out/` folder will contain packaged artifacts for distributors (e.g., installer, EXE, APPIMAGE, etc.). Check `builder-effective-config.yaml` and `package.json` scripts for platform-specific options and signing.

Notes on code signing
- To publish Windows installers, code signing is recommended and often required to avoid SmartScreen warnings. Configure code signing certificates in `package.json`/electron-builder config and CI secrets.

3. Testing the packaged app
- Unpack or run the produced installer in a clean environment or VM. The packaged app should load and connect to Firestore (if network access is permitted).

8. Firebase configuration and environment
-----------------------------------------
- File: `src/config/firebase.js` — contains the firebase config object. This file should not be committed with production secrets in a public repo.

Recommended pattern
- Use environment variables in CI to inject Firebase config at build time, or maintain a `config/local.firebase.js` that is excluded from source control.

Firestore structure (high-level)
- collections:
	- `products` — documents with fields: name, sku/code, currentStock, cost, price, category, reorderPoint, images, etc.
	- `orders` — documents with fields: date, items[], total, customer, paymentMethod, status, orderNumber, etc.
	- `users` — user profiles and role (admin/staff)
	- `settings` — app-wide settings (reorder points, default tax)

9. Backup & recovery
---------------------
Use the Firebase CLI or Google Cloud console for exports.

Export (Firestore) example:

```powershell
# Authenticate first
firebase login
# Export to a GCS bucket or local emulator path
firebase firestore:export gs://<your-bucket>/backups/mmh-inventory-$(Get-Date -Format yyyy-MM-dd)
```

To restore, use the matching `firebase firestore:import` (or use Google Cloud backup/restore tools). For local development, use the Firestore emulator to import/export local datasets.

Recommendations
- Schedule nightly exports to cloud storage.
- Keep at least 30 days of retention for backups (adjust to your policies).

10. Troubleshooting
--------------------
Common issues and fixes

1) App shows a blank screen in Electron dev
- Cause: React dev server not running or different port.
- Fix: Run `npm run electron-dev` and watch terminal for errors. Ensure no other process uses the dev port. The Electron shell is configured to attempt the dev server and fall back to `index.html`.

2) Authentication failures
- Cause: Incorrect Firebase config or disabled Authentication provider.
- Fix: Verify `src/config/firebase.js` values, ensure the Firebase project has Email/Password provider enabled in the console.

3) Reports page shows "Access Denied"
- Cause: Reports pages are restricted to Admin users. The app uses `useAuth().isAdmin()` to gate access.
- Fix: Ensure the signed-in user's role is set to `admin` in your `users` collection or via the User Management page (Admin only).

4) Exports not downloading
- Cause: Browser environment restrictions in Electron or missing handlers.
- Fix: Sales and Inventory pages implement CSV/Excel exports; if a button appears to do PDF/Print and nothing happens, those handlers are not wired for those pages (Comprehensive Report does implement PDF export).

5) Packaging fails on CI
- Cause: Missing environment variables, missing code signing credentials, or incompatible Node/Electron versions.
- Fix: Ensure build agents have the required Node version and environment variables. For Windows signing, ensure the certificate is available and referenced in electron-builder config.

11. Maintenance tasks
----------------------
- Update dependencies regularly and test in a staging environment before publishing.
- Run security audits on dependencies (npm audit) and patch high/critical vulnerabilities.
- Monitor Firestore usage (read/write quotas) to ensure you stay under limits; implement pagination and server-side filtering where relevant.

12. Security
------------
- Minimize exposed Electron IPC channels in `preload.js`; validate messages and avoid executing arbitrary commands from renderer.
- Remove admin-only operations from client-side-only checks where sensitive state changes must be validated by server rules or Cloud Functions.
- Firestore rules: enforce role-based access (e.g., only admin can write certain collections). Keep rules in `firestore.rules` at repo root and test with the emulator.

13. Developer notes & quick commands
-----------------------------------
Install deps:

```powershell
npm install
```

Run dev (React + Electron):

```powershell
npm run electron-dev
```

Build and package:

```powershell
npm run build
npm run dist
```

Run tests (if present):

```powershell
npm test
```
