import { IFrame, getKeysHash } from './react-mixitup';

export const createFrame = <RMKey extends string | number>(
  keys: RMKey[],
  index: number
): IFrame<RMKey> => {
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
