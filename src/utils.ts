import { IFrame, getKeysHash } from './react-mixitup';

export const createFrame = (keys: (string | number)[], index: number): IFrame => {
  const nextHash = getKeysHash(keys);
  return {
    index,
    hash: nextHash,
    keys,
    containerHeight: undefined,
    containerWidth: undefined,
    positions: {},
    hasBeenMeasured: false
  };
};
