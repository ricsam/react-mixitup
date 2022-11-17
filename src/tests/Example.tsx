import React from 'react';
import { ReactMixitup } from '../react-mixitup';

export type Options = {
  dynamicDirection: 'off' | 'horizontal' | 'vertical';
  disableTransition?: boolean;
  debugMeasure?: number;
  transitionDuration: number;
};

export const Example = ({ keys, options }: { keys: number[]; options: Options }) => {
  return (
    <ReactMixitup
      ref={el => {}}
      keys={keys}
      dynamicDirection={options.dynamicDirection}
      disableTransition={options.disableTransition}
      debugMeasure={options.debugMeasure}
      transitionDuration={options.transitionDuration}
      renderCell={(key, style, ref, stage, frame) => (
        <div
          key={key}
          ref={ref}
          style={style}
          id="cell"
          data-stage={stage}
          data-key={key}
          data-frame-index={frame.index}
        >
          {key}
        </div>
      )}
      renderWrapper={(style, ref, cells, stage, frame) => (
        <div ref={ref} style={style} id="wrapper" data-stage={stage} data-frame-index={frame.index}>
          {cells}
        </div>
      )}
    />
  );
};
