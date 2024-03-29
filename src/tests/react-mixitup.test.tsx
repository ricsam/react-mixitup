import React from 'react';
import { create } from 'react-test-renderer';
import { ReactMixitup } from '../react-mixitup';
import { Example } from './Example';

it('can render in react-dom', () => {
  create(
    <Example
      keys={[1, 2, 3]}
      options={{
        dynamicDirection: 'vertical',
        transitionDuration: 1000
      }}
    />
  );
});
describe('prop tests', () => {
  let origConsoleError: typeof console.error;
  beforeEach(() => {
    origConsoleError = console.error;
    // disable console.error as react-dom uses it to print stuff on error
    console.error = () => {};
  });
  afterEach(() => {
    console.error = origConsoleError.bind(console);
  });
  it('should throw if no keys', () => {
    expect(() => {
      create(
        <ReactMixitup
          keys={(undefined as unknown) as number[]}
          renderCell={() => null}
          dynamicDirection="off"
          transitionDuration={1}
        />
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Invalid keys: keys must be provided"`);
  });
  it('should throw if keys are not unique', () => {
    expect(() => {
      create(
        <ReactMixitup
          keys={[1, 2, 3, 3, 3]}
          renderCell={() => null}
          dynamicDirection="off"
          transitionDuration={1}
        />
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Invalid keys: every key must be unique"`);
  });
  it('should throw if transitionDuration is lt 0', () => {
    expect(() => {
      create(
        <ReactMixitup
          keys={[1, 2, 3]}
          renderCell={() => null}
          dynamicDirection="off"
          transitionDuration={-100}
        />
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Invalid transitionDuration: transition duration must be a number > 0"`
    );
  });
  it('should throw if renderCell is not a function', () => {
    expect(() => {
      create(
        <ReactMixitup
          keys={[1, 2, 3]}
          renderCell={undefined as any}
          dynamicDirection="off"
          transitionDuration={100}
        />
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Invalid renderCell: must be a function"`);
  });
  it('should throw if renderWrapper is not a function', () => {
    expect(() => {
      create(
        <ReactMixitup
          keys={[1, 2, 3]}
          renderCell={() => null}
          renderWrapper={(123 as unknown) as () => null}
          dynamicDirection="off"
          transitionDuration={100}
        />
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Invalid renderWrapper: must be a function"`);
  });
  it('should throw if debugMeasure is a truthy but not a number', () => {
    expect(() => {
      create(
        <ReactMixitup
          keys={[1, 2, 3]}
          renderCell={() => null}
          dynamicDirection="off"
          transitionDuration={100}
          debugMeasure={('hello' as unknown) as number}
        />
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Invalid debugMeasure: must be a number"`);
  });
});
