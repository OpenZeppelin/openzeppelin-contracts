pragma solidity ^0.4.4;


// UNSAFE CODE, DO NOT USE!
contract BadPushPayments {

	address highestBidder;
	uint highestBid;

	function bid() {
		if (msg.value < highestBid) throw;

		if (highestBidder != 0) {
      // return bid to previous winner
			if (!highestBidder.send(highestBid)) {
        throw;
      }
		}

	  highestBidder = msg.sender;
	  highestBid = msg.value;
	}
}
