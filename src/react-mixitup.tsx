import * as React from 'react';
import { createFrame } from './utils';

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
 * StageType
 *
 * Determines what to render in the component
 */
export enum StageType {
  /**
   * STALE
   *
   * If the animation finishes the next stage will be STALE.
   * Render the cells in the wrapper statically positioned.
   */
  STALE = 'STALE',
  /**
   * MEASURE
   *
   * If oldKeys.join() != nextKeys.join() then the next stage will be MEASURE.
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
   * If stage is MEASURE then the next stage will be COMMIT.
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
   * If stage is COMMIT or ANIMATE_COMMIT then the next stage will be ANIMATE.
   *
   * For each cell that should be moved, i.e the intersection between old keys and new keys, update style.translate to the new position.
   *
   * For each cell that should be removed, i.e those in old keys not present in new keys, update style.scale to 0
   *
   * For each cell that should be added, i.e. those in new keys not present in old keys, update style.cale to 1
   */
  ANIMATE = 'ANIMATE'
  /**
   * ANIMATE_MEASURE
   *
   * If stage is ANIMATE, and the keys are updated then the next stage will be ANIMATE_MEASURE.
   *
   * Render next cells in a hidden div and measure the position of each next cell.
   * Measure the height of the next hidden wrapper.
   *
   * The positions of the old cells should already be measured
   *
   * Render the same as in ANIMATE while rendering the measuring component.
   *
   */
  // replaced by MEASURE where stage.whileAnimating = true;
  // ANIMATE_MEASURE = 'ANIMATE_MEASURE',
  /**
   * ANIMATE_COMMIT
   *
   * If stage is ANIMATE_MEASURE then the next stage will be ANIMATE_COMMIT.
   *
   * Render all unique cells from the old lists of keys (notice plural on lists) and the next list of keys.
   * That is the the same as in ANIMATE.
   *
   * All cells which are now to be removed should be scaled to 0.
   *
   * All new cells, i.e those keys in next keys which are not in old keys should be translated to their
   * next position, and scaled to 0.
   */
  // replaced by COMMIT where stage.whileAnimating = true;
  // ANIMATE_COMMIT = 'ANIMATE_COMMIT'
}

/**
 * IFrame
 *
 * Holds information about the keys of rendered cells
 */
export interface IFrame {
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

  /**
   * a hash generated from the keys
   */
  hash: string;
}

/**
 * ICellStyle
 *
 * The styles passed to a cell
 */
export interface ICellStyle {
  transform?: string;
  transition?: string;
}

export interface IWrapperStyle {
  /**
   * used when rendering a measure stage
   */
  position?: 'absolute';
  width?: number;
  height?: number;
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
    ref: React.Ref<any>,
    stage: StageType,
    frame: IFrame
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
    cells: JSX.Element[],
    stage: StageType,
    frame: IFrame
  ) => React.ReactNode | JSX.Element;

  /**
   * Disable the transition
   */
  disableTransition?: boolean;

  /**
   * If the wrapper should grow/shrink vertically or horizontally when adding and removing cells
   */
  dynamicDirection: 'horizontal' | 'vertical' | 'off';

  transitionDuration: number;

  // default false. If true will remeasure all previous frames.
  // only useful if resizing container while animation is slow and multiple animations are queued.
  reMeasureAllPreviousFramesOnNewKeys?: boolean;

  // default undefined. if number will render the measure container, and keep it for debugMeasure ms
  // before removing
  debugMeasure?: number;
}

/**
 * Creates a hash of the keys in order to determine if the keys are updated
 */
export function getKeysHash(keys: (string | number)[]): string {
  return keys.map(k => `${(typeof k)[0]}${k}`).join(',');
}

export enum DOMLevel {
  ROOT = 'ROOT',
  VISIBLE = 'VISIBLE',
  WRAPPER = 'WRAPPER',
  HIDDEN = 'HIDDEN'
}

export const MixitupFragment = ({
  children,
  level
}: {
  children: React.ReactNode;
  level: DOMLevel;
}) => {
  return <React.Fragment>{children}</React.Fragment>;
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

export const TEST_COMPONENT_UPDATE_DELAY = 100;

type Stage =
  | {
      type: StageType.MEASURE;
      frameToMeasure: IFrame;
      whileAnimating: boolean;
    }
  | {
      type: StageType.ANIMATE;
    }
  | {
      type: StageType.COMMIT;
      whileAnimating: boolean;
    }
  | {
      type: StageType.STALE;
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
    (props: IProps, outerBoundRef: React.Ref<HTMLDivElement>): JSX.Element | null => {
      const {
        keys,
        renderCell,
        renderWrapper = defaultRenderWrapper,
        disableTransition = false,
        dynamicDirection,
        transitionDuration
      } = props;

      /* ensure every item is a string */
      if (new Set(keys).size !== keys.length) {
        throw new Error('In prop keys: every key must be unique');
      }

      const nextHash = getKeysHash(keys);

      const refs = React.useRef<{
        frames: IFrame[];
        persistedElement: JSX.Element | null;
        hash: undefined | string;
        stage: Stage;
      }>(undefined as any);

      if (!refs.current) {
        const frame = createFrame(keys);
        refs.current = {
          frames: [frame],
          persistedElement: null,
          hash: undefined,
          stage: { type: StageType.STALE, frame }
        };
      }

      const [, _update] = React.useState(0);
      const update = () => {
        setTimeout(
          () => {
            _update(i => i + 1);
          },
          process.env.NODE_ENV === 'test' ? TEST_COMPONENT_UPDATE_DELAY : 1
        );
      };

      React.useEffect(() => {
        const goToStaleOrNext = (cb: () => void) => {
          if (!props.debugMeasure) {
            cb();
            return;
          }

          // only use case is when running with debugMeasure
          // then you can update many times while in commit
          // and end up at with the same keys as in the start
          const lastFrame = refs.current.frames[refs.current.frames.length - 1];
          if (refs.current.frames[0].hash === lastFrame.hash) {
            refs.current.stage = {
              type: StageType.STALE,
              frame: lastFrame
            };
            update();
          } else {
            cb();
          }
        };
        const goToAnimate = () => {
          // from commit or measure
          goToStaleOrNext(() => {
            refs.current.stage = {
              type: StageType.ANIMATE
            };
            if (process.env.NODE_ENV === 'test') {
              setTimeout(() => {
                update();
              }, TEST_COMPONENT_UPDATE_DELAY);
            } else {
              window.requestAnimationFrame(() => {
                update();
              });
            }
          });
        };
        const goToCommit = (whileAnimating: boolean) => {
          // from measure
          goToStaleOrNext(() => {
            refs.current.stage = {
              type: StageType.COMMIT,
              whileAnimating
            };
            update();
          });
        };
        const maybeDelay = (cb: () => void) => {
          if (props.debugMeasure) {
            const t = setTimeout(() => {
              cb();
            }, props.debugMeasure);
            return () => {
              clearTimeout(t);
            };
          }
          cb();
        };
        if (refs.current.stage.type === StageType.MEASURE) {
          if (dynamicDirection === 'off') {
            // skip COMMIT phase, go straight to ANIMATE
            return maybeDelay(() => goToAnimate());
          }
          const whileAnimating = refs.current.stage.whileAnimating;
          return maybeDelay(() => goToCommit(whileAnimating));
        }

        if (refs.current.stage.type === StageType.COMMIT) {
          goToAnimate();
        }
      });

      if (refs.current.hash === undefined) {
        // first render
        refs.current.hash = nextHash;
      }

      if (refs.current.hash !== nextHash) {
        refs.current.hash = nextHash;
        const frame = createFrame(keys);
        if (disableTransition) {
          refs.current.frames.splice(0, refs.current.frames.length, frame);
          refs.current.stage = {
            type: StageType.STALE,
            frame
          };
        } else {
          refs.current.frames.push(frame);
          const whileAnimating =
            'whileAnimating' in refs.current.stage
              ? refs.current.stage.whileAnimating
              : refs.current.stage.type === StageType.ANIMATE;
          refs.current.stage = {
            type: StageType.MEASURE,
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
        keys,
        stageType
      }: {
        keys: { key: string | number; frame: IFrame }[];
        ref: (key: string | number, el: HTMLElement) => void;
        style: (key: string | number) => ICellStyle;
        stageType: StageType;
      }) => {
        const makeRef = (key: string | number) => {
          return (el: HTMLElement | null) => {
            if (el) {
              ref(key, el);
            }
          };
        };

        const cells = keys.map(({ key, frame }) => {
          return (
            <React.Fragment key={key}>
              {renderCell(key, style(key), makeRef(key), stageType, frame)}
            </React.Fragment>
          );
        });

        return cells;
      };

      const measureFrame = (frame: IFrame) => (
        <NotifyAboutRendered frame={frame}>
          {renderWrapper(
            props.debugMeasure
              ? {
                  position: 'absolute'
                }
              : {
                  position: 'absolute',
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
              keys: frame.keys.map(key => ({ key, frame })),
              style: staleStyle,
              stageType: StageType.MEASURE
            }),
            StageType.MEASURE,
            frame
          )}
        </NotifyAboutRendered>
      );

      const onEndOfTransition = () => {
        const frame = refs.current.frames[refs.current.frames.length - 1];
        refs.current.stage = {
          type: StageType.STALE,
          frame
        };
        // stale should always only have 1 frame
        refs.current.frames = [frame];

        update();
      };

      React.useEffect(() => {
        if (refs.current.stage.type === StageType.ANIMATE) {
          const timeout = setTimeout(() => {
            onEndOfTransition();
          }, transitionDuration);

          return () => {
            clearTimeout(timeout);
          };
        }
      });

      const staleStyle = (): ICellStyle => ({
        transition: '0s 0s all ease',
        transform: 'none'
      });

      // BEGIN RENDER

      // The keys used on the React.Fragments are there to assist React in preseving the DOM tree nodes and
      // prevent unmounting of components which interupts animation

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
        <MixitupFragment key={DOMLevel.WRAPPER} level={DOMLevel.WRAPPER}>
          {renderWrapper(
            {},
            () => {},
            cells({
              ref: () => {},
              keys: frame.keys.map(key => ({ key, frame })),
              style: staleStyle,
              stageType: StageType.STALE
            }),
            StageType.STALE,
            frame
          )}
        </MixitupFragment>
      );

      // If transitions are disabled, always render the staleFrame node
      if (disableTransition) {
        return (
          <MixitupFragment key={DOMLevel.ROOT} level={DOMLevel.ROOT}>
            <MixitupFragment key={DOMLevel.VISIBLE} level={DOMLevel.VISIBLE}>
              {staleFrame(refs.current.frames[refs.current.frames.length - 1])}
            </MixitupFragment>
          </MixitupFragment>
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
        type: StageType.ANIMATE | StageType.COMMIT,
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
          if (type === StageType.ANIMATE) {
            z = 1;
          } else {
            // scale from 0 -> 1 when going from COMMIT -> ANIMATE
            z = 0;
          }
        }

        /* will be removed */
        if (!frames[frames.length - 1].keys.includes(key)) {
          if (type === StageType.ANIMATE) {
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

      const getAllUniqueKeysForFrames = (frames: IFrame[]) => {
        const keys: { frame: IFrame; key: string | number }[] = [];
        const keysSet = new Set<string | number>();
        frames.forEach(frame => {
          frame.keys.forEach(key => {
            if (keysSet.has(key)) {
              return;
            }
            keysSet.add(key);
            keys.push({ frame, key });
          });
        });
        return keys;
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
        const lastFrame = frames[frames.length - 1];
        const height = lastFrame.containerHeight!;
        const width = lastFrame.containerWidth!;
        const styles: IWrapperStyle = {};
        if (dynamicDirection === 'horizontal') {
          styles.width = width;
        } else if (dynamicDirection === 'vertical') {
          styles.height = height;
        }
        const keys = getAllUniqueKeysForFrames(frames);
        return (
          <MixitupFragment key={DOMLevel.WRAPPER} level={DOMLevel.WRAPPER}>
            {renderWrapper(
              {
                ...styles
              },
              () => {},
              cells({
                ref: (key, el) => {},
                keys: keys,
                style: key => {
                  return animatedCellStyle(StageType.ANIMATE, key, frames);
                },
                stageType: StageType.ANIMATE
              }),
              StageType.ANIMATE,
              lastFrame
            )}
          </MixitupFragment>
        );
      };

      // When animating render the animatingFrame
      if (refs.current.stage.type === StageType.ANIMATE) {
        return (
          <MixitupFragment key={DOMLevel.ROOT} level={DOMLevel.ROOT}>
            <MixitupFragment key={DOMLevel.VISIBLE} level={DOMLevel.VISIBLE}>
              {animatingFrame(refs.current.frames)}
            </MixitupFragment>
          </MixitupFragment>
        );
      }

      // Commit will translate all elements to their corresponding static location of the previous frame.
      if (refs.current.stage.type === StageType.COMMIT) {
        const stage = refs.current.stage;
        let sizeFrame = refs.current.frames[refs.current.frames.length - 2];
        if (stage.whileAnimating) {
          sizeFrame = refs.current.frames[refs.current.frames.length - 1];
        }
        const height = sizeFrame.containerHeight!;
        const width = sizeFrame.containerWidth!;
        const styles: IWrapperStyle = {};
        if (dynamicDirection === 'horizontal') {
          styles.width = width;
        } else if (dynamicDirection === 'vertical') {
          styles.height = height;
        }
        const keys = getAllUniqueKeysForFrames(refs.current.frames);

        return (
          <MixitupFragment key={DOMLevel.ROOT} level={DOMLevel.ROOT}>
            <MixitupFragment key={DOMLevel.VISIBLE} level={DOMLevel.VISIBLE}>
              <MixitupFragment key={DOMLevel.WRAPPER} level={DOMLevel.WRAPPER}>
                {renderWrapper(
                  {
                    ...styles
                  },
                  () => {},
                  cells({
                    ref: (key, el) => {},
                    keys,
                    style: key => {
                      return animatedCellStyle(StageType.COMMIT, key, refs.current.frames);
                    },
                    stageType: StageType.COMMIT
                  }),
                  StageType.COMMIT,
                  sizeFrame
                )}
              </MixitupFragment>
            </MixitupFragment>
          </MixitupFragment>
        );
      }

      // Measure
      if (refs.current.stage.type === StageType.MEASURE) {
        const len = refs.current.frames.length;
        const lastFrame = refs.current.frames[len - 1];
        let measureFrames = refs.current.frames;
        if (!props.reMeasureAllPreviousFramesOnNewKeys) {
          measureFrames = [];
          refs.current.frames.forEach((frame, index) => {
            if (!frame.hasBeenMeasured) {
              measureFrames.push(frame);
            } else if (index >= len - 2) {
              // push the last 2 frames
              measureFrames.push(frame);
            }
          });
        }
        return (
          <MixitupFragment key={DOMLevel.ROOT} level={DOMLevel.ROOT}>
            <MixitupFragment key={DOMLevel.HIDDEN} level={DOMLevel.HIDDEN}>
              {measureFrames.map(frame => {
                return <React.Fragment key={frame.id}>{measureFrame(frame)}</React.Fragment>;
              })}
            </MixitupFragment>
            <MixitupFragment key={DOMLevel.VISIBLE} level={DOMLevel.VISIBLE}>
              {refs.current.stage.whileAnimating
                ? animatingFrame(refs.current.frames.filter(frame => frame.hasBeenMeasured))
                : staleFrame(refs.current.frames[0])}
            </MixitupFragment>
          </MixitupFragment>
        );
      }

      // If stage is stale render the stale frame
      if (refs.current.stage.type === StageType.STALE) {
        return (
          <MixitupFragment key={DOMLevel.ROOT} level={DOMLevel.ROOT}>
            <MixitupFragment key={DOMLevel.VISIBLE} level={DOMLevel.VISIBLE}>
              {staleFrame(refs.current.stage.frame)}
            </MixitupFragment>
          </MixitupFragment>
        );
      }

      return null;
    }
  )
);
