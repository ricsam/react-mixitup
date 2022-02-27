import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { shuffle, range, uniq } from 'lodash';
import { ReactMixitup } from '../../../src/react-mixitup';
import { useEffect } from 'react';

// const getItems = () =>
//   uniq(
//     shuffle(
//       range(Math.round(Math.random() * 40)).map(v => String(v + Math.round(Math.random() * 100)))
//     )
//   );
const getItems = () => shuffle(range(9)).map(s => String(s));

const duration = 3000;

export const Shuffle = () => {
  // const [items, setItems] = React.useState(getItems());
  const [items, setItems] = React.useState([1, 2]);

  // const shuffleItems = () => {
  //   setItems(getItems());
  // };
  const shuffleItems = () => {
    setItems(items[0] === 1 ? [2, 1] : [1, 2]);
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        height: 720,
        paddingTop: 16
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button type="button" className="button button--primary" onClick={shuffleItems}>
          Shuffle
        </button>
      </div>
      <ReactMixitup
        keys={items}
        renderCell={(key, style, ref) => (
          <div
            key={key}
            ref={ref}
            style={{
              padding: '8px',
              transition: `transform ${duration}ms linear`,
              ...style,
            }}
          >
            <div
              className="square"
              style={{
                width: 160,
                height: 160,
                color: 'black',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px'
              }}
            >
              {key}
            </div>
          </div>
        )}
        dynamicDirection="vertical"
        transitionDuration={duration}
        renderWrapper={(style, ref, children) => {
          return (
            <div
              style={{
                transition: `height ${duration}ms ease`,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'center',
                width: '75%',
                margin: 'auto',
                padding: '16px',
                maxWidth: '560px',
                ...style
              }}
              ref={ref}
            >
              {children}
            </div>
          );
        }}
      />
    </div>
  );
};
