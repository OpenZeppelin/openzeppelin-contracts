import ether from '../helpers/ether';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .should();

const ControlledAccessCrowdsale = artifacts.require('ControlledAccessCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

var hashMessage = require('../helpers/hashMessage.js');

contract('ControlledAccessCrowdsale', function ([owner, wallet, authorized, unauthorized]) {
  const rate = 1;
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  describe('message validity', function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
      this.crowdsale = await ControlledAccessCrowdsale.new(rate, wallet, this.token.address);
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

      it('should accept valid message to authorized user', async function () {
        const ACCESS_MESSAGE = this.crowdsale.address.substr(2) + authorized.substr(2);

        // Create the signature using account[0] (owner)
        const signature = web3.eth.sign(owner, web3.sha3(ACCESS_MESSAGE, {encoding: 'hex'}));

        // Recover the signer address from the generated message and signature.
        let isValidMessage =  await this.crowdsale.isValidAccessMessage(authorized, signature);

        isValidMessage.should.equal(true);
      });


      it('should reject invalid message to unauthorized user', async function () {
        const ACCESS_MESSAGE = this.crowdsale.address.substr(2) + authorized.substr(2);

        // Create the signature using account[0] (owner)
        const signature = web3.eth.sign(owner, web3.sha3(ACCESS_MESSAGE, {encoding: 'hex'}));

        // Recover the signer address from the generated message and signature.
        let isValidMessage = await this.crowdsale.isValidAccessMessage(unauthorized, signature);

        isValidMessage.should.equal(false);
      });


      it('should reject access message for another contract for authorized user', async function () {
        const ACCESS_MESSAGE = this.token.address.substr(2) + authorized.substr(2);

        // Create the signature using account[0] (owner)
        const signature = web3.eth.sign(owner, web3.sha3(ACCESS_MESSAGE, {encoding: 'hex'}));

        // Recover the signer address from the generated message and signature.
        let isValidMessage = await this.crowdsale.isValidAccessMessage(authorized, signature);

        isValidMessage.should.equal(false);
      });

    describe('accepting payments', function () {
      it('should accept payments from user with valid access message', async function () {
        const ACCESS_MESSAGE = this.crowdsale.address.substr(2) + authorized.substr(2);

        // Create the signature using account[0] (owner)
        const signature = web3.eth.sign(owner, web3.sha3(ACCESS_MESSAGE, {encoding: 'hex'}));

        //console.log(signature)

        //fallback with signature as msg.data
        await this.crowdsale.sendTransaction({from : authorized, value: value, data: signature }).should.be.fulfilled;

        //call buyTokens function with signature
        await this.crowdsale.buyTokens(authorized, signature, { value: value, from: authorized }).should.be.fulfilled;
      });

      it('should reject payments from users with invalid access message', async function () {
        const ACCESS_MESSAGE_FOR_1   = this.crowdsale.address.substr(2) + authorized.substr(2);
        const INVALID_ACCESS_MESSAGE = this.token.address.substr(2) + authorized.substr(2);
 
        // Create the signature using account[0] (owner)
        const signature1 = web3.eth.sign(owner, web3.sha3(ACCESS_MESSAGE_FOR_1, {encoding: 'hex'}));
        const signature2 = web3.eth.sign(owner, web3.sha3(INVALID_ACCESS_MESSAGE, {encoding: 'hex'}));

        //No signature provided
        await this.crowdsale.send(value).should.be.rejected;

        //Signature meant for someone else
        await this.crowdsale.buyTokens(unauthorized, signature1, { value: value, from: unauthorized }).should.be.rejected;

        //Signature meant for another contract
        await this.crowdsale.buyTokens(authorized, signature2, {value: value, from: authorized }).should.be.rejected;
      });
    });
  });
});
