# MMH Hardware Inventory Management System

A modern, desktop-based inventory management system built with React, Electron, and Material-UI for Metro Manila Hills Hardware.

## 🚀 Features

### Core Functionality
- **Full CRUD Operations**: Add, update, delete, and view products and categories
- **Inventory Management**: Track stock levels, reorder points, and product locations
- **User Role Management**: Admin and Staff permissions with different access levels
- **Real-time Dashboard**: Overview of inventory status, low stock alerts, and key metrics

### Advanced Features
- **Bulk Import/Export**: CSV and Excel file support for data management
- **Search & Filtering**: Advanced search capabilities across all entities
- **Data Visualization**: Charts and graphs for inventory analytics
- **Responsive Design**: Modern UI that works on all screen sizes

### Desktop Application Benefits
- **Offline Capability**: Works without internet connection
- **Native Performance**: Fast and responsive desktop experience
- **File System Access**: Direct import/export of files
- **System Integration**: Native menus and system notifications

## 🛠️ Technology Stack

- **Frontend**: React 18, Material-UI (MUI)
- **Desktop**: Electron 27
- **Charts**: Recharts
- **Data Grid**: MUI X Data Grid
- **Date Handling**: date-fns
- **File Operations**: xlsx for Excel support

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mmh-hardware-inventory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
```bash
# Start the React development server and Electron
npm run electron-dev
```

### 4. Production Build
```bash
# Build the application for production
npm run build

# Package the application for distribution
npm run dist
```

## 🔐 Demo Accounts

The system comes with pre-configured demo accounts:

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Permissions**: Full access to all features

### Staff Account
- **Username**: `staff`
- **Password**: `staff123`
- **Permissions**: View and edit access (no deletion)

## 📱 Application Structure

### Main Sections
1. **Dashboard** - Overview and key metrics
2. **Products** - Inventory management
3. **Categories** - Product categorization
4. **Reports** - Analytics and insights

## 🚀 Quick Start Guide

### For Developers
1. **Clone and Setup**: Follow installation steps above
2. **Development Mode**: Use `npm run electron-dev` for live development
3. **Testing**: All features work offline with local data storage

### For End Users
1. **Download**: Get the latest release from the releases page
2. **Install**: Run the installer for your operating system
3. **Login**: Use demo accounts or create your own
4. **Start Managing**: Begin adding products and managing inventory

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_APP_NAME=MMH Hardware Inventory
REACT_APP_VERSION=1.0.0
```

### Build Configuration
The application is configured for:
- **Window Size**: 1400x900 (minimum: 1200x800)
- **Security**: Context isolation enabled
- **Menu**: Custom application menu with shortcuts

## 📊 Data Management

### Local Storage
- All data is stored locally using localStorage
- Data persists between application sessions
- No external database required

### Import/Export
- **Import**: CSV and Excel files (.csv, .xlsx, .xls)
- **Export**: Data export in multiple formats
- **Bulk Operations**: Handle large datasets efficiently

## 🐛 Troubleshooting

### Common Issues & Solutions

1. **Large File Push Error**
   ```bash
   # If you encounter large file errors:
   git rm -r --cached dist-out/
   git commit -m "Remove large build files"
   git push
   ```

2. **Dependencies not installing**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Electron not starting**
   - Check Node.js version (requires 16+)
   - Ensure all dependencies are installed
   - Check for port conflicts on 3000

### Debug Mode
```bash
# Start with developer tools
npm run electron-dev
# Developer tools will open automatically
```

## 📈 Performance Optimization

- **Lazy Loading**: Components load on demand
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Data grid handles large datasets efficiently
- **Local Storage**: Fast data access without network latency

## 🔄 Updates & Version History

### Version 1.0.0
- ✅ Initial release with core inventory management
- ✅ Desktop application with Electron
- ✅ Material-UI based interface
- ✅ Local data storage
- ✅ Basic reporting and analytics

### Future Roadmap
- **v1.1**: Advanced reporting and analytics
- **v1.2**: Multi-user support and cloud sync
- **v1.3**: Mobile companion app
- **v2.0**: Advanced inventory optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 📝 Notes

- **Build Artifacts**: The `dist-out/` directory contains build outputs and is excluded from version control
- **Large Files**: Build files (`.exe`) are automatically excluded using `.gitignore`
- **Offline Mode**: Works without internet connection
- **Data Backup**: Regular exports recommended for data safety

---

**Built with ❤️ for Metro Manila Hills Hardware**

---

## Project Documentation: MMHH Inventory Desktop Application (Version 3)

### 1. Objectives:
*   To provide a robust and user-friendly desktop application for managing inventory and product categories.
*   To enable efficient tracking of products and stock levels.
*   To facilitate user authentication and authorization for secure access to inventory data.
*   To generate reports for better business insights and decision-making.
*   To offer a seamless user experience through a responsive and intuitive interface.
*   To integrate with Firebase for real-time data synchronization and authentication.

### 2. Scope:
*   **User Management:** User registration, login, logout, profile management, and role-based access control (e.g., admin, staff).
*   **Product Management:** Adding, editing, deleting, and viewing products with details such as name, description, price, stock quantity, and category.
*   **Category Management:** Creating, updating, and deleting product categories.
*   **Inventory Tracking:** Real-time updates of stock levels, low-stock alerts, and inventory adjustments.
*   **Reporting:** Generation of sales reports, inventory reports, and other custom reports to provide business insights.
*   **Notifications:** System notifications for important events like low stock.
*   **Technology Stack:** React for the frontend, Electron for desktop application wrapping, and Firebase (Firestore, Authentication, Cloud Messaging) for backend services.

### 3. Delimitations:
*   **No Offline Sync (Initial Phase):** While Electron allows for offline capabilities, the initial version might rely heavily on Firebase's real-time capabilities, meaning limited functionality without an internet connection.
*   **No Multi-Branch/Multi-Warehouse Support:** The application will focus on managing inventory for a single location or business entity.
*   **No Advanced CRM Features:** Customer relationship management features beyond basic customer details in sales orders are out of scope.
*   **No E-commerce Integration:** Direct integration with online stores or e-commerce platforms is not included.
*   **No Payment Gateway Integration:** The application will not handle direct payment processing; it will only record sales transactions.
*   **No Barcode/QR Code Scanning Integration:** While possible, advanced hardware integration for barcode or QR code scanning for inventory management is not part of the initial scope.
*   **No Complex Financial Accounting:** The reporting features will focus on inventory and sales data, not comprehensive financial accounting.

### 4. Data Flow Diagrams (DFD)
A comprehensive Data Flow Diagram (DFD) has been created to illustrate the system's data flow at both Level 0 and Level 1. This diagram details the interactions between external entities, processes, and data stores within the Metro Manila Hills Hardware Inventory Management System.

- **DFD File**: `flowcharts/dfd_updated.drawio.xml`
