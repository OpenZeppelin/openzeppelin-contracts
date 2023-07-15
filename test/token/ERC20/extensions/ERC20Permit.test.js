/* eslint-disable */

const { BN, constants, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC20Permit = artifacts.require('$ERC20Permit');

const { Permit, getDomain, domainType, domainSeparator } = require('../../../helpers/eip712');
const { getChainId } = require('../../../helpers/chainid');
const { expectRevertCustomError } = require('../../../helpers/customError');

contract('ERC20Permit', function (accounts) {
  const [initialHolder, spender] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

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
    expect(await this.token.DOMAIN_SEPARATOR()).to.equal(await getDomain(this.token).then(domainSeparator));
  });

  describe('permit', function () {
    const wallet = Wallet.generate();

    const owner = wallet.getAddressString();
    const value = new BN(42);
    const nonce = 0;
    const maxDeadline = MAX_UINT256;

    const buildData = (contract, deadline = maxDeadline) =>
      getDomain(contract).then(domain => ({
        primaryType: 'Permit',
        types: { EIP712Domain: domainType(domain), Permit },
        domain,
        message: { owner, spender, value, nonce, deadline },
      }));

    it('accepts owner signature', async function () {
      const { v, r, s } = await buildData(this.token)
        .then(data => ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data }))
        .then(fromRpcSig);

      await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      expect(await this.token.nonces(owner)).to.be.bignumber.equal('1');
      expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
    });

    it('rejects reused signature', async function () {
      const sig = await buildData(this.token).then(data =>
        ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data }),
      );
      const { r, s, v } = fromRpcSig(sig);

      await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      const domain = await getDomain(this.token);
      const typedMessage = {
        primaryType: 'Permit',
        types: { EIP712Domain: domainType(domain), Permit },
        domain,
        message: { owner, spender, value, nonce: nonce + 1, deadline: maxDeadline },
      };

      await expectRevertCustomError(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'ERC2612InvalidSigner',
        [ethSigUtil.recoverTypedSignature({ data: typedMessage, sig }), owner],
      );
    });

    it('rejects other signature', async function () {
      const otherWallet = Wallet.generate();

      const { v, r, s } = await buildData(this.token)
        .then(data => ethSigUtil.signTypedMessage(otherWallet.getPrivateKey(), { data }))
        .then(fromRpcSig);

      await expectRevertCustomError(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'ERC2612InvalidSigner',
        [await otherWallet.getAddressString(), owner],
      );
    });

    it('rejects expired permit', async function () {
      const deadline = (await time.latest()) - time.duration.weeks(1);

      const { v, r, s } = await buildData(this.token, deadline)
        .then(data => ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data }))
        .then(fromRpcSig);

      await expectRevertCustomError(
        this.token.permit(owner, spender, value, deadline, v, r, s),
        'ERC2612ExpiredSignature',
        [deadline],
      );
    });
  });
});
