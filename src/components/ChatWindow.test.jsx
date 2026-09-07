import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWindow from './ChatWindow';

function fakeConnection(overrides = {}) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    invoke: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const baseProps = {
  sessionId: 'sess-1',
  senderName: 'Ada',
  senderRole: 'customer',
  onClose: vi.fn(),
};

describe('ChatWindow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the composer and registers hub listeners', () => {
    const conn = fakeConnection();
    render(<ChatWindow {...baseProps} connection={conn} />);
    expect(screen.getByPlaceholderText(/TYPE YOUR MESSAGE/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SEND/i })).toBeInTheDocument();
    // ReceiveMessage / UserTyping / AgentJoined / SessionClosed
    expect(conn.on).toHaveBeenCalled();
  });

  it('sends a message via SendMessage and clears the input on success', async () => {
    const conn = fakeConnection();
    render(<ChatWindow {...baseProps} connection={conn} />);
    const input = screen.getByPlaceholderText(/TYPE YOUR MESSAGE/i);
    fireEvent.change(input, { target: { value: 'hello agent' } });
    fireEvent.click(screen.getByRole('button', { name: /SEND/i }));
    await waitFor(() =>
      expect(conn.invoke).toHaveBeenCalledWith('SendMessage', 'sess-1', 'Ada', 'hello agent', 'customer')
    );
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('keeps the text and surfaces an error when the send fails', async () => {
    const conn = fakeConnection({
      invoke: vi.fn().mockImplementation((method) =>
        method === 'SendMessage' ? Promise.reject(new Error('offline')) : Promise.resolve()
      ),
    });
    render(<ChatWindow {...baseProps} connection={conn} />);
    const input = screen.getByPlaceholderText(/TYPE YOUR MESSAGE/i);
    fireEvent.change(input, { target: { value: 'will fail' } });
    fireEvent.click(screen.getByRole('button', { name: /SEND/i }));
    await waitFor(() => expect(screen.getByText(/MESSAGE FAILED TO SEND/i)).toBeInTheDocument());
    expect(input.value).toBe('will fail');
  });

  it('does not throw when connection is briefly null', () => {
    expect(() => render(<ChatWindow {...baseProps} connection={null} />)).not.toThrow();
  });
});
