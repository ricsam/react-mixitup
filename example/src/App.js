import React, { Component, Fragment } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { range, shuffle } from 'lodash'
import ReactMixitup from 'react-mixitup'
import { viewportEpic, getViewport, margins, numberOfCols } from '@rdey/design'

const Box = styled.div`
  background-color: red;
  height: 10px;
  width: 100%;
  color: white;
  font-size: 12px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Container = styled.div`
  padding: 24px;
  background-color: grey;
  margin: 2em 0;
`

const numItems = 44
const initialSubsetLength = 2

const Row = styled.div`
  display: flex;
  justify-content: flex-start;
`

const CellWrapper = styled.div`
  ${({ theme: { viewport, numberOfCols, margins }, first, last }) => {
    const columns = numberOfCols[viewport]
    const margin = margins[viewport]
    const baseWidth = `calc(${100 / columns}% + ${margin / columns}px`
    const width = `${baseWidth} - ${(margin * columns) / columns}px - ${(margin * 2) / columns}px)`
    return `
      min-width: ${width};
      max-width: ${width};
      ${first ? `margin-left: ${margin}px` : ''}
      ${!last ? `margin-right: ${margin}px` : ''}
    `
  }}
`

function getRows(arr, rowSize: number) {
  if (arr.length < rowSize) {
    return [arr]
  }
  const rows = [[]]

  for (let i = 0; i < arr.length; i += 1) {
    if (i % rowSize === 0 && i > 0) {
      rows.push([])
    }
    rows[rows.length - 1].push(arr[i])
  }
  return rows
}

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
            <div style={{ background: 'yellow', display: 'flex' }}>
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

export default class App extends Component {
  state = {
    items: range(numItems),
    subset: range(2),
    viewport: getViewport()
  }

  componentDidMount() {
    this.subscription = viewportEpic().subscribe(({ viewport }) => {
      this.setState({ viewport })
    })
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  shuffle = () => {
    this.setState({
      items: shuffle(range(numItems))
    })
  }

  toggleSubset = () => {
    this.setState(prevState => {
      return {
        subset:
          prevState.subset.length === initialSubsetLength
            ? [...range(2), ...shuffle(range(12)).map(i => i + 24), ...range(2).map(i => i + 50)]
            : range(initialSubsetLength)
      }
    })
  }

  render() {
    const { viewport } = this.state
    const cols = numberOfCols[viewport]
    return (
      <div>
        <Example />
        <ThemeProvider theme={{ viewport, margins: margins, numberOfCols: numberOfCols }}>
          <Fragment>
            {/* <button onClick={this.shuffle}>Shuffle</button>
        <ReactMixitup
          viewport={viewport}
          items={this.state.items.map((ii) => ({
            Cell: () => <Box key={ii}>{ii}</Box>,
            key: ii,
          }))}
          duration={5000}
        /> */}
            <button onClick={this.toggleSubset}>Toggle subset</button>
            <ReactMixitup
              items={this.state.subset}
              duration={5000}
              renderCells={items => {
                /* items = { key, ref, style }[] */
                return getRows(items, cols).map((rowItems, index) => {
                  const rowKey = rowItems.map(({ key }) => key).join(',')
                  return (
                    <Row emptySpace={cols - rowItems.length} key={rowKey}>
                      {rowItems.map(({ ref, style, key }, index) => {
                        return (
                          <CellWrapper
                            key={key}
                            first={index === 0}
                            last={index === rowItems.length - 1}
                            ref={ref}
                            style={style}
                          >
                            <Box>{key}</Box>
                          </CellWrapper>
                        )
                      })}
                    </Row>
                  )
                })
              }}
            />
          </Fragment>
        </ThemeProvider>
      </div>
    )
  }
}
