/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { ReactMixitup } from '../../../../src/react-mixitup';
import { shuffle, range, uniq, random } from 'lodash';

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ReactMixitup,
  StageType: {
    ANIMATE: 'ANIMATE',
    MEASURE: 'MEASURE',
    COMMIT: 'COMMIT',
    STALE: 'STALE',
  },
  shuffle,
  range,
  uniq,
  random,
};
export default ReactLiveScope;
