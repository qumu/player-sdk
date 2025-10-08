import { parseMessageData } from '../functions';

describe('functions', () => {
  describe('parseMessageData', () => {
    it('should parse the string if data is a string', () => {
      const spy = jest.spyOn(JSON, 'parse');

      const data = parseMessageData(JSON.stringify({
        foo: 'bar',
      }));

      expect(spy).toHaveBeenCalled();
      expect(data).toEqual({
        foo: 'bar',
      });
    });

    it('should return an empty object if data is an non parsable string', () => {
      // mock the console.error used in parseMessageData()
      console.error = jest.fn();
      const data = parseMessageData('to');

      expect(data).toEqual({});
    });

    it('should directly return the object if data is an object', () => {
      const spy = jest.spyOn(JSON, 'parse');

      const data = parseMessageData({
        foo: 'bar',
      });

      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual({
        foo: 'bar',
      });
    });
  });
});
