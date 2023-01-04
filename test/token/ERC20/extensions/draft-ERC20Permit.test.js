/* eslint-disable */

const { BN, constants, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC20Permit = artifacts.require('$ERC20Permit');

const { EIP712Domain, Permit, domainSeparator } = require('../../../helpers/eip712');
const { getChainId } = require('../../../helpers/chainid');

contract('ERC20Permit', function (accounts) {
  const [initialHolder, spender] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const version = '1';

  const initialSupply = new BN(100);

  beforeEach(async function () {
    this.chainId = await getChainId();

    this.token = await ERC20Permit.new(name, symbol, name);
    await this.token.$_mint(initialHolder, initialSupply);
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(initialHolder)).to.be.bignumber.equal('0');
  });

  it('domain separator', async function () {
    expect(await this.token.DOMAIN_SEPARATOR()).to.equal(
      await domainSeparator({ name, version, chainId: this.chainId, verifyingContract: this.token.address }),
    );
  });

  describe('permit', function () {
    const wallet = Wallet.generate();

    const owner = wallet.getAddressString();
    const value = new BN(42);
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

      await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      expect(await this.token.nonces(owner)).to.be.bignumber.equal('1');
      expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
    });

    it('rejects reused signature', async function () {
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      await expectRevert(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'ERC20Permit: invalid signature',
      );
    });

    it('rejects other signature', async function () {
      const otherWallet = Wallet.generate();
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(otherWallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expectRevert(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'ERC20Permit: invalid signature',
      );
    });

    it('rejects expired permit', async function () {
      const deadline = (await time.latest()) - time.duration.weeks(1);

      const data = buildData(this.chainId, this.token.address, deadline);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expectRevert(this.token.permit(owner, spender, value, deadline, v, r, s), 'ERC20Permit: expired deadline');
    });
  });
});
