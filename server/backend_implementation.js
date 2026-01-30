const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');

const app = express();
app.use(cors()); // Critical for cross-origin requests from the web app
app.use(express.json());

// Match the Client ID used in the frontend
const CLIENT_ID = '323159573006-cgt7goaad3tsp3vf62gvligd6sg8cqq0.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

/**
 * GOOGLE AUTH VERIFICATION ENDPOINT
 * Resolves the 404 error on the Cloud Run backend.
 */
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Missing credential in request body' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        // Return structured user info as expected by LandingPage.tsx
        res.json({
            success: true,
            user: {
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            }
        });
        
        console.log(`Auth Success: ${payload.email}`);
    } catch (error) {
        console.error('Google ID Token verification failed:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid Google credential' 
        });
    }
});

/**
 * IDENTIFIER/PASSWORD FALLBACK ENDPOINT
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    // Implement production-grade auth here
    if (email && password) {
        res.json({
            user: {
                name: email.split('@')[0],
                email: email
            }
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

/**
 * REPORTS ENDPOINT (For StatusFeed)
 */
app.get('/api/reports', (req, res) => {
    // Return sample data or fetch from database
    res.json({
        reports: [
            {
                id: '1',
                type: 'OUTAGE',
                timestamp: Date.now(),
                location: { lat: 36.1627, lng: -86.7816, address: 'Downtown Nashville' },
                description: 'Transformer blew on 2nd Ave.',
                verified: true
            }
        ]
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`GridWatch Backend Service running on port ${PORT}`);
});
