# Authentication Flow Test Plan

## Fixed Issues Summary
1. ✅ Removed duplicate login page display
2. ✅ Consolidated login and signup functionality into single page with tabs
3. ✅ Proper email existence checking before allowing login
4. ✅ Fixed OTP flow to work correctly after email verification
5. ✅ Maintained cyber-themed interface while fixing backend authentication flow

## Test Cases to Verify

### 1. Login Flow Tests
- [ ] Navigate to `/login` - Should show unified login page
- [ ] Click on "signup" tab - Should switch to signup form
- [ ] Click on "login" tab - Should switch back to login form
- [ ] Enter non-existent email and click "Generate OTP Link" - Should show error
- [ ] Enter existing email and click "Generate OTP Link" - Should proceed to OTP step
- [ ] Enter invalid OTP format - Should show validation error
- [ ] Enter valid OTP - Should login successfully and redirect to dashboard

### 2. Signup Flow Tests
- [ ] Switch to signup tab
- [ ] Submit empty form - Should show validation errors
- [ ] Enter valid signup data - Should create account successfully
- [ ] Try to signup with existing email - Should show "email already registered" error
- [ ] Try to signup with existing username - Should show "username taken" error
- [ ] Successful signup should switch to login tab with email pre-filled

### 3. Edge Case Tests
- [ ] Try to access `/signup` directly - Should redirect to `/login?tab=signup`
- [ ] Logged-in user accessing login page - Should redirect to home
- [ ] Invalid OTP attempts - Should show appropriate error messages
- [ ] Rate limiting - Should prevent too many requests

### 4. UI/UX Tests
- [ ] Tab switching animations work smoothly
- [ ] Form validation errors display properly
- [ ] Loading states show during API calls
- [ ] Cyber-themed styling is maintained
- [ ] Responsive design works on mobile/desktop

## Manual Testing Steps

1. Open the preview browser
2. Navigate to http://localhost:3000/login
3. Verify the unified authentication page loads correctly
4. Test switching between login and signup tabs
5. Test the complete login flow with a test account
6. Test the complete signup flow
7. Verify error handling works properly
8. Check that the cyber-themed UI is preserved

## Expected Behavior

### Login Tab:
- Initial state: Shows email input field
- After entering email: Sends OTP and shows OTP input field
- After entering OTP: Authenticates user and redirects to dashboard

### Signup Tab:
- Shows registration form with name, username, email, password
- Validates all fields before submission
- Creates account and switches to login tab with email pre-filled

### Error Handling:
- Clear error messages for all failure cases
- Proper validation for email format, password strength, etc.
- Rate limiting prevents abuse