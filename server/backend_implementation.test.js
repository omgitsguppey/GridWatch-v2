const request = require('supertest');

const mockVerifyIdToken = jest.fn();

// Mock google-auth-library before requiring the app
jest.mock('google-auth-library', () => {
    return {
        OAuth2Client: jest.fn().mockImplementation(() => {
            return {
                verifyIdToken: mockVerifyIdToken
            };
        })
    };
});

const app = require('./backend_implementation.js');

describe('Auth Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/google', () => {
        it('should return 401 Unauthorized for an invalid ID token', async () => {
            // Arrange: simulate throwing an error on invalid token
            mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

            // Act
            const response = await request(app)
                .post('/api/auth/google')
                .send({ credential: 'invalid_token_123' });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid Google credential'
            });
            expect(mockVerifyIdToken).toHaveBeenCalledWith({
                idToken: 'invalid_token_123',
                audience: '323159573006-cgt7goaad3tsp3vf62gvligd6sg8cqq0.apps.googleusercontent.com'
            });
        });
    });
});
