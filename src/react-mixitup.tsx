/**
 * @class ReactMixitup
 */

import flatten from 'lodash.flatten';
import uniq from 'lodash.uniq';
import * as React from 'react';

interface IPosition {
  x: number;
  y: number;
  z?: number;
}
interface IPositions {
  [key: string]: IPosition;
}
interface IReducerState {
  hash: null | string;
  mount: boolean;
  commit: boolean;
  animate: boolean;
  firstRender: boolean;
}

interface IState {
  containerHeight: number | null;
  items: Items;
  positions: IPositions;
}

type UnparsedItems = Array<string | number | boolean>;
type Item = string;
type Items = Item[];

interface IWrapperProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  ref?: React.Ref<any>;
}

type WrapperType = any;

interface IProps {
  items: UnparsedItems;
  duration?: number;
  renderCells: (
    items: Array<{
      key: string;
      ref?: React.Ref<any>;
      style?: React.CSSProperties;
    }>
  ) => React.ReactNode;
  Wrapper?: WrapperType;
  transition?: boolean;
}

interface IAction {
  type: 'SET_HASH' | 'STOP_ANIMATION' | 'ANIMATE' | 'COMMIT';
  hash?: string | null;
  key?: string;
  el?: HTMLElement | null;
  transition?: boolean;
}

const OuterBound = React.memo(
  React.forwardRef((props: { children: React.ReactNode }, ref?: React.Ref<any>) => (
    <div style={{ position: 'relative' }} {...props} ref={ref} />
  ))
);

function init(): IReducerState {
  return {
    animate: false,
    commit: false,
    firstRender: true,
    hash: null,
    mount: false
  };
}

const getItemsHash = (items: Items): string => {
  return items.join(',');
};

function reducer(state: IReducerState, action: IAction): IReducerState {
  switch (action.type) {
    case 'SET_HASH':
      if (typeof action.hash === 'undefined') {
        throw new Error();
      }
      let mount = true;
      if (
        state.firstRender ||
        state.mount ||
        state.commit /* || state.animate */ ||
        !action.transition
      ) {
        mount = false;
      }
      return {
        ...state,
        hash: action.hash,
        firstRender: false,
        mount
      };
    case 'COMMIT':
      return {
        ...state,
        commit: true,
        mount: false
      };
    case 'ANIMATE':
      return {
        ...state,
        animate: true,
        commit: false
      };
    case 'STOP_ANIMATION':
      return {
        ...state,
        animate: false,
        mount: false
      };
    default:
      throw new Error();
  }
}

function onNextFrame(callback: () => any) {
  setTimeout(() => {
    window.requestAnimationFrame(callback);
  }, 0);
}

const makeAbsoluteWrapper = (Wrapper: React.JSXElementConstructor<any>) =>
  React.memo(
    React.forwardRef((props: { children: React.ReactNode }, ref?: React.Ref<any>) => (
      <Wrapper
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          visibility: 'hidden',
          zIndex: -1
        }}
        {...props}
        ref={ref}
      />
    ))
  );

const makeWrapper = (ReactMixitupWrapper: WrapperType) => {
  return React.memo(
    React.forwardRef((props: IWrapperProps, ref) => <ReactMixitupWrapper {...props} ref={ref} />)
  );
};

const ReactMixitup = React.memo(
  React.forwardRef(
    (
      {
        items: unparsedItems,
        duration = 500,
        renderCells,
        Wrapper: ReactMixitupWrapper = 'div',
        transition = true
      }: IProps,
      outerBoundRef: React.Ref<HTMLDivElement>
    ): JSX.Element | null => {
      const Wrapper = React.useMemo(() => makeWrapper(ReactMixitupWrapper), [ReactMixitupWrapper]);
      const AbsoluteWrapper = React.useMemo(() => makeAbsoluteWrapper(Wrapper), [Wrapper]);

      const items: Items = unparsedItems.map(key => key.toString());
      const [{ hash, animate, mount, commit }, unsafeDispatch] = React.useReducer(
        reducer,
        items,
        init
      );

      const unmounted = React.useRef(false);
      React.useEffect(
        () => () => {
          unmounted.current = true;
        },
        []
      );

      const dispatch = React.useCallback((action: IAction) => {
        if (unmounted.current) {
          return;
        }
        unsafeDispatch(action);
      }, []);

      const refs = React.useRef<{
        states: IState[];
        persistedElement: JSX.Element | null;
      }>({
        states: [
          {
            items,
            positions: {},
            containerHeight: null
          }
        ],
        persistedElement: null
      });
      let newHash: string | null = getItemsHash(items);
      let newGrid = newHash !== hash;
      /* just to handle if clicking really fast, then ignore the update */
      if (mount || commit) {
        newGrid = false;
        newHash = hash;
      }

      let currentState = refs.current.states[refs.current.states.length - 1];

      if (newGrid) {
        const nextState: IState = {
          items,
          positions: {},
          containerHeight: null
        };
        if (animate) {
          refs.current.states.push(nextState);
        } else {
          refs.current.states = [currentState, nextState];
        }

        currentState = refs.current.states[refs.current.states.length - 1];
      }
      const { states } = refs.current;

      React.useEffect(() => {
        if (newGrid) {
          dispatch({
            type: 'SET_HASH',
            hash: newHash,
            transition
          });
        }
      }, [newHash, newGrid, transition]);

      React.useEffect(() => {
        if (mount) {
          /* make sure the mount has been committed to the DOM, double make sure by wrapping in onNextFrame */
          onNextFrame(() => {
            dispatch({
              type: 'COMMIT'
            });
          });
        }
      }, [mount]);

      React.useEffect(() => {
        if (commit) {
          onNextFrame(() => {
            dispatch({
              type: 'ANIMATE'
            });
          });
        }
      }, [commit]);

      React.useEffect(() => {
        let timer: number;
        const clear = () => {
          window.clearTimeout(timer);
        };
        if (animate) {
          timer = window.setTimeout(() => {
            dispatch({
              type: 'STOP_ANIMATION'
            });
          }, duration);
        } else {
          clear();
        }
        return clear;
      }, [animate, newHash]);

      const measureRef = React.useCallback((key: string, el: HTMLElement) => {
        // console.log(index, states, key);
        refs.current.states[refs.current.states.length - 1].positions[key] = {
          x: el.offsetLeft,
          y: el.offsetTop
        };
      }, []);

      const wrapperMeasureContainerHeight = React.useCallback((el: HTMLElement | null) => {
        if (!el) {
          return;
        }
        refs.current.states[refs.current.states.length - 1].containerHeight = el.offsetHeight;
      }, []);

      const rows = React.useCallback(
        ({
          itemsToRender,
          ref,
          style
        }: {
          itemsToRender: Items;
          ref?: (key: string, el: HTMLElement) => void;
          style?: (key: string) => React.CSSProperties;
        }) => {
          const makeRef = (key: string) => {
            if (typeof ref === 'undefined') {
              return;
            }
            return (el: HTMLElement | null) => {
              if (el) {
                ref(key, el);
              }
            };
          };

          const makeStyle = (key: string) => {
            return typeof style !== 'undefined' ? style(key) : undefined;
          };

          return renderCells(
            itemsToRender.map(key => ({
              key,
              ref: makeRef(key),
              style: makeStyle(key)
            }))
          );
        },
        [renderCells]
      );

      const latestIndex = states.length - 1;

      if (commit) {
        return refs.current.persistedElement;
      }

      const measureNewGrid = newGrid ? (
        <AbsoluteWrapper ref={wrapperMeasureContainerHeight}>
          {rows({
            itemsToRender: currentState.items,
            ref: measureRef
          })}
        </AbsoluteWrapper>
      ) : null;

      if (!transition) {
        return (
          <OuterBound ref={outerBoundRef}>
            <Wrapper>
              {rows({
                itemsToRender: currentState.items
              })}
            </Wrapper>
          </OuterBound>
        );
      }

      let child = (
        <>
          <Wrapper>
            {rows({
              itemsToRender: currentState.items
            })}
          </Wrapper>
          {measureNewGrid}
        </>
      );

      if (newGrid) {
        /* AND !animate AND !mount */
        /* measure stage */
        child = (
          <>
            <Wrapper>
              {rows({
                itemsToRender: states.length > 1 ? states[states.length - 2].items : states[0].items
              })}
            </Wrapper>
            {measureNewGrid}
          </>
        );
      }

      const getItemStateIndexes = (item: string): number[] => {
        const indexes = [];
        for (let i = states.length - 1; i >= 0; i -= 1) {
          const state = states[i];
          if (state.items.includes(item)) {
            indexes.push(i);
          }
        }
        return indexes;
      };

      const allItems = flatten(states.map(({ items: sItems }) => sItems));

      const getLatestPositions = (item: string): IPosition | undefined => {
        for (let i = states.length - 1; i >= 0; i -= 1) {
          const state = states[i];
          if (state.positions[item]) {
            return state.positions[item];
          }
        }
        return undefined;
      };

      const animationRenderItems = uniq(allItems)
        .sort()
        .filter(getLatestPositions);

      if (mount) {
        // debugger;
        child = (
          <>
            <Wrapper style={{ height: states[states.length - 2].containerHeight + 'px' }}>
              {rows({
                itemsToRender: animationRenderItems,
                style(key) {
                  let z = 1;
                  let x = 0;
                  let y = 0;

                  const indexes = getItemStateIndexes(key);
                  if (indexes.length === 0) {
                    throw new Error('something went wrong in the lib');
                  }
                  /* the new items (indexes[0] === latestIndex) that has a previous position */

                  ({ x, y } = states[indexes[0]].positions[key]);

                  if (indexes[0] === latestIndex) {
                    if (indexes.length > 1) {
                      /* move from previous position */
                      ({ x, y } = states[indexes[1]].positions[key]);
                    } else {
                      /* appear at current position */
                      z = 0;
                    }
                  }

                  const transform = `translate3d(${[x, y, 0].join('px,')}px) scale(${z})`;

                  const style: React.CSSProperties = {
                    transform,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    margin: 0
                  };

                  return style;
                }
              })}
            </Wrapper>
          </>
        );
      }

      if (animate) {
        // debugger;
        child = (
          <>
            <Wrapper style={{ height: currentState.containerHeight + 'px' }}>
              {rows({
                /* they must have been measured */
                itemsToRender: animationRenderItems,
                style(key) {
                  let z = 1;
                  let x = 0;
                  let y = 0;

                  const indexes = getItemStateIndexes(key);
                  if (indexes.length === 0) {
                    throw new Error('something went wrong in the lib');
                  }

                  const latestPosition = getLatestPositions(key);

                  if (!latestPosition) {
                    throw new Error('This should not happed since filtering');
                  }

                  ({ x, y } = latestPosition);

                  // /* was just added */
                  if (indexes.length === 1 && latestIndex === indexes[0] && mount) {
                    z = 0;
                  }

                  /* will be removed */
                  if (!currentState.items.includes(key)) {
                    z = 0;
                  }

                  const transform = `translate3d(${[x, y, 0].join('px,')}px) scale(${z})`;

                  const style: React.CSSProperties = {
                    transform,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    margin: 0,
                    transition: `transform ${duration}ms ease`
                  };
                  return style;
                }
              })}
            </Wrapper>
            {measureNewGrid}
          </>
        );
      }

      refs.current.persistedElement = <OuterBound ref={outerBoundRef}>{child}</OuterBound>;

      return refs.current.persistedElement;
    }
  )
);

export default ReactMixitup;
