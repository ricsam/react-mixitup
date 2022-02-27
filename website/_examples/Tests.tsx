import React from 'react';
import { range, shuffle } from 'lodash';
import { ReactMixitup } from '../../src/react-mixitup';

const numKeys = 44;
const initialSubsetLength = 2;

const Box = React.forwardRef<any, { children: React.ReactNode; style?: React.CSSProperties }>(
  ({ children, style }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          height: '24px',
          width: '100%',
          color: 'rgba(0, 0, 0, 0.5)',
          fontWeight: 'bold',
          background: 'white',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          margin: '8px',
          borderRadius: '4px',
          ...style
        }}
      >
        {children}
      </div>
    );
  }
);

const WrapperStyle = React.forwardRef<
  any,
  { children: React.ReactNode; style?: React.CSSProperties }
>(({ children, style }, ref) => (
  <div
    ref={ref}
    style={{ transition: 'height 1s ease', borderBottom: '1px solid black', ...style }}
  >
    {children}
  </div>
));

const Middle = ({
  children,
  style
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => <div style={{ maxWidth: '1024px', ...style }}>{children}</div>;
const Flex = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', ...style }}>{children}</div>
);

export function Tests() {
  const [keys, setKeys] = React.useState(() => range(numKeys));
  const [subset, setSubset] = React.useState(() => range(2));

  const _shuffle = () => {
    setKeys(shuffle(range(numKeys)));
  };

  const _toggleSubset = () => {
    setSubset(subset => {
      return subset.length === initialSubsetLength
        ? [...range(2), ...shuffle(range(12)).map(i => i + 24), ...range(20).map(i => i + 50)]
        : range(initialSubsetLength);
    });
  };

  return (
    <Middle>
      <React.Fragment>
        <Flex>
          <div>
            <button onClick={_shuffle}>Shuffle</button>
            <ReactMixitup
              keys={keys}
              dynamicDirection="vertical"
              transitionDuration={1000}
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
              dynamicDirection="vertical"
              transitionDuration={1000}
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
            dynamicDirection="vertical"
            transitionDuration={1000}
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
    </Middle>
  );
}
