import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { shuffle, range, uniq } from 'lodash';
import ReactMixitup from '../src/react-mixitup';

const Wrapper = React.forwardRef(
  (
    { children, style }: { children: React.ReactNode; style: React.CSSProperties },
    ref: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div
        style={{
          transition: 'height 0.5s ease',
          borderBottom: '1px solid black',
          maxWidth: `${80 * 6}px`,
          ...style
        }}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

const Swap = () => {
  const [a, setA] = React.useState(true);
  const [items, setItems] = React.useState([1, 2, 3]);

  const shuffleItems = React.useCallback(() => {
    setA(!a);
    if (!a) {
      setItems([1, 2, 3]);
    } else {
      setItems([3, 2, 1]);
    }
  }, [a]);

  const renderCells = React.useCallback(
    (
      cells: Array<{
        key: string;
        ref?: React.Ref<any>;
        style?: React.CSSProperties;
      }>
    ) => (
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {cells.map(({ key, ref, style }) => (
          <div
            key={key}
            ref={ref}
            style={{
              ...style,
              background: 'red',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {key}
          </div>
        ))}
      </div>
    ),
    []
  );

  return (
    <React.Fragment>
      <button onClick={shuffleItems}>Swap</button>
      <ReactMixitup items={items} renderCells={renderCells} Wrapper={Wrapper} duration={2500} />
    </React.Fragment>
  );
};
export default Swap;
