import { range, shuffle } from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactMixitup } from './react-mixitup';

describe('Dummy test', () => {
  it('works if true is truthy', () => {
    const Example = () => {
      const [keys, setKeys] = React.useState([1, 2, 3, 4]);

      const shuffleKeys = React.useCallback(() => {
        setKeys(shuffle(range(Math.round(Math.random() * 15))));
      }, []);

      return (
        <React.Fragment>
          <button onClick={shuffleKeys}>Shuffle</button>
          <ReactMixitup
            keys={keys}
            dynamicDirection="vertical"
            transitionDuration={250}
            renderCell={(key, style, ref) => {
              return (
                <div
                  key={key}
                  ref={ref}
                  style={{
                    width: '48px',
                    height: '48px',
                    transition: `transform ${Number(key) % 2 === 0 ? '1' : '0.25'}s ease`,
                    color: 'rgba(0, 0, 0, 0.5)',
                    fontWeight: 'bold',
                    background: 'white',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    margin: '8px',
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,\n    'Open Sans', 'Helvetica Neue', sans-serif",
                    borderRadius: '4px',
                    ...style
                  }}
                >
                  {key}
                </div>
              );
            }}
          />
        </React.Fragment>
      );
    };
    const div = document.createElement('div');
    ReactDOM.render(<Example />, div);
  });
});
