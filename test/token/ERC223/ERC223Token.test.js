const ERC223TestToken = artifacts.require('ERC223TokenMock');
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('ERC223Token', function(accounts) {
    let token = null;

    const _name = 'My Test ERC223 Token';
    const _symbol = 'M223T';
    const _decimals = 8;
    const _supply = 100;

    beforeEach(async function() {
        token = await ERC223TestToken.new(_name, _symbol, _decimals, _supply);
    });

    describe('Basic information methods', function() {
        it('should return the right name', async function() {
            let name = await token.name();
            name.should.be.equal(_name);
        });

        it('should return the right symbol', async function() {
            let symbol = await token.symbol();
            symbol.should.be.equal(_symbol);
        });

        it('should return the right decimal point', async function() {
            let decimals = await token.decimals();
            decimals.should.be.bignumber.equal(_decimals);
        });

        it('should return the right total supply', async function() {
            let supply = await token.totalSupply();
            supply.should.be.bignumber.equal(_supply * (10 ** _decimals));
        });
    });

    describe('Transaction methods', function() {
        it('should return the balance of an address');

        it('should throw on failed transfer');

        it('should throw on failed approve');

        it('should not throw on succeeding transfer');

        it('should not throw on succeeding transferFrom');

        it('should not throw on succeeding approve');
    });
});