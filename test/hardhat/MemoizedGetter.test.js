import { expect } from 'chai';
import { defineGetterMemoized } from '../../hardhat/hardhat-solidity-docgen/internal/utils/memoized-getter.ts';

describe('defineGetterMemoized', function () {
  it('retries the getter after it throws', function () {
    let count = 0;
    const obj = {};

    defineGetterMemoized(obj, 'value', () => {
      count++;
      throw new Error('boom');
    });

    expect(() => obj.value).to.throw('boom');
    expect(() => obj.value).to.throw('boom');
    expect(count).to.equal(2);
  });

  it('detects recursive access', function () {
    const obj = {};

    defineGetterMemoized(obj, 'value', () => obj.value);

    expect(() => obj.value).to.throw('Detected recursion');
  });
});
