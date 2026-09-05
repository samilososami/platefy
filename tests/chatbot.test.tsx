import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Chatbot from '../src/Chatbot';
import { generateReply } from '../src/services/ai';
vi.mock('../src/services/ai', async importOriginal => ({ ...await importOriginal<object>(), generateReply: vi.fn() }));
class Recognition {
  static current: Recognition;
  lang = ''; continuous = false; interimResults = false;
  onstart: null | (() => void) = null;
  onend: null | (() => void) = null;
  onerror: null | ((event: { error: string }) => void) = null;
  onresult: null | ((event: { results: { 0: { transcript: string } }[] }) => void) = null;
  start = vi.fn(); stop = vi.fn(); abort = vi.fn();
  constructor() { Recognition.current = this; }
}
beforeEach(() => {
  vi.stubGlobal('SpeechRecognition', Recognition);
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  Element.prototype.scrollTo = vi.fn();
  render(<Chatbot locale="es" onLocaleChange={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Tomar asiento' }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('microphone lifecycle', () => {
  it('shows permission pending until native capture starts, then restores the draft on cancellation', () => {
    const input = screen.getByRole('textbox', { name: 'Tu mensaje' });
    fireEvent.change(input, { target: { value: 'Mi borrador' } });
    fireEvent.click(screen.getByRole('button', { name: 'Hablar con Platefy' }));
    expect(screen.getByText('Esperando permiso de micrófono…')).toBeTruthy();
    expect(screen.queryByText('Te escucho…')).toBeNull();
    act(() => Recognition.current.onstart?.());
    expect(screen.getByText('Te escucho…')).toBeTruthy();
    act(() => Recognition.current.onresult?.({ results: [{ 0: { transcript: 'Una mesa' } }] }));
    expect((input as HTMLTextAreaElement).value).toBe('Una mesa');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect((input as HTMLTextAreaElement).value).toBe('Mi borrador');
    expect(screen.queryByText('Te escucho…')).toBeNull();
    expect(Recognition.current.abort).toHaveBeenCalledOnce();
  });
  it('ignores late native events even if abort throws while permission is pending', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Hablar con Platefy' }));
    const lateStart = Recognition.current.onstart;
    Recognition.current.abort.mockImplementation(() => { throw new Error('Inactive capture'); });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    act(() => lateStart?.());
    expect(screen.queryByText('Esperando permiso de micrófono…')).toBeNull();
    expect(screen.queryByText('Te escucho…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Hablar con Platefy' })).toBeTruthy();
    expect(Recognition.current.stop).toHaveBeenCalledOnce();
  });
  it('makes denial recoverable without fabricating speech', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Hablar con Platefy' }));
    act(() => Recognition.current.onerror?.({ error: 'not-allowed' }));
    expect(screen.getByRole('alert').textContent).toContain('No se ha permitido el micrófono');
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByText('Esperando permiso de micrófono…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Hablar con Platefy' })).toBeTruthy();
  });
  it('rejects blank input without invoking a model', () => {
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect((screen.getByRole('button', { name: 'Enviar mensaje' }) as HTMLButtonElement).disabled).toBe(true);
    expect(generateReply).not.toHaveBeenCalled();
  });
});
