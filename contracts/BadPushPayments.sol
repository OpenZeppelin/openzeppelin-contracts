// UNSAFE CODE, DO NOT USE!

contract BadPushPayments {

	address highestBidder;
	uint highestBid;

	function bid() {
		if (msg.value < highestBid) throw;

		if (highestBidder != 0) {
			highestBidder.send(highestBid);
		}

	  highestBidder = msg.sender;
	  highestBid = msg.value;
	}
}
