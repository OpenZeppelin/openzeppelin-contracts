import { network } from 'hardhat';
import { expect } from 'chai';
import { PANIC_CODES } from '@nomicfoundation/hardhat-ethers-chai-matchers/panic';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const name = 'Security Token';
const symbol = 'SEC';
const initialSupply = 100n;

async function fixture() {
  const [owner, holder, recipient, other, approved] = await ethers.getSigners();

  const registry = await ethers.deployContract('ERC3643IdentityRegistryMock');
  const compliance = await ethers.deployContract('ERC3643ComplianceMock');
  const onchainID = ethers.Wallet.createRandom().address;

  const token = await ethers.deployContract('$ERC3643Mock', [name, symbol, registry, compliance, onchainID, owner]);

  // Each verified wallet is registered with an identity that holds valid claims.
  const holderIdentity = ethers.Wallet.createRandom().address;
  const recipientIdentity = ethers.Wallet.createRandom().address;
  await registry.setIdentity(holder, holderIdentity);
  await registry.setIdentity(recipient, recipientIdentity);
  await registry.setVerified(holderIdentity, true);
  await registry.setVerified(recipientIdentity, true);

  await token.connect(owner).mint(holder, initialSupply);

  return {
    owner,
    holder,
    recipient,
    other,
    approved,
    registry,
    compliance,
    onchainID,
    token,
    holderIdentity,
    recipientIdentity,
  };
}

describe('ERC3643', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('construction', function () {
    it('sets the identity registry, compliance and onchain identity', async function () {
      await expect(this.token.identityRegistry()).to.eventually.equal(this.registry);
      await expect(this.token.compliance()).to.eventually.equal(this.compliance);
      await expect(this.token.onchainID()).to.eventually.equal(this.onchainID);
      await expect(this.token.version()).to.eventually.equal('1');
      await expect(this.token.paused()).to.eventually.be.false;
    });

    it('emits the registry, compliance and token information events', async function () {
      const token = await ethers.deployContract('$ERC3643Mock', [
        name,
        symbol,
        this.registry,
        this.compliance,
        ethers.ZeroAddress,
        this.owner,
      ]);
      const tx = token.deploymentTransaction();

      await expect(tx).to.emit(token, 'IdentityRegistryAdded').withArgs(this.registry);
      await expect(tx).to.emit(token, 'ComplianceAdded').withArgs(this.compliance);
      await expect(tx).to.emit(token, 'UpdatedTokenInformation').withArgs(name, symbol, 18n, '1', ethers.ZeroAddress);
    });

    it('reverts with a zero identity registry', async function () {
      const factory = await ethers.getContractFactory('$ERC3643Mock');
      await expect(
        ethers.deployContract('$ERC3643Mock', [
          name,
          symbol,
          ethers.ZeroAddress,
          this.compliance,
          this.onchainID,
          this.owner,
        ]),
      ).to.be.revertedWithCustomError(factory, 'ERC3643MissingIdentityRegistry');
    });

    it('reverts with a zero compliance', async function () {
      const factory = await ethers.getContractFactory('$ERC3643Mock');
      await expect(
        ethers.deployContract('$ERC3643Mock', [
          name,
          symbol,
          this.registry,
          ethers.ZeroAddress,
          this.onchainID,
          this.owner,
        ]),
      ).to.be.revertedWithCustomError(factory, 'ERC3643MissingCompliance');
    });
  });

  describe('admin functions', function () {
    for (const [fn, args] of Object.entries({
      setName: ['New'],
      setSymbol: ['NEW'],
      setOnchainID: [ethers.ZeroAddress],
      pause: [],
      unpause: [],
      setAddressFrozen: [ethers.ZeroAddress, true],
      freezePartialTokens: [ethers.ZeroAddress, 1n],
      unfreezePartialTokens: [ethers.ZeroAddress, 1n],
      setIdentityRegistry: [ethers.ZeroAddress],
      setCompliance: [ethers.ZeroAddress],
      forcedTransfer: [ethers.ZeroAddress, ethers.ZeroAddress, 1n],
      mint: [ethers.ZeroAddress, 1n],
      burn: [ethers.ZeroAddress, 1n],
      recoveryAddress: [ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroAddress],
      batchForcedTransfer: [[], [], []],
      batchMint: [[], []],
      batchBurn: [[], []],
      batchSetAddressFrozen: [[], []],
      batchFreezePartialTokens: [[], []],
      batchUnfreezePartialTokens: [[], []],
    })) {
      it(`${fn} reverts when the caller is not authorized`, async function () {
        await expect(this.token.connect(this.other)[fn](...args))
          .to.be.revertedWithCustomError(this.token, 'OwnableUnauthorizedAccount')
          .withArgs(this.other);
      });
    }
  });

  describe('token information', function () {
    it('sets the name', async function () {
      await expect(this.token.connect(this.owner).setName('New Name'))
        .to.emit(this.token, 'UpdatedTokenInformation')
        .withArgs('New Name', symbol, 18n, '1', this.onchainID);
      await expect(this.token.name()).to.eventually.equal('New Name');
    });

    it('sets the symbol', async function () {
      await expect(this.token.connect(this.owner).setSymbol('NEW'))
        .to.emit(this.token, 'UpdatedTokenInformation')
        .withArgs(name, 'NEW', 18n, '1', this.onchainID);
      await expect(this.token.symbol()).to.eventually.equal('NEW');
    });

    it('sets the onchain identity', async function () {
      const newOnchainID = ethers.Wallet.createRandom().address;
      await expect(this.token.connect(this.owner).setOnchainID(newOnchainID))
        .to.emit(this.token, 'UpdatedTokenInformation')
        .withArgs(name, symbol, 18n, '1', newOnchainID);
      await expect(this.token.onchainID()).to.eventually.equal(newOnchainID);
    });

    it('sets the identity registry', async function () {
      const newRegistry = await ethers.deployContract('ERC3643IdentityRegistryMock');
      await expect(this.token.connect(this.owner).setIdentityRegistry(newRegistry))
        .to.emit(this.token, 'IdentityRegistryAdded')
        .withArgs(newRegistry);
      await expect(this.token.identityRegistry()).to.eventually.equal(newRegistry);
    });

    it('sets the compliance', async function () {
      const newCompliance = await ethers.deployContract('ERC3643ComplianceMock');
      await expect(this.token.connect(this.owner).setCompliance(newCompliance))
        .to.emit(this.token, 'ComplianceAdded')
        .withArgs(newCompliance);
      await expect(this.token.compliance()).to.eventually.equal(newCompliance);
    });

    it('sets the compliance without the event through the internal setter', async function () {
      const newCompliance = await ethers.deployContract('ERC3643ComplianceMock');
      await expect(this.token.$_setCompliance(newCompliance, false)).to.not.emit(this.token, 'ComplianceAdded');
      await expect(this.token.compliance()).to.eventually.equal(newCompliance);
    });
  });

  describe('transfers', function () {
    for (const [title, transfer] of Object.entries({
      transfer: (token, from, to, value) => token.connect(from).transfer(to, value),
      transferFrom: async (token, from, to, value, spender) => {
        await token.connect(from).approve(spender, value);
        return token.connect(spender).transferFrom(from, to, value);
      },
    })) {
      describe(title, function () {
        it('moves tokens and notifies the compliance', async function () {
          const tx = await transfer(this.token, this.holder, this.recipient, 40n, this.approved);
          await expect(tx).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [-40n, 40n]);
          await expect(tx).to.emit(this.compliance, 'Transferred').withArgs(this.holder, this.recipient, 40n);
        });

        it('reverts when the recipient is not verified', async function () {
          await expect(transfer(this.token, this.holder, this.other, 40n, this.approved))
            .to.be.revertedWithCustomError(this.token, 'ERC3643UnverifiedRecipient')
            .withArgs(this.other);
        });

        it('reverts when the compliance refuses the transfer', async function () {
          await this.compliance.setCanTransfer(false);
          await expect(transfer(this.token, this.holder, this.recipient, 40n, this.approved))
            .to.be.revertedWithCustomError(this.token, 'ERC3643ComplianceViolation')
            .withArgs(this.holder, this.recipient, 40n);
        });

        it('reverts when the sender is frozen', async function () {
          await this.token.connect(this.owner).setAddressFrozen(this.holder, true);
          await expect(transfer(this.token, this.holder, this.recipient, 40n, this.approved))
            .to.be.revertedWithCustomError(this.token, 'ERC3643FrozenWallet')
            .withArgs(this.holder);
        });

        it('reverts when the recipient is frozen', async function () {
          await this.token.connect(this.owner).setAddressFrozen(this.recipient, true);
          await expect(transfer(this.token, this.holder, this.recipient, 40n, this.approved))
            .to.be.revertedWithCustomError(this.token, 'ERC3643FrozenWallet')
            .withArgs(this.recipient);
        });

        it('reverts when the amount exceeds the unfrozen balance', async function () {
          await this.token.connect(this.owner).freezePartialTokens(this.holder, 70n);
          await expect(transfer(this.token, this.holder, this.recipient, 40n, this.approved))
            .to.be.revertedWithCustomError(this.token, 'ERC3643InsufficientUnfrozenBalance')
            .withArgs(this.holder, 40n, 30n);
        });

        it('reverts while paused', async function () {
          await this.token.connect(this.owner).pause();
          await expect(
            transfer(this.token, this.holder, this.recipient, 40n, this.approved),
          ).to.be.revertedWithCustomError(this.token, 'EnforcedPause');
        });
      });
    }
  });

  describe('pause', function () {
    it('pauses and unpauses', async function () {
      await expect(this.token.connect(this.owner).pause()).to.emit(this.token, 'Paused').withArgs(this.owner);
      await expect(this.token.paused()).to.eventually.be.true;
      await expect(this.token.connect(this.owner).unpause()).to.emit(this.token, 'Unpaused').withArgs(this.owner);
      await expect(this.token.paused()).to.eventually.be.false;
    });

    it('allows mint, burn, forced transfer and recovery while paused', async function () {
      await this.token.connect(this.owner).pause();
      await expect(this.token.connect(this.owner).mint(this.holder, 10n)).to.changeTokenBalance(
        ethers,
        this.token,
        this.holder,
        10n,
      );
      await expect(this.token.connect(this.owner).burn(this.holder, 10n)).to.changeTokenBalance(
        ethers,
        this.token,
        this.holder,
        -10n,
      );
      await expect(
        this.token.connect(this.owner).forcedTransfer(this.holder, this.recipient, 10n),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [-10n, 10n]);
      await expect(
        this.token.connect(this.owner).recoveryAddress(this.holder, this.other, this.holderIdentity),
      ).to.emit(this.token, 'RecoverySuccess');
    });
  });

  describe('mint', function () {
    it('mints to a verified recipient and notifies the compliance', async function () {
      const tx = this.token.connect(this.owner).mint(this.recipient, 50n);
      await expect(tx).to.changeTokenBalance(ethers, this.token, this.recipient, 50n);
      await expect(tx).to.emit(this.compliance, 'Created').withArgs(this.recipient, 50n);
    });

    it('reverts when the recipient is not verified', async function () {
      await expect(this.token.connect(this.owner).mint(this.other, 50n))
        .to.be.revertedWithCustomError(this.token, 'ERC3643UnverifiedRecipient')
        .withArgs(this.other);
    });

    it('reverts when the compliance refuses the mint', async function () {
      await this.compliance.setCanTransfer(false);
      await expect(this.token.connect(this.owner).mint(this.recipient, 50n))
        .to.be.revertedWithCustomError(this.token, 'ERC3643ComplianceViolation')
        .withArgs(ethers.ZeroAddress, this.recipient, 50n);
    });

    it('mints to a frozen wallet', async function () {
      await this.token.connect(this.owner).setAddressFrozen(this.recipient, true);
      await expect(this.token.connect(this.owner).mint(this.recipient, 50n)).to.changeTokenBalance(
        ethers,
        this.token,
        this.recipient,
        50n,
      );
    });
  });

  describe('burn', function () {
    it('burns and notifies the compliance', async function () {
      const tx = this.token.connect(this.owner).burn(this.holder, 40n);
      await expect(tx).to.changeTokenBalance(ethers, this.token, this.holder, -40n);
      await expect(tx).to.emit(this.compliance, 'Destroyed').withArgs(this.holder, 40n);
    });

    it('does not ask the identity registry or the compliance', async function () {
      await this.registry.setVerified(this.holderIdentity, false);
      await this.compliance.setCanTransfer(false);
      await expect(this.token.connect(this.owner).burn(this.holder, 40n)).to.changeTokenBalance(
        ethers,
        this.token,
        this.holder,
        -40n,
      );
    });

    it('burns from a frozen wallet', async function () {
      await this.token.connect(this.owner).setAddressFrozen(this.holder, true);
      await expect(this.token.connect(this.owner).burn(this.holder, 40n)).to.changeTokenBalance(
        ethers,
        this.token,
        this.holder,
        -40n,
      );
    });

    it('leaves frozen tokens alone when the free balance covers the burn', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await expect(this.token.connect(this.owner).burn(this.holder, 70n)).to.not.emit(this.token, 'TokensUnfrozen');
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(30n);
    });

    it('unfreezes just enough tokens to cover the burn', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await expect(this.token.connect(this.owner).burn(this.holder, 80n))
        .to.emit(this.token, 'TokensUnfrozen')
        .withArgs(this.holder, 10n);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(20n);
    });

    it('reverts when the amount exceeds the balance', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await expect(this.token.connect(this.owner).burn(this.holder, initialSupply + 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
        .withArgs(this.holder, initialSupply, initialSupply + 1n);
    });
  });

  describe('freezing', function () {
    it('freezes and unfreezes a wallet', async function () {
      await expect(this.token.connect(this.owner).setAddressFrozen(this.holder, true))
        .to.emit(this.token, 'AddressFrozen')
        .withArgs(this.holder, true, this.owner);
      await expect(this.token.isFrozen(this.holder)).to.eventually.be.true;

      await expect(this.token.connect(this.owner).setAddressFrozen(this.holder, false))
        .to.emit(this.token, 'AddressFrozen')
        .withArgs(this.holder, false, this.owner);
      await expect(this.token.isFrozen(this.holder)).to.eventually.be.false;
    });

    it('freezes part of a balance', async function () {
      await expect(this.token.connect(this.owner).freezePartialTokens(this.holder, 30n))
        .to.emit(this.token, 'TokensFrozen')
        .withArgs(this.holder, 30n);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(30n);
    });

    it('clamps a freeze to the free balance', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 80n);
      await expect(this.token.connect(this.owner).freezePartialTokens(this.holder, 50n))
        .to.emit(this.token, 'TokensFrozen')
        .withArgs(this.holder, 20n);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(initialSupply);
    });

    it('unfreezes part of a balance', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await expect(this.token.connect(this.owner).unfreezePartialTokens(this.holder, 10n))
        .to.emit(this.token, 'TokensUnfrozen')
        .withArgs(this.holder, 10n);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(20n);
    });

    it('reverts when unfreezing more than is frozen', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await expect(this.token.connect(this.owner).unfreezePartialTokens(this.holder, 31n)).to.be.revertedWithPanic(
        PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
      );
    });

    it('records the given actor on the frozen event', async function () {
      await expect(this.token['$_setAddressFrozen(address,bool,address)'](this.holder, true, this.other))
        .to.emit(this.token, 'AddressFrozen')
        .withArgs(this.holder, true, this.other);
    });
  });

  describe('forced transfer', function () {
    it('moves tokens and notifies the compliance', async function () {
      const tx = this.token.connect(this.owner).forcedTransfer(this.holder, this.recipient, 40n);
      await expect(tx).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [-40n, 40n]);
      await expect(tx).to.emit(this.compliance, 'Transferred').withArgs(this.holder, this.recipient, 40n);
    });

    it('returns false and moves nothing when the recipient is not verified', async function () {
      await expect(this.token.connect(this.owner).forcedTransfer.staticCall(this.holder, this.other, 40n)).to.eventually
        .be.false;
      await expect(this.token.connect(this.owner).forcedTransfer(this.holder, this.other, 40n)).to.changeTokenBalances(
        ethers,
        this.token,
        [this.holder, this.other],
        [0n, 0n],
      );
    });

    it('ignores frozen wallets and the compliance rules', async function () {
      await this.token.connect(this.owner).setAddressFrozen(this.holder, true);
      await this.token.connect(this.owner).setAddressFrozen(this.recipient, true);
      await this.compliance.setCanTransfer(false);
      await expect(
        this.token.connect(this.owner).forcedTransfer(this.holder, this.recipient, 40n),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [-40n, 40n]);
    });

    it('unfreezes just enough tokens to cover the amount', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await expect(this.token.connect(this.owner).forcedTransfer(this.holder, this.recipient, 80n))
        .to.emit(this.token, 'TokensUnfrozen')
        .withArgs(this.holder, 10n);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(20n);
    });
  });

  describe('recovery', function () {
    it('moves the balance to the new wallet and migrates its registration', async function () {
      const tx = this.token.connect(this.owner).recoveryAddress(this.holder, this.other, this.holderIdentity);
      await expect(tx).to.changeTokenBalances(
        ethers,
        this.token,
        [this.holder, this.other],
        [-initialSupply, initialSupply],
      );
      await expect(tx).to.emit(this.registry, 'IdentityRegistered').withArgs(this.other, this.holderIdentity);
      await expect(tx).to.emit(this.registry, 'IdentityRemoved').withArgs(this.holder, this.holderIdentity);
      await expect(tx).to.emit(this.compliance, 'Transferred').withArgs(this.holder, this.other, initialSupply);
      await expect(tx).to.emit(this.token, 'RecoverySuccess').withArgs(this.holder, this.other, this.holderIdentity);
    });

    it('carries the frozen tokens and the frozen status over', async function () {
      await this.token.connect(this.owner).freezePartialTokens(this.holder, 30n);
      await this.token.connect(this.owner).setAddressFrozen(this.holder, true);

      const tx = this.token.connect(this.owner).recoveryAddress(this.holder, this.other, this.holderIdentity);
      await expect(tx).to.emit(this.token, 'TokensFrozen').withArgs(this.other, 30n);
      await expect(tx).to.emit(this.token, 'AddressFrozen').withArgs(this.holder, false, this.token);
      await expect(tx).to.emit(this.token, 'AddressFrozen').withArgs(this.other, true, this.token);

      await expect(this.token.getFrozenTokens(this.other)).to.eventually.equal(30n);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(0n);
      await expect(this.token.isFrozen(this.other)).to.eventually.be.true;
      await expect(this.token.isFrozen(this.holder)).to.eventually.be.false;
    });

    it('keeps the frozen status of a new wallet that is already frozen', async function () {
      await this.token.connect(this.owner).setAddressFrozen(this.holder, true);
      await this.token.connect(this.owner).setAddressFrozen(this.other, true);

      await expect(this.token.connect(this.owner).recoveryAddress(this.holder, this.other, this.holderIdentity))
        .to.emit(this.token, 'AddressFrozen')
        .withArgs(this.holder, false, this.token)
        .to.not.emit(this.token, 'TokensFrozen');
      await expect(this.token.isFrozen(this.other)).to.eventually.be.true;
    });

    it('reverts when the new wallet is not verified', async function () {
      const unverifiedIdentity = ethers.Wallet.createRandom().address;
      await expect(this.token.connect(this.owner).recoveryAddress(this.holder, this.other, unverifiedIdentity))
        .to.be.revertedWithCustomError(this.token, 'ERC3643FailedForcedTransfer')
        .withArgs(this.holder, this.other, initialSupply);
    });
  });

  describe('batch functions', function () {
    it('batchTransfer moves tokens to every recipient', async function () {
      await this.registry.setIdentity(this.other, this.recipientIdentity);
      await expect(
        this.token.connect(this.holder).batchTransfer([this.recipient, this.other], [10n, 20n]),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient, this.other], [-30n, 10n, 20n]);
    });

    it('batchForcedTransfer moves tokens between every pair', async function () {
      await this.token.connect(this.owner).mint(this.recipient, 50n);
      await expect(
        this.token
          .connect(this.owner)
          .batchForcedTransfer([this.holder, this.recipient], [this.recipient, this.holder], [10n, 20n]),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [10n, -10n]);
    });

    it('batchForcedTransfer skips recipients that are not verified', async function () {
      await expect(
        this.token
          .connect(this.owner)
          .batchForcedTransfer([this.holder, this.holder], [this.recipient, this.other], [10n, 20n]),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient, this.other], [-10n, 10n, 0n]);
    });

    it('batchMint mints to every recipient', async function () {
      await expect(
        this.token.connect(this.owner).batchMint([this.holder, this.recipient], [10n, 20n]),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [10n, 20n]);
    });

    it('batchBurn burns from every holder', async function () {
      await this.token.connect(this.owner).mint(this.recipient, 50n);
      await expect(
        this.token.connect(this.owner).batchBurn([this.holder, this.recipient], [10n, 20n]),
      ).to.changeTokenBalances(ethers, this.token, [this.holder, this.recipient], [-10n, -20n]);
    });

    it('batchSetAddressFrozen freezes every wallet', async function () {
      await this.token.connect(this.owner).batchSetAddressFrozen([this.holder, this.recipient], [true, false]);
      await expect(this.token.isFrozen(this.holder)).to.eventually.be.true;
      await expect(this.token.isFrozen(this.recipient)).to.eventually.be.false;
    });

    it('batchFreezePartialTokens and batchUnfreezePartialTokens update every wallet', async function () {
      await this.token.connect(this.owner).mint(this.recipient, 50n);
      await this.token.connect(this.owner).batchFreezePartialTokens([this.holder, this.recipient], [30n, 40n]);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(30n);
      await expect(this.token.getFrozenTokens(this.recipient)).to.eventually.equal(40n);

      await this.token.connect(this.owner).batchUnfreezePartialTokens([this.holder, this.recipient], [10n, 40n]);
      await expect(this.token.getFrozenTokens(this.holder)).to.eventually.equal(20n);
      await expect(this.token.getFrozenTokens(this.recipient)).to.eventually.equal(0n);
    });

    for (const [fn, args, signer] of [
      ['batchTransfer', [[ethers.ZeroAddress], []], 'holder'],
      ['batchForcedTransfer', [[ethers.ZeroAddress], [ethers.ZeroAddress], []], 'owner'],
      ['batchForcedTransfer', [[ethers.ZeroAddress], [], [1n]], 'owner'],
      ['batchMint', [[ethers.ZeroAddress], []], 'owner'],
      ['batchBurn', [[ethers.ZeroAddress], []], 'owner'],
      ['batchSetAddressFrozen', [[ethers.ZeroAddress], []], 'owner'],
      ['batchFreezePartialTokens', [[ethers.ZeroAddress], []], 'owner'],
      ['batchUnfreezePartialTokens', [[ethers.ZeroAddress], []], 'owner'],
    ]) {
      it(`${fn} reverts with arrays of different lengths (${args.map(a => a.length).join(', ')})`, async function () {
        await expect(this.token.connect(this[signer])[fn](...args)).to.be.revertedWithCustomError(
          this.token,
          'ERC3643InvalidArrayLength',
        );
      });
    }
  });
});
