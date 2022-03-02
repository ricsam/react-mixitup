import { get, range, shuffle } from 'lodash';
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

const Example = ({ keys }: { keys: number[] }) => {
  return (
    <ReactMixitup
      keys={keys}
      dynamicDirection="vertical"
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

const createRoot = (keys: KeysStore) => {
  return create(<Example keys={keys['1']} />, {
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
        return {
          offsetHeight: 1,
          offsetWidth: keys[frameId].length
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

const expectChildrenOrdering = (root: Root, keys: KeysStore, frameId: string) => {
  expect(
    // expect keys to be 1,2,3
    // expect stage to be stale
    getChildrenProps(root, ['data-key']).join()
  ).toBe(keys[frameId].join());
};

const expectStaleCellStyles = (root: Root) => {
  expect(
    // expect each transition to be off
    // expect transform to be off
    // expect stage to be stale
    getChildrenProps(root, ['style'])
  ).toEqual(range(3).map(() => ({ transition: '0s 0s all ease', transform: 'none' })));
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

  expectChildrenOrdering(root, keys, frameId);

  expectStaleCellStyles(root);
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

const expectMeasureStage = (root: Root) => {
  assert(!Array.isArray(root));

  expect(root.props['data-stage']).toBe(StageType.MEASURE);

  // measure should render each cell with stale styles
  expectStaleCellStyles(root);

  // expect measure wrapper to be position absolute and hidden
  expectMeasureWrapperStyles(root);
};

const expectAnimationCellStyles = (root: Root, keysStore: KeysStore, frameId: string) => {
  // should only be one element now
  assert(!Array.isArray(root));

  // height should be set during commit
  expect(root.props.style).toEqual({ height: 1 });

  const keys = keysStore[frameId];
  const firstKeys = keysStore['1'];

  assert(keys.length === root.children.length);

  keys.forEach((key, index) => {
    const child = root.children[index];
    assert(!Array.isArray(child));

    // e.g. move from position 1 -> 3
    // 0 - 2
    const diff = firstKeys.indexOf(key) - keys.indexOf(key);

    expect(child.props.style).toEqual({
      transform: `translate3d(${diff}px,0px,0px) scale(1)`
    });
  });
};

const expectCommitStage = (root: Root, keys: KeysStore, frameId: string) => {
  // should only be one element now
  assert(!Array.isArray(root));

  expect(root.props['id']).toBe('wrapper');
  expect(root.props['data-stage']).toBe(StageType.COMMIT);
  expectAnimationCellStyles(root, keys, frameId);
};
const expectAnimationStage = (root: Root, keys: KeysStore, frameId: string) => {
  assert(!Array.isArray(root));

  expect(root.props['id']).toBe('wrapper');
  expect(root.props['data-stage']).toBe(StageType.ANIMATE);
  expectAnimationCellStyles(root, keys, frameId);
};

const withFakeTimers = (cb: () => void) => {
  jest.useFakeTimers();
  jest.spyOn(global, 'setTimeout');
  cb();
  jest.useRealTimers();
};

const expectFullCycleToWork = () => {
  let _root: renderer.ReactTestRenderer;
  const keys: KeysStore = {
    1: [1, 2, 3],
    2: [3, 2, 1]
  };

  _root = createRoot(keys);

  let root: Root;
  root = _root.toJSON() as Root;

  expectStaleStage(root, keys, '1');

  // Update keys, move to measure stage and a new frame
  _root.update(<Example keys={keys['2']} />);

  root = _root.toJSON() as Root;

  assert(Array.isArray(root));
  // should have 3 children now
  expect(root.length).toBe(3);

  expectMeasureStage(root[0]);
  expectMeasureStage(root[1]);

  // measure frame 1
  expectChildrenOrdering(root[0], keys, '1');
  // measure frame 2
  expectChildrenOrdering(root[1], keys, '2');
  // stale frame 1
  expectStaleStage(root[2], keys, '1');
  expectChildrenOrdering(root[2], keys, '1');

  // Move to commit stage
  _root.update(<Example keys={keys['2']} />);

  root = _root.toJSON() as Root;

  expectCommitStage(root, keys, '2');

  // Move to animate stage
  _root.update(<Example keys={keys['2']} />);

  root = _root.toJSON() as Root;

  // children ordering should be according to frame 1
  expectAnimationStage(root, keys, '2');
  expectChildrenOrdering(root, keys, '1');

  // Move to stale
  act(() => {
    jest.runAllTimers();
  });

  root = _root.toJSON() as Root;

  expectStaleStage(root, keys, '2');
};

describe('can render', () => {
  it('should cycle through stages', () => {
    withFakeTimers(expectFullCycleToWork);
  });
  it('should keep animating while measuring new frames', () => {
    withFakeTimers(() => {
      let _root: renderer.ReactTestRenderer;
      const keys: KeysStore = {
        1: [1, 2, 3],
        2: [3, 2, 1],
        3: [2, 1, 3],
        4: [1, 3, 2]
      };

      _root = createRoot(keys);

      let root: Root;
      root = _root.toJSON() as Root;

      expectStaleStage(root, keys, '1');

      // Update keys, move to measure stage and a new frame
      _root.update(<Example keys={keys['2']} />);

      root = _root.toJSON() as Root;

      expectMeasureStage(root[0]);
      expectMeasureStage(root[1]);
      expectStaleStage(root[2], keys, '1');

      // Move to commit stage
      _root.update(<Example keys={keys['2']} />);

      root = _root.toJSON() as Root;

      expectCommitStage(root, keys, '2');

      const animate = (frameId: number, shouldHaveMeasureStage: boolean) => {
        // Move to animate stage
        _root.update(<Example keys={keys[frameId]} />);

        root = _root.toJSON() as Root;

        if (shouldHaveMeasureStage) {
          assert(Array.isArray(root));
          // the first [:-1] elements are measure frames
          // as updates are instant there will be only 1 measure frame and 1 frame in animation
          const measureFrame = root[0];
          expectMeasureStage(measureFrame);
          expectChildrenOrdering(measureFrame, keys, String(frameId));

          // The last element is the animation frame.
          // This should render initial cells, but transformed targeting
          // the latest measured frame (i.e. frameId - 1)
          const animationFrame = root[root.length - 1];
          expectAnimationStage(animationFrame, keys, String(frameId - 1));
          expectChildrenOrdering(animationFrame, keys, '1');
        } else {
          // children ordering should be according to frame 1
          expectAnimationStage(root, keys, '2');
          expectChildrenOrdering(root, keys, '1');
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
});
