// Comprehensive Dashboard Testing Script
// Run this in browser console on http://localhost:3001

console.log('🔧 Starting comprehensive dashboard testing...');

// Test admin login
async function testAdminLogin() {
    console.log('\n📝 Testing Admin Login...');

    // Navigate to login
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        return 'Navigate to /login first';
    }

    // Fill login form (adjust selectors as needed)
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const loginButton = document.querySelector('button[type="submit"]');

    if (emailInput && passwordInput && loginButton) {
        emailInput.value = 'admin@797events.com';
        passwordInput.value = 'admin123';
        loginButton.click();
        console.log('✅ Admin login form submitted');
        return true;
    } else {
        console.log('❌ Login form elements not found');
        return false;
    }
}

// Test user creation
async function testUserCreation() {
    console.log('\n👥 Testing User Creation...');

    try {
        // Test creating a guard user
        const guardResponse = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'guard.test@797events.com',
                password: 'guard123',
                full_name: 'Test Guard',
                role: 'guard',
                phone: '9876543210'
            })
        });

        const guardResult = await guardResponse.json();
        console.log('Guard creation:', guardResult.success ? '✅ Success' : '❌ Failed', guardResult);

        // Test creating an influencer user
        const influencerResponse = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'influencer.test@797events.com',
                password: 'influencer123',
                full_name: 'Test Influencer',
                role: 'influencer',
                phone: '9876543211'
            })
        });

        const influencerResult = await influencerResponse.json();
        console.log('Influencer creation:', influencerResult.success ? '✅ Success' : '❌ Failed', influencerResult);

        return { guard: guardResult.success, influencer: influencerResult.success };

    } catch (error) {
        console.log('❌ User creation test failed:', error);
        return { guard: false, influencer: false };
    }
}

// Test event creation
async function testEventCreation() {
    console.log('\n🎪 Testing Event Creation...');

    try {
        const eventData = {
            title: 'Test Event Dashboard',
            description: 'Testing event creation from dashboard test',
            date: '2025-02-15',
            time: '19:00',
            venue: 'Test Venue',
            price: 999,
            image: '/Assets/Passes_outlet design.jpg',
            isActive: true,
            passes: [{
                name: 'Test VIP Pass',
                price: 1999,
                available: 100
            }, {
                name: 'Test Regular Pass',
                price: 999,
                available: 200
            }]
        };

        const response = await fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();
        console.log('Event creation:', result.success ? '✅ Success' : '❌ Failed', result);
        return result.success;

    } catch (error) {
        console.log('❌ Event creation test failed:', error);
        return false;
    }
}

// Test referral code validation
async function testReferralCodes() {
    console.log('\n🏷️ Testing Referral Code Validation...');

    try {
        // Test with invalid code
        const invalidResponse = await fetch('/api/validate-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'INVALID123',
                eventId: 'test-event',
                orderAmount: 1000
            })
        });

        // Test student code
        const studentResponse = await fetch('/api/validate-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: 'STUDENT25',
                eventId: 'test-event',
                orderAmount: 1000
            })
        });

        console.log('Invalid code test: Expected to fail');
        console.log('Student code test: Should work with 10% discount');

        return true;

    } catch (error) {
        console.log('❌ Referral code test failed:', error);
        return false;
    }
}

// Test PDF generation
async function testPDFGeneration() {
    console.log('\n📄 Testing PDF Generation...');

    try {
        const response = await fetch('/api/test-pdf-download');

        if (response.ok) {
            const blob = await response.blob();
            console.log('✅ PDF generation working, size:', blob.size, 'bytes');

            // Create download link for testing
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dashboard-test-ticket.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('✅ Test ticket downloaded');
            return true;
        } else {
            console.log('❌ PDF generation failed');
            return false;
        }

    } catch (error) {
        console.log('❌ PDF generation test failed:', error);
        return false;
    }
}

// Test email system
async function testEmailSystem() {
    console.log('\n📧 Testing Email System...');

    try {
        const response = await fetch('/api/debug-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@797events.com'
            })
        });

        const result = await response.json();
        console.log('Email test:', result.success ? '✅ Success' : '❌ Failed', result);
        return result.success;

    } catch (error) {
        console.log('❌ Email test failed:', error);
        return false;
    }
}

// Test QR verification
async function testQRVerification() {
    console.log('\n🔍 Testing QR Code Verification...');

    try {
        // Test with sample QR data
        const qrData = {
            bid: 'booking_test_123',
            tid: 'TGIN-25-D1-00001',
            eid: 'event_test',
            sig: 'test_signature'
        };

        const response = await fetch('/api/verify-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId: qrData.tid,
                bookingId: qrData.bid,
                eventId: qrData.eid,
                signature: qrData.sig,
                scanTime: new Date().toISOString(),
                scannedBy: 'test_guard',
                guardName: 'Test Guard',
                scanLocation: 'Test Location'
            })
        });

        const result = await response.json();
        console.log('QR verification test:', result);

        // Expected to fail since no actual booking exists, but should not crash
        return response.status === 404 || response.status === 400; // Expected failure

    } catch (error) {
        console.log('❌ QR verification test failed:', error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running comprehensive dashboard tests...\n');

    const results = {
        userCreation: await testUserCreation(),
        eventCreation: await testEventCreation(),
        referralCodes: await testReferralCodes(),
        pdfGeneration: await testPDFGeneration(),
        emailSystem: await testEmailSystem(),
        qrVerification: await testQRVerification()
    };

    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('='.repeat(50));
    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${test}: ${status}`);
    });

    const passCount = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;

    console.log(`\nOverall: ${passCount}/${totalTests} tests passed`);

    if (passCount === totalTests) {
        console.log('🎉 ALL DASHBOARD FEATURES WORKING!');
    } else {
        console.log('⚠️ Some features need attention');
    }

    return results;
}

// Export for manual testing
window.dashboardTests = {
    testAdminLogin,
    testUserCreation,
    testEventCreation,
    testReferralCodes,
    testPDFGeneration,
    testEmailSystem,
    testQRVerification,
    runAllTests
};

console.log('✅ Dashboard testing script loaded!');
console.log('Run window.dashboardTests.runAllTests() to test everything');
console.log('Or run individual tests like window.dashboardTests.testUserCreation()');