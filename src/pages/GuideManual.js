import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const GuideManual = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  const manualDefault = `# MMH Hardware Inventory — User Manual

Generated: 2025-12-18

---

## Title & Version

MMH Hardware Inventory — User Manual

Version: 1.0.0

---

## Table of Contents

1. Overview
2. Installation & Setup
3. Firebase Setup
4. Running the Application
5. Features
6. Project File Structure
7. Troubleshooting
8. FAQ
9. Support & Contact
10. Appendices (Full README, Full Firebase Setup)

---

## 1. Overview

A modern, desktop-based inventory management system built with React, Electron, and Material-UI for Metro Manila Hills Hardware.

Core goals:
- Provide robust inventory and product management.
- Offer role-based access (Admin, Staff).
- Provide desktop packaging through Electron with offline capability.

Key technologies: React 18, Material-UI (MUI), Electron, Firebase (Firestore, Authentication), Recharts, MUI Data Grid.

---

## 2. Installation & Setup

### Prerequisites
- Node.js (16+)
- npm
- Git (optional, for cloning)

### Clone & Install
\`\`\`bash
git clone <repository-url>
cd mmh-hardware-inventory
npm install
\`\`\`

### Development Mode
\`\`\`bash
npm run electron-dev
\`\`\`
This runs the React dev server and launches Electron when the dev server is ready.

### Production Build
\`\`\`bash
npm run build
npm run dist
\`\`\`
This builds the React app and packages the application for distribution using electron-builder.

Environment variables (optional):
Create a \.env file with keys like:
\`\`\`
REACT_APP_APP_NAME=MMH Hardware Inventory
REACT_APP_VERSION=1.0.0
\`\`\`

---

## 3. Firebase Setup

(Full setup instructions are included in Appendix B — this section summarizes the key steps.)

1. Create a Firebase project (example project ID: \`hardwareinventory-65123\`).
2. In Firebase Console, enable Email/Password authentication.
3. Create users (admin/staff) in Authentication and add corresponding documents in \`users\` Firestore collection with \`role\` fields.
4. Create Firestore collections used by the app: \`inventory\`, \`categories\`, \`users\`, \`settings\`, \`activity\`.
5. (Optional) Update Firestore security rules to restrict write operations to admins.

Demo accounts used for testing:
- admin@mmhhardware.com / admin123 (Admin)
- staff@mmhhardware.com / staff123 (Staff)

---

## 4. Running the Application

Relevant npm scripts (available in \`package.json\`):
- \`start\` — start React in dev mode
- \`electron\` — run electron against build/dev as configured
- \`electron-dev\` — concurrently runs \`npm start\`, waits for http://localhost:3000, then opens Electron
- \`build\` — build the React app
- \`dist\` — build and package the app with electron-builder

For local development, run:
\`\`\`bash
npm install
npm run electron-dev
\`\`\`

If you see networking errors (ERR_CONNECTION_REFUSED), ensure the React dev server is running (port 3000 by default) before Electron tries to load it.

---

## 5. Features

Summary of features (from README):
- Full CRUD operations for products and categories
- Inventory tracking, low stock alerts, reorder points
- User role management (Admin/Staff)
- Bulk import/export (CSV/XLSX/PDF)
- Search and filtering
- Charts and reporting (Overview, Business, Sales, Inventory)
- Desktop packaging with offline capability

---

## 6. Project File Structure

Selected top-level folders and purpose:
- \`public/\` — static files, icons, electron.js (app shell)
- \`src/\` — React source code (components, pages, contexts, services)
- \`build/\` — compiled production build
- \`dist-out/\` — packaged app and artifacts
- \`docs/\` — generated docs (this manual)
- \`tools/\` — utility scripts

Important source files:
- \`src/config/firebase.js\` — Firebase configuration
- \`src/contexts/AuthContext.js\` — authentication state and permissions
- \`src/pages/\` — application pages (Dashboard, Products, Reports, etc.)

---

## 7. Troubleshooting

Common problems and quick fixes:

- ERR_CONNECTION_REFUSED when starting Electron in dev mode
  - Cause: Electron attempted to load the React dev server but the server wasn't running on \`http://localhost:3000\`.
  - Fix: Ensure \`npm start\` is running and reachable at \`http://localhost:3000\` before Electron launches. Use \`npm run electron-dev\` which handles the wait-on step.

- Dependencies not installing or failing
  - Fix: \`npm cache clean --force\`, remove \`node_modules\` and \`package-lock.json\`, then \`npm install\`.

- Electron fails to start
  - Ensure Node.js 16+ installed
  - Verify \`electron\` is available in \`node_modules\` and \`npm run electron-dev\` runs correctly

---

## 8. FAQ

Q: Where is my data stored?
A: Data is stored in Firestore (cloud).

Q: How do I backup data?
A: Use the Export feature (CSV/XLSX/PDF) to save a copy; keep periodic backups off-app.

Q: How do I add users?
A: Use the app's User Management page (Admin only) or Firebase Console.

---

## 9. Support & Contact

For help:
- Open an issue on the repository
- Contact the project developers

---

## 10. Appendices

### Appendix A — Full README (excerpt)

(For full README, see \`README.md\` in the project root.)

> The project README includes detailed installation steps, features, quick start guide, demo accounts, and troubleshooting tips.

### Appendix B — Full Firebase Setup (excerpt)

(For the full Firebase setup guide, see \`FIREBASE_SETUP.md\` in the project root.)

---

End of manual.`;

  useEffect(() => {
    const fetchMd = async () => {
      try {
        const res = await fetch('/MMHH_User_Manual.md');
        if (!res.ok) throw new Error('Could not load manual');
        const text = await res.text();
        setMarkdown(text);
      } catch (err) {
        // fallback to embedded manual content
        setMarkdown(manualDefault);
      } finally {
        setLoading(false);
      }
    };
    fetchMd();
  }, []);

  const exportToPdf = async () => {
    if (!contentRef.current) return;

    const input = contentRef.current;

    // Use html2canvas to render the element
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    // A4 size in mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Canvas size in px
    const imgProps = {
      width: canvas.width,
      height: canvas.height,
    };

    // Convert px to mm at 96dpi: 1px = 0.264583 mm approx
    const pxToMm = (px) => (px * 0.264583);

    const imgWidthMm = pxToMm(imgProps.width);
    const imgHeightMm = pxToMm(imgProps.height);

    // Fit image width to PDF width with margin
    const margin = 10; // mm
    const usablePdfWidth = pdfWidth - margin * 2;
    const scale = usablePdfWidth / imgWidthMm;
    const scaledImgHeight = imgHeightMm * scale;

    // If the image fits on one page, just add it. Otherwise split into pages.
    if (scaledImgHeight <= pdfHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, usablePdfWidth, scaledImgHeight);
    } else {
      // Calculate the height of the portion of the image that fits per page (in px)
      const pageHeightMm = pdfHeight - margin * 2;
      const pageHeightPx = Math.round((pageHeightMm / pxToMm(1)) / scale);

      let remainingHeightPx = imgProps.height;
      let offsetY = 0;

      while (remainingHeightPx > 0) {
        const canvasPage = document.createElement('canvas');
        canvasPage.width = imgProps.width;
        canvasPage.height = Math.min(pageHeightPx, remainingHeightPx);

        const ctx = canvasPage.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasPage.width, canvasPage.height);
        ctx.drawImage(canvas, 0, offsetY, canvasPage.width, canvasPage.height, 0, 0, canvasPage.width, canvasPage.height);

        const imgPageData = canvasPage.toDataURL('image/png');
        const imgPageHeightMm = pxToMm(canvasPage.height) * scale;

        pdf.addImage(imgPageData, 'PNG', margin, margin, usablePdfWidth, imgPageHeightMm);

        remainingHeightPx -= canvasPage.height;
        offsetY += canvasPage.height;

        if (remainingHeightPx > 0) pdf.addPage();
      }
    }

    pdf.save('MMHH_User_Manual.pdf');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">User Manual</Typography>
        <Box>
          <Button variant="contained" color="primary" onClick={exportToPdf} sx={{ mr: 1 }}>
            Export to PDF
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Box
          ref={contentRef}
          sx={{ p: 2, bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}
          id="manual-content"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </Box>
      )}
    </Box>
  );
};

export default GuideManual;
