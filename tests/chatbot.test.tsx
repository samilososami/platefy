import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('restaurant images', () => {
  it('renders a dish attachment returned by the verified transport', async () => {
    vi.mocked(generateReply).mockImplementationOnce(async (_messages, _locale, _signal, _progress, _thinking, onImages) => {
      onImages?.([{ id: 'edamame', nombre: 'Edamame', src: '/restaurantes/ko/images/edamame.webp', alt: 'Cuenco de edamame' }]);
      return 'Aquí tienes Edamame.';
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Enséñame el edamame' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    const photo = await screen.findByRole('img', { name: 'Cuenco de edamame' });
    expect(photo.getAttribute('src')).toBe('/restaurantes/ko/images/edamame.webp');
    expect(photo.closest('a')?.getAttribute('href')).toBe('/restaurantes/ko/#edamame');
    expect(screen.queryByRole('button', { name: 'Razonar más' })).toBeNull();
    await waitFor(() => expect(generateReply).toHaveBeenCalledOnce());
  });

  it('renders compact recommendation lists with emphasized dish names', async () => {
    vi.mocked(generateReply).mockResolvedValueOnce('- **Nigiri de salmón** — 3,50 € · fresco.\n- **Edamame** — 4,50 € · ligero.');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '¿Qué me recomiendas?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    expect(screen.getByText('Nigiri de salmón').tagName).toBe('STRONG');
  });
});
