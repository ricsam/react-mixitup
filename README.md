# react-mixitup

> Animate the addition, removal and shuffling of elements.

[![NPM](https://img.shields.io/npm/v/react-mixitup.svg)](https://www.npmjs.com/package/react-mixitup) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-mixitup
```

## Usage

```tsx
import * as React from 'react'
import ReactMixitup from 'react-mixitup'
import { shuffle, range } from 'lodash'

class Example extends React.Component {
  state = { items: [1, 2, 3, 4] }

  shuffle = () =>
    this.setState({
      items: shuffle(range(Math.round(Math.random() * 15)))
    })

  render() {
    return (
      <Fragment>
        <button onClick={this.shuffle}>Shuffle</button>
        <ReactMixitup
          items={this.state.items}
          renderCells={items => (
            <div style={{ background: 'yellow' }}>
              {items.map(({ key, ref, style }) => (
                <div key={key} ref={ref} style={{ ...style, background: 'red' }}>
                  {key}
                </div>
              ))}
            </div>
          )}
        />
      </Fragment>
    )
  }
}
```

## License

MIT © [ricsam](https://github.com/ricsam)
