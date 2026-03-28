import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import * as googleAuthLibrary from 'google-auth-library';
import { app, CLIENT_ID } from './backend_implementation.js';

describe('POST /api/auth/google', () => {
    let verifySpy;

    beforeEach(() => {
        vi.clearAllMocks();
        // Since backend_implementation.js already has a created instance,
        // mocking the prototype is the best way to intercept calls for that instance.
        verifySpy = vi.spyOn(googleAuthLibrary.OAuth2Client.prototype, 'verifyIdToken');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return 400 if credential is missing in request body', async () => {
        const response = await request(app)
            .post('/api/auth/google')
            .send({}); // Empty body

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Missing credential in request body' });
    });

    it('should return 200 and user info on successful verification', async () => {
        const fakePayload = {
            name: 'Test User',
            email: 'test@example.com',
            picture: 'http://example.com/pic.jpg'
        };

        // Mock verifyIdToken to return a successful ticket
        verifySpy.mockResolvedValueOnce({
            getPayload: () => fakePayload
        });

        const response = await request(app)
            .post('/api/auth/google')
            .send({ credential: 'valid_fake_token' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            user: {
                name: fakePayload.name,
                email: fakePayload.email,
                picture: fakePayload.picture
            }
        });

        // Verify that verifyIdToken was called with the correct arguments
        expect(verifySpy).toHaveBeenCalledWith({
            idToken: 'valid_fake_token',
            audience: CLIENT_ID
        });
    });

    it('should return 401 if Google ID Token verification fails', async () => {
        // Mock verifyIdToken to throw an error
        verifySpy.mockRejectedValueOnce(new Error('Invalid token'));

        // Silence console.error for this test to avoid polluting test output
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const response = await request(app)
            .post('/api/auth/google')
            .send({ credential: 'invalid_fake_token' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: 'Invalid Google credential'
        });
    });
});
