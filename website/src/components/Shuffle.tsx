import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { shuffle, range, uniq } from 'lodash';
import { ReactMixitup, StageType } from '../../../src/react-mixitup';
import { useEffect } from 'react';
import Link from '@docusaurus/Link';
import styles from './shuffle.module.css';
import clsx from 'clsx';

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

// const getItems = () => shuffle(range(88)).map(s => String(s));

const initial = range(100).map(String);

export const Shuffle = () => {
  const [muchShuffle, setMuchShuffle] = React.useState(false);
  const getItems = () =>
    uniq(shuffle(range(getRandomInt(muchShuffle ? 0 : 48, 100)).map(String)));

  const [items, setItems] = React.useState(initial);
  const duration = 500;
  // const [items, setItems] = React.useState([1, 2]);

  const shuffleItems = () => {
    setItems(getItems());
  };
  // const shuffleItems = () => {
  //   setItems(items[0] === 1 ? [2, 1] : [1, 2]);
  // };

  useEffect(() => {
    if (muchShuffle) {
      const i = setInterval(() => {
        shuffleItems();
      }, 250);
      return () => {
        clearInterval(i);
      };
    }
  }, [muchShuffle]);

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        height: 720,
        paddingTop: 16
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button type="button" className="button button--primary" onClick={shuffleItems}>
          Shuffle
        </button>
        <div style={{ width: 16 }}></div>
        <button
          type="button"
          className={clsx('button', muchShuffle ? 'button--danger' : 'button--secondary')}
          onClick={() => {
            if (!muchShuffle) {
              shuffleItems();
            }
            setMuchShuffle(!muchShuffle);
          }}
        >
          {muchShuffle ? 'Stop' : 'Shuffle a lot'}
        </button>
        <div style={{ width: 16 }}></div>
        <Link
          to="/docs/intro"
          type="button"
          className="button button--secondary"
          onClick={shuffleItems}
        >
          Get started
        </Link>
      </div>
      <ReactMixitup
        keys={items}
        renderCell={(key, style, ref, stage) => {
          return (
            <div
              key={key}
              ref={ref}
              style={{
                padding: '2px',
                transition: `transform ${duration}ms linear`,
                transformOrigin: 'center center',
                ...style
              }}
            >
              <div className={styles.square}>{key}</div>
            </div>
          );
        }}
        dynamicDirection="vertical"
        transitionDuration={duration}
        renderWrapper={(style, ref, children, stage) => {
          return (
            <div
              style={{
                transition: `height ${duration}ms ease`,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                alignContent: 'flex-start',
                justifyContent: 'center',
                width: '75%',
                margin: 'auto',
                padding: '16px',
                maxWidth: '560px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                ...style
                // height: 400
              }}
              ref={ref}
            >
              {children}
            </div>
          );
        }}
      />
    </div>
  );
};
