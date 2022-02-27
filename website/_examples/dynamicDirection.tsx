import React from 'react';
import { ReactMixitup } from '../../src/react-mixitup';

const ANIMATION_DURATION = 3000;

export const Horizontal = () => {
  const [keys, setKeys] = React.useState([1, 2, 3]);

  return (
    <div>
      <button onClick={() => setKeys(keys[0] === 1 ? [3, 2, 1] : [1, 2, 3])}>Mixitup</button>
      <ReactMixitup
        // unique list of keys to identify each cell.
        keys={keys}
        // is called to render each cell. ref and style must be passed
        renderCell={(key, style, ref) => (
          <div
            key={key}
            ref={ref}
            style={{
              ...style,
              transition: `transform ${ANIMATION_DURATION}ms linear`
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
    </div>
  );
};


export const Vertical = () => {
  const [keys, setKeys] = React.useState([1, 2, 3]);

  return (
    <div>
      <button onClick={() => setKeys(keys[0] === 1 ? [3, 2, 1] : [1, 2, 3])}>Mixitup</button>
      <ReactMixitup
        // unique list of keys to identify each cell.
        keys={keys}
        // is called to render each cell. ref and style must be passed
        renderCell={(key, style, ref) => (
          <div
            key={key}
            ref={ref}
            style={{
              ...style,
              transition: `transform ${ANIMATION_DURATION}ms linear`
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
                flexDirection: 'column',
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
    </div>
  );
};
