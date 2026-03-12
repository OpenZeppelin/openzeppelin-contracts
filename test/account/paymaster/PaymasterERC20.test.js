const { ethers, predeploy } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { getDomain, formatType, PackedUserOperation } = require('../../helpers/eip712');
const { ERC4337Helper } = require('../../helpers/erc4337');
const { encodeBatch, encodeMode, CALL_TYPE_BATCH } = require('../../helpers/erc7579');

const { shouldBehaveLikePaymaster } = require('./Paymaster.behavior');

const value = ethers.parseEther('1');

async function fixture() {
  // EOAs and environment
  const [admin, receiver, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);

  // signers
  const accountSigner = ethers.Wallet.createRandom();
  const oracleSigner = ethers.Wallet.createRandom();

  // ERC-4337 account
  const helper = new ERC4337Helper();
  const account = await helper.newAccount('$AccountECDSAMock', [accountSigner, 'AccountECDSA', '1']);
  await account.deploy();

  // ERC-4337 paymaster
  const paymaster = await ethers.deployContract('$PaymasterERC20Mock', ['PaymasterERC20', '1']);
  await paymaster.$_grantRole(ethers.id('ORACLE_ROLE'), oracleSigner);
  await paymaster.$_grantRole(ethers.id('WITHDRAWER_ROLE'), admin);

  // Domains
  const entrypointDomain = await getDomain(predeploy.entrypoint.v09);
  const paymasterDomain = await getDomain(paymaster);

  const signUserOp = userOp =>
    accountSigner
      .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));

  // [0x00:0x14                      ] token                 (IERC20)
  // [0x14:0x1a                      ] validAfter            (uint48)
  // [0x1a:0x20                      ] validUntil            (uint48)
  // [0x20:0x40                      ] tokenPrice            (uint256)
  // [0x40:0x54                      ] oracle                (address)
  // [0x54:0x56                      ] oracleSignatureLength (uint16)
  // [0x56:0x56+oracleSignatureLength] oracleSignature       (bytes)
  const paymasterSignUserOp =
    oracle =>
    (userOp, { validAfter = 0n, validUntil = 0n, tokenPrice = ethers.WeiPerEther, erc20 = token } = {}) => {
      userOp.paymasterData = ethers.solidityPacked(
        ['address', 'uint48', 'uint48', 'uint256', 'address'],
        [
          erc20.target ?? erc20.address ?? erc20,
          validAfter,
          validUntil,
          tokenPrice,
          oracle.target ?? oracle.address ?? oracle,
        ],
      );
      return Promise.all([
        oracle.signTypedData(
          paymasterDomain,
          {
            TokenPrice: formatType({
              token: 'address',
              validAfter: 'uint48',
              validUntil: 'uint48',
              tokenPrice: 'uint256',
            }),
          },
          {
            token: erc20.target ?? erc20.address ?? erc20,
            validAfter,
            validUntil,
            tokenPrice,
          },
        ),
      ]).then(([oracleSignature]) => {
        userOp.paymasterData = ethers.concat([
          userOp.paymasterData,
          ethers.solidityPacked(['uint16', 'bytes'], [ethers.getBytes(oracleSignature).length, oracleSignature]),
        ]);
        return userOp;
      });
    };

  return {
    admin,
    receiver,
    other,
    target,
    token,
    account,
    paymaster,
    signUserOp,
    paymasterSignUserOp: paymasterSignUserOp(oracleSigner), // sign using the correct key
    paymasterSignUserOpInvalid: paymasterSignUserOp(other), // sign using the wrong key
  };
}

describe('PaymasterERC20', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('core paymaster behavior', async function () {
    beforeEach(async function () {
      await this.token.$_mint(this.account, value);
      await this.token.$_approve(this.account, this.paymaster, ethers.MaxUint256);
    });

    shouldBehaveLikePaymaster({ timeRange: true });
  });

  describe('pays with ERC-20 tokens', function () {
    beforeEach(async function () {
      await this.paymaster.deposit({ value });
      this.userOp ??= {};
      this.userOp.paymaster = this.paymaster;
    });

    it('succeeds paying with ERC-20 tokens', async function () {
      // fund account
      await this.token.$_mint(this.account, value);
      await this.token.$_approve(this.account, this.paymaster, ethers.MaxUint256);

      this.extraCalls = [];
      this.tokenMovements = [
        { account: this.account, factor: -1n },
        { account: this.paymaster, factor: 1n },
      ];

      const signedUserOp = await this.account
        // prepare user operation, with paymaster data
        .createUserOp({
          ...this.userOp,
          callData: this.account.interface.encodeFunctionData('execute', [
            encodeMode({ callType: CALL_TYPE_BATCH }),
            encodeBatch(...this.extraCalls, {
              target: this.target,
              data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
            }),
          ]),
        })
        .then(op =>
          this.paymasterSignUserOp(op, {
            tokenPrice: 2n * ethers.WeiPerEther,
          }),
        )
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      const txPromise = predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

      // check main events (target call and sponsoring)
      await expect(txPromise)
        .to.emit(this.paymaster, 'UserOperationSponsored')
        .withArgs(signedUserOp.hash(), this.token, anyValue, 2n * ethers.WeiPerEther)
        .to.emit(this.target, 'MockFunctionCalledExtra')
        .withArgs(this.account, 0n);

      // parse logs:
      // - get tokenAmount repaid for the paymaster event
      // - get the actual gas cost from the entrypoint event
      const { logs } = await txPromise.then(tx => tx.wait());
      const { tokenAmount } = logs.map(ev => this.paymaster.interface.parseLog(ev)).find(Boolean).args;
      const { actualGasCost } = logs.find(ev => ev.fragment?.name == 'UserOperationEvent').args;
      // check token balances moved as expected
      await expect(txPromise).to.changeTokenBalances(
        this.token,
        this.tokenMovements.map(({ account }) => account),
        this.tokenMovements.map(({ factor = 0n, offset = 0n }) => offset + tokenAmount * factor),
      );
      // check that ether moved as expected
      await expect(txPromise).to.changeEtherBalances(
        [predeploy.entrypoint.v09, this.receiver],
        [-actualGasCost, actualGasCost],
      );

      // check token cost is within the expected values
      // skip gas consumption tests when running coverage (significantly affects the postOp costs)
      if (!process.env.COVERAGE) {
        expect(tokenAmount)
          .to.be.greaterThan(actualGasCost * 2n)
          .to.be.lessThan((actualGasCost * 2n * 110n) / 100n); // covers costs with no more than 10% overcost
      }
    });

    it('reverts with PaymasterERC20FailedRefund when token refund fails', async function () {
      const erc20Blocklist = await ethers.deployContract('$ERC20BlocklistMock', ['Token', 'TKN']);

      // fund account with the malicious token
      await erc20Blocklist.$_mint(this.account, value);
      await erc20Blocklist.$_approve(this.account, this.paymaster, ethers.MaxUint256);

      const extraCalls = [
        // Set the token to block all transfers during postOp
        {
          target: erc20Blocklist,
          data: erc20Blocklist.interface.encodeFunctionData('$_blockUser', [this.paymaster.target]),
        },
      ];

      const signedUserOp = await this.account
        .createUserOp({
          ...this.userOp,
          callData: this.account.interface.encodeFunctionData('execute', [
            encodeMode({ callType: CALL_TYPE_BATCH }),
            encodeBatch(...extraCalls, {
              target: this.target,
              data: this.target.interface.encodeFunctionData('mockFunctionExtra'),
            }),
          ]),
        })
        .then(op =>
          this.paymasterSignUserOp(op, {
            tokenPrice: 2n * ethers.WeiPerEther,
            erc20: erc20Blocklist,
          }),
        )
        .then(op => this.signUserOp(op));

      const txPromise = predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

      // Reverted post op does not revert the operation
      const { logs } = await txPromise.then(tx => tx.wait());
      const [, , , postOpRevertReason] = logs.find(v => v.fragment?.name === 'PostOpRevertReason').args;
      const postOpError = predeploy.entrypoint.v09.interface.parseError(postOpRevertReason);
      expect(postOpError.name).to.eq('PostOpReverted');
      const [paymasterRevertReason] = postOpError.args;
      const { name, args } = this.paymaster.interface.parseError(paymasterRevertReason);
      expect(name).to.eq('PaymasterERC20FailedRefund');
      const [token, prefundAmount] = args;
      expect(token).to.eq(erc20Blocklist.target);
      await expect(txPromise).changeTokenBalances(
        erc20Blocklist,
        [this.paymaster, signedUserOp.sender],
        [prefundAmount, -prefundAmount],
      );
    });

    it('reverts with an invalid token', async function () {
      // prepare user operation, with paymaster data
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op, { erc20: this.other })) // not a token
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });

    it('reverts with insufficient balance', async function () {
      await this.token.$_mint(this.account, 1n); // not enough
      await this.token.$_approve(this.account, this.paymaster, ethers.MaxUint256);

      // prepare user operation, with paymaster data
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op))
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });

    it('reverts with insufficient approval', async function () {
      await this.token.$_mint(this.account, value);
      await this.token.$_approve(this.account, this.paymaster, 1n);

      // prepare user operation, with paymaster data
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op))
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });
  });

  describe('withdraw ERC-20 tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.paymaster, value);
    });

    it('withdraw some token', async function () {
      await expect(
        this.paymaster.connect(this.admin).withdrawTokens(this.token, this.receiver, 10n),
      ).to.changeTokenBalances(this.token, [this.paymaster, this.receiver], [-10n, 10n]);
    });

    it('withdraw all token', async function () {
      await expect(
        this.paymaster.connect(this.admin).withdrawTokens(this.token, this.receiver, ethers.MaxUint256),
      ).to.changeTokenBalances(this.token, [this.paymaster, this.receiver], [-value, value]);
    });

    it('only admin can withdraw', async function () {
      await expect(this.paymaster.connect(this.other).withdrawTokens(this.token, this.receiver, 10n)).to.be.reverted;
    });
  });
});
