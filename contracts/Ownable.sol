/*
 * Ownable
 * Base contract with an owner
 */
contract Ownable {
	address owner;

	function Ownable() {
		owner = msg.sender;
	}

	modifier onlyOwner() { 
		if (msg.sender == owner)
			_
	}
}
