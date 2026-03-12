# File Management System - Complete Implementation Guide

## Overview

A comprehensive file management system with strict file-level access control for the Project and Team Lead Management application. Supports uploading, organizing, sharing, and managing files securely with role-based permissions.

---

## Features

### ✅ Core Functionality

- **File Upload**: Upload PDF, PNG, JPG, JPEG, DOCX (max 50MB)
- **Cloudinary Integration**: Secure cloud storage for all files
- **File Metadata**: Name, category, tags, description
- **Access Control**: File-level permissions for granular access
- **File Search**: Full-text search by name, tags, category
- **File Operations**: Replace, edit metadata, delete
- **Role-based Permissions**: Admin, Team Lead, Member access levels

### ✅ File-Level Access Control

```
Admin:
  ✓ Full access to all files
  ✓ Can grant/revoke access
  ✓ Can delete, replace, edit files
  
Team Lead:
  ✓ Can upload files
  ✓ Can replace/edit own files
  ✓ Can view files with permission
  ✗ Cannot change permissions
  
Member:
  ✓ Can only access granted files
  ✓ Can view/download
  ✗ Cannot delete/upload/replace
```

---

## Database Schema

### Files Collection

```javascript
{
  _id: ObjectId,
  file_name: String,              // User-provided name
  file_url: String,              // Cloudinary secure URL
  cloudinary_public_id: String,  // For deletion/replacement
  cloudinary_resource_type: String, // 'image', 'video', 'raw', 'auto'
  file_size: Number,             // In bytes
  file_type: String,             // 'pdf', 'png', 'jpg', 'jpeg', 'docx'
  category_id: ObjectId,         // Reference to Category
  tags: [String],                // Array of tags
  uploaded_by: ObjectId,         // Reference to User
  upload_date: Date,             // Date uploaded
  upload_time: String,           // HH:MM:SS format
  description: String,           // Optional description
  is_active: Boolean,            // Soft delete flag
  created_at: Date,
  updated_at: Date
}
```

### Categories Collection

```javascript
{
  _id: ObjectId,
  category_name: String,  // Unique category name
  description: String,    // Optional description
  created_by: ObjectId,   // Reference to User
  created_at: Date
}
```

### FilePermissions Collection

```javascript
{
  _id: ObjectId,
  file_id: ObjectId,         // Reference to File
  user_id: ObjectId,         // Reference to User (UNIQUE per file)
  permission_type: String,   // 'view', 'download', 'edit', 'delete'
  granted_by: ObjectId,      // Reference to User (who gave access)
  granted_at: Date
}
```

---

## API Endpoints

### Files API

#### Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- file_name: String (required)
- category_id: String (optional)
- tags: String (comma-separated, optional)
- access_members: JSON array of user IDs (optional)

Response: { success, data: File, message }
```

#### Get All Files (with access control)
```
GET /api/files

Response: { success, count, data: File[] }

Access Logic:
- Admin: All files
- Team Lead: Their files + files with permission
- Member: Only files with permission
```

#### Search Files
```
GET /api/files/search?query=name&category_id=xxx&tags=tag1,tag2&uploaded_by=xxx

Response: { success, count, data: File[] }
```

#### Update File Metadata
```
PUT /api/files/:id
Body: { file_name, category_id, tags, description }

Response: { success, data: File, message }
```

#### Replace File
```
POST /api/files/:id/replace
Content-Type: multipart/form-data

Body: { file: File }

Response: { success, data: File, message }
```

#### Delete File
```
DELETE /api/files/:id

Response: { success, message }
```

#### Grant Access (Admin Only)
```
POST /api/files/:id/grant-access
Body: { user_id: String }

Response: { success, data: Permission, message }
```

#### Revoke Access (Admin Only)
```
DELETE /api/files/:id/revoke-access/:user_id

Response: { success, message }
```

### Categories API

#### Get All Categories
```
GET /api/categories

Response: { success, count, data: Category[] }
```

#### Create Category
```
POST /api/categories
Body: { category_name, description }

Response: { success, data: Category, message }
```

#### Update Category
```
PUT /api/categories/:id
Body: { category_name, description }

Response: { success, data: Category, message }
```

#### Delete Category
```
DELETE /api/categories/:id

Response: { success, message }
```

---

## Frontend Components

### FileUpload Component

**Location**: `client/src/components/files/FileUpload.jsx`

Modal dialog for uploading files with:
- File selection (drag & drop, click)
- File name input
- Category selection/creation
- Tags input (comma-separated)
- Multi-select member access
- Auto-grant access to: uploader, admins, team leads

**Props**:
```javascript
{
  isOpen: Boolean,
  onClose: () => void,
  onSuccess: () => void
}
```

### FileManagement Page

**Location**: `client/src/pages/FileManagement.jsx`

Main file management dashboard with:
- Upload button
- Search bar (real-time)
- Category filter dropdown
- Tags filter dropdown
- File table with metadata
- Action menu (download, delete)
- Loading states and error handling

**Features**:
- Responsive design (mobile-friendly)
- File icons by type (📄 PDF, 🖼️ Image, 📝 DOCX)
- Inline file preview/download
- Bulk tag extraction
- Results counter

---

## Frontend API Service

```javascript
// filesAPI
filesAPI.getAll(params)           // Fetch files with access control
filesAPI.upload(formData)          // Upload new file
filesAPI.search(params)            // Search with filters
filesAPI.update(id, data)          // Update metadata
filesAPI.replace(id, formData)     // Replace file
filesAPI.delete(id)                // Delete file
filesAPI.grantAccess(id, {user_id}) // Admin: grant access
filesAPI.revokeAccess(id, userId)  // Admin: revoke access

// categoriesAPI
categoriesAPI.getAll()             // Fetch all categories
categoriesAPI.create(data)         // Create new category
categoriesAPI.update(id, data)     // Update category
categoriesAPI.delete(id)           // Delete category
```

---

## Access Control Logic

### File Fetch Logic

```javascript
if (user.role === 'admin') {
  // Admin sees all files
  return ALL_FILES;
} else if (user.role === 'team_lead') {
  // Team lead sees:
  // 1. Files they uploaded
  // 2. Files they have permission for
  return files WHERE uploaded_by = user OR user in FilePermissions
} else {
  // Member sees only files with explicit permission
  return files WHERE user in FilePermissions
}
```

### Permission Grant Logic

```javascript
// On upload:
- Grant 'edit' to uploader
- Grant 'edit' to all admins
- Grant 'edit' to team lead of user's team
- Grant 'view' to selected members

// Admin can later:
- Revoke any permission
- Grant new permissions
```

---

## Security Features

✅ **File-Level Access Control**: Enforced on every API call
✅ **Role-Based Permissions**: Admin, Team Lead, Member
✅ **File Type Validation**: Only allowed types (PDF, Images, DOCX)
✅ **File Size Limit**: Maximum 50MB per file
✅ **Cloudinary Integration**: Secure cloud storage
✅ **Public ID Tracking**: For safe file replacement/deletion
✅ **Soft Delete Support**: `is_active` flag for soft deletes

---

## Implementation Steps

### 1. Backend Setup

```bash
# Create uploads directory (for temporary files)
mkdir uploads

# Install cloudinary package
npm install cloudinary

# Configure .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Initialize Cloudinary in Index.js

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

### 3. Add Routes to App Router

In `client/src/App.jsx`, add file management page route:

```javascript
import FileManagement from './pages/FileManagement';

// Inside routes array
{ path: '/files', element: <ProtectedRoute><FileManagement /></ProtectedRoute> }
```

### 4. Add to Navigation

Add link in header/sidebar navigation:
```javascript
{ label: 'File Manager', path: '/files', icon: FileIcon }
```

---

## Usage Examples

### Upload a File

```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('file_name', 'Meeting Notes');
formData.append('category_id', '507f1f77bcf86cd799439011');
formData.append('tags', 'important,meeting');
formData.append('access_members', JSON.stringify(['user1_id', 'user2_id']));

await filesAPI.upload(formData);
```

### Search Files

```javascript
// Search by name and filter by category
await filesAPI.search({
  query: 'budget',
  category_id: 'category_id',
  tags: 'important'
});
```

### Grant Access (Admin)

```javascript
await filesAPI.grantAccess(fileId, { user_id: memberId });
```

---

## Error Handling

All API endpoints return standard response format:

```javascript
{
  success: Boolean,
  message: String,
  data: Object|Array|null,
  error: String|null
}
```

Errors include:
- 400: Invalid file type, missing required fields
- 403: Permission denied
- 404: File/Category not found
- 500: Server error

---

## File Size and Type Validation

**Allowed File Types**:
- PDF: `application/pdf`
- PNG: `image/png`
- JPG/JPEG: `image/jpeg`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Size Limit**: 50MB (configurable in multer config)

---

## Best Practices

1. **Always validate file types** on both frontend and backend
2. **Implement file size limits** to prevent storage abuse
3. **Use Cloudinary public IDs** for safe file replacement
4. **Log file operations** for audit trail
5. **Soft delete files** instead of hard delete (set `is_active = false`)
6. **Index frequently searched fields** (file_name, tags, category_id)
7. **Cleanup temp files** after Cloudinary upload
8. **Validate user permissions** before every operation

---

## Future Enhancements

1. **File Versioning**: Keep history of replaced files
2. **Bulk Operations**: Upload/download/delete multiple files
3. **Comments**: Add file-level comments and discussions
4. **Expiration**: Automatic file deletion after X days
5. **Sharing Links**: Generate shareable links with expiration
6. **File Preview**: In-browser preview for images/PDFs
7. **Virus Scanning**: Integrate antivirus API
8. **Compression**: Auto-compress images during upload
9. **Audit Log**: Track all file access/modifications
10. **Archive**: Move old files to cheaper storage

---

## Troubleshooting

### Files Not Visible

**Check**:
- User has permission in FilePermissions collection
- File `is_active = true`
- User role is admin/team_lead or has explicit permission

### Upload Fails

**Check**:
- Cloudinary credentials configured
- File type is allowed
- File size < 50MB
- `/uploads` directory exists and writable

### Search Not Working

**Check**:
- Text indexes exist on files collection
- Search query format is correct
- Category/tag filters are valid IDs

---

## Support

For issues or questions about the File Management System, refer to:
- Backend Controller: `server/src/controllers/fileController.js`
- Frontend Components: `client/src/components/files/`
- API Routes: `server/src/routes/fileRoutes.js`

