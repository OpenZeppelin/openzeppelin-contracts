const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC1155PresetMinterPauser = artifacts.require('ERC1155PresetMinterPauser');

contract('ERC1155PresetMinterPauser', function (accounts) {
  const [ deployer, other ] = accounts;

  const firstTokenId = new BN('845');
  const firstTokenIdAmount = new BN('5000');

  const secondTokenId = new BN('48324');
  const secondTokenIdAmount = new BN('77875');

  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
  const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');

  const uri = 'https://token.com';

  beforeEach(async function () {
    this.token = await ERC1155PresetMinterPauser.new(uri, { from: deployer });
  });

  it('deployer has the default admin role', async function () {
    expect(await this.token.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.bignumber.equal('1');
    expect(await this.token.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(deployer);
  });

  it('deployer has the minter role', async function () {
    expect(await this.token.getRoleMemberCount(MINTER_ROLE)).to.be.bignumber.equal('1');
    expect(await this.token.getRoleMember(MINTER_ROLE, 0)).to.equal(deployer);
  });

  it('deployer has the pauser role', async function () {
    expect(await this.token.getRoleMemberCount(PAUSER_ROLE)).to.be.bignumber.equal('1');
    expect(await this.token.getRoleMember(PAUSER_ROLE, 0)).to.equal(deployer);
  });

  it('minter and pauser role admin is the default admin', async function () {
    expect(await this.token.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    expect(await this.token.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
  });

  describe('minting', function () {
    it('deployer can mint tokens', async function () {
      const receipt = await this.token.mint(other, firstTokenId, firstTokenIdAmount, '0x', { from: deployer });
      expectEvent(receipt, 'TransferSingle',
        { operator: deployer, from: ZERO_ADDRESS, to: other, value: firstTokenIdAmount, id: firstTokenId },
      );

      expect(await this.token.balanceOf(other, firstTokenId)).to.be.bignumber.equal(firstTokenIdAmount);
    });

    it('other accounts cannot mint tokens', async function () {
      await expectRevert(
        this.token.mint(other, firstTokenId, firstTokenIdAmount, '0x', { from: other }),
        'ERC1155PresetMinterPauser: must have minter role to mint',
      );
    });
  });

  describe('batched minting', function () {
    it('deployer can batch mint tokens', async function () {
      const receipt = await this.token.mintBatch(
        other, [firstTokenId, secondTokenId], [firstTokenIdAmount, secondTokenIdAmount], '0x', { from: deployer },
      );

      expectEvent(receipt, 'TransferBatch',
        { operator: deployer, from: ZERO_ADDRESS, to: other },
      );

      expect(await this.token.balanceOf(other, firstTokenId)).to.be.bignumber.equal(firstTokenIdAmount);
    });

    it('other accounts cannot batch mint tokens', async function () {
      await expectRevert(
        this.token.mintBatch(
          other, [firstTokenId, secondTokenId], [firstTokenIdAmount, secondTokenIdAmount], '0x', { from: other },
        ),
        'ERC1155PresetMinterPauser: must have minter role to mint',
      );
    });
  });

  describe('pausing', function () {
    it('deployer can pause', async function () {
      const receipt = await this.token.pause({ from: deployer });
      expectEvent(receipt, 'Paused', { account: deployer });

      expect(await this.token.paused()).to.equal(true);
    });

    it('deployer can unpause', async function () {
      await this.token.pause({ from: deployer });

      const receipt = await this.token.unpause({ from: deployer });
      expectEvent(receipt, 'Unpaused', { account: deployer });

      expect(await this.token.paused()).to.equal(false);
    });

    it('cannot mint while paused', async function () {
      await this.token.pause({ from: deployer });

      await expectRevert(
        this.token.mint(other, firstTokenId, firstTokenIdAmount, '0x', { from: deployer }),
        'ERC1155Pausable: token transfer while paused',
      );
    });

    it('other accounts cannot pause', async function () {
      await expectRevert(
        this.token.pause({ from: other }),
        'ERC1155PresetMinterPauser: must have pauser role to pause',
      );
    });
  });

  describe('burning', function () {
    it('holders can burn their tokens', async function () {
      await this.token.mint(other, firstTokenId, firstTokenIdAmount, '0x', { from: deployer });

      const receipt = await this.token.burn(other, firstTokenId, firstTokenIdAmount.subn(1), { from: other });
      expectEvent(receipt, 'TransferSingle',
        { operator: other, from: other, to: ZERO_ADDRESS, value: firstTokenIdAmount.subn(1), id: firstTokenId },
      );

      expect(await this.token.balanceOf(other, firstTokenId)).to.be.bignumber.equal('1');
    });
  });
});
