import { describe, it, expect, vi } from 'vitest';
import { findWarmingCenters } from './geminiService';

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            models = {
                generateContent: vi.fn().mockResolvedValue({
                    text: 'invalid json }'
                })
            };
        },
        Type: {
            ARRAY: 'ARRAY',
            OBJECT: 'OBJECT',
            STRING: 'STRING',
            NUMBER: 'NUMBER'
        }
    };
});

describe('geminiService', () => {
    describe('findWarmingCenters', () => {
        it('should handle invalid JSON gracefully and return empty centers', async () => {
            // Spy on console.error to avoid spamming test output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await findWarmingCenters(40.7128, -74.0060);

            expect(result).toEqual({ centers: [], chunks: [] });
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
});
