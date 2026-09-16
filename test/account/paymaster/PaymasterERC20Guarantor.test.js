import { network, globalOptions } from 'hardhat';
import { expect } from 'chai';
import { anyValue } from '@nomicfoundation/hardhat-ethers-chai-matchers/withArgs';
import { getDomain } from '../../helpers/eip712';
import { formatType, PackedUserOperation } from '../../helpers/eip712-types';
import { ERC4337Helper } from '../../helpers/erc4337';
import { encodeBatch, encodeMode, CALL_TYPE_BATCH } from '../../helpers/erc7579';
import * as random from '../../helpers/random';
import { shouldBehaveLikePaymaster } from './Paymaster.behavior';

const connection = await network.create();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

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
  const helper = new ERC4337Helper(connection);
  const account = await helper.newAccount('$AccountECDSAMock', [accountSigner, 'AccountECDSA', '1']);
  await account.deploy();

  // ERC-4337 paymaster
  const paymaster = await ethers.deployContract('$PaymasterERC20GuarantorMock', ['PaymasterERC20Guarantor', '1']);
  await paymaster.$_grantRole(ethers.id('ORACLE_ROLE'), oracleSigner);
  await paymaster.$_grantRole(ethers.id('WITHDRAWER_ROLE'), admin);

  // Domains
  const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);
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
    (oracle, domain) =>
    (
      userOp,
      {
        validAfter = 0n,
        validUntil = 0n,
        tokenPrice = ethers.WeiPerEther,
        guarantor = undefined,
        guarantorSigner = undefined,
        erc20 = token,
      } = {},
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
          domain,
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
        guarantor ? (guarantorSigner ?? guarantor).signTypedData(domain, { PackedUserOperation }, userOp.packed) : '0x',
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
    paymasterSignUserOp: paymasterSignUserOp(oracleSigner, paymasterDomain), // sign using the correct key
    paymasterSignUserOpInvalid: paymasterSignUserOp(other, paymasterDomain), // sign using the wrong oracle key
  };
}

describe('PaymasterERC20Guarantor', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));
  });

  describe('core paymaster behavior', function () {
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
      // Two signature checks (oracle + guarantor) + transferFrom pushes
      // past the 100k default under coverage instrumentation.
      if (globalOptions.coverage) {
        this.userOp.paymasterVerificationGasLimit = 200_000n;
      }
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
        const txPromise = ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

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
          ethers,
          this.token,
          this.tokenMovements.map(({ account }) => account),
          this.tokenMovements.map(({ factor = 0n, offset = 0n }) => offset + tokenAmount * factor),
        );

        // check that ether moved as expected
        await expect(txPromise).to.changeEtherBalances(
          ethers,
          [ethers.predeploy.entrypoint.v09, this.receiver],
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
        const txPromise = ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

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
          ethers,
          this.token,
          this.tokenMovements.map(({ account }) => account),
          this.tokenMovements.map(({ factor = 0n, offset = 0n }) => offset + tokenAmount * factor),
        );

        // check ether balances
        await expect(txPromise).to.changeEtherBalances(
          ethers,
          [ethers.predeploy.entrypoint.v09, this.receiver],
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
        const txPromise = ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver);

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
          ethers,
          this.token,
          this.tokenMovements.map(({ account }) => account),
          this.tokenMovements.map(({ factor = 0n, offset = 0n }) => offset + tokenAmount * factor),
        );
      });
    });

    it('rejects a guaranteed op whose paymasterPostOpGasLimit cannot cover the refund', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

      // Floor = _postOpCost (30k) + _guaranteedPostOpCost (15k) = 45k; 30k is below it.
      const signedUserOp = await this.account
        .createUserOp({ ...this.userOp, paymasterPostOpGasLimit: 30_000n })
        .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
        .then(op => this.signUserOp(op));

      // _prefund returns false before pulling any funds. The call does not revert, so the unchanged
      // guarantor balance proves no transfer was attempted.
      await expect(
        this.paymaster.$_prefund(
          signedUserOp.packed,
          ethers.ZeroHash,
          this.token,
          ethers.WeiPerEther,
          this.account,
          0n,
        ),
      )
        .to.emit(this.paymaster, 'return$_prefund')
        .withArgs(false, anyValue, anyValue, anyValue);
      await expect(this.token.balanceOf(this.guarantor)).to.eventually.equal(value);

      // End to end, the EntryPoint rejects the op with SIG_VALIDATION_FAILED.
      await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });

    it('accepts a guaranteed op at the paymasterPostOpGasLimit floor', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

      // 45k = the floor (_postOpCost 30k + _guaranteedPostOpCost 15k), so _prefund accepts and pulls the prefund.
      const signedUserOp = await this.account
        .createUserOp({ ...this.userOp, paymasterPostOpGasLimit: 45_000n })
        .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
        .then(op => this.signUserOp(op));

      await expect(
        this.paymaster.$_prefund(
          signedUserOp.packed,
          ethers.ZeroHash,
          this.token,
          ethers.WeiPerEther,
          this.account,
          1000n,
        ),
      )
        .to.emit(this.paymaster, 'return$_prefund')
        .withArgs(true, anyValue, anyValue, anyValue);
    });

    it('_postOpGasBudget covers the guaranteed postOp cost only for guaranteed ops', async function () {
      const [postOpCost, guaranteedPostOpCost] = await Promise.all([
        this.paymaster.$_postOpCost(),
        this.paymaster.$_guaranteedPostOpCost(),
      ]);

      const guaranteed = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
        .then(op => this.signUserOp(op));
      const plain = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op))
        .then(op => this.signUserOp(op));

      await expect(this.paymaster.$_postOpGasBudget(guaranteed.packed)).to.eventually.equal(
        postOpCost + guaranteedPostOpCost,
      );
      await expect(this.paymaster.$_postOpGasBudget(plain.packed)).to.eventually.equal(postOpCost);
    });

    it('charges no unused-gas penalty for a guaranteed op provisioned at the floor', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

      // The floor is exactly _postOpGasBudget for a guaranteed op, so the penalty base saturates to zero.
      const floor = await this.paymaster.$_postOpGasBudget(
        await this.account
          .createUserOp(this.userOp)
          .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
          .then(op => this.signUserOp(op))
          .then(op => op.packed),
      );

      for (const [paymasterPostOpGasLimit, expectedPenaltyGas] of [
        [floor, 0n],
        [floor + 50_000n, 5_000n], // only the gas provisioned above the budget is penalized
      ]) {
        const signedUserOp = await this.account
          .createUserOp({ ...this.userOp, paymasterPostOpGasLimit })
          .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor }))
          .then(op => this.signUserOp(op));

        // context layout: userOpHash(32) | token(20) | tokenPerNative(32) | prefundAmount(32) | prefunder(20) |
        //                 penaltyGas(32) | prefundContext
        const { logs } = await this.paymaster
          .$_validatePaymasterUserOp(signedUserOp.packed, ethers.ZeroHash, 0n)
          .then(tx => tx.wait());
        const { context } = this.paymaster.interface.parseLog(
          logs.find(
            log => log.topics[0] === this.paymaster.interface.getEvent('return$_validatePaymasterUserOp').topicHash,
          ),
        ).args;

        expect(ethers.toBigInt(ethers.dataSlice(context, 0x88, 0xa8))).to.equal(expectedPenaltyGas);
      }
    });

    it('reverts with invalid guarantor signature', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);

      // Create user op with incorrect guarantor signing
      const signedUserOp = await this.account
        .createUserOp(this.userOp)
        .then(op => this.paymasterSignUserOp(op, { guarantor: this.guarantor, guarantorSigner: this.other }))
        .then(op => this.signUserOp(op));

      // send it to the entrypoint
      await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });

    it('reads userOp.sender from the tail of prefundContext', async function () {
      await this.token.$_mint(this.guarantor, value);
      await this.token.$_approve(this.guarantor, this.paymaster, ethers.MaxUint256);
      await this.token.$_mint(this.paymaster, value); // fund the refund leg

      const prefundContext = ethers.solidityPacked(['bytes', 'address'], [random.bytes(), this.guarantor.address]);

      // prefunder=other ≠ userOpSender=guarantor (read from tail) so `_refund` enters the
      // guaranteed branch and augments `actualAmount` by `_guaranteedPostOpCost() * feePerGas`
      // (priced in tokens). With tokenPrice=1e18, denominator=1e18 (1:1), feePerGas=1, the
      // augmentation adds 15_000 tokens. Passing `actualAmount = 31_000` yields a final
      // augmented amount of `31_000 + 15_000 = 46_000` charged to the guarantor; the full
      // `prefundAmount` (100_000) is then refunded to `prefunder` (other).
      await expect(
        this.paymaster.$_refund(
          this.token,
          ethers.WeiPerEther, // tokenPrice
          31_000n, // actualAmount (pre-computed by `_postOp` in the real flow)
          1n, // actualUserOpFeePerGas
          this.other.address, // prefunder
          100_000n, // prefundAmount
          prefundContext,
        ),
      ).to.changeTokenBalances(ethers, this.token, [this.guarantor, this.other], [-46_000n, 100_000n]);
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
      await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
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
      await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
        .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
        .withArgs(0n, 'AA34 signature error');
    });
  });

  describe('propagates effective amounts from downstream extensions', function () {
    // Composition: Mock → PaymasterERC20Guarantor → PaymasterERC20ReducingMock → PaymasterERC20.
    // The reducing helper subtracts 1 from the amount passed to super, simulating a downstream
    // extension (e.g. a fixed-credit policy) that legitimately settles for less than requested.
    // Guarantor must propagate the reduced value returned by super, otherwise the postOp context
    // would record an unbacked amount and the refund path would pay out of the paymaster balance.
    const userOp = sender => ({
      sender,
      nonce: 0n,
      initCode: '0x',
      callData: '0x',
      accountGasLimits: ethers.ZeroHash,
      preVerificationGas: 0n,
      gasFees: ethers.ZeroHash,
      paymasterAndData: '0x',
      signature: '0x',
    });

    beforeEach(async function () {
      this.reducingPaymaster = await ethers.deployContract('$PaymasterERC20GuarantorReducingMock');
    });

    it('_prefund returns the amount pulled by super, not the input', async function () {
      const requested = 100n;
      const effective = requested - 1n; // reducing helper subtracts 1

      await this.token.$_mint(this.other, effective);
      await this.token.$_approve(this.other, this.reducingPaymaster, ethers.MaxUint256);

      // Return value carries the effective amount (99), matching what super pulled.
      // Without the fix, this would be `requested` (100) — one token more than actually entered
      // the paymaster, and that inflated value would be serialized into the postOp context.
      const packedSender = ethers.solidityPacked(['address'], [this.other.address]);
      await expect(
        this.reducingPaymaster.$_prefund(
          userOp(this.other.address),
          ethers.ZeroHash,
          this.token,
          ethers.WeiPerEther, // tokenPrice
          this.other.address,
          requested,
        ),
      )
        .to.emit(this.reducingPaymaster, 'return$_prefund')
        .withArgs(true, this.other.address, effective, packedSender);

      // Token movements confirm only the effective amount actually entered the paymaster.
      await expect(this.token.balanceOf(this.other)).to.eventually.equal(0n);
      await expect(this.token.balanceOf(this.reducingPaymaster)).to.eventually.equal(effective);
    });

    it('_refund returns the amount charged by super for non-guaranteed operations', async function () {
      // Seed the paymaster so the refund transfer succeeds.
      const prefundAmount = 100n;
      const inputActual = 40n;
      const effectiveActual = inputActual - 1n; // reducing helper subtracts 1
      await this.token.$_mint(this.reducingPaymaster, prefundAmount);

      // prefunder == userOpSender in the context tail → the non-guaranteed branch runs.
      const prefundContext = ethers.solidityPacked(['address'], [this.other.address]);

      // Return value carries the effective charge (39), matching what super actually charged.
      // Without the fix, this would be `inputActual` (40) — the pre-reduction value — so
      // `UserOperationSponsored.tokenAmount` would disagree with the actual settlement.
      await expect(
        this.reducingPaymaster.$_refund(
          this.token,
          ethers.WeiPerEther, // tokenPrice
          inputActual, // actualAmount
          1n, // actualUserOpFeePerGas
          this.other.address, // prefunder
          prefundAmount,
          prefundContext,
        ),
      )
        .to.emit(this.reducingPaymaster, 'return$_refund')
        .withArgs(true, effectiveActual);

      // The base refunded `prefundAmount - effectiveActual`. Paymaster keeps only the effective
      // amount; if the return value had reported the pre-reduction 40, the recorded charge would
      // not match the token balance change.
      await expect(this.token.balanceOf(this.other)).to.eventually.equal(prefundAmount - effectiveActual);
      await expect(this.token.balanceOf(this.reducingPaymaster)).to.eventually.equal(effectiveActual);
    });
  });
});
