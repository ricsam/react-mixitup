# react-mixitup

> Animate the addition, removal and shuffling of elements.

[![NPM](https://img.shields.io/npm/v/react-mixitup.svg)](https://www.npmjs.com/package/react-mixitup)

## Getting Started

Install react-mixitup

```sh
npm install react-mixitup
```
# See [documentation](https://react-mixitup.ricsam.dev/docs/intro)

```tsx live
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
