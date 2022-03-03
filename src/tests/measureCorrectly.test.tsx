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
  StageType
} from '../react-mixitup';
import * as utils from '../utils';
import assert from 'assert';

type Options = {
  dynamicDirection: 'off' | 'horizontal' | 'vertical';
};

const Example = ({ keys, options }: { keys: number[]; options: Options }) => {
  return (
    <ReactMixitup
      keys={keys}
      dynamicDirection={options.dynamicDirection}
      transitionDuration={250}
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

const expectMeasureWrapperStyles = (root: Root) => {
  assert(!Array.isArray(root));
  expect(
    // stale wrapper should not have any style
    root.props.style
  ).toEqual({
    position: 'absolute',
    visibility: 'hidden',
    zIndex: -1
  });
};

const expectMeasureStage = (root: Root, keys: KeysStore, frameId: string) => {
  assert(!Array.isArray(root));

  expect(root.props['data-stage']).toBe(StageType.MEASURE);

  // measure should render each cell with stale styles
  expectStaleCellStyles(root, keys, frameId);

  // expect measure wrapper to be position absolute and hidden
  expectMeasureWrapperStyles(root);
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

const withFakeTimers = (cb: () => void) => {
  jest.useFakeTimers();
  jest.spyOn(global, 'setTimeout');
  cb();
  jest.useRealTimers();
};

const expectFullCycleToWork = (keys: KeysStore, options: Options) => {
  let _root: renderer.ReactTestRenderer;
  _root = createRoot(keys, options);

  let root: Root;
  root = _root.toJSON() as Root;

  expectStaleStage(root, keys, '1');

  // Update keys, move to measure stage and a new frame
  _root.update(<Example keys={keys['2']} options={options} />);

  root = _root.toJSON() as Root;

  assert(Array.isArray(root));
  // should have 3 children now
  expect(root.length).toBe(3);

  expectMeasureStage(root[0], keys, '1');
  expectMeasureStage(root[1], keys, '2');

  // measure frame 1
  expectChildrenOrdering(root[0], keys['1'].join());
  // measure frame 2
  expectChildrenOrdering(root[1], keys['2'].join());
  // stale frame 1
  expectStaleStage(root[2], keys, '1');
  expectChildrenOrdering(root[2], keys['1'].join());

  // Move to commit stage
  _root.update(<Example keys={keys['2']} options={options} />);

  root = _root.toJSON() as Root;

  expectCommitStage(root, keys, '2', options);

  // Move to animate stage
  _root.update(<Example keys={keys['2']} options={options} />);

  root = _root.toJSON() as Root;

  // children ordering should be according to frame 1
  expectAnimationStage(root, keys, '2', options);
  // children of the animation stage is the uniq keys from all frames
  expectChildrenOrdering(root, [...new Set([...keys['1'], ...keys['2']])].join());

  // Move to stale
  act(() => {
    jest.runAllTimers();
  });

  root = _root.toJSON() as Root;

  expectStaleStage(root, keys, '2');
};

describe('can render', () => {
  it('should cycle through stages', () => {
    withFakeTimers(() => {
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2, 1]
      };

      expectFullCycleToWork(keys, {
        dynamicDirection: 'horizontal'
      });
    });
  });
  it('should keep animating while measuring new frames', () => {
    withFakeTimers(() => {
      const options: Options = {
        dynamicDirection: 'horizontal'
      };
      let _root: renderer.ReactTestRenderer;
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2, 1],
        3: [2, 1, 3],
        4: [1, 3, 2]
      };

      _root = createRoot(keys, options);

      let root: Root;
      root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '1');

      // Update keys, move to measure stage and a new frame
      _root.update(<Example keys={keys['2']} options={options} />);

      root = _root.toJSON() as Root;

      expectMeasureStage(root[0], keys, '1');
      expectMeasureStage(root[1], keys, '2');
      expectStaleStage(root[2], keys, '1');

      // Move to commit stage
      _root.update(<Example keys={keys['2']} options={options} />);

      root = _root.toJSON() as Root;

      expectCommitStage(root, keys, '2', options);

      const animate = (frameId: number, shouldHaveMeasureStage: boolean) => {
        // Move to animate stage
        _root.update(<Example keys={keys[frameId]} options={options} />);

        root = _root.toJSON() as Root;

        if (shouldHaveMeasureStage) {
          assert(Array.isArray(root));
          // the first [:-1] elements are measure frames
          // as updates are instant there will be only 1 measure frame and 1 frame in animation
          const measureFrame = root[0];
          expectMeasureStage(measureFrame, keys, String(frameId));
          expectChildrenOrdering(measureFrame, keys[frameId].join());

          // The last element is the animation frame.
          // This should render initial cells, but transformed targeting
          // the latest measured frame (i.e. frameId - 1)
          const animationFrame = root[root.length - 1];
          expectAnimationStage(animationFrame, keys, String(frameId - 1), options);
          expectChildrenOrdering(animationFrame, keys['1'].join());
        } else {
          // children ordering should be according to frame 1
          expectAnimationStage(root, keys, '2', options);
          expectChildrenOrdering(root, keys['1'].join());
        }
      };
      animate(2, false);
      animate(3, true);
      animate(4, true);

      // Move to stale
      act(() => {
        jest.runAllTimers();
      });

      root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '4');
    });
  });

  it('should increase width when adding new items', () => {
    withFakeTimers(() => {
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2, 1, 4]
      };
      expectFullCycleToWork(keys, {
        dynamicDirection: 'horizontal'
      });
    });
  });
  it('should decrease width when adding new items', () => {
    withFakeTimers(() => {
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2]
      };
      expectFullCycleToWork(keys, {
        dynamicDirection: 'horizontal'
      });
    });
  });
  it('should increase height when adding new items', () => {
    withFakeTimers(() => {
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2, 1, 4]
      };
      expectFullCycleToWork(keys, {
        dynamicDirection: 'vertical'
      });
    });
  });
  it('should decrease height when adding new items', () => {
    withFakeTimers(() => {
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2]
      };
      expectFullCycleToWork(keys, {
        dynamicDirection: 'vertical'
      });
    });
  });
});
