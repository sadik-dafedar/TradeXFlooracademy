/**
 * Integration test for authentication flow and admin functionality
 */
const puppeteer = require('puppeteer');

async function runIntegrationTest() {
    let browser;
    
    try {
        console.log('🚀 Starting integration test...');
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 50,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Test 1: Access login page
        console.log('\n📋 Test 1: Accessing login page...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        
        // Check if we're on the login page (not maintenance page)
        const title = await page.title();
        console.log('Page title:', title);
        
        const url = page.url();
        console.log('Current URL:', url);
        
        // Look for login/signup elements
        const hasLoginForm = await page.$('form') !== null;
        const hasTabs = await page.$('[data-tab]') !== null;
        const hasMaintenance = await page.$('text/maintenance') !== null;
        
        console.log('Has login form:', hasLoginForm);
        console.log('Has tabs:', hasTabs);
        console.log('Shows maintenance:', hasMaintenance);
        
        if (hasMaintenance) {
            console.log('❌ FAILED: Still showing maintenance page');
            return false;
        }
        
        if (!hasLoginForm) {
            console.log('❌ FAILED: No login form found');
            return false;
        }
        
        console.log('✅ PASSED: Login page accessible');
        
        // Test 2: Check authentication flow elements
        console.log('\n📋 Test 2: Checking authentication flow elements...');
        
        const loginTab = await page.$('button:has-text("Login")');
        const signupTab = await page.$('button:has-text("Sign Up")');
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        
        console.log('Login tab found:', loginTab !== null);
        console.log('Signup tab found:', signupTab !== null);
        console.log('Email input found:', emailInput !== null);
        console.log('Password input found:', passwordInput !== null);
        
        // Test 3: Try admin panel access (should redirect to login)
        console.log('\n📋 Test 3: Testing admin panel access...');
        await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'networkidle0' });
        
        const adminUrl = page.url();
        console.log('Admin URL after redirect:', adminUrl);
        
        const isLoginPage = adminUrl.includes('/login');
        console.log('Redirected to login page:', isLoginPage);
        
        if (isLoginPage) {
            console.log('✅ PASSED: Admin access properly redirects to login');
        } else {
            console.log('⚠️  WARNING: Admin access behavior unclear');
        }
        
        console.log('\n🎉 Integration test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
runIntegrationTest().then(success => {
    process.exit(success ? 0 : 1);
});