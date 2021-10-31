/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC721PermitMock = artifacts.require('ERC721PermitMock');

const { EIP712Domain, domainSeparator } = require('../../../helpers/eip712');

const Permit = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];

contract('ERC721Permit', function (accounts) {
  const [ initialHolder, spender, recipient, other ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';

  const initialTokenId = new BN('100');

  beforeEach(async function () {
    this.token = await ERC721PermitMock.new(name, symbol, initialHolder, initialTokenId);

    // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
    // from within the EVM as from the JSON RPC interface.
    // See https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await this.token.getChainId();
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(initialHolder)).to.be.bignumber.equal('0');
  });

  it('domain separator', async function () {
    expect(
      await this.token.DOMAIN_SEPARATOR(),
    ).to.equal(
      await domainSeparator(name, version, this.chainId, this.token.address),
    );
  });

  describe.only('permit', function () {
    const wallet = Wallet.generate();

    const owner = wallet.getAddressString();
    const value = initialTokenId;
    const nonce = 0;
    const maxDeadline = MAX_UINT256;

    const buildData = (chainId, verifyingContract, deadline = maxDeadline) => ({
      primaryType: 'Permit',
      types: { EIP712Domain, Permit },
      domain: { name, version, chainId, verifyingContract },
      message: { owner, spender, value, nonce, deadline },
    });

    it('accepts owner signature', async function () {
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      const receipt = await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      expect(await this.token.nonces(owner)).to.be.bignumber.equal('1');
      expect(await this.token.getApproved(value)).to.be.equal(spender);
    });

    it('rejects reused signature', async function () {
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);
      
      await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      await expectRevert(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'ERC721Permit: invalid signature',
      );
    });

    it('rejects other signature', async function () {
      const otherWallet = Wallet.generate();
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(otherWallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expectRevert(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'ERC721Permit: invalid signature',
      );
    });

    it('rejects expired permit', async function () {
      const deadline = (await time.latest()) - time.duration.weeks(1);

      const data = buildData(this.chainId, this.token.address, deadline);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expectRevert(
        this.token.permit(owner, spender, value, deadline, v, r, s),
        'ERC721Permit: expired deadline',
      );
    });
  });
});
