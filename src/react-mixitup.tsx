import React from 'react';
import { createFrame, getKeysHash } from './utils';

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
   * // DEPRECATED, see note bellow
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
   * // DEPRECATED, see note bellow
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
export interface IFrame<RMKey extends string | number> {
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
  keys: RMKey[];
  /**
   * The positions of each cell
   */
  positions: IPositions;
  /**
   * A unique index used for debugging purposes to differentiate each IFrame
   */
  index: number;
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
 * The styles passed to a renderCell
 */
export interface ICellStyle {
  position?: 'absolute';
  top?: string;
  left?: string;
  margin?: '0px';
  transition?: string;
  transform?: string;
}

/**
 * IWrapperStyle
 *
 * The styles passed to the renderWrapper
 */
export interface IWrapperStyle {
  // position absolute in MEASURE stage and position relative in ANIMATE and COMMIT stage
  // undefined in STALE stage
  position?: 'absolute' | 'relative';
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
interface IProps<RMKey extends string | number> {
  /**
   * keys should be a unique list of strings or numbers.
   */
  keys: RMKey[];
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
    key: RMKey,
    style: ICellStyle,
    ref: React.Ref<any>,
    stage: StageType,
    frame: IFrame<RMKey>,
    activeFrame: boolean
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
    frame: IFrame<RMKey>,
    activeFrame: boolean
  ) => React.ReactNode | JSX.Element;

  /**
   * Disable the transition
   */
  disableTransition?: boolean;

  /**
   * If the wrapper should grow/shrink vertically or horizontally when adding and removing cells
   */
  dynamicDirection: 'horizontal' | 'vertical' | 'off';

  /**
   * How long is the transition? Should be the same as the transition-duration css property value set on each cell
   */
  transitionDuration: number;

  /**
   * Default undefined. If number will render the measure container, and keep it for debugMeasure ms
   * before removing
   */
  debugMeasure?: number;
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
export type RenderWrapper<RMKey extends string | number> = Exclude<
  IProps<RMKey>['renderWrapper'],
  undefined
>;

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
export type RenderCell<RMKey extends string | number> = Exclude<
  IProps<RMKey>['renderCell'],
  undefined
>;

/**
 * Default renderer
 */
const defaultRenderWrapper: RenderWrapper<string | number> = (style, ref, cells) => {
  return (
    <div style={style} ref={ref}>
      {cells}
    </div>
  );
};

export const TEST_COMPONENT_UPDATE_DELAY = 100;

type Stage<RMKey extends string | number> =
  | {
      type: StageType.MEASURE;
      frameToMeasure: IFrame<RMKey>;
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
      frame: IFrame<RMKey>;
    };

const NotifyAboutRendered = <RMKey extends string | number>({
  children,
  frame
}: {
  children: React.ReactNode | JSX.Element;
  frame: IFrame<RMKey>;
}) => {
  React.useLayoutEffect(() => {
    frame.hasBeenMeasured = true;
  }, [frame]);
  return <>{children}</>;
};

const processEnv = (name: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
};

const debug = (...msg: any[]) => {
  if (processEnv('DEBUG:react-mixitup')) {
    console.log(...msg);
  } else if (typeof window !== 'undefined') {
    try {
      if (window.localStorage) {
        if (window.localStorage.getItem('DEBUG:react-mixitup')) {
          console.log(...msg);
        }
      }
    } catch (err) {}
  }
};

export function ReactMixitupComponent<RMKey extends string | number>(
  props: IProps<RMKey>,
  outerBoundRef: React.Ref<HTMLDivElement>
): JSX.Element | null {
  const {
    keys,
    renderCell,
    renderWrapper = defaultRenderWrapper,
    disableTransition: disableTransitionProp,
    dynamicDirection,
    transitionDuration
  } = props;

  const disableTransition = !!disableTransitionProp || transitionDuration === 0 || false;

  if (!keys) {
    throw new Error('Invalid keys: keys must be provided');
  }

  if (new Set(keys).size !== keys.length) {
    throw new Error('Invalid keys: every key must be unique');
  }

  if (typeof transitionDuration !== 'number' || transitionDuration < 0) {
    throw new Error('Invalid transitionDuration: transition duration must be a number > 0');
  }

  if (!renderCell || typeof renderCell !== 'function') {
    throw new Error('Invalid renderCell: must be a function');
  }

  if (!renderWrapper || typeof renderWrapper !== 'function') {
    throw new Error('Invalid renderWrapper: must be a function');
  }

  if (props.debugMeasure && typeof props.debugMeasure !== 'number') {
    throw new Error('Invalid debugMeasure: must be a number');
  }

  const indexRef = React.useRef(0);

  const nextHash = getKeysHash(keys);

  const refs = React.useRef<{
    frames: IFrame<RMKey>[];
    persistedElement: JSX.Element | null;
    hash: undefined | string;
    stage: Stage<RMKey>;
  }>(undefined as any);

  if (!refs.current) {
    const frame = createFrame(keys, indexRef.current++);
    refs.current = {
      frames: [frame],
      persistedElement: null,
      hash: undefined,
      stage: { type: StageType.STALE, frame }
    };
  }

  const [, _update] = React.useState(0);

  const hasUnmounted = React.useRef(false);
  React.useEffect(() => {
    hasUnmounted.current = false;
    return () => {
      hasUnmounted.current = true;
    };
  }, []);

  const update = () => {
    setTimeout(
      () => {
        if (!hasUnmounted.current) {
          _update(i => i + 1);
        }
      },
      processEnv('NODE_ENV') === 'test' ? TEST_COMPONENT_UPDATE_DELAY : 1
    );
  };

  function goToStale(frame: IFrame<RMKey>) {
    debug('go to STALE');
    refs.current.stage = {
      type: StageType.STALE,
      frame
    };
    // stale should always only have 1 frame
    refs.current.frames = [frame];

    update();
  }

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
        debug('due to last frame being the same as first key we go straight back to STALE');
        goToStale(lastFrame);
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
        if (processEnv('NODE_ENV') === 'test') {
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
    const frame = createFrame(keys, indexRef.current++);
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

  const measureGridItems = (frame: IFrame<RMKey>, key: string | number, el: HTMLElement) => {
    const pos = {
      x: el.offsetLeft,
      y: el.offsetTop
    };
    frame.positions[key] = pos;
  };

  const wrapperMeasureContainerSize = (frame: IFrame<RMKey>, el: HTMLElement | null) => {
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
    stageType,
    activeFrame
  }: {
    keys: { key: RMKey; frame: IFrame<RMKey> }[];
    ref: (key: RMKey, el: HTMLElement) => void;
    style: (key: RMKey) => ICellStyle;
    stageType: StageType;
    activeFrame: boolean;
  }) => {
    const makeRef = (key: RMKey) => {
      return (el: HTMLElement | null) => {
        if (el) {
          ref(key, el);
        }
      };
    };

    const cells = keys.map(({ key, frame }) => {
      return (
        <React.Fragment key={key}>
          {renderCell(key, style(key), makeRef(key), stageType, frame, activeFrame)}
        </React.Fragment>
      );
    });

    return cells;
  };

  const measureFrame = (frame: IFrame<RMKey>, activeFrame: boolean) => (
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
          if (outerBoundRef) {
            if (typeof outerBoundRef === 'function') {
              outerBoundRef(el);
            } else if ('current' in outerBoundRef) {
              try {
                (outerBoundRef as React.MutableRefObject<HTMLDivElement>).current = el;
              } catch (err) {
                // ignore "Cannot assign to read only property..." errors
              }
            }
          }
        },
        cells({
          ref: (key, el) => {
            measureGridItems(frame, key, el);
          },
          keys: frame.keys.map(key => ({ key, frame })),
          style: staleStyle,
          stageType: StageType.MEASURE,
          activeFrame
        }),
        StageType.MEASURE,
        frame,
        activeFrame
      )}
    </NotifyAboutRendered>
  );

  const onEndOfTransition = () => {
    const frame = refs.current.frames[refs.current.frames.length - 1];
    debug('end of transition');
    goToStale(frame);
  };

  React.useEffect(() => {
    if (refs.current.stage.type === StageType.ANIMATE) {
      debug('set timeout');
      const timeout = setTimeout(() => {
        onEndOfTransition();
      }, transitionDuration);

      return () => {
        debug('clear timeout');
        clearTimeout(timeout);
      };
    }
  });

  const staleStyle = (): ICellStyle => ({
    transition: '0s 0s all ease',
    transform: 'none'
  });

  debug('current stage', refs.current.stage.type);

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
  const staleFrame = (frame: IFrame<RMKey>) => (
    <MixitupFragment key={DOMLevel.WRAPPER} level={DOMLevel.WRAPPER}>
      {renderWrapper(
        {},
        () => {},
        cells({
          ref: () => {},
          keys: frame.keys.map(key => ({ key, frame })),
          style: staleStyle,
          stageType: StageType.STALE,
          activeFrame: true
        }),
        StageType.STALE,
        frame,
        true
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
  const getKeyFrameParticipation = (frames: IFrame<RMKey>[], key: RMKey): number[] => {
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
    key: RMKey,
    frames: IFrame<RMKey>[],
    commitWhileAnimating: boolean
  ): ICellStyle => {
    let z = 1;

    const indexes = getKeyFrameParticipation(frames, key);
    if (indexes.length === 0) {
      throw new Error('something went wrong in the lib');
    }

    const { x: xTarget, y: yTarget } = frames[indexes[0]].positions[key];
    const { x: xSource, y: ySource } = frames[indexes[indexes.length - 1]].positions[key];

    const style: ICellStyle = {
      position: 'absolute',
      top: '0px',
      left: '0px',
      margin: '0px'
    };

    /* will be added */
    // Last frame has the key.
    // The key has not been added before.
    // Type is commit
    if (
      frames[frames.length - 1].keys.includes(key) &&
      indexes.length === 1 &&
      type === StageType.COMMIT
    ) {
      // scale from 0 -> 1 when going from COMMIT -> ANIMATE
      z = 0;
    }

    /* will be removed */
    if (!frames[frames.length - 1].keys.includes(key)) {
      // simply remove
      z = 0;
    }

    const xDiff = xTarget - xSource;
    const yDiff = yTarget - ySource;

    style.left = xSource + 'px';
    style.top = ySource + 'px';

    if (type === StageType.COMMIT && !commitWhileAnimating) {
      // if (type === StageType.COMMIT) {
      style.transform = `translate3d(${[0, 0, 0].join('px,')}px) scale(${z})`;
    } else {
      style.transform = `translate3d(${[xDiff, yDiff, 0].join('px,')}px) scale(${z})`;
    }
    return style;
  };

  const getAllUniqueKeysForFrames = (frames: IFrame<RMKey>[]) => {
    const keys: { frame: IFrame<RMKey>; key: RMKey }[] = [];
    const keysSet = new Set<RMKey>();
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
  const animatingFrame = (frames: IFrame<RMKey>[]) => {
    const lastFrame = frames[frames.length - 1];
    const height = lastFrame.containerHeight!;
    const width = lastFrame.containerWidth!;
    const styles: IWrapperStyle = {
      position: 'relative'
    };
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
              return animatedCellStyle(StageType.ANIMATE, key, frames, false);
            },
            stageType: StageType.ANIMATE,
            activeFrame: true
          }),
          StageType.ANIMATE,
          lastFrame,
          true
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
    const styles: IWrapperStyle = {
      position: 'relative'
    };
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
                  return animatedCellStyle(
                    StageType.COMMIT,
                    key,
                    refs.current.frames,
                    stage.whileAnimating
                  );
                },
                stageType: StageType.COMMIT,
                activeFrame: true
              }),
              StageType.COMMIT,
              sizeFrame,
              true
            )}
          </MixitupFragment>
        </MixitupFragment>
      </MixitupFragment>
    );
  }

  // Measure
  if (refs.current.stage.type === StageType.MEASURE) {
    const len = refs.current.frames.length;
    let measureFrames = refs.current.frames;
    // all frames can be measured, but it is better to just measure the 2 last frames for performance reasons
    measureFrames = [];
    refs.current.frames.forEach((frame, index) => {
      if (!frame.hasBeenMeasured) {
        measureFrames.push(frame);
      } else if (index >= len - 2) {
        // push the last 2 frames
        measureFrames.push(frame);
      }
    });
    return (
      <MixitupFragment key={DOMLevel.ROOT} level={DOMLevel.ROOT}>
        <MixitupFragment key={DOMLevel.HIDDEN} level={DOMLevel.HIDDEN}>
          {measureFrames.map((frame, index) => {
            return (
              <React.Fragment key={frame.index}>
                {measureFrame(frame, index === measureFrames.length - 1)}
              </React.Fragment>
            );
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

type ReactMixitup = <RMKey extends string | number>(
  props: IProps<RMKey> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => JSX.Element | null;

export const ReactMixitup = React.memo(React.forwardRef(ReactMixitupComponent)) as ReactMixitup;
