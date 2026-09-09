import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Chatbot from '../src/Chatbot';
import { prepareKnowledge, generateReply } from '../src/services/ai';
import pica from '../public/demos/pica-pica/menu.json';
import type { RestaurantKnowledge } from '../src/services/restaurant';

vi.mock('../src/services/ai', async original => ({ ...await original<object>(), prepareKnowledge: vi.fn(), generateReply: vi.fn() }));
const knowledge = { identity: 'platefy', menu: pica } as RestaurantKnowledge;
beforeEach(() => {
  window.history.replaceState({}, '', '/demo/chat/?restaurant=pica-pica');
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  Element.prototype.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); window.history.replaceState({}, '', '/'); });

describe('embedded demo readiness', () => {
  it('waits for the tenant menu before marking ready, then opens that menu without a restaurant page', async () => {
    const notify = vi.spyOn(window.parent, 'postMessage');
    let resolve!: (value: RestaurantKnowledge) => void;
    vi.mocked(prepareKnowledge).mockReturnValue(new Promise(done => { resolve = done; }));
    render(<Chatbot locale="es" onLocaleChange={vi.fn()} embedded />);
    expect(notify.mock.calls.some(([data]) => data.type === 'platefy:ready')).toBe(false);
    await act(async () => { resolve(knowledge); });
    expect(notify).toHaveBeenCalledWith({ type: 'platefy:ready', restaurant: 'pica-pica' }, location.origin);
    expect(screen.getByRole('heading', { name: 'Pica Pica' })).toBeTruthy();
    expect(screen.queryByText('Pica Pica · platefy')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nueva conversación' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ver la carta', exact: true }));
    expect(screen.getByRole('dialog').textContent).toContain('Patates braves');
    expect(screen.queryByRole('link', { name: 'Volver a la carta' })).toBeNull();
    expect(generateReply).not.toHaveBeenCalled();
  });

  it('reports menu failure to the chooser instead of claiming a usable empty chat', async () => {
    const notify = vi.spyOn(window.parent, 'postMessage');
    vi.mocked(prepareKnowledge).mockRejectedValue(new Error('menu unavailable'));
    render(<Chatbot locale="es" onLocaleChange={vi.fn()} embedded />);
    await waitFor(() => expect(notify).toHaveBeenCalledWith({ type: 'platefy:error', restaurant: 'pica-pica' }, location.origin));
    expect(notify.mock.calls.some(([data]) => data.type === 'platefy:ready')).toBe(false);
  });

  it('cancels an active generation when its verified parent pauses the old demo', async () => {
    vi.mocked(prepareKnowledge).mockResolvedValue(knowledge);
    let signal: AbortSignal | undefined;
    vi.mocked(generateReply).mockImplementation((_messages, _locale, abortSignal) => { signal = abortSignal; return new Promise(() => {}); });
    render(<Chatbot locale="es" onLocaleChange={vi.fn()} embedded />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '¿Cuánto cuestan las bravas?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    await waitFor(() => expect(signal).toBeDefined());
    act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://untrusted.example', source: window.parent, data: { type: 'platefy:pause' } })));
    expect(signal?.aborted).toBe(false);
    act(() => window.dispatchEvent(new MessageEvent('message', { origin: location.origin, source: window.parent, data: { type: 'platefy:pause' } })));
    expect(signal?.aborted).toBe(true);
  });
});
