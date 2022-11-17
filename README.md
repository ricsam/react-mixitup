# react-mixitup

> Animate the addition, removal and shuffling of elements in react.

[![GitHub Repo stars](https://img.shields.io/github/stars/ricsam/react-mixitup?style=social)](https://github.com/ricsam/react-mixitup)

## Getting Started

Install react-mixitup

```sh
npm install --save react-mixitup
```
[![npm](https://img.shields.io/npm/v/react-mixitup)](https://www.npmjs.com/package/react-mixitup)
[![npm](https://img.shields.io/npm/dw/react-mixitup?label=npm%20downloads)](https://www.npmjs.com/package/react-mixitup)

# See [documentation](https://react-mixitup.ricsam.dev/docs/intro)

```tsx
import { ReactMixitup } from 'react-mixitup';

function Example() {
  const [keys, setKeys] = React.useState([1,2,3]);

  return (
    <div style={{ height: 64 }}>
      <button onClick={() => {
        setKeys(keys[0] === 1 ? [3,2,1] : [1,2,3]);
      }}>
        Mixitup
      </button>
      <ReactMixitup
        keys={keys}
        renderCell={(key, style, ref) => (
          <div
            key={key}
            ref={ref}
            style={{
              // You must set the transition property here!
              transition: 'transform 300ms linear',
              ...style,
            }}
          >
            {key}
          </div>
        )}
        renderWrapper={(style, ref, cells) => {
          return (
            <div
              style={{
                transition: 'height 300ms ease',
                display: 'flex',
                ...style
              }}
              ref={ref}
            >
              {cells}
            </div>
          );
        }}
        dynamicDirection="horizontal"
        transitionDuration={300}
      />
    </div>
  )
}
```


## License

MIT © [ricsam](https://github.com/ricsam)
