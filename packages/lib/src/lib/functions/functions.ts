/**
 * Parses a message received from postMessage.
 *
 * @param data The data received from postMessage.
 */
export function parseMessageData<T>(data: unknown): T {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as T;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse message data:', error);

      return {} as T;
    }
  }

  return data as T;
}
