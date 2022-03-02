import { IFrame, getKeysHash } from './react-mixitup';

export const createFrame = (keys: (string | number)[]): IFrame => {
  const nextHash = getKeysHash(keys);
  return {
    id: String(Math.random()),
    hash: nextHash,
    keys,
    containerHeight: undefined,
    containerWidth: undefined,
    positions: {},
    hasBeenMeasured: false
  };
};
