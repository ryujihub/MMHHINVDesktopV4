II. USER MANUAL
(For End Users / Non-Technical Users)

Quick Start — First Run (3 minutes)
----------------------------------
If you're a store staff or admin and just installed the app, follow these three quick steps to start using the system now:

1. Open the app from the Start menu (or run the installed executable).
2. Sign in using your account. If you don't have one, ask your administrator to create it.
3. Create a product and make a test sales order:
	- Products → Add Product → fill Name, Category, Price, SKU, Starting stock → Save.
	- Sales Orders → New Order → add product, set quantity → Save.

Tip: Open the Guide Manual anytime from the user menu (click your avatar in the top-right → Guide Manual).

Purpose
-------
This User Manual explains how to use the Metro Manila Hills Hardware (MMH) Inventory Desktop application for day-to-day tasks: managing products, processing sales orders, running reports, and basic troubleshooting.

Target audience: store staff and administrators who use the app to perform daily operations.

A. Contents of a User Manual

1. Introduction
----------------
- Name of the system: Metro Manila Hills Hardware — Inventory Desktop (MMH Inventory Desktop)
- Purpose: Manage products, inventory levels, sales orders, and basic reporting from a desktop application.
- Target users: Store staff (data entry, sales) and Admin users (management, reports, user management).

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
- Sidebar: left side contains navigation to Dashboard, Products, Categories, Sales Orders, Reports, Settings, and User Management (Admin only).
- Main area: shows the content for the selected page (tables, forms, graphs).

Common UI elements
- Add / New buttons: create new records (Product, Order).
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
	1. Open a product and click Adjust Stock.
	2. Enter the adjustment amount and reason (stocktake, damage, correction).
	3. Save. The adjustment is recorded in the stock movement history.
- Stocktake (count)
	1. Use the Inventory page to record counted quantities for items.
	2. Submit or save adjustments to reconcile system stock with counted stock.

Sales Orders
- Create a new sales order
	1. Navigate to Sales Orders → New Order.
	2. Add customer details (name, phone, delivery address) or select a walk-in customer.
	3. Add products by searching name or SKU, set quantities, and apply discounts if needed.
	4. Set payment status (Paid / Pending) and fulfillment status (Pending / Fulfilled).
	5. Save the order and print or export an invoice if needed.
- Process a return
	1. Locate the original order and choose Create Return.
	2. Select items being returned, update quantities, and process refund or store credit as required.

6. Advanced Features
--------------------
Reports
- Access: Reports → choose Sales, Inventory, or Full Business (Comprehensive) report.
- Filters: set date range and other filters (staff, product, category) then run the report.
- Export:
	- Sales and Inventory pages provide CSV/Excel export buttons (Export Excel / Export Report).
	- The Comprehensive Report includes a PDF export (produced via the app's exporter).
	- Note: Some PDF/Print buttons shown on Sales/Inventory pages may be placeholders and not wired; use CSV export if PDF does not work.

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
- Navigate to Reports → choose Sales / Inventory / Comprehensive.
- Set the date range and any filters.
- Click Run (or View) and then click Export to download results (CSV or PDF depending on the page).

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

Q: Can I print invoices?
A: The Sales Orders page shows Print/Export options. Use Export to generate a PDF or CSV; if Print does not work, export and print the file from your system.

10. Contact Information
-----------------------
Helpdesk / Support
- For application problems or account issues, open an issue in the repository or contact the maintainers listed by your organization.
- Provide: app version, screenshot of error, your user email, and time of error to speed troubleshooting.

End of User Manual

