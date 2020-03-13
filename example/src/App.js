import React, { Component, Fragment } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { range, shuffle } from 'lodash';
import { ReactMixitup } from 'react-mixitup';
import { viewportEpic, getViewport, margins, numberOfCols } from '@rdey/design';

const Box = styled.div`
  height: 10px;
  width: 100%;
  color: rgba(0, 0, 0, 0.5);
  font-weight: bold;
  background: white;
  font-size: 12px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  margin: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Open Sans', 'Helvetica Neue', sans-serif;
  border-radius: 4px;
`;

const Container = styled.div`
  padding: 24px;
  background-color: grey;
  margin: 2em 0;
`;

const numKeys = 44;
const initialSubsetLength = 2;

const Row = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const CellWrapper = styled.div`
  ${({ theme: { viewport, numberOfCols, margins }, first, last }) => {
    const columns = numberOfCols[viewport];
    const margin = margins[viewport];
    const baseWidth = `calc(${100 / columns}% + ${margin / columns}px`;
    const width = `${baseWidth} - ${(margin * columns) / columns}px - ${(margin * 2) / columns}px)`;
    return `
      min-width: ${width};
      max-width: ${width};
      ${first ? `margin-left: ${margin}px` : ''}
      ${!last ? `margin-right: ${margin}px` : ''}
    `;
  }}
`;

function getRows(arr, rowSize) {
  if (arr.length < rowSize) {
    return [arr];
  }
  const rows = [[]];

  for (let i = 0; i < arr.length; i += 1) {
    if (i % rowSize === 0 && i > 0) {
      rows.push([]);
    }
    rows[rows.length - 1].push(arr[i]);
  }
  return rows;
}

const WrapperStyle = styled.div`
  transition: height 0.5s ease;
  border-bottom: 1px solid black;
`;
const Wrapper = props => {
  return <WrapperStyle style={{ display: 'flex', ...props.style }}>{props.children}</WrapperStyle>;
};
const GridWrapper = React.forwardRef((props, ref) => {
  return (
    <WrapperStyle
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        boxSizing: 'border-box',
        width: '640px',
        ...props.style
      }}
      ref={ref}
    >
      {props.children}
    </WrapperStyle>
  );
});

const ExampleWrapper = styled.div`
  display: flex;
  max-width: 1024px;
  justify-content: space-between;
`;

export default class App extends Component {
  state = {
    keys: range(numKeys),
    subset: range(2),
    viewport: getViewport()
  };

  componentDidMount() {
    this.subscription = viewportEpic().subscribe(({ viewport }) => {
      this.setState({ viewport });
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  shuffle = () => {
    this.setState({
      keys: shuffle(range(numKeys))
    });
  };

  toggleSubset = () => {
    this.setState(prevState => {
      return {
        subset:
          prevState.subset.length === initialSubsetLength
            ? [...range(2), ...shuffle(range(12)).map(i => i + 24), ...range(20).map(i => i + 50)]
            : range(initialSubsetLength)
      };
    });
  };

  render() {
    const { viewport } = this.state;
    const cols = numberOfCols[viewport];
    const renderCell = ({ key, ref, style }) => (
      <Box key={key} ref={ref} style={{ width: '48px', height: '48px', ...style }}>
        {key}
      </Box>
    );
    return (
      <ExampleWrapper>
        <ThemeProvider theme={{ viewport, margins: margins, numberOfCols: numberOfCols }}>
          <Fragment>
            <div>
              <button onClick={this.shuffle}>Shuffle</button>
              <ReactMixitup
                Wrapper="div"
                keys={this.state.keys}
                Wrapper={GridWrapper}
                renderCell={renderCell}
                duration={5000}
                enableTransition={false}
              />
            </div>
            <div>
              <button onClick={this.toggleSubset}>Toggle subset</button>
              <ReactMixitup
                keys={this.state.subset}
                duration={5000}
                Wrapper={GridWrapper}
                renderCell={renderCell}
                enableTransition={false}
              />
            </div>
          </Fragment>
        </ThemeProvider>
      </ExampleWrapper>
    );
  }
}
