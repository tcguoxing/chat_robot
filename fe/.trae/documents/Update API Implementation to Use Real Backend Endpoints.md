## Update API Implementation to Use Real Backend Endpoints

### Overview
I will update the `api/index.ts` file to use real backend APIs based on the `swagger.json` specification. This involves updating TypeScript interfaces, removing mock implementations, and implementing real API calls using the existing axios request tool.

### Step 1: Update TypeScript Interfaces
- Align `LoginRequest`, `RegisterRequest`, and response interfaces with swagger definitions
- Update `RegisterRequest` to match `RegisterUserDto` schema (remove confirmPassword, add required fields)
- Update `LoginResponse` to match swagger's `LoginResponse` schema
- Update `ApiResponse` type to match swagger definition

### Step 2: Remove Mock Implementations
- Delete all mock implementation code (delay functions, mock data, console logs)
- Remove commented-out real API examples

### Step 3: Implement Real API Calls
- **Login API**: POST `/users/login` for email/password login
- **Register API**: POST `/users/register` with inviteCode
- **Get Current User**: GET `/users/me` for user info
- **Get All Users**: GET `/users` for other users list
- **Get User by ID**: GET `/users/{id}` for single user info
- **Update User**: PUT `/users/{id}` for updating user info

### Step 4: Update Content-Related APIs
- Note: swagger.json doesn't include content-related endpoints (getContentApi, uploadContentApi, etc.)
- Keep these functions but update to use proper TypeScript types
- Mark them as TODO for future implementation when backend endpoints are available

### Step 5: Ensure Proper Error Handling
- Leverage the existing axios interceptors for error handling
- Ensure all API functions return proper Promise types
- Add proper type assertions for API responses

### Expected Changes
- Updated `src/api/index.ts` with real API implementations
- TypeScript interfaces aligned with swagger definitions
- Removed mock data and mock delay functions
- Properly implemented API calls using the axios request tool
- Maintained backward compatibility with existing components

This update will ensure the frontend application uses the real backend APIs as specified in the swagger documentation, while maintaining type safety and proper error handling.