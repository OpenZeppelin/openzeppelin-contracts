contract('PullPaymentBid', function(accounts) {

  var pullPaymentBid;

  before(function() {
    pullPaymentBid = PullPaymentBid.deployed();
  });

  it("sets the first bid value and bidder address as highest", function(done) {
    var bidAmount= 1;
    var bidderAddress = accounts[1];

    return pullPaymentBid.bid({
      from: bidderAddress,
      value: bidAmount
    })
    .then(function() {
      pullPaymentBid.highestBid()
      .then(function(bid) {
        assert.isTrue(bid.c[0] === bidAmount);
      });
      pullPaymentBid.highestBidder()
      .then(function(bidder) {
        assert.isTrue(bidder === bidderAddress);
      });
    })
    .then(done);
  });

});
