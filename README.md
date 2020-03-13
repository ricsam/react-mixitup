# react-mixitup

> Animate the addition, removal and shuffling of elements.

[![NPM](https://img.shields.io/npm/v/react-mixitup.svg)](https://www.npmjs.com/package/react-mixitup) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-mixitup
```

## Usage

```tsx
import * as React from 'react';
import ReactMixitup from 'react-mixitup';
import { shuffle, range } from 'lodash';

const Example = () => {
  const [keys, setKeys] = useState([1, 2, 3, 4]);

  const updateKeys = useCallback(() => {
    setKeys(updateKeys(range(Math.round(Math.random() * 15))));
  }, []);

  const renderCell = useCallback(({ key, ref, style }) => (
    <div key={key} ref={ref} style={{ ...style, background: 'red' }}>
      {key}
    </div>
  ), []);

  return (
    <Fragment>
      <button onClick={updateKeys}>Shuffle</button>
      <ReactMixitup renderCell={renderCell} keys={keys} />
    </Fragment>
  );
};
```

#### ReactMixitup props

**keys** `string[]`

An array of unique ids.

**duration** `number` optional, default: 500

How long should the animation last

**enableTransition** `boolean` optional

If false no transition and transform will happend. Items will just be rearanged

**renderCells** `(items: { key: string, style: CSSProperties, ref?: Ref }) => ReactNode`

This function will be used to render each cell.
The library will internaly add the key attribute to each cell so you don't have to do that.
The style is used to position the cell using css transforms.
The ref is used to measure the size and current position of the cell.

**Wrapper** `(props: { style: CssProperties, children: ReactNode }) => ReactNode` optional

The wrapping component.
The props.style.height of this component will dynamically change when the items change. The children will be a react component containing the cells.

## License

MIT © [ricsam](https://github.com/ricsam)
