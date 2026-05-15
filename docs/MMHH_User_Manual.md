II. USER MANUAL
(For End Users / Non-Technical Users)

Quick Start — First Run (3 minutes)
----------------------------------
If you're a store staff or admin and just installed the app, follow these three quick steps to start using the system now:

1. Open the app from the Start menu (or run the installed executable).
2. Sign in using your account. If you don't have one, ask your administrator to create it.
3. Create a product and view it in the dashboard:
	- Products → Add Product → fill Name, Category, Price, SKU, Starting stock → Save.
	- Dashboard → View stock levels and low stock alerts.

Tip: Open the Guide Manual anytime from the user menu (click your avatar in the top-right → Guide Manual).

Purpose
-------
This User Manual explains how to use the Metro Manila Hills Hardware (MMH) Inventory Desktop application for day-to-day tasks: managing products, tracking inventory levels, running reports, and basic troubleshooting.

Target audience: store staff and administrators who use the app to perform daily operations.

A. Contents of a User Manual

1. Introduction
----------------
- Name of the system: Metro Manila Hills Hardware — Inventory Desktop (MMH Inventory Desktop)
- Purpose: Manage products, inventory levels, and basic reporting from a desktop application.
- Target users: Store staff (data entry, inventory) and Admin users (management, reports, user management).

2. Getting Started
------------------
How to access the system
- Installed desktop: Open the app from the Start menu / Applications or run the installed executable.
- Portable runner for troubleshooting: If you have a development build, open the packaged binary (ask IT for the correct installer).

Login or account creation steps
- Launch the app and enter your email and password on the Login screen.
- If you are a new staff user, contact your administrator to create an account (Admins create users via the User Management page). The app does not perform self-signup unless enabled by your admin.
- If you cannot sign in, verify with your administrator that your account exists and that you are using the correct email.

3. System Requirements
----------------------
- Device: Desktop or laptop (Windows 10/11 recommended for the packaged app). The app is packaged with Electron for desktop use; a web preview may be used by developers only.
- Browser: Not required for end users — the app is a desktop application. If using a developer build, Chrome-based browser features are used.
- Internet: Required for cloud features (Firebase Authentication and Firestore). Offline use is limited and dependent on local configuration.

4. User Interface Overview
--------------------------
Main layout
- Header: top-right contains the user avatar/menu. Click the avatar to open Profile, Guide Manual, Settings, or Logout.
- Sidebar: grouped into Main (Dashboard, Guide & Manual), Inventory (Products, Categories), Reports (Reports Overview, Inventory), Management (User Management), and System (Settings).
- Main area: shows the content for the selected page (tables, forms, graphs).

Common UI elements
- Add / New buttons: create new records (Product, Category).
- Row actions: Edit (pencil), Delete (trash), Adjust Stock (inventory adjustments) accessible from lists.
- Filters and search: usually at the top of report or listing pages to restrict results by date, category, or keyword.
- Export buttons: appear on Reports and listing pages to download CSV/Excel; some pages support PDF export.

Screenshots
- Screenshots are not included in this file. To add screenshots, open the app, capture the relevant page, and add the image under the appropriate heading in the manual.

5. Basic Features (step-by-step)
--------------------------------
Products (Catalog)
- Add a product
	1. Navigate to Products → Add Product.
	2. Fill the fields: Product Name, Category, SKU/Code, Price, Unit, Starting stock (optional).
	3. Optionally set Reorder Point, Supplier, and Description.
	4. Click Save.
- Edit a product
	1. Open the product row and click Edit.
	2. Modify the fields and Save.
- Delete a product
	1. From the product list, open the actions menu and select Delete.
	2. Confirm deletion. Note: Deleting a product may be restricted to Admins.

Inventory
- Adjust stock (manual correction)
	1. Open a product and click Edit or Adjust Stock if available.
	2. Update the stock quantity or add/subtract as needed.
	3. Save to update current inventory.
- Track stock levels
	1. Use the Dashboard to see low-stock alerts.
	2. Reorder items when they fall below the reorder point.

6. Advanced Features
--------------------
Reports
- Access: Reports → choose Reports Overview or Inventory Report.
- Filters: set date range and other filters (staff, product, category) then run the report.
- Export:
	- Reports pages provide CSV/Excel/PDF export options where available.


Settings
- Access general app settings from the Settings page (visual preferences, default values).
- Only Admin users can change system-wide settings.

Search and filters
- Use the search box and column filters on lists to quickly locate items or orders.
- Combine filters (date + category + search term) to narrow results.

7. Common Tasks (examples)
--------------------------
How to reset password
- If the Login screen shows a "Forgot password" link, follow it to request a reset email.
- If no reset link is available, contact your administrator (Admin can reset user passwords via the User Management page or via Firebase console).

How to generate a report
- Navigate to Reports → choose Reports Overview / Inventory.
- Set the date range and any filters.
- Click Export or Print to download results.

8. Error Messages and Solutions
-------------------------------
Common errors
- "Access Denied" on Reports pages: you are not an Admin. Request Admin role if you need report access.
- Login fails: check email/password, Caps Lock, and contact Admin if account not found.
- Export failed / no download: try CSV export or contact support; check that the app has permission to write files on your machine.

What the user should do
- Note the exact error message and time. If it's an access/permission issue, ask an Admin to verify your role. For functional problems, collect screenshots and open a support ticket.

9. Frequently Asked Questions (FAQ)
----------------------------------
Q: Where is my manual?
A: Open the user menu (avatar top-right) → Guide Manual. The manual displayed in-app is `public/MMHH_User_Manual.md`.

Q: How do I back up data?
A: Data is stored in Firestore (cloud). Contact your admin to schedule Firestore exports; only Admins or IT can perform backups.

10. Contact Information
-----------------------
Helpdesk / Support
- For application problems or account issues, open an issue in the repository or contact the maintainers listed by your organization.
- Provide: app version, screenshot of error, your user email, and time of error to speed troubleshooting.

End of User Manual

