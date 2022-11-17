import type { IFrame } from './react-mixitup';

/**
 * Creates a hash of the keys in order to determine if the keys are updated
 */
export function getKeysHash(keys: (string | number)[]): string {
  return keys.map(k => `${(typeof k)[0]}${k}`).join(',');
}

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
