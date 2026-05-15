# 🔥 Firebase Setup Guide for MMH Hardware Inventory

This guide will help you set up Firebase for your MMH Hardware Inventory Management System.

## 📋 Prerequisites

1. **Firebase Project**: You already have a Firebase project set up
2. **Node.js**: Version 16 or higher
3. **npm**: Package manager

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

Your Firebase configuration is already set up in `src/config/firebase.js` with your project details:

- **Project ID**: `hardwareinventory-65123`
- **Auth Domain**: `hardwareinventory-65123.firebaseapp.com`
- **Storage Bucket**: `hardwareinventory-65123.firebasestorage.app`

### 3. Firebase Console Setup

#### Authentication Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hardwareinventory-65123`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. Go to **Users** tab and add these demo users:

**Admin User:**
- Email: `admin@mmhhardware.com`
- Password: `admin123`
- Role: Admin (full access)

**Staff User:**
- Email: `staff@mmhhardware.com`
- Password: `staff123`
- Role: Staff (limited access)

#### Firestore Database Setup
1. Go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to Philippines)
5. Create the following collections:

**Collections to create:**
- `users` - User profiles and permissions
- `products` - Inventory products
- `categories` - Product categories

#### Security Rules (Optional)
For production, you can set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Inventory data - authenticated users can read, admins can write
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🔐 User Management

### Creating Users via Firebase Console
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password
4. Go to **Firestore** → `users` collection
5. Create a document with the user's UID
6. Add user data:

```json
{
  "name": "Administrator",
  "email": "admin@mmhhardware.com",
  "role": "admin",
  "permissions": ["all"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### User Roles and Permissions

**Admin Role:**
- Full access to all features
- Can create, edit, delete any data
- User management
- System settings

**Staff Role:**
- View and edit access
- Cannot delete data
- Limited to inventory operations

## 📊 Initial Data Setup

The system includes a utility to set up initial sample data:

```javascript
import { setupInitialData } from './src/utils/firebaseSetup';

// Run this once to populate your database
await setupInitialData();
```

This will create:
- 5 product categories
- 3 sample products

## 🧪 Testing the Setup

### 1. Start the Application
```bash
npm run electron-dev
```

### 2. Login with Demo Accounts
- **Admin**: `admin@mmhhardware.com` / `admin123`
- **Staff**: `staff@mmhhardware.com` / `staff123`

### 3. Verify Data Loading
- Check if products and categories load
- Try adding a new product
- Verify real-time updates

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Firebase project ID matches
   - Check if Email/Password auth is enabled
   - Ensure user exists in Firebase Console

2. **Data Not Loading**
   - Check Firestore database exists
   - Verify collection names match exactly
   - Check browser console for errors

3. **Permission Denied**
   - Verify Firestore security rules
   - Check user role and permissions
   - Ensure user document exists in `users` collection

### Debug Mode
Enable debug logging in the browser console:

```javascript
// In browser console
localStorage.setItem('debug', 'firebase:*');
```

## 📱 Production Considerations

### Security
1. Set up proper Firestore security rules
2. Enable Firebase App Check
3. Use environment variables for sensitive config
4. Implement proper user role validation

### Performance
1. Enable Firestore offline persistence
2. Implement data pagination for large datasets
3. Use Firestore indexes for complex queries
4. Enable Firebase Performance Monitoring

### Monitoring
1. Set up Firebase Analytics
2. Configure error reporting
3. Monitor database usage and costs
4. Set up alerts for unusual activity

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify Firebase project configuration
3. Check Firestore database permissions
4. Review authentication setup
5. Contact the development team

## 🔄 Next Steps

After successful setup:

1. **Customize Data**: Modify sample data to match your business
2. **User Management**: Add your actual staff members
3. **Categories**: Adjust product categories for your inventory
4. **Products**: Import your actual product catalog

---

**🎯 Your MMH Hardware Inventory System is now powered by Firebase!**

Enjoy real-time data synchronization, secure authentication, and scalable cloud storage for your inventory management needs.
