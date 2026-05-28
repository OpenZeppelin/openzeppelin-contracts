const { artifacts } = require('hardhat');
const { expect } = require('chai');

describe('IPausable', function () {
  it('exposes the Pausable events, errors, and getter in its ABI', async function () {
    const { abi } = await artifacts.readArtifact('IPausable');

    const names = abi.map(fragment => fragment.name).filter(Boolean);

    expect(names).to.include('Paused');
    expect(names).to.include('Unpaused');
    expect(names).to.include('EnforcedPause');
    expect(names).to.include('ExpectedPause');
    expect(names).to.include('paused');
    expect(names).to.not.include('pause');
    expect(names).to.not.include('unpause');
  });
});
