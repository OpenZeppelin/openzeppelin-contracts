pragma solidity ^0.4.24;

contract ERC725 {
	uint256 constant MANANGEMENT_KEY = 1;
	uint256 constant ACTION_KEY = 2;
	uint256 constant CLAIM_SIGNER_KEY = 3;
	uint256 constant ENCRYPTION_KEY = 4;

	event KeyAdded(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
	event KeyRemoved(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
	event ExecutionRequest(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
	event Executed(uint256 indexed executionId, address indexed to, uint256 indexed value, bytes data);
	event Approved(uint256 indexed executionId, bool approved);

	struct Key {
		uint256 purpose;
		uint256 keyType;
		bytes32 key;
	}

	function getKey(bytes32 _key) public constant returns (uint256[] purposes, uint256 keyType, bytes32 key);
	function keyHasPurpose(bytes32 _key, uint256 _purpose) public constant returns (bool exists);
	function getKeysByPurpose(uint256 _purpose) public constant returns (bytes32[] keys);
	function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType) public returns (bool success);
	function execute(address _to, uint256 _value bytes _data) public returns (uint256 executionId);
	function approve(uint256 _id, bool _approve) public returns (bool success)
}
