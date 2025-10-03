/* eslint-disable no-console */
import { CallbackStore } from '../callbacks';

describe('CallbackStore', () => {
  describe('getCallbacks', () => {
    it('should return the callbacks for the given name', () => {
      const store = new CallbackStore();

      const callbacks = [
        (time: number) => console.log('time', time),
      ];

      store.storeCallback('event:timeupdate', callbacks[0]);
      store.storeCallback('event:volume', (volume: number) => console.log('volume', volume));

      expect(store.getCallbacks('event:timeupdate')).toEqual(callbacks);
    });

    it('should return an empty array if the name does not have callbacks', () => {
      const store = new CallbackStore();

      store.storeCallback('event:timeupdate', (time: number) => console.log('time', time));
      store.storeCallback('event:volume', (volume: number) => console.log('volume', volume));

      expect(store.getCallbacks('does-not-exist')).toEqual([]);
    });
  });

  describe('removeCallback', () => {
    it('should remove the callback when the callback is defined', () => {
      const store = new CallbackStore();

      const callback1 = (time: number) => console.log('time', time);
      const callback2 = (volume: number) => console.log('volume', volume);

      store.storeCallback('event:timeupdate', callback1);
      store.storeCallback('event:timeupdate', callback2);

      store.removeCallback('event:timeupdate', callback1);

      expect(store.getCallbacks('event:timeupdate')).toEqual([
        callback2,
      ]);
    });

    it('should remove all the callbacks when no callback is passed', () => {
      const store = new CallbackStore();

      const callback1 = (time: number) => console.log('time', time);
      const callback2 = (volume: number) => console.log('volume', volume);

      store.storeCallback('event:timeupdate', callback1);
      store.storeCallback('event:timeupdate', callback2);

      store.removeCallback('event:timeupdate');

      expect(store.getCallbacks('event:timeupdate')).toEqual([]);
    });

    it('should empty the map when the removed callback is the last one for the said event', () => {
      const store = new CallbackStore();

      const callback1 = (time: number) => console.log('time', time);

      store.storeCallback('event:timeupdate', callback1);

      store.removeCallback('event:timeupdate', callback1);

      expect(store.getCallbacks('event:timeupdate')).toEqual([]);
    });
  });

  describe('shiftCallback', () => {
    it('should return undefined if no callbacks are available for the name', () => {
      const store = new CallbackStore();
      const callback = store.shiftCallback('event:timeupdate');

      expect(callback).toBeUndefined();
    });

    it('should remove and return the first available callback', () => {
      const store = new CallbackStore();

      const spy = jest.spyOn(store, 'removeCallback');

      const callback1 = (time: number) => console.log('time', time);
      const callback2 = (volume: number) => console.log('volume', volume);

      store.storeCallback('event:timeupdate', callback1);
      store.storeCallback('event:timeupdate', callback2);

      const callback = store.shiftCallback('event:timeupdate');

      expect(callback).toEqual(callback);
      expect(spy).toHaveBeenCalledWith('event:timeupdate', callback1);
    });
  });

  describe('storeCallback', () => {
    it('should add a new callback to an empty map', () => {
      const store = new CallbackStore();
      const callback1 = (time: number) => console.log('time', time);

      store.storeCallback('event:timeupdate', callback1);

      expect(store.getCallbacks('event:timeupdate')).toEqual([
        callback1,
      ]);
    });

    it('should add the new callback to an existing map', () => {
      const store = new CallbackStore();
      const callback1 = (time: number) => console.log('time', time);
      const callback2 = (volume: number) => console.log('volume', volume);

      store.storeCallback('event:timeupdate', callback1);
      store.storeCallback('event:timeupdate', callback2);

      expect(store.getCallbacks('event:timeupdate')).toEqual([
        callback1,
        callback2,
      ]);
    });
  });
});
