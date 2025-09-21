/**
 * Test simple des endpoints backend
 */

const API_BASE = 'http://localhost:8000/api';

async function testEndpoints() {
    console.log('🔍 Test des endpoints backend...\n');

    try {
        // 1. Login
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bruno@taaazzz.be',
                password: '@51008473@'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;

        // 2. Test profile
        console.log('2. Test /auth/profile...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileResponse.json();
        console.log('Profile response:', JSON.stringify(profileData, null, 2));

        // 3. Test badges utilisateur
        console.log('\n3. Test /users/me/badges...');
        const badgesResponse = await fetch(`${API_BASE}/users/me/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (badgesResponse.ok) {
            const badgesData = await badgesResponse.json();
            console.log('Badges response:', JSON.stringify(badgesData, null, 2));
        } else {
            console.log('Badges response error:', badgesResponse.status, await badgesResponse.text());
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testEndpoints();