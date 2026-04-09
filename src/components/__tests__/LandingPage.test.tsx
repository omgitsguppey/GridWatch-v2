import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LandingPage } from '../LandingPage';

describe('LandingPage', () => {
  const mockOnLogin = vi.fn();
  const mockOnAdminLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const setup = () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<LandingPage onLogin={mockOnLogin} onAdminLogin={mockOnAdminLogin} />);
    return { user };
  };

  it('calls onAdminLogin with correct user data on successful login', async () => {
    const { user } = setup();

    const mockResponse = { user: { name: 'Test User', email: 'test@example.com' } };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const emailInput = screen.getByPlaceholderText('name@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /continue/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnAdminLogin).toHaveBeenCalledWith(mockResponse.user);
    });
  });

  it('shows error message on 401 Unauthorized', async () => {
    const { user } = setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Custom invalid login details.' }),
    });

    const emailInput = screen.getByPlaceholderText('name@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /continue/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Custom invalid login details.')).toBeInTheDocument();
    });
  });

  it('handles network failure, sets offline mode, and logs in as guest after timeout', async () => {
    const { user } = setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network Error'));

    const emailInput = screen.getByPlaceholderText('name@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /continue/i });

    await user.type(emailInput, 'guest@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Verify offline message
    await waitFor(() => {
      expect(screen.getByText('Server is busy. Continuing as a guest...')).toBeInTheDocument();
      expect(screen.getByText('Entering Offline Mode')).toBeInTheDocument();
    });

    expect(mockOnAdminLogin).not.toHaveBeenCalled();

    // Advance time to trigger guest login timeout
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(mockOnAdminLogin).toHaveBeenCalledWith({
        name: 'guest',
        email: 'guest@example.com',
      });
    });
  });
});
