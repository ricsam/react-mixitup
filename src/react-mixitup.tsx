import * as React from 'react';

/**
 * IPosition
 *
 * The position of a cell. x and y are its offsetX and offsetY position.
 * If a cell is to be removed or added the scale property will be added, 0 to 1
 */
interface IPosition {
  x: number;
  y: number;
  scale?: number;
}
/**
 * IPositions
 *
 * The collection of positions for each key
 */
interface IPositions {
  [key: string]: IPosition;
}

/**
 * State
 *
 * Determines what to render in the component
 */
enum StateType {
  /**
   * STALE
   *
   * If the animation finishes the next state will be STALE.
   * Render the cells in the wrapper statically positioned.
   */
  STALE = 'STALE',
  /**
   * MEASURE
   *
   * If oldKeys.join() != nextKeys.join() then the next state will be MEASURE.
   *
   * Render next cells in a hidden div and measure the position of each next cell.
   * Measure the height of the next hidden wrapper.
   *
   * Measure the position of each old cell.
   * Measure the height of the old wrapper.
   */
  MEASURE = 'MEASURE',
  /**
   * COMMIT
   *
   * If state is MEASURE then the next state will be COMMIT.
   *
   * Render all unique cells from the old list of keys and the next list of keys.
   *
   * All cells are position absolute. The old cells should be css translated to their old position and scaled to 1.
   *
   * All new cells, i.e those keys in next keys which are not in old keys should be translated to their
   * next position, and scaled to 0.
   */
  COMMIT = 'COMMIT',
  /**
   * ANIMATE
   *
   * If state is COMMIT or ANIMATE_COMMIT then the next state will be ANIMATE.
   *
   * For each cell that should be moved, i.e the intersection between old keys and new keys, update style.translate to the new position.
   *
   * For each cell that should be removed, i.e those in old keys not present in new keys, update style.scale to 0
   *
   * For each cell that should be added, i.e. those in new keys not present in old keys, update style.cale to 1
   */
  ANIMATE = 'ANIMATE',
  /**
   * ANIMATE_MEASURE
   *
   * If state is ANIMATE, and the keys are updated then the next state will be ANIMATE_MEASURE.
   *
   * Render next cells in a hidden div and measure the position of each next cell.
   * Measure the height of the next hidden wrapper.
   *
   * The positions of the old cells should already be measured
   *
   * Render the same as in ANIMATE while rendering the measuring component.
   *
   */
  ANIMATE_MEASURE = 'ANIMATE_MEASURE',
  /**
   * ANIMATE_COMMIT
   *
   * If state is ANIMATE_MEASURE then the next state will be ANIMATE_COMMIT.
   *
   * Render all unique cells from the old lists of keys (notice plural on lists) and the next list of keys.
   * That is the the same as in ANIMATE.
   *
   * All cells which are now to be removed should be scaled to 0.
   *
   * All new cells, i.e those keys in next keys which are not in old keys should be translated to their
   * next position, and scaled to 0.
   */
  ANIMATE_COMMIT = 'ANIMATE_COMMIT'
}

/**
 * IFrame
 *
 * Holds information about the keys of rendered cells
 */
interface IFrame {
  /**
   * The height of the container when all cells are rendered.
   */
  containerHeight: number | undefined;
  /**
   * The width of the container when all cells are rendered.
   */
  containerWidth: number | undefined;
  /**
   * The keys which should be rendered
   */
  keys: (string | number)[];
  /**
   * The positions of each cell
   */
  positions: IPositions;
  /**
   * A unique id used for debugging purposes to differentiate each IFrame
   */
  id: string;

  /**
   * If the frame has been measured
   */
  hasBeenMeasured: boolean;
}

/**
 * ICellStyle
 *
 * The styles passed to a cell
 */
interface ICellStyle {
  transform?: string;
  transition?: string;
}

interface IWrapperStyle {
  position?: 'absolute' | 'relative';
  width?: number;
  height?: number;
  top?: 0;
  left?: 0;
  visibility?: 'hidden';
  zIndex?: -1;
}

/**
 * IProps
 *
 * The props accepted by ReactMixitup
 */
interface IProps {
  /**
   * keys should be a unique list of strings.
   */
  keys: (string | number)[];
  /**
   * MUST return a react node.
   *
   * The item.key corresponds to a key in the keys prop.
   * You should use the key to render the correct data in the cell.
   *
   * It MUST accept style and forward that to the returned component.
   * Style contains the transition styles.
   *
   * The ref MUST also be attached to the returned element so
   * ReactMixitup is able to measure the position of the cell.
   */
  renderCell: (
    key: string | number,
    style: ICellStyle,
    ref: React.Ref<any>
  ) => React.ReactNode | JSX.Element;

  /**
   * Optional, by default ReactMixitup will wrap all cells in a div.
   *
   * If provided renderWrapper MUST return a React node which accepts the provided style and ref.
   *
   * The ref is used to measure the height of the wrapping container.
   *
   * The style is used to update the height of the wrapping container.
   * By setting the transition: height style property on the wrapper the height can be animated.
   */
  renderWrapper?: (
    style: IWrapperStyle,
    ref: React.Ref<any>,
    cells: JSX.Element[]
  ) => React.ReactNode | JSX.Element;

  /**
   * Disable the transition
   */
  disableTransition?: boolean;

  /**
   * If the wrapper should grow/shrink vertically or horizontally when adding and removing cells
   */
  dynamicDirection: 'horizontal' | 'vertical';

  transitionDuration: number;
}

/**
 * Creates a hash of the keys in order to determine if the keys are updated
 */
function getKeysHash(keys: (string | number)[]): string {
  return keys.map(k => `${(typeof k)[0]}${k}`).join(',');
}

/**
 * Flattens a nested array
 */
const flatten = <T extends unknown>(nested: (T | T[])[]): T[] => {
  const flatList: T[] = [];
  const iter = (item: T | T[]) => {
    if (Array.isArray(item)) {
      item.forEach(iter);
    } else {
      flatList.push(item);
    }
  };
  nested.forEach(iter);
  return flatList;
};

/**
 * MUST return a React node which accepts the provided style and ref.
 *
 * The ref is used to measure the height of the wrapping container.
 *
 * The style is used to update the height of the wrapping container.
 * By setting the transition: height style property on the wrapper the height can be animated.
 */
export type RenderWrapper = Exclude<IProps['renderWrapper'], undefined>;

/**
 * MUST return a react node.
 *
 * The item.key corresponds to a key in the keys prop.
 * You should use the key to render the correct data in the cell.
 *
 * It MUST accept style and forward that to the returned component.
 * Style contains the transition styles.
 *
 * The ref MUST also be attached to the returned element so
 * ReactMixitup is able to measure the position of the cell.
 */
export type RenderCell = Exclude<IProps['renderCell'], undefined>;

/**
 * Default renderer
 */
const defaultRenderWrapper: RenderWrapper = (style, ref, cells) => {
  return (
    <div style={style} ref={ref}>
      {cells}
    </div>
  );
};

const uniq = (values: (string | number)[]) => {
  const seen = new Set(values);
  const uniq: (string | number)[] = [];
  seen.forEach(value => {
    uniq.push(value);
  });
  return uniq;
};

type State =
  | {
      type: StateType.MEASURE;
      frameToMeasure: IFrame;
      whileAnimating: boolean;
    }
  | {
      type: StateType.ANIMATE;
    }
  | {
      type: StateType.COMMIT;
      whileAnimating: boolean;
    }
  | {
      type: StateType.STALE;
      frame: IFrame;
    };

const NotifyAboutRendered = ({
  children,
  frame
}: {
  children: React.ReactNode | JSX.Element;
  frame: IFrame;
}) => {
  React.useLayoutEffect(() => {
    frame.hasBeenMeasured = true;
  }, [frame]);
  return <>{children}</>;
};

export const ReactMixitup = React.memo(
  React.forwardRef(
    (
      {
        keys,
        renderCell,
        renderWrapper = defaultRenderWrapper,
        disableTransition = false,
        dynamicDirection,
        transitionDuration
      }: IProps,
      outerBoundRef: React.Ref<HTMLDivElement>
    ): JSX.Element | null => {
      /* ensure every item is a string */
      if (new Set(keys).size !== keys.length) {
        throw new Error('In prop keys: every key must be unique');
      }

      const createFrame = (): IFrame => {
        return {
          id: String(Math.random()),
          keys,
          containerHeight: undefined,
          containerWidth: undefined,
          positions: {},
          hasBeenMeasured: false
        };
      };

      const refs = React.useRef<{
        frames: IFrame[];
        persistedElement: JSX.Element | null;
        hash: undefined | string;
        state: State;
      }>(undefined as any);

      if (!refs.current) {
        const frame = createFrame();
        refs.current = {
          frames: [frame],
          persistedElement: null,
          hash: undefined,
          state: { type: StateType.STALE, frame }
        };
      }

      const [, _update] = React.useState(0);
      const update = () => {
        setTimeout(() => {
          _update(i => i + 1);
        }, 1);
      };

      React.useEffect(() => {
        if (refs.current.state.type === StateType.MEASURE) {
          refs.current.state = {
            type: StateType.COMMIT,
            whileAnimating: refs.current.state.whileAnimating
          };
          update();
        } else if (refs.current.state.type === StateType.COMMIT) {
          refs.current.state = {
            type: StateType.ANIMATE
          };
          window.requestAnimationFrame(() => {
            update();
          });
        }
      });

      const nextHash = getKeysHash(keys);

      if (refs.current.hash === undefined) {
        // first render
        refs.current.hash = nextHash;
      }

      if (refs.current.hash !== nextHash) {
        refs.current.hash = nextHash;
        const frame = createFrame();
        if (disableTransition) {
          refs.current.frames.splice(0, refs.current.frames.length, frame);
          refs.current.state = {
            type: StateType.STALE,
            frame
          };
        } else {
          refs.current.frames.push(frame);
          const whileAnimating =
            'whileAnimating' in refs.current.state
              ? refs.current.state.whileAnimating
              : refs.current.state.type === StateType.ANIMATE;
          refs.current.state = {
            type: StateType.MEASURE,
            frameToMeasure: frame,
            whileAnimating
          };
        }
      }

      const measureGridItems = (frame: IFrame, key: string | number, el: HTMLElement) => {
        const pos = {
          x: el.offsetLeft,
          y: el.offsetTop
        };
        frame.positions[key] = pos;
      };

      const wrapperMeasureContainerSize = (frame: IFrame, el: HTMLElement | null) => {
        if (!el) {
          return;
        }
        const h = el.offsetHeight;
        const w = el.offsetWidth;
        frame.containerHeight = h;
        frame.containerWidth = w;
      };

      const cells = ({
        ref,
        style,
        keys
      }: {
        keys: (string | number)[];
        ref: (key: string | number, el: HTMLElement) => void;
        style: (key: string | number) => ICellStyle;
      }) => {
        const makeRef = (key: string | number) => {
          return (el: HTMLElement | null) => {
            if (el) {
              ref(key, el);
            }
          };
        };

        const cells = keys.map(key => (
          <React.Fragment key={key}>{renderCell(key, style(key), makeRef(key))}</React.Fragment>
        ));

        return cells;
      };

      const measureFrame = (frame: IFrame) => (
        <NotifyAboutRendered frame={frame}>
          {renderWrapper(
            {
              position: 'absolute',
              top: 0,
              left: 0,
              visibility: 'hidden',
              zIndex: -1
            },
            el => {
              wrapperMeasureContainerSize(frame, el);
            },
            cells({
              ref: (key, el) => {
                measureGridItems(frame, key, el);
              },
              keys: frame.keys,
              style: () => ({})
            })
          )}
        </NotifyAboutRendered>
      );

      const onEndOfTransition = () => {
        const frame = refs.current.frames[refs.current.frames.length - 1];
        refs.current.state = {
          type: StateType.STALE,
          frame
        };
        // stale should always only have 1 frame
        refs.current.frames = [frame];

        update();
      };

      React.useEffect(() => {
        if (refs.current.state.type === StateType.ANIMATE) {
          const timeout = setTimeout(() => {
            onEndOfTransition();
          }, transitionDuration);

          return () => {
            clearTimeout(timeout);
          };
        }
      });

      console.log('refs', JSON.stringify(refs.current.state, null, 2));

      // BEGIN RENDER

      // The keys used on the React.Fragments are there to assist React in preseving the DOM tree nodes and
      // prevent unmounting of components which interupts animation
      const ROOT_LEVEL = 'root-level';
      const VISIBLE_LEVEL = 'visible-level';
      const WRAPPER_LEVEL = 'wrapper-level';
      const HIDDEN_LEVEL = 'hidden-level';
      // The hierarchies:
      // root-level > visible-level > wrapper-level > renderWrapper
      //      ↳     > hidden-level > [key] > wrapper-level > NotifyAboutRendered > renderWrapper

      /**
       * staleFrame
       *
       * Renders the cells without any modifications
       *
       * @param frame IFrame
       * @returns React.ReactNode | JSX.Element
       */
      const staleFrame = (frame: IFrame) => (
        <React.Fragment key={WRAPPER_LEVEL}>
          {renderWrapper(
            {},
            () => {},
            cells({
              ref: () => {},
              keys: frame.keys,
              style: () => ({
                transition: '0s 0s all ease',
                transform: 'none'
              })
            })
          )}
        </React.Fragment>
      );

      // If transitions are disabled, always render the staleFrame node
      if (disableTransition) {
        return (
          <React.Fragment key={ROOT_LEVEL}>
            <React.Fragment key={VISIBLE_LEVEL}>
              {staleFrame(refs.current.frames[refs.current.frames.length - 1])}
            </React.Fragment>
          </React.Fragment>
        );
      }

      /**
       * getKeyFrameParticipation
       *
       * returns the frame indices where a key is present
       *
       * @param frames IFrame[]
       * @param key string
       * @returns number[]
       */
      const getKeyFrameParticipation = (frames: IFrame[], key: string | number): number[] => {
        const indexes = [];
        for (let i = frames.length - 1; i >= 0; i -= 1) {
          const frame = frames[i];
          if (frame.keys.includes(key)) {
            indexes.push(i);
          }
        }
        return indexes;
      };

      const animatedCellStyle = (
        type: StateType.ANIMATE | StateType.COMMIT,
        key: string | number,
        frames: IFrame[]
      ): ICellStyle => {
        let z = 1;
        let x = 0;
        let y = 0;
        let x0 = 0;
        let y0 = 0;

        const indexes = getKeyFrameParticipation(frames, key);
        if (indexes.length === 0) {
          throw new Error('something went wrong in the lib');
        }

        ({ x, y } = frames[indexes[0]].positions[key]);
        ({ x: x0, y: y0 } = frames[indexes[indexes.length - 1]].positions[key]);

        /* will be added */
        if (indexes.length === 1) {
          if (type === StateType.ANIMATE) {
            z = 1;
          } else {
            // scale from 0 -> 1 when going from COMMIT -> ANIMATE
            z = 0;
          }
        }

        /* will be removed */
        if (!frames[frames.length - 1].keys.includes(key)) {
          if (type === StateType.ANIMATE) {
            z = 0;
          } else {
            // scale from 1 -> 0 when going from COMMIT -> ANIMATE
            z = 1;
          }
        }

        const xDiff = x - x0;
        const yDiff = y - y0;

        const transform = `translate3d(${[xDiff, yDiff, 0].join('px,')}px) scale(${z})`;

        const style: ICellStyle = {
          transform
        };
        return style;
      };

      /**
       * animatingFrame
       *
       * Returns the nodes which renders while animating.
       * Translate all elements to ther corresponding static location in the latest frame
       *
       * @param frames IFrame[]
       * @returns JSX.Element
       */
      const animatingFrame = (frames: IFrame[]) => {
        const height = frames[frames.length - 1].containerHeight!;
        const width = frames[frames.length - 1].containerWidth!;
        const styles: IWrapperStyle = {};
        if (dynamicDirection === 'horizontal') {
          styles.width = width;
        } else {
          styles.height = height;
        }
        return (
          <React.Fragment key={WRAPPER_LEVEL}>
            {renderWrapper(
              {
                ...styles,
                position: 'relative'
              },
              () => {},
              cells({
                ref: (key, el) => {},
                keys: uniq(flatten(frames.map(frame => frame.keys))),
                style: key => {
                  return animatedCellStyle(StateType.ANIMATE, key, frames);
                }
              })
            )}
          </React.Fragment>
        );
      };

      // When animating render the animatingFrame
      if (refs.current.state.type === StateType.ANIMATE) {
        return (
          <React.Fragment key={ROOT_LEVEL}>
            <React.Fragment key={VISIBLE_LEVEL}>
              {animatingFrame(refs.current.frames)}
            </React.Fragment>
          </React.Fragment>
        );
      }

      // Commit will translate all elements to their corresponding static location of the previous frame.
      if (refs.current.state.type === StateType.COMMIT) {
        const state = refs.current.state;
        let sizeFrame = refs.current.frames[refs.current.frames.length - 2];
        if (state.whileAnimating) {
          sizeFrame = refs.current.frames[refs.current.frames.length - 1];
        }
        const height = sizeFrame.containerHeight!;
        const width = sizeFrame.containerWidth!;
        const styles: IWrapperStyle = {};
        if (dynamicDirection === 'horizontal') {
          styles.width = width;
        } else {
          styles.height = height;
        }
        return (
          <React.Fragment key={ROOT_LEVEL}>
            <React.Fragment key={VISIBLE_LEVEL}>
              <React.Fragment key={WRAPPER_LEVEL}>
                {renderWrapper(
                  {
                    ...styles,
                    position: 'relative'
                  },
                  () => {},
                  cells({
                    ref: (key, el) => {},
                    keys: uniq(flatten(refs.current.frames.map(frame => frame.keys))),
                    style: key => {
                      return animatedCellStyle(StateType.COMMIT, key, refs.current.frames);
                    }
                  })
                )}
              </React.Fragment>
            </React.Fragment>
          </React.Fragment>
        );
      }

      // Measure
      if (refs.current.state.type === StateType.MEASURE) {
        console.log('@measreu', refs.current.frames.length);
        return (
          <React.Fragment key={ROOT_LEVEL}>
            <React.Fragment key={HIDDEN_LEVEL}>
              {refs.current.frames
                // .filter(frame => !frame.hasBeenMeasured)
                .map(frame => {
                  return <React.Fragment key={frame.id}>{measureFrame(frame)}</React.Fragment>;
                })}
            </React.Fragment>
            <React.Fragment key={VISIBLE_LEVEL}>
              {refs.current.state.whileAnimating
                ? animatingFrame(refs.current.frames.filter(frame => frame.hasBeenMeasured))
                : staleFrame(refs.current.frames[0])}
            </React.Fragment>
          </React.Fragment>
        );
      }

      // If state is stale render the stale frame
      if (refs.current.state.type === StateType.STALE) {
        console.log('@rendering stale frame', refs.current.state.frame);
        return (
          <React.Fragment key={ROOT_LEVEL}>
            <React.Fragment key={VISIBLE_LEVEL}>
              {staleFrame(refs.current.state.frame)}
            </React.Fragment>
          </React.Fragment>
        );
      }

      return null;
    }
  )
);
