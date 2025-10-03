# Multisoft E-commerce Platform - AI Coding Instructions

## Architecture Overview

This is a full-stack e-commerce platform with:
- **Frontend**: React 19 + Vite + TailwindCSS + React Router (SellingWebsite/)
- **Backend**: Node.js + Express + MongoDB + JWT auth (Server/)
- **Deployment**: GitHub Pages frontend, Render backend

## Key Architectural Patterns

### 1. Authentication & Authorization System
The platform uses a sophisticated permission-based auth system:

- **Client-side**: `AuthContext.jsx` provides `useAuth()` hook with methods like `hasPermission()`, `isAdmin()`
- **Server-side**: JWT tokens + role-based middleware (`auth.js`, `adminAuth.js`)
- **Route Protection**: `ProtectedRoute.jsx` component wraps admin routes with `adminOnly={true}`
- **Permission System**: Users have arrays of specific permissions like `['manage_users', 'manage_products']`

**When working with auth:**
- Always check permissions with `hasPermission('specific_permission')` not just `isAdmin()`
- Use `AuthContext` methods: `isAuthenticated()`, `isLoggedIn()`, `isAdmin()`
- Admin routes must be wrapped in `<ProtectedRoute adminOnly={true}>`

### 2. API Integration Pattern
Centralized API configuration in `src/config/api.js`:

```javascript
// Use predefined endpoints
import { API_ENDPOINTS, apiHelpers } from '../config/api.js';
const response = await apiHelpers.get(API_ENDPOINTS.DEVICES.FEATURED);
```

**Critical conventions:**
- All API calls use the centralized `api` axios instance with auto-token injection
- Endpoints are organized in `API_ENDPOINTS` object by domain (AUTH, DEVICES, CATEGORIES, etc.)
- Use `apiHelpers.uploadFile()` for file uploads with FormData
- Base URL switches between localhost:3000 (dev) and render.com (prod)

### 3. Component Structure & Layouts
- **Dual Layouts**: `Layout.jsx` (public) and `AdminLayout.jsx` (admin dashboard)
- **Nested Routing**: Admin routes are deeply nested (e.g., `/admin/devices/edit/:id`)
- **Device Components**: Specialized components in `components/Device/` for product pages
- **Page Organization**: Admin pages mirror the URL structure in `Pages/Admin/`

### 4. Database Models & Patterns
**Device Model** (`Server/src/models/Device.js`):
- Dual specification system: `basicSpecs[]` (product cards) + `detailedSpecs[]` (full pages)
- Auto-migration from old `specifications` format on save
- Virtual fields: `discountedPrice`, `stockStatus`, `primaryImage`
- Complex indexing for search and performance

**User Model** (`Server/src/models/User.js`):
- Login attempt tracking with account locking
- Permission arrays with role-based defaults
- Public JSON method excludes sensitive fields
- Extensive validation and security features

## Development Workflows

### Frontend Development
```bash
cd SellingWebsite/
npm run dev    # Starts Vite dev server on localhost:5173
npm run build  # Builds for GitHub Pages with /Microsoft/ base path
```

### Backend Development
```bash
cd Server/
npm run dev    # Nodemon on localhost:3000
npm start      # Production mode
```

### Key Environment Variables
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Token signing
- `SUPER_ADMIN_SECRET` - For creating first admin user
- Frontend: Uses hardcoded render.com URL in production

## Project-Specific Conventions

### 1. File Naming & Organization
- Component files use PascalCase: `DeviceCard.jsx`
- Pages mirror route structure: `Pages/Admin/Devices/AddDevice.jsx`
- API routes follow RESTful patterns: `/api/devices/:id`
- Models use singular names: `Device.js`, `User.js`

### 2. State Management
- **Auth State**: Managed by `AuthContext` - never duplicate auth logic
- **Local State**: Components use `useState` for form data, loading states
- **API State**: No global state management - fetch data in components/pages

### 3. Styling Patterns
- **TailwindCSS**: All styling through utility classes
- **Custom Animations**: Defined in `tailwind.config.js` (slide-left, slide-right, etc.)
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Loading States**: Consistent spinner pattern with purple-600 color

### 4. Error Handling
- **Server**: Standardized JSON responses with `{ success: boolean, message: string }`
- **Client**: API interceptors handle 401s by redirecting to login
- **Forms**: Show error messages below inputs, success messages at top

### 5. Routing Conventions
- **Slugs**: Products/categories use slug-based routes (`/product/:slug`)
- **Admin Nesting**: Deep nesting reflects UI hierarchy
- **Protected Routes**: Wrap entire admin section, not individual pages

## Common Tasks & Patterns

### Adding New Admin Features
1. Create page component in `Pages/Admin/`
2. Add route to `App.jsx` under admin section
3. Create corresponding API route in `Server/src/Routes/`
4. Add permission check using `hasPermission('manage_feature')`

### Working with Products/Devices
- Use `basicSpecs` for card displays, `detailedSpecs` for full pages
- Always populate category: `await Device.findById(id).populate('category')`
- Handle image arrays with `primaryImage` virtual field
- Use device slug for SEO-friendly URLs

### User Management
- Check `isActive` status before operations
- Use `toPublicJSON()` method to exclude sensitive data
- Permission updates require admin role validation
- Support both role-based and permission-based access

## Integration Points
- **MongoDB**: Mongoose ODM with complex schemas and virtuals
- **AWS S3**: Media uploads through dedicated routes
- **JWT**: Stateless authentication with 7-day expiry
- **GitHub Pages**: Static site deployment with base path configuration
- **Render**: Backend hosting with environment variable management

Remember: This platform prioritizes security (permission-based access), performance (indexed queries), and maintainability (centralized patterns). Always follow the established patterns for consistency.