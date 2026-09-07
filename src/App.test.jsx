import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('App routing', () => {
  // BrowserRouter reads jsdom's window.location, which persists across tests.
  beforeEach(() => window.history.pushState({}, '', '/'));

  it('renders the landing page with both entry points', () => {
    render(<App />);
    expect(screen.getByText('THREATLOCKER')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /REQUEST SUPPORT/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AGENT LOGIN/i })).toBeInTheDocument();
  });

  it('agent login requires both fields before calling the backend', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /AGENT LOGIN/i }));
    fireEvent.click(await screen.findByRole('button', { name: /AUTHENTICATE/i }));
    await waitFor(() => expect(screen.getByText(/ALL FIELDS REQUIRED/i)).toBeInTheDocument());
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('agent login never persists the token to web storage', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ displayName: 'Agent', token: 'jwt-secret' }),
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /AGENT LOGIN/i }));
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'a' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'b' } });
    fireEvent.click(screen.getByRole('button', { name: /AUTHENTICATE/i }));
    await screen.findByText(/SUPPORT CONSOLE/i);
    expect(JSON.stringify(localStorage)).not.toContain('jwt-secret');
    expect(JSON.stringify(sessionStorage)).not.toContain('jwt-secret');
    vi.restoreAllMocks();
  });
});
