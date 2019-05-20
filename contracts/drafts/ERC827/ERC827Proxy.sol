/* solium-disable security/no-low-level-calls */

pragma solidity ^0.5.2;


/**
 * @title ERC827Proxy
 *
 * @dev Proxy to forward contract calls from token contract to any other
 * contract.
 */
contract ERC827Proxy {

    address public token;
    bytes4 public callContractFunctionSignature = bytes4(
        keccak256("callContract(address,bytes)")
    );

    /**
     * @dev constructor, executed by the ERC827 token when it is deployed.
     */
    constructor() public {
        token = address(msg.sender);
    }

    /**
     * @dev Forward calls only from the token contract that created it
     * @param _target address The address which you want to transfer to
     * @param _data bytes The data to be executed in the call
     */
    function callContract(
        address _target, bytes memory _data
    ) public payable returns (bool) {
        require(
            msg.sender == address(token),
            "Proxy cant execute calls to the token contract"
        );
        // solhint-disable-next-line avoid-call-value, no-unused-vars
        (bool success, bytes memory data) = _target.call.value(msg.value)(_data);
        require(success, "Proxy call failed");
        return true;
    }

}
