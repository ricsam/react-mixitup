import React from 'react';
import './App.css';
import styled, { ThemeProvider } from 'styled-components';
import { range, shuffle } from 'lodash';
import { ReactMixitup } from 'react-mixitup';

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

const numKeys = 44;
const initialSubsetLength = 2;

declare module 'styled-components' {
  export interface DefaultTheme {
    viewport: 'sm' | 'md' | 'lg';
    numberOfCols: {
      sm: 4;
      md: 6;
      lg: 8;
    };
    margins: {
      sm: 4;
      md: 6;
      lg: 8;
    };
  }
}

const theme: import('styled-components').DefaultTheme = {
  viewport: 'sm',
  numberOfCols: {
    sm: 4,
    md: 6,
    lg: 8
  },
  margins: {
    sm: 4,
    md: 6,
    lg: 8
  }
};

const WrapperStyle = styled.div`
  transition: height 1s ease;
  border-bottom: 1px solid black;
`;

const Middle = styled.div`
  max-width: 1024px;
`;
const Flex = styled.div`
  display: flex;
  justify-content: space-between;
`;

const getViewport = (): 'lg' | 'md' | 'sm' => {
  const w = window.innerWidth;
  if (w > 1600) {
    return 'lg';
  }
  if (w > 728) {
    return 'md';
  }
  return 'sm';
};
const strList = (l: number[]) => {
  return l.map(v => String(v));
};

function App() {
  const [keys, setKeys] = React.useState(() => strList(range(numKeys)));
  const [subset, setSubset] = React.useState(() => strList(range(2)));
  const [viewport, setViewport] = React.useState(() => getViewport());

  React.useEffect(() => {
    const listener = () => {
      setViewport(getViewport());
    };
    window.addEventListener('resize', listener, { passive: true });
    return () => {
      window.removeEventListener('resize', listener);
    };
  }, []);

  const _shuffle = () => {
    setKeys(strList(shuffle(range(numKeys))));
  };

  const _toggleSubset = () => {
    setSubset(subset => {
      return strList(
        subset.length === initialSubsetLength
          ? [...range(2), ...shuffle(range(12)).map(i => i + 24), ...range(20).map(i => i + 50)]
          : range(initialSubsetLength)
      );
    });
  };

  const _theme = React.useMemo(() => {
    return {
      ...theme,
      viewport
    };
  }, [viewport]);

  return (
    <Middle>
      <ThemeProvider theme={_theme}>
        <React.Fragment>
          <Flex>
            <div>
              <button onClick={_shuffle}>Shuffle</button>
              <ReactMixitup
                keys={keys}
                renderCell={(key, style, ref) => (
                  <Box
                    key={key}
                    ref={ref}
                    style={{
                      width: '48px',
                      height: '48px',
                      transition: `transform ${Number(key) % 2 === 0 ? '1' : '0.25'}s ease`,
                      ...style
                    }}
                  >
                    {key}
                  </Box>
                )}
                renderWrapper={(style, ref, children) => {
                  return (
                    <WrapperStyle
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        boxSizing: 'border-box',
                        width: '640px',
                        padding: '12px',
                        ...style
                      }}
                      ref={ref}
                    >
                      {children}
                    </WrapperStyle>
                  );
                }}
              />
            </div>
            <div>
              <button onClick={_toggleSubset}>Toggle subset</button>
              <ReactMixitup
                keys={subset}
                renderCell={(key, style, ref) => (
                  <Box
                    key={key}
                    ref={ref}
                    style={{
                      width: '48px',
                      height: '48px',
                      transition: `transform ${Number(key) % 2 === 0 ? '1' : '0.25'}s ease`,
                      ...style
                    }}
                  >
                    {key}
                  </Box>
                )}
                renderWrapper={(style, ref, children) => {
                  return (
                    <WrapperStyle
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        boxSizing: 'border-box',
                        width: '640px',
                        padding: '12px',
                        ...style
                      }}
                      ref={ref}
                    >
                      {children}
                    </WrapperStyle>
                  );
                }}
              />
            </div>
          </Flex>
          <div>
            <button onClick={_toggleSubset}>Toggle subset</button>
            <ReactMixitup
              keys={subset}
              renderCell={(key, style, ref) => (
                <Box
                  key={key}
                  ref={ref}
                  style={{
                    width: '48px',
                    height: '48px',
                    transition: `transform ${Number(key) % 2 === 0 ? '1' : '0.25'}s ease`,
                    ...style
                  }}
                >
                  {key}
                </Box>
              )}
              renderWrapper={(style, ref, children) => {
                return (
                  <WrapperStyle
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      boxSizing: 'border-box',
                      width: '640px',
                      padding: '12px',
                      ...style
                    }}
                    ref={ref}
                  >
                    {children}
                  </WrapperStyle>
                );
              }}
              disableTransition
            />
          </div>
        </React.Fragment>
      </ThemeProvider>
    </Middle>
  );
}

export default App;
