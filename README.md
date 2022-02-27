# react-mixitup

> Animate the addition, removal and shuffling of elements.

[![NPM](https://img.shields.io/npm/v/react-mixitup.svg)](https://www.npmjs.com/package/react-mixitup) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-mixitup
```

## Usage

```tsx
import React from 'react';
import ReactMixitup from 'react-mixitup';
import { shuffle, range } from 'lodash';

const Example = () => {
  const [keys, setKeys] = useState(['1', '2', '3', '4']);

  const updateKeys = () => {
    setKeys(range(Math.round(Math.random() * 15)).map(String));
  };

  return (
    <Fragment>
      <button onClick={updateKeys}>Shuffle</button>
      <ReactMixitup
        keys={keys}
        renderCell={(key, style, ref) => (
          <div ref={ref} style={{ ...style, background: 'red', transition: 'transform 0.5s ease' }}>
            {key}
          </div>
        )}
      />
    </Fragment>
  );
};
```

#### ReactMixitup props

**keys** `string[]`

An array of unique ids.

**disableTransition** `boolean` _optional_

If true no transition and transform will happend. Items will just be rearanged

**renderCell** `(key: string, style: CSSProperties, ref: Ref) => ReactNode`

This function will be used to render each cell.
The style is used to position the cell using css transforms.
The ref is used to measure the size and current position of the cell.

**renderWrapper** `(style: CssProperties, ref: Ref, children: ReactNode) => ReactNode` _optional_

Returns the wrapping component.
The props.style.height of this component will dynamically change when the items change. The children will be a react component containing the cells.

## License

MIT © [ricsam](https://github.com/ricsam)
