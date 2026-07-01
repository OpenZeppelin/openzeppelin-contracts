const { artifacts } = require('hardhat');
const { expect } = require('chai');

describe('IPausable', function () {
  it('exposes the Pausable events, errors, and getter in its ABI', async function () {
    const { abi } = await artifacts.readArtifact('IPausable');

    const names = abi
      .map(fragment => fragment.name)
      .filter(Boolean)
      .sort();

    expect(names).to.deep.equal(['EnforcedPause', 'ExpectedPause', 'Paused', 'Unpaused', 'paused']);
  });
});
