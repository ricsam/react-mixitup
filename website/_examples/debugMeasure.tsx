import React from 'react';
import { ReactMixitup, StageType } from '../../src/react-mixitup';
import { shuffle } from 'lodash';

const ANIMATION_DURATION = 250;

export const DebugMeasure = () => {
  const [keys, setKeys] = React.useState([1, 2, 3]);

  return (
    <div
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        borderRadius: 12,
        padding: 16
      }}
    >
      <div>
        <p>
          <strong>debugMeasure = 1000</strong>
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: '12px' }}>
        <button
          onClick={() => setKeys(keys[0] === 1 ? [3, 2, 1, 4, 5] : [1, 2, 3])}
          style={{ marginRight: '16px' }}
        >
          Mixitup
        </button>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <ReactMixitup
            // unique list of keys to identify each cell.
            keys={keys}
            // is called to render each cell. ref and style must be passed
            renderCell={(key, style, ref) => (
              <div
                key={key}
                ref={ref}
                style={{
                  transition: `transform ${ANIMATION_DURATION}ms linear`,
                  ...style
                }}
              >
                {key}
              </div>
            )}
            // Optional. ref and style must be passed
            renderWrapper={(style, ref, cells, stage) => {
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    transition: `width ${ANIMATION_DURATION}ms ease`,
                    borderRight: '1px solid black',
                    paddingRight: '4px',
                    height: '20px',
                    alignItems: 'center',
                    background: stage === StageType.MEASURE ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
                    top: stage === StageType.MEASURE ? -24 : 'auto',
                    left: stage === StageType.MEASURE ? (cells.length === 5 ? 30 : 0) : 'auto',
                    ...style
                    // position: 'static',
                  }}
                  ref={ref}
                >
                  {cells}
                </div>
              );
            }}
            // when adding and removing cells, should the wrapper grow/shrink vertically or horizontally?
            dynamicDirection="horizontal"
            // the transitionDuration should match the transition on renderCell / renderWrapper
            transitionDuration={ANIMATION_DURATION}
            debugMeasure={1000}
            reMeasureAllPreviousFramesOnNewKeys
          />
          <span style={{ paddingLeft: 4 }}>Moved horizontally</span>
        </div>
      </div>
    </div>
  );
};
