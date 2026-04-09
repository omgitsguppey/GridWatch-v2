import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findWarmingCenters } from './geminiService';
import { GoogleGenAI } from '@google/genai';

vi.mock('@google/genai', () => {
    const mockGenerateContent = vi.fn();
    return {
        GoogleGenAI: vi.fn().mockImplementation(function() {
            return {
                models: {
                    generateContent: mockGenerateContent
                }
            };
        }),
        Type: { ARRAY: 'ARRAY', OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER' },
        Modality: { AUDIO: 'AUDIO' }
    };
});

describe('geminiService', () => {
    describe('findWarmingCenters', () => {
        let consoleErrorSpy: any;

        beforeEach(() => {
            vi.clearAllMocks();
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('should correctly parse valid JSON response and return warming centers', async () => {
            const mockCenters = [
                { name: 'Center 1', address: '123 Main St', status: 'OPEN', latitude: 40.7128, longitude: -74.0060 }
            ];

            const mockInstance = new GoogleGenAI({ apiKey: 'test' });
            (mockInstance.models.generateContent as any).mockResolvedValue({
                text: JSON.stringify(mockCenters)
            });

            const result = await findWarmingCenters(40.7128, -74.0060);

            expect(mockInstance.models.generateContent).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'gemini-3-flash-preview',
                    contents: expect.stringContaining('Find open public services like warming centers')
                })
            );

            expect(result).toEqual({ centers: mockCenters, chunks: [] });
        });

        it('should handle invalid JSON response gracefully by catching the error and returning an empty array', async () => {
            const mockInstance = new GoogleGenAI({ apiKey: 'test' });
            (mockInstance.models.generateContent as any).mockResolvedValue({
                text: 'invalid json'
            });

            const result = await findWarmingCenters(40.7128, -74.0060);

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(result).toEqual({ centers: [], chunks: [] });
        });

        it('should handle empty or undefined text response by returning an empty array', async () => {
            const mockInstance = new GoogleGenAI({ apiKey: 'test' });
            (mockInstance.models.generateContent as any).mockResolvedValue({
                text: undefined
            });

            const result = await findWarmingCenters(40.7128, -74.0060);

            expect(result).toEqual({ centers: [], chunks: [] });
        });
    });
});
