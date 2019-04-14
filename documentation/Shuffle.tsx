import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { shuffle, range, uniq } from 'lodash';
import ReactMixitup from '../src/react-mixitup';

const getItems = () =>
  uniq(
    shuffle(range(Math.round(Math.random() * 40)).map(v => v + Math.round(Math.random() * 100)))
  );

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

const Shuffle = () => {
  const [items, setItems] = React.useState(getItems());

  const shuffleItems = React.useCallback(() => {
    setItems(getItems());
  }, []);

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
      <button onClick={shuffleItems}>Shuffle</button>
      <ReactMixitup items={items} renderCells={renderCells} Wrapper={Wrapper} duration={2500}/>
    </React.Fragment>
  );
};
export default Shuffle;
