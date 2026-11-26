/** Loads Malvo's official hosted widget (https://malvo.io/widget.js) and opens it. Browser only. */
interface MalvoHandle { close(): void }
interface MalvoGlobal { init(o: Record<string, unknown>): MalvoHandle }

let loading: Promise<MalvoGlobal> | null = null;
function load(): Promise<MalvoGlobal> {
  const w = window as unknown as { MalvoConnect?: MalvoGlobal };
  if (w.MalvoConnect) return Promise.resolve(w.MalvoConnect);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://malvo.io/widget.js';
    s.async = true;
    s.onload = () => (w.MalvoConnect ? resolve(w.MalvoConnect) : reject(new Error('widget')));
    s.onerror = () => { loading = null; reject(new Error('widget')); };
    document.head.appendChild(s);
  });
  return loading;
}

export async function openMalvoWidget(o: { connectToken: string; connectorId?: number | undefined; includeSandbox: boolean; onSuccess: (itemId: string) => void; onError: () => void; onClose: () => void }) {
  const M = await load();
  return M.init({
    connectToken: o.connectToken,
    language: 'pt',
    countries: ['BR'],
    includeSandbox: o.includeSandbox,
    ...(o.connectorId ? { selectedConnectorId: o.connectorId } : {}),
    onSuccess: (d: { item?: { id?: string } }) => { if (d.item?.id) o.onSuccess(d.item.id); },
    onError: () => o.onError(),
    onClose: () => o.onClose(),
  });
}
