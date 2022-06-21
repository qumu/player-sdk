/**
 * Parses a message received from postMessage.
 *
 * @param data The data received from postMessage.
 */
export function parseMessageData<T>(data: string | T): T {
  if (typeof data === 'string') {
    try {
      // eslint-disable-next-line no-param-reassign
      data = JSON.parse(data);
    } catch (error) {
      return {} as T;
    }
  }

  return data as T;
}
