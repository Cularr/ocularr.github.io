import { JsonObject } from '../DemoTypes';

const RECORD_SEPARATOR = '\u001e';

const PING_INTERVAL = 12000;

const HANDSHAKE_WAIT = 1000;

type SignalRAction = 'sync' | 'created' | 'updated' | 'deleted';

let pending: string[] = [];

let waiting: ((body: string) => void) | null = null;

let isConnected = false;

function flush() {
  if (waiting && pending.length) {
    const resolve = waiting;
    const body = pending.join('');

    waiting = null;
    pending = [];
    resolve(body);
  }
}

function push(frame: object) {
  const json = JSON.stringify(frame, (_key, value: unknown) =>
    value === null ? undefined : value
  );

  pending.push(`${json}${RECORD_SEPARATOR}`);
  flush();
}

function send(name: string, body: JsonObject) {
  if (!isConnected) {
    return;
  }

  push({
    type: 1,
    target: 'receiveMessage',
    arguments: [{ name, body, version: 5 }],
  });
}

export function broadcast(
  name: string,
  action: SignalRAction,
  resource?: JsonObject
) {
  send(name, { action, resource });
}

export function broadcastVersion(version: string) {
  send('version', { version });
}

export function negotiate() {
  isConnected = false;
  pending = [];

  if (waiting) {
    const resolve = waiting;

    waiting = null;
    resolve('');
  }

  return {
    connectionId: 'demo',
    connectionToken: 'demo',
    negotiateVersion: 1,
    availableTransports: [
      { transport: 'LongPolling', transferFormats: ['Text'] },
    ],
  };
}

export function receive(body: string) {
  if (body.includes('"protocol"')) {
    pending.unshift(`{}${RECORD_SEPARATOR}`);
    isConnected = true;
    flush();
  }
}

export function poll(signal?: AbortSignal | null) {
  return new Promise<string>((resolve, reject) => {
    if (pending.length) {
      const body = pending.join('');

      pending = [];
      resolve(body);

      return;
    }

    const handler = (body: string) => {
      window.clearTimeout(timeout);
      resolve(body);
    };

    const timeout = window.setTimeout(
      () => {
        if (waiting === handler) {
          waiting = null;
        }

        resolve(isConnected ? `{"type":6}${RECORD_SEPARATOR}` : '');
      },
      isConnected ? PING_INTERVAL : HANDSHAKE_WAIT
    );

    waiting = handler;

    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeout);

        if (waiting === handler) {
          waiting = null;
        }

        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}
