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
  const [admin, receiver, guarantor, other] = await ethers.getSigners();
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
  const paymaster = await ethers.deployContract('$PaymasterERC20GuarantorMock', ['PaymasterERC20Guarantor', '1']);
  await paymaster.$_grantRole(ethers.id('ORACLE_ROLE'), oracleSigner);
  await paymaster.$_grantRole(ethers.id('WITHDRAWER_ROLE'), admin);

  // Domains
  const entrypointDomain = await getDomain(predeploy.entrypoint.v09);
  const paymasterDomain = await getDomain(paymaster);

  const signUserOp = userOp =>
    accountSigner
      .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));

  // Paymaster data format:
  // [0x00:0x14                      ] token                 (IERC20)
  // [0x14:0x1a                      ] validAfter            (uint48)
  // [0x1a:0x20                      ] validUntil            (uint48)
  // [0x20:0x40                      ] tokenPrice            (uint256)
  // [0x40:0x54                      ] oracle                (address)
  // [0x54:0x56                      ] oracleSignatureLength (uint16)
  // [0x56:0x56+oracleSignatureLength] oracleSignature       (bytes)
  // [0x00:0x14                      ] guarantor                (address) (optional: 0 if no guarantor)
  // [0x14:0x16                      ] guarantorSignatureLength (uint16)
  // [0x16:0x16+guarantorSignatureLn ] guarantorSignature       (bytes)

  const paymasterSignUserOp =
    oracle =>
    (
      userOp,
      { validAfter = 0n, validUntil = 0n, tokenPrice = ethers.WeiPerEther, guarantor = undefined, erc20 = token } = {},
    ) => {
      // First create main paymaster data without signatures
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
        guarantor ? guarantor.signTypedData(paymasterDomain, { PackedUserOperation }, userOp.packed) : '0x',
      ]).then(([oracleSignature, guarantorSignature]) => {
        // Add oracle signature
        const oracleSignatureWithLength = ethers.solidityPacked(
          ['uint16', 'bytes'],
          [ethers.getBytes(oracleSignature).length, oracleSignature],
        );

        userOp.paymasterData = ethers.concat([userOp.paymasterData, oracleSignatureWithLength]);

        // Add guarantor data if provided
        if (guarantor) {
          const guarantorData = ethers.solidityPacked(
            ['address', 'uint16', 'bytes'],
            [guarantor.address, ethers.getBytes(guarantorSignature).length, guarantorSignature],
          );

          userOp.paymasterData = ethers.concat([userOp.paymasterData, guarantorData]);
        }

        return userOp;
      });
    };

  return {
    admin,
    receiver,
    guarantor,
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

describe('PaymasterERC20Guarantor', function () {
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

  describe('guarantor functionality', function () {
    beforeEach(async function () {
      await this.paymaster.deposit({ value });
      this.userOp ??= {};
      this.userOp.paymaster = this.paymaster;
    });

    describe('succeeds paying with ERC20 tokens', function () {
      it('user repays guarantor', async function () {
        // fund guarantor. account has no asset to pay for at the beginning of the transaction, but will get them during execution.
        await this.token.$_mint(this.guarantor, value);
        await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

        this.extraCalls = [
          { target: this.token, data: this.token.interface.encodeFunctionData('$_mint', [this.account.target, value]) },
          {
            target: this.token,
            data: this.token.interface.encodeFunctionData('approve', [this.paymaster.target, ethers.MaxUint256]),
          },
        ];

        this.tokenMovements = [
          { account: this.account, factor: -1n, offset: value },
          { account: this.guarantor, factor: 0n },
          { account: this.paymaster, factor: 1n },
        ];

        const signedUserOp = await this.account
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
              guarantor: this.guarantor,
            }),
          )
          .then(op => this.signUserOp(op));

        // send it to the entrypoint
        const txPromise = predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

        // check main events (target call, guarantor event, and sponsoring)
        await expect(txPromise)
          .to.emit(this.paymaster, 'UserOperationGuaranteed')
          .withArgs(signedUserOp.hash(), this.guarantor.address, anyValue)
          .to.emit(this.paymaster, 'UserOperationSponsored')
          .withArgs(signedUserOp.hash(), this.token, anyValue, 2n * ethers.WeiPerEther)
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.account, 0n);

        // parse logs:
        // - get tokenAmount repaid for the paymaster event
        // - get the actual gas cost from the entrypoint event
        const { logs } = await txPromise.then(tx => tx.wait());
        const paymasterERC20 = await ethers.getContractFactory('$PaymasterERC20Mock');
        const { tokenAmount } = logs.map(ev => paymasterERC20.interface.parseLog(ev)).find(Boolean).args;
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
      });

      it('guarantor pays when user fails to pay', async function () {
        // fund guarantor. account has no asset to pay for at the beginning of the transaction, and will not get them.
        await this.token.$_mint(this.guarantor, value);
        await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

        this.extraCalls = []; // No minting to the account, so it won't be able to repay

        this.tokenMovements = [
          { account: this.account, factor: 0n },
          { account: this.guarantor, factor: -1n },
          { account: this.paymaster, factor: 1n },
        ];

        const signedUserOp = await this.account
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
              guarantor: this.guarantor,
            }),
          )
          .then(op => this.signUserOp(op));

        // send it to the entrypoint
        const txPromise = predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

        // check main events
        await expect(txPromise)
          .to.emit(this.paymaster, 'UserOperationGuaranteed')
          .withArgs(signedUserOp.hash(), this.guarantor.address, anyValue)
          .to.emit(this.paymaster, 'UserOperationSponsored')
          .withArgs(signedUserOp.hash(), this.token, anyValue, 2n * ethers.WeiPerEther)
          .to.emit(this.target, 'MockFunctionCalledExtra')
          .withArgs(this.account, 0n);

        // parse logs
        const { logs } = await txPromise.then(tx => tx.wait());
        const paymasterERC20 = await ethers.getContractFactory('$PaymasterERC20Mock');
        const { tokenAmount } = logs.map(ev => paymasterERC20.interface.parseLog(ev)).find(Boolean).args;
        const { actualGasCost } = logs.find(ev => ev.fragment?.name == 'UserOperationEvent').args;

        // check token balances
        await expect(txPromise).to.changeTokenBalances(
          this.token,
          this.tokenMovements.map(({ account }) => account),
          this.tokenMovements.map(({ factor = 0n, offset = 0n }) => offset + tokenAmount * factor),
        );

        // check ether balances
        await expect(txPromise).to.changeEtherBalances(
          [predeploy.entrypoint.v09, this.receiver],
          [-actualGasCost, actualGasCost],
        );
      });

      it('works with cold storage guarantor', async function () {
        // fund guarantor and account beforehand - all balances and allowances are cold
        await this.token.$_mint(this.account, value);
        await this.token.$_mint(this.guarantor, value);
        await this.token.$_approve(this.account, this.paymaster, ethers.MaxUint256);
        await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

        this.extraCalls = [];
        this.tokenMovements = [
          { account: this.account, factor: -1n },
          { account: this.guarantor, factor: 0n },
          { account: this.paymaster, factor: 1n },
        ];

        const signedUserOp = await this.account
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
              guarantor: this.guarantor,
            }),
          )
          .then(op => this.signUserOp(op));

        // send it to the entrypoint
        const txPromise = predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

        // check events and balances
        await expect(txPromise)
          .to.emit(this.paymaster, 'UserOperationGuaranteed')
          .to.emit(this.paymaster, 'UserOperationSponsored')
          .to.emit(this.target, 'MockFunctionCalledExtra');

        // parse logs
        const { logs } = await txPromise.then(tx => tx.wait());
        const paymasterERC20 = await ethers.getContractFactory('$PaymasterERC20Mock');
        const { tokenAmount } = logs.map(ev => paymasterERC20.interface.parseLog(ev)).find(Boolean).args;

        // check token balances
        await expect(txPromise).to.changeTokenBalances(
          this.token,
          this.tokenMovements.map(({ account }) => account),
          this.tokenMovements.map(({ factor = 0n, offset = 0n }) => offset + tokenAmount * factor),
        );
      });
    });

    it('reverts with invalid guarantor signature', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

      // Create user op with incorrect guarantor signing
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOpInvalid(op, { guarantor: this.guarantor }))
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });

    it('reverts when guarantor has insufficient balance', async function () {
      await this.token.$_mint(this.guarantor, 1n); // not enough
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

      // Create user op
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });

    it('reverts when guarantor has insufficient approval', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, 1n); // not enough

      // Create user op
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });
  });
});
