import React from 'react';
import { ReactMixitup, StageType } from '../../src/react-mixitup';
import { shuffle } from 'lodash';

const ANIMATION_DURATION = 250;

export const Horizontal = () => {
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
          <strong>dynamicDirection = 'horizontal'</strong>
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setKeys(keys[0] === 1 ? [3, 2, 1, 4, 5] : [1, 2, 3])}
          style={{ marginRight: '16px' }}
        >
          Mixitup
        </button>
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
          renderWrapper={(style, ref, cells) => {
            return (
              <div
                style={{
                  display: 'inline-flex',
                  transition: `width ${ANIMATION_DURATION}ms ease`,
                  borderRight: '1px solid black',
                  paddingRight: '4px',
                  ...style
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
        />
        <span style={{ paddingLeft: 4 }}>Moved horizontally</span>
      </div>
    </div>
  );
};

export const Vertical = () => {
  const [keys, setKeys] = React.useState([1, 2, 3]);

  return (
    <div
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        borderRadius: 12,
        padding: 16
      }}
    >
      <p>
        <strong>dynamicDirection = 'vertical'</strong>
      </p>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setKeys(keys[0] === 1 ? [3, 2, 1, 4, 5] : [1, 2, 3])}
          style={{ marginRight: '16px' }}
        >
          Mixitup
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
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
                  textAlign: 'center',
                  ...style
                }}
              >
                {key}
              </div>
            )}
            // Optional. ref and style must be passed
            renderWrapper={(style, ref, cells) => {
              return (
                <div
                  style={{
                    display: 'inline-block',
                    transition: `height ${ANIMATION_DURATION}ms ease`,
                    borderBottom: '1px solid black',
                    paddingBottom: '4px',
                    ...style
                  }}
                  ref={ref}
                >
                  {cells}
                </div>
              );
            }}
            // when adding and removing cells, should the wrapper grow/shrink vertically or horizontally?
            dynamicDirection="vertical"
            // the transitionDuration should match the transition on renderCell / renderWrapper
            transitionDuration={ANIMATION_DURATION}
          />
          <span>Moved vertically</span>
        </div>
      </div>
    </div>
  );
};

export const Off = () => {
  const [keys, setKeys] = React.useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  return (
    <div
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        borderRadius: 12,
        padding: 16
      }}
    >
      <p>
        <strong>dynamicDirection = 'off'</strong>
      </p>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingRight: '16px',
            textAlign: 'left'
          }}
        >
          <button onClick={() => setKeys(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]))} style={{}}>
            Shuffle
          </button>
          <button
            onClick={() =>
              setKeys(shuffle(keys.length === 9 ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9]))
            }
            style={{ marginTop: '4px' }}
          >
            Variable size ⚠️
          </button>
          <div style={{ padding: '0 8px' }}>
            <div>Variable size looks weird sometimes</div>
            <div>due to dynamicDirection = 'off'</div>
            <div>But just a shuffle looks okay,</div>
            <div>since no elements are removed or added</div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            position: 'relative'
          }}
        >
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
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '30px',
                  height: '30px',
                  ...style
                }}
              >
                {key}
              </div>
            )}
            // Optional. ref and style must be passed
            renderWrapper={(style, ref, cells) => {
              return (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    border: '1px solid black',
                    width: '92px',
                    boxSizing: 'border-box',
                    ...style
                  }}
                  ref={ref}
                >
                  {cells}
                </div>
              );
            }}
            // when adding and removing cells, should the wrapper grow/shrink vertically or horizontally?
            dynamicDirection="off"
            // the transitionDuration should match the transition on renderCell / renderWrapper
            transitionDuration={ANIMATION_DURATION}
            // debugMeasure={100000}
          />
          <span>Moved vertically</span>
        </div>
      </div>
    </div>
  );
};
