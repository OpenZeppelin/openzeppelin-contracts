const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Sellable = artifacts.require('SellableMock');

contract("Sellable", function (accounts) {
	const [owner, buyer, proxy, peep] = accounts;
  	const price = 10;
  
  beforeEach(async function () {
    this.sellable = await Sellable.new({from:owner});
  });

  // no need to test for the Ownable because it's a pure copy paste

  describe("Getters", function () {

      it("Should allow anyone to see check if an address is the approved buyer", async function () {
        // before approval
        assert.equal(await this.sellable.isApprovedBuyer(buyer, {from:peep}),false);

        // after approval
        await this.sellable.approveSellingOwnership(buyer, price, {from:owner});
        assert.equal(await this.sellable.isApprovedBuyer(peep, {from:peep}),false);
        assert.equal(await this.sellable.isApprovedBuyer(buyer, {from:peep}),true);
      });

      it("Should allow only buyer or owner to get selling price", async function () {
        // before approval
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:peep}),
        	"Sender is not the approved buyer or owner"
        	);
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:buyer}),
        	"Sender is not the approved buyer or owner"
        	);
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:owner}),
        	"Buying contract is not approved"
        	);

        // after approval
        await this.sellable.approveSellingOwnership(buyer, price,{from:owner});
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:peep}),
        	"Sender is not the approved buyer or owner"
        	);
        let _price = Number((await this.sellable.getOwnershipSellingPrice({from:owner})).toString() );
        assert.equal(_price,price);
        _price = Number((await this.sellable.getOwnershipSellingPrice({from:buyer})).toString() );
        assert.equal(_price,price);        

        // after cancelling
        await this.sellable.cancelSellingOwnership({from:owner});
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:peep}),
        	"Sender is not the approved buyer or owner"
        	);
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:buyer}),
        	"Sender is not the approved buyer or owner"
        	);
        await expectRevert(
        	this.sellable.getOwnershipSellingPrice({from:owner}),
        	"Buying contract is not approved"
        	);

      }); 

      it("Should allow anyone to see check if an address is the approved proxy", async function () {
        // before approval
        assert.equal(await this.sellable.isApprovedProxy(proxy, {from:peep}),false);

        // after approval
        await this.sellable.approveProxy(proxy,{from:owner});
        assert.equal(await this.sellable.isApprovedProxy(peep, {from:peep}),false);
        assert.equal(await this.sellable.isApprovedProxy(proxy, {from:peep}),true);
      });

  });


  describe("Selling contract", function () {

      it("Should allow the owner to approve a buyer with given price", async function () {
        // before approval
        await expectRevert(
        	this.sellable.buyOwnership({from:buyer, value:price}),
        	"Sender is not the approved buyer"
        	);

        // approval
        await expectRevert(
        	this.sellable.approveSellingOwnership(buyer,0,{from:owner}),
        	"Sellable: price must be > 0"
        	);
        await expectRevert(
        	this.sellable.approveSellingOwnership(owner,price,{from:owner}),
        	"Sellable: approved buyer is the current owner"
        	);
        await this.sellable.approveSellingOwnership(buyer, price,{from:owner});

        // after approval
        await expectRevert(
        	this.sellable.buyOwnership({from:peep, value:price}),
        	"Sender is not the approved buyer"
        	);
        await expectRevert(
        	this.sellable.buyOwnership({from:buyer, value:price+1}),
        	"Selling price incorrect"
        	);
        let balance = Number(await web3.eth.getBalance(owner));        
        await this.sellable.buyOwnership({from:buyer, value:price});
        assert.equal(await this.sellable.owner(),buyer); // check the new owner
        // check that the seller has received the price        
        let newbalance = Number(await web3.eth.getBalance(owner));
        assert.equal(newbalance, balance+price);

      });

      it("Should allow the owner to cancel a selling approval", async function () {
        // approval
        await this.sellable.approveSellingOwnership(buyer, price,{from:owner});
        // cancelling
        await this.sellable.cancelSellingOwnership({from:owner});
        // after cancelling
        await expectRevert(
        	this.sellable.buyOwnership({from:buyer, value:price}),
        	"Sender is not the approved buyer"
        	);
      }); 

      it("Should allow the owner to approve a proxy", async function () {
        // before approval
        await expectRevert(
        	this.sellable.proxyTransferOwnership(buyer,{from:peep}),
        	"Sellable: sender is not the approved proxy"
        	);

        // approval
        await this.sellable.approveProxy(proxy,{from:owner});

        // after approval
        await expectRevert(
        	this.sellable.proxyTransferOwnership(buyer,{from:peep}),
        	"Sellable: sender is not the approved proxy"
        	);
        await this.sellable.proxyTransferOwnership(buyer,{from:proxy});
        assert.equal(await this.sellable.owner(),buyer);
      });

      it("Should allow the owner to cancel a proxy approval", async function () {
        // approval
        await this.sellable.approveProxy(proxy,{from:owner});
        // cancelling
        await this.sellable.cancelApproveProxy({from:owner});
        // after cancelling
        await expectRevert(
        	this.sellable.proxyTransferOwnership(buyer,{from:proxy}),
        	"Sellable: sender is not the approved proxy"
        	);
      });

      it("Should disable the proxy approval after a sale", async function () {
        await this.sellable.approveProxy(proxy,{from:owner});
        // sale
        await this.sellable.approveSellingOwnership(buyer, price,{from:owner});
        await this.sellable.buyOwnership({from:buyer, value:price});
        // after sale
        await expectRevert(
        	this.sellable.proxyTransferOwnership(peep,{from:proxy}),
        	"Sellable: sender is not the approved proxy"
        	);
      }); 

      it("Should disable the proxy approval after a proxy transfer", async function () {
        await this.sellable.approveProxy(proxy,{from:owner});
        // sale
        await this.sellable.proxyTransferOwnership(buyer,{from:proxy});
        // after transfer
        await expectRevert(
        	this.sellable.proxyTransferOwnership(peep,{from:proxy}),
        	"Sellable: sender is not the approved proxy"
        	);
      }); 

      it("Should disable the buying approval after a proxy transfer", async function () {
        await this.sellable.approveProxy(proxy,{from:owner});
        await this.sellable.approveSellingOwnership(buyer, price,{from:owner});
        // sale by proxy to peep
        await this.sellable.proxyTransferOwnership(peep,{from:proxy});
        // after transfer, buyer should not be able to by contract
        await expectRevert(
        	this.sellable.buyOwnership({from:buyer, value:price}),
        	"Sender is not the approved buyer"
        	);
      }); 

  });
});

