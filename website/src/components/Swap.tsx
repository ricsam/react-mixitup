import React from 'react';
import { ReactMixitup } from '../src/react-mixitup';
import { strList } from './utils';

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
          display: 'flex',
          flexWrap: 'wrap',
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
  const [keys, setItems] = React.useState(strList([1, 2, 3]));

  const shuffleItems = React.useCallback(() => {
    setA(!a);
    if (!a) {
      setItems(strList([1, 2, 3]));
    } else {
      setItems(strList([3, 2, 1]));
    }
  }, [a]);

  return (
    <React.Fragment>
      <button onClick={shuffleItems}>Swap</button>
      <ReactMixitup
        keys={keys}
        renderCell={(key, style, ref) => (
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
        )}
        renderWrapper={(style, ref, children) => {
          return (
            <Wrapper style={style} ref={ref}>
              {children}
            </Wrapper>
          );
        }}
      />
    </React.Fragment>
  );
};
export default Swap;
