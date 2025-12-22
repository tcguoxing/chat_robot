# Implementation Plan for Axios Request Tool

## 1. Installation
- Install axios library and its TypeScript types
- Update package.json with new dependencies

## 2. Create `request.ts` File Structure

### 2.1 Basic Configuration
- Create axios instance with configurable base URL
- Set default timeout and headers
- Support for different environments

### 2.2 Type Definitions
- Define request and response interfaces
- Create generic types for API responses
- Support for cancel tokens

### 2.3 Interceptors
- **Request Interceptor**: Add authentication tokens, set common headers
- **Response Interceptor**: Handle common errors, transform response data

### 2.4 HTTP Methods
- Implement GET, POST, PUT, DELETE methods with generic types
- Support for request cancellation
- Handle different content types (JSON, FormData)

### 2.5 Error Handling
- Unified error handling for network errors, server errors, etc.
- Clear error messages for user feedback

### 2.6 Request Cancellation
- Implement cancel token generation
- Support for cancelling ongoing requests
- Avoid memory leaks

## 3. Update `index.ts` to Use New Request Tool
- Import the request instance
- Refactor existing API calls to use the new tool
- Ensure TypeScript compatibility

## 4. Testing
- Verify all HTTP methods work correctly
- Test error handling
- Validate request cancellation
- Ensure TypeScript type checking passes

## 5. Configuration Options
- Support for environment-specific base URLs
- Configurable timeout settings
- Custom headers support
- Authentication token management

This plan will create a robust, type-safe axios request tool that meets all the specified requirements, allowing for easy integration with the existing API structure.