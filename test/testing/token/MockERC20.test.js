const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('MockERC20', function () {
    const name = 'Mock Token';
    const symbol = 'MCK';
    const initialSupply = 1000;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    async function fixture() {
        const [deployer, recipient] = await ethers.getSigners();
        const token = await ethers.deployContract('MockERC20', [name, symbol]);

        return { token, deployer, recipient };
    }

    beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
    });

    it('has the correct name', async function () {
        expect(await this.token.name()).to.equal(name);
    });

    it('has the correct symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
    });

    it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.equal(18);
    });

    describe('mint', function () {
        it('allows minting tokens to an address', async function () {
            await this.token.mint(this.recipient.address, initialSupply);

            expect(await this.token.balanceOf(this.recipient.address)).to.equal(initialSupply);
            expect(await this.token.totalSupply()).to.equal(initialSupply);
        });

        it('emits a Transfer event', async function () {
            await expect(this.token.mint(this.recipient.address, initialSupply))
                .to.emit(this.token, 'Transfer')
                .withArgs(ZERO_ADDRESS, this.recipient.address, initialSupply);
        });
    });

    describe('burn', function () {
        beforeEach(async function () {
            await this.token.mint(this.recipient.address, initialSupply);
        });

        it('allows burning tokens from an address', async function () {
            await this.token.burn(this.recipient.address, 500);

            expect(await this.token.balanceOf(this.recipient.address)).to.equal(500);
            expect(await this.token.totalSupply()).to.equal(500);
        });

        it('emits a Transfer event', async function () {
            await expect(this.token.burn(this.recipient.address, 500))
                .to.emit(this.token, 'Transfer')
                .withArgs(this.recipient.address, ZERO_ADDRESS, 500);
        });

        it('reverts when burning more tokens than available', async function () {
            await expect(this.token.burn(this.recipient.address, initialSupply + 1))
                .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance');
        });
    });
}); 