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
      return pullPaymentBid.highestBid()
      .then(function(bid) {
        assert.isTrue(bid.c[0] === bidAmount);
      });
    })
    .then(function() {
      return pullPaymentBid.highestBidder()
      .then(function(bidder) {
        assert.isTrue(bidder === bidderAddress);
      });
    })
    .then(done);
  });

  it("replaces first bid and bidder with higher ones", function(done) {
    var bidAmount = 2;
    var bidderAddress = accounts[2];

    return pullPaymentBid.bid({
      from: bidderAddress,
      value: bidAmount
    })
    .then(function() {
      return pullPaymentBid.highestBid()
      .then(function(bid) {
        assert.isTrue(bid.c[0] === bidAmount);
      });
    })
    .then(function() {
      return pullPaymentBid.highestBidder()
      .then(function(bidder) {
        assert.isTrue(bidder === bidderAddress);
      });
    })
    .then(done);
  });

  it("does not replace top bid and bidder with a lower one", function(done) {
    var bidAmount = 0;
    var bidderAddress = accounts[3];

    return pullPaymentBid.bid({
      from: bidderAddress,
      value: bidAmount
    })
    .then(function() {
      return pullPaymentBid.highestBid()
      .then(function(bid) {
        assert.isTrue(bid.c[0] > bidAmount);
      });
    })
    .then(function() {
      return pullPaymentBid.highestBidder()
      .then(function(bidder) {
        assert.isFalse(bidder === bidderAddress);
      });
    })
    .then(done);
  });

});
