import { get, omit, range, shuffle, uniq } from 'lodash';
import React from 'react';
import renderer, { act, create } from 'react-test-renderer';
import { render } from '@testing-library/react';
import {
  DOMLevel,
  ICellStyle,
  IFrame,
  IWrapperStyle,
  ReactMixitup,
  StageType,
  TEST_COMPONENT_UPDATE_DELAY
} from '../react-mixitup';
import * as utils from '../utils';
import assert from 'assert';

type Options = {
  dynamicDirection: 'off' | 'horizontal' | 'vertical';
  disableTransition?: boolean;
  debugMeasure?: number;
  transitionDuration: number;
  reMeasureAllPreviousFramesOnNewKeys?: boolean;
};

const Example = ({ keys, options }: { keys: number[]; options: Options }) => {
  return (
    <ReactMixitup
      keys={keys}
      dynamicDirection={options.dynamicDirection}
      disableTransition={options.disableTransition}
      debugMeasure={options.debugMeasure}
      transitionDuration={options.transitionDuration}
      reMeasureAllPreviousFramesOnNewKeys={options.reMeasureAllPreviousFramesOnNewKeys}
      renderCell={(key, style, ref, stage, frame) => (
        <div
          key={key}
          ref={ref}
          style={style}
          id="cell"
          data-stage={stage}
          data-key={key}
          data-frame-id={frame.id}
        >
          {key}
        </div>
      )}
      renderWrapper={(style, ref, cells, stage, frame) => (
        <div ref={ref} style={style} id="wrapper" data-stage={stage} data-frame-id={frame.id}>
          {cells}
        </div>
      )}
    />
  );
};
let mockGenName: jest.SpyInstance<IFrame, [(string | number)[]]>;

beforeEach(() => {
  let i = 0;
  const origCreateFrame = utils.createFrame;
  mockGenName = jest.spyOn(utils, 'createFrame').mockImplementation(keys => {
    const orig = origCreateFrame(keys);
    return {
      ...orig,
      id: String(++i)
    };
  });
});

afterEach(() => {
  mockGenName.mockRestore();
});

type ElementProps =
  | {
      style: ICellStyle;
      id: 'cell';
      'data-stage': StageType;
      'data-key': string;
      'data-frame-id': string;
    }
  | {
      style: IWrapperStyle;
      id: 'wrapper';
      'data-stage': StageType;
    };

type Root =
  | {
      type: string;
      props: ElementProps;
      children: Root[];
    }
  | Root[];

type KeysStore = { [k: string]: number[] };

const createRoot = (keys: KeysStore, options: Options) => {
  return create(<Example keys={keys['1']} options={options} />, {
    createNodeMock: element => {
      if (element.props.id === 'cell') {
        const key = element.props['data-key'];
        const stage = element.props['data-stage'];
        const frameId = element.props['data-frame-id'];
        return {
          offsetLeft: keys[frameId].indexOf(key),
          offsetTop: 0
        };
      }
      if (element.props.id === 'wrapper') {
        const frameId = element.props['data-frame-id'];
        if (options.dynamicDirection === 'horizontal') {
          return {
            offsetHeight: 1,
            offsetWidth: keys[frameId].length
          };
        }
        return {
          offsetHeight: keys[frameId].length,
          offsetWidth: 1
        };
      }
      return null;
    }
  });
};

const getChildrenProps = (root: Root, getter: string[] | string) => {
  assert(!Array.isArray(root));
  return root.children.map((child: any) => {
    return get(child.props, getter);
  });
};

const expectChildrenOrdering = (root: Root, children: string) => {
  expect(
    // expect keys to be 1,2,3
    // expect stage to be stale
    getChildrenProps(root, ['data-key']).join()
  ).toBe(children);
};

const expectStaleCellStyles = (root: Root, keys: KeysStore, frameId: string) => {
  expect(
    // expect each transition to be off
    // expect transform to be off
    // expect stage to be stale
    getChildrenProps(root, ['style'])
  ).toEqual(
    range(keys[frameId].length).map(() => ({ transition: '0s 0s all ease', transform: 'none' }))
  );
};

const expectStaleWrapperStyles = (root: Root) => {
  assert(!Array.isArray(root));
  expect(
    // stale wrapper should not have any style
    root.props.style
  ).toEqual({});
};

const expectStaleStage = (root: Root, keys: KeysStore, frameId: string) => {
  assert(!Array.isArray(root));

  expect(root.props.id).toBe('wrapper');

  assert(!Array.isArray(root.children[0]));
  expect(root.children[0].props).toEqual(
    expect.objectContaining({
      id: 'cell',
      'data-frame-id': frameId,
      'data-key': keys[frameId][0],
      'data-stage': 'STALE',
      style: {
        transform: 'none',
        transition: '0s 0s all ease'
      }
    })
  );

  expectChildrenOrdering(root, keys[frameId].join());

  expectStaleCellStyles(root, keys, frameId);
  expectStaleWrapperStyles(root);

  // save snapshot as well
  expect(root).toMatchSnapshot();
};

const expectMeasureWrapperStyles = (root: Root, options: Options) => {
  assert(!Array.isArray(root));
  expect(
    // stale wrapper should not have any style
    root.props.style
  ).toEqual(
    options.debugMeasure
      ? { position: 'absolute' }
      : {
          position: 'absolute',
          visibility: 'hidden',
          zIndex: -1
        }
  );
};

const expectMeasureStage = (root: Root, keys: KeysStore, frameId: string, options: Options) => {
  assert(!Array.isArray(root));

  expect(root.props['data-stage']).toBe(StageType.MEASURE);

  // measure should render each cell with stale styles
  expectStaleCellStyles(root, keys, frameId);

  // expect measure wrapper to be position absolute and hidden
  expectMeasureWrapperStyles(root, options);
};

const expectAnimationCellStyles = (
  root: Root,
  keysStore: KeysStore,
  frameId: string,
  stage: StageType.ANIMATE | StageType.COMMIT,
  options: Options
) => {
  // should only be one element now
  assert(!Array.isArray(root));

  // width should be set during commit
  if (options.dynamicDirection === 'off') {
    expect(root.props.style).toEqual({});
  } else {
    expect(root.props.style).toEqual({
      [options.dynamicDirection === 'horizontal' ? 'width' : 'height']: keysStore[
        Number(frameId) - (stage === StageType.COMMIT ? 1 : 0)
      ].length
    });
  }

  const frames = Object.values(keysStore);

  root.children.forEach((child, index) => {
    assert(!Array.isArray(child));
    const key = Number(child.props['data-key']);

    let includedFrames: number[][] = [];
    for (let i = 0; i < frames.length; i += 1) {
      if (frames[i].includes(key)) {
        includedFrames.push(frames[i]);
      }
      if (String(i + 1) === frameId) {
        break;
      }
    }

    let diff =
      includedFrames[includedFrames.length - 1].indexOf(key) - includedFrames[0].indexOf(key);
    let scale = 1;

    if (includedFrames.length === 1) {
      // appearing for first time
      if (stage === StageType.ANIMATE) {
        scale = 1;
      } else {
        // scale from 0 -> 1 when going from COMMIT -> ANIMATE
        scale = 0;
      }
    }

    if (!keysStore[frameId].includes(key)) {
      if (stage === StageType.ANIMATE) {
        scale = 0;
      } else {
        // scale from 1 -> 0 when going from COMMIT -> ANIMATE
        scale = 1;
      }
    }

    expect(child.props.style).toEqual({
      transform: `translate3d(${diff}px,0px,0px) scale(${scale})`
    });
  });
};

const expectCommitStage = (root: Root, keys: KeysStore, frameId: string, options: Options) => {
  // should only be one element now
  assert(!Array.isArray(root));

  expect(root.props['id']).toBe('wrapper');
  expect(root.props['data-stage']).toBe(StageType.COMMIT);
  expectAnimationCellStyles(root, keys, frameId, StageType.COMMIT, options);
};
const expectAnimationStage = (root: Root, keys: KeysStore, frameId: string, options: Options) => {
  assert(!Array.isArray(root));

  expect(root.props['id']).toBe('wrapper');
  expect(root.props['data-stage']).toBe(StageType.ANIMATE);
  expectAnimationCellStyles(root, keys, frameId, StageType.ANIMATE, options);
};

const withFakeTimers = (
  keys: KeysStore,
  options: Options,
  cb: (_root: renderer.ReactTestRenderer) => void
) => {
  const _root: renderer.ReactTestRenderer = createRoot(keys, options);
  jest.useFakeTimers();
  const spy = jest.spyOn(global, 'setTimeout');
  cb(_root);
  jest.useRealTimers();
  spy.mockRestore();
};

const expectFullCycleToWork = (
  _root: renderer.ReactTestRenderer,
  keys: KeysStore,
  options: Options
) => {
  expect(setTimeout).toHaveBeenCalledTimes(0);
  let root: Root;
  root = _root.toJSON() as Root;

  expectStaleStage(root, keys, '1');

  // Update keys, move to measure stage and a new frame
  act(() => {
    _root.update(<Example keys={keys['2']} options={options} />);
  });
  if (options.dynamicDirection === 'off') {
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), options.transitionDuration);
  } else {
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
  }

  root = _root.toJSON() as Root;
  assert(Array.isArray(root));
  // should have 3 children now
  expect(root.length).toBe(3);

  expectMeasureStage(root[0], keys, '1', options);
  expectMeasureStage(root[1], keys, '2', options);

  // measure frame 1
  expectChildrenOrdering(root[0], keys['1'].join());
  // measure frame 2
  expectChildrenOrdering(root[1], keys['2'].join());
  // stale frame 1
  expectStaleStage(root[2], keys, '1');
  expectChildrenOrdering(root[2], keys['1'].join());

  if (options.dynamicDirection !== 'off') {
    // Move to commit stage
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
    });
    expect(setTimeout).toHaveBeenCalledTimes(3);
    expect(setTimeout).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(3, expect.any(Function), options.transitionDuration);

    root = _root.toJSON() as Root;

    expectCommitStage(root, keys, '2', options);
  }
  // Move to animate stage
  act(() => {
    jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY * 2);
  });

  root = _root.toJSON() as Root;

  // children ordering should be according to frame 1
  expectAnimationStage(root, keys, '2', options);
  // children of the animation stage is the uniq keys from all frames
  expectChildrenOrdering(root, [...new Set([...keys['1'], ...keys['2']])].join());

  if (options.dynamicDirection === 'off') {
    expect(setTimeout).toHaveBeenCalledTimes(4);
    expect(setTimeout).toHaveBeenNthCalledWith(4, expect.any(Function), options.transitionDuration);
  } else {
    expect(setTimeout).toHaveBeenCalledTimes(5);
    expect(setTimeout).toHaveBeenNthCalledWith(
      4,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(5, expect.any(Function), options.transitionDuration);
  }

  // Move to stale
  act(() => {
    jest.advanceTimersByTime(options.transitionDuration + TEST_COMPONENT_UPDATE_DELAY);
  });

  const expectNoMoreTimeouts = (numCalls: number) => {
    expect(setTimeout).toHaveBeenCalledTimes(numCalls);
    expect(setTimeout).toHaveBeenNthCalledWith(
      numCalls,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
    });
    expect(setTimeout).toHaveBeenCalledTimes(numCalls);
  };

  if (options.dynamicDirection === 'off') {
    expectNoMoreTimeouts(5);
  } else {
    expectNoMoreTimeouts(6);
  }

  root = _root.toJSON() as Root;

  expectStaleStage(root, keys, '2');
};

const runMultipleAnimations = (options: Options) => {
  const keys: KeysStore = {
    1: [1, 2, 3],
    2: [3, 2, 1],
    3: [2, 1, 3],
    4: [1, 3, 2]
  };
  withFakeTimers(keys, options, _root => {
    expect(setTimeout).toHaveBeenCalledTimes(0);

    let root: Root;
    root = _root.toJSON() as Root;

    expectStaleStage(root, keys, '1');

    // Update keys, move to measure stage and a new frame
    act(() => {
      _root.update(<Example keys={keys['2']} options={options} />);
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );

    root = _root.toJSON() as Root;

    expectMeasureStage(root[0], keys, '1', options);
    expectMeasureStage(root[1], keys, '2', options);
    expectStaleStage(root[2], keys, '1');

    // Move to commit stage
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
    });
    expect(setTimeout).toHaveBeenCalledTimes(3);
    expect(setTimeout).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(3, expect.any(Function), options.transitionDuration);

    root = _root.toJSON() as Root;

    expectCommitStage(root, keys, '2', options);

    const expectAnimateWhileMeasure = (frameIds: number[]) => {
      root = _root.toJSON() as Root;

      assert(Array.isArray(root));
      frameIds.forEach((frameId, index) => {
        // the first [:-1] elements are measure frames
        // as updates are instant there will be only 1 measure frame and 1 frame in animation
        const measureFrame = root[index];
        expectMeasureStage(measureFrame, keys, String(frameId), options);
        expectChildrenOrdering(measureFrame, keys[frameId].join());
      });

      // The last element is the animation frame.
      // This should render initial cells, but transformed targeting
      // the latest measured frame (i.e. frameId - 1)
      const animationFrame = root[root.length - 1];
      expectAnimationStage(
        animationFrame,
        keys,
        String(frameIds[frameIds.length - 1] - 1),
        options
      );
      expectChildrenOrdering(animationFrame, keys['1'].join());
    };

    // move to animate frame 2
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY * 2);
    });
    root = _root.toJSON() as Root;
    expectAnimationStage(root, keys, '2', options);
    expectChildrenOrdering(root, keys['1'].join());
    expect(setTimeout).toHaveBeenCalledTimes(5);
    expect(setTimeout).toHaveBeenNthCalledWith(
      4,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(5, expect.any(Function), options.transitionDuration);

    // move to animate frame 3
    act(() => {
      _root.update(<Example keys={keys['3']} options={options} />);
    });
    root = _root.toJSON() as Root;
    // if reMeasureAllPreviousFramesOnNewKeys then all previous frames are measured, else just the latest
    expectAnimateWhileMeasure(options.reMeasureAllPreviousFramesOnNewKeys ? [1, 2, 3] : [3]);
    expect(setTimeout).toHaveBeenCalledTimes(6);
    expect(setTimeout).toHaveBeenNthCalledWith(
      6,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );

    // move to animate frame 4
    act(() => {
      _root.update(<Example keys={keys['4']} options={options} />);
    });
    root = _root.toJSON() as Root;
    expectAnimateWhileMeasure(options.reMeasureAllPreviousFramesOnNewKeys ? [1, 2, 3, 4] : [4]);
    expect(setTimeout).toHaveBeenCalledTimes(7);
    expect(setTimeout).toHaveBeenNthCalledWith(
      7,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );

    root = _root.toJSON() as Root;

    // move to commit
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
    });

    root = _root.toJSON() as Root;

    expectCommitStage(root, keys, '4', options);
    expect(setTimeout).toHaveBeenCalledTimes(9);
    expect(setTimeout).toHaveBeenNthCalledWith(
      8,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(9, expect.any(Function), options.transitionDuration);

    // move to animate
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY * 2);
    });

    expect(setTimeout).toHaveBeenCalledTimes(11);
    expect(setTimeout).toHaveBeenNthCalledWith(
      10,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    expect(setTimeout).toHaveBeenNthCalledWith(
      11,
      expect.any(Function),
      options.transitionDuration
    );

    root = _root.toJSON() as Root;

    expectAnimationStage(root, keys, '4', options);

    // move to stale
    act(() => {
      jest.advanceTimersByTime(options.transitionDuration + TEST_COMPONENT_UPDATE_DELAY);
    });

    expect(setTimeout).toHaveBeenCalledTimes(12);
    expect(setTimeout).toHaveBeenNthCalledWith(
      12,
      expect.any(Function),
      TEST_COMPONENT_UPDATE_DELAY
    );
    act(() => {
      jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
    });
    expect(setTimeout).toHaveBeenCalledTimes(12);

    root = _root.toJSON() as Root;

    expectStaleStage(root, keys, '4');
  });
};

describe('basic functionality', () => {
  it('should cycle through stages', () => {
    const keys: KeysStore = {
      1: [1, 2, 3],
      2: [3, 2, 1]
    };

    const options: Options = {
      dynamicDirection: 'horizontal',
      transitionDuration: 1000
    };

    withFakeTimers(keys, options, _root => {
      expectFullCycleToWork(_root, keys, options);
    });
  });
  it('should keep animating while measuring new frames', () => {
    const options: Options = {
      dynamicDirection: 'horizontal',
      transitionDuration: 1000
    };
    runMultipleAnimations(options);
  });
});

const registerDynamicDirectionTest = (title: string, keys: KeysStore, options: Options) => {
  it(title, () => {
    withFakeTimers(keys, options, _root => {
      expectFullCycleToWork(_root, keys, options);
    });
  });
};

describe('dynamicDirection', () => {
  const registerArgs: {
    title: string;
    keys: KeysStore;
    options: Options;
  }[] = [];

  registerArgs.push(
    {
      title: 'should increase width when adding new items',
      keys: {
        1: [1, 2, 3],
        2: [3, 2, 1, 4]
      },
      options: {
        dynamicDirection: 'horizontal',
        transitionDuration: 1000
      }
    },
    {
      title: 'should decrease width when adding new items',
      keys: {
        1: [1, 2, 3],
        2: [3, 2]
      },
      options: {
        dynamicDirection: 'horizontal',
        transitionDuration: 1000
      }
    },
    {
      title: 'should increase height when adding new items',
      keys: {
        1: [1, 2, 3],
        2: [3, 2, 1, 4]
      },
      options: {
        dynamicDirection: 'vertical',
        transitionDuration: 1000
      }
    },
    {
      title: 'should decrease height when adding new items',
      keys: {
        1: [1, 2, 3],
        2: [3, 2]
      },
      options: {
        dynamicDirection: 'vertical',
        transitionDuration: 1000
      }
    },
    {
      title: 'should skip commit if dynamic direction is off',
      keys: {
        1: [1, 2, 3],
        2: [3, 2]
      },
      options: { dynamicDirection: 'off', transitionDuration: 1000 }
    }
  );

  registerArgs.forEach(({ title, keys, options }) => {
    registerDynamicDirectionTest(title, keys, options);
  });
});

describe('disableTransition', () => {
  it('should always be stale', () => {
    const options: Options = {
      dynamicDirection: 'vertical',
      disableTransition: true,
      transitionDuration: 1000
    };
    const keys: KeysStore = {
      1: [1, 2, 3],
      2: [3, 2, 1]
    };
    withFakeTimers(keys, options, _root => {
      let root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '1');

      // Update keys, move to measure stage and a new frame
      _root.update(<Example keys={keys['2']} options={options} />);

      root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '2');
    });
  });
});

const registerDebugMeasureTest = (title: string, keys: KeysStore) => {
  it('should work with debugMeasure ' + title, () => {
    const options: Options = {
      dynamicDirection: 'vertical',
      debugMeasure: 1000,
      transitionDuration: 500
    };
    withFakeTimers(keys, options, _root => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(setTimeout).toHaveBeenCalledTimes(0);

      let root: Root;
      root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '1');

      // Update keys, move to measure stage and a new frame
      act(() => {
        _root.update(<Example keys={keys['2']} options={options} />);
      });

      root = _root.toJSON() as Root;

      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), options.debugMeasure);

      expectMeasureStage(root[0], keys, '1', options);
      expectMeasureStage(root[1], keys, '2', options);
      expectStaleStage(root[2], keys, '1');

      // move to frame 3, while debug measure is open
      act(() => {
        _root.update(<Example keys={keys['3']} options={options} />);
      });
      root = _root.toJSON() as Root;

      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), options.debugMeasure);

      expectMeasureStage(root[0], keys, '3', options);
      expectStaleStage(root[1], keys, '1');

      // move to frame 4, while debug measure is open
      act(() => {
        _root.update(<Example keys={keys['4']} options={options} />);
      });
      root = _root.toJSON() as Root;

      expect(setTimeout).toHaveBeenCalledTimes(3);
      expect(setTimeout).toHaveBeenNthCalledWith(3, expect.any(Function), options.debugMeasure);

      expectMeasureStage(root[0], keys, '4', options);
      expectStaleStage(root[1], keys, '1');

      // will now move to commit, but should move to stale if keys[1] === keys[4]
      act(() => {
        jest.advanceTimersByTime(options.debugMeasure + TEST_COMPONENT_UPDATE_DELAY);
      });

      if (keys[1].join() !== keys[4].join()) {
        root = _root.toJSON() as Root;

        expectCommitStage(root, keys, '4', options);
        expect(setTimeout).toHaveBeenCalledTimes(6);
        expect(setTimeout).toHaveBeenNthCalledWith(
          4,
          expect.any(Function),
          TEST_COMPONENT_UPDATE_DELAY
        );
        expect(setTimeout).toHaveBeenNthCalledWith(
          5,
          expect.any(Function),
          TEST_COMPONENT_UPDATE_DELAY
        );
        expect(setTimeout).toHaveBeenNthCalledWith(
          6,
          expect.any(Function),
          options.transitionDuration
        );

        // move to animate
        act(() => {
          jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY * 2);
        });

        root = _root.toJSON() as Root;

        expectAnimationStage(root, keys, '4', options);

        expect(setTimeout).toHaveBeenCalledTimes(8);
        expect(setTimeout).toHaveBeenNthCalledWith(
          7,
          expect.any(Function),
          TEST_COMPONENT_UPDATE_DELAY
        );
        expect(setTimeout).toHaveBeenNthCalledWith(
          8,
          expect.any(Function),
          options.transitionDuration
        );

        // move to stale
        act(() => {
          jest.advanceTimersByTime(options.transitionDuration + TEST_COMPONENT_UPDATE_DELAY);
        });
        expect(setTimeout).toHaveBeenCalledTimes(9);
        expect(setTimeout).toHaveBeenNthCalledWith(
          9,
          expect.any(Function),
          TEST_COMPONENT_UPDATE_DELAY
        );
        act(() => {
          jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
        });
        expect(setTimeout).toHaveBeenCalledTimes(9);
      } else {
        expect(setTimeout).toHaveBeenCalledTimes(4);
        expect(setTimeout).toHaveBeenNthCalledWith(
          4,
          expect.any(Function),
          TEST_COMPONENT_UPDATE_DELAY
        );
        act(() => {
          jest.advanceTimersByTime(TEST_COMPONENT_UPDATE_DELAY);
        });
        expect(setTimeout).toHaveBeenCalledTimes(4);
      }

      root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '4');
    });
  });
};

describe('debugMeasure', () => {
  registerDebugMeasureTest('not same first frame as last frame', {
    1: [1, 2, 3],
    2: [3, 2, 1],
    3: [2, 1, 3],
    4: [1, 3, 2] // not same as frame 1
  });
  registerDebugMeasureTest('same first frame as last frame', {
    1: [1, 2, 3],
    2: [3, 2, 1],
    3: [2, 1, 3],
    4: [1, 2, 3] // same as frame 1
  });
});

describe('reMeasureAllPreviousFramesOnNewKeys', () => {
  it('should work', () => {
    const options: Options = {
      dynamicDirection: 'horizontal',
      transitionDuration: 1000,
      reMeasureAllPreviousFramesOnNewKeys: true
    };
    runMultipleAnimations(options);
  });
});
