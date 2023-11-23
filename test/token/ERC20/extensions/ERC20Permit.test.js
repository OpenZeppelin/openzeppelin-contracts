/* eslint-disable */
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { BN, constants, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const ERC20Permit = artifacts.require('$ERC20Permit');

const {
  types: { Permit },
  getDomain,
  domainType,
  domainSeparator,
} = require('../../../helpers/eip712');
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

describe('ERC20 Permit Signer Interaction via Wallet Interface', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const NAME = 'My Token';
    const SYMBOL = 'MTKN';
    const VERSION = '1'; // By default it is '1' on-chain.
    const ONE_HOUR = 1 * 60 * 60;
    const BILLION_ETHER = ethers.parseEther('1000000000');

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const token = await ERC20Permit.new(NAME, SYMBOL, NAME);

    const network = await ethers.provider.getNetwork();

    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore?.timestamp;

    let deadline = 0;

    if (timestampBefore) {
      deadline = timestampBefore + ONE_HOUR;
    }

    const EIP712DomainDefinition = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ];

    const PermitDefinition = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ];

    const tokenDomainData = {
      name: await token.name(),
      version: '1',
      verifyingContract: token.address,
      chainId: Number(network.chainId),
    };

    const message = {
      owner: await owner.getAddress(),
      spender: await otherAccount.getAddress(),
      value: BILLION_ETHER,
      nonce: Number(await token.nonces(await owner.getAddress())),
      deadline: deadline,
    };

    const typedData = {
      types: {
        // EIP712Domain: EIP712DomainDefinition,
        Permit: PermitDefinition,
      },
      domain: tokenDomainData,
      primaryType: 'Permit',
      message: message,
    };

    const signature = await owner.signTypedData(typedData.domain, typedData.types, typedData.message);

    const verifiedAddress = ethers.verifyTypedData(typedData.domain, typedData.types, typedData.message, signature);

    expect(verifiedAddress).to.equal(await owner.getAddress());

    // Split the signature into v, r, and s values
    const r = signature.slice(0, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = '0x' + signature.slice(130, 132);

    return {
      token,
      owner,
      otherAccount,
      BILLION_ETHER,
      message,
      signature,
      r,
      s,
      v,
    };
  }

  describe('Permit and Transfer Functionality', function () {
    it('Should enables token transfer via EIP712 signed permits', async function () {
      const { owner, token, otherAccount, BILLION_ETHER, message, r, s, v } = await loadFixture(deployFixture);

      await token.$_mint(await owner.getAddress(), BILLION_ETHER);
      expect(await token.balanceOf(await owner.getAddress())).to.equal(BILLION_ETHER);

      await token.permit(
        await owner.getAddress(),
        await otherAccount.getAddress(),
        message.value,
        message.deadline,
        v,
        r,
        s,
        { from: otherAccount.address },
      );

      await token.transferFrom(await owner.getAddress(), await otherAccount.getAddress(), BILLION_ETHER, {
        from: otherAccount.address,
      });

      expect(await token.balanceOf(await owner.getAddress())).to.equal(0);
    });
  });
});
