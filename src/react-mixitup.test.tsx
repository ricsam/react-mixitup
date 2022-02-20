import { range, shuffle } from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ReactMixitup from './react-mixitup';

/**
 * Dummy test
 */
describe('Dummy test', () => {
  it('works if true is truthy', () => {
    const Example = () => {
      const [items, setItems] = React.useState([1, 2, 3, 4]);

      const shuffleItems = React.useCallback(() => {
        setItems(shuffle(range(Math.round(Math.random() * 15))));
      }, []);

      const renderCells = React.useCallback(
        (
          cells: Array<{
            key: string;
            ref?: React.Ref<any>;
            style?: React.CSSProperties;
          }>
        ) => (
          <div style={{ background: 'yellow' }}>
            {cells.map(({ key, ref, style }) => (
              <div key={key} ref={ref} style={{ ...style, background: 'red' }}>
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
          <ReactMixitup items={items} renderCells={renderCells} />
        </React.Fragment>
      );
    };
    const div = document.createElement('div');
    ReactDOM.render(<Example />, div);
  });
});
