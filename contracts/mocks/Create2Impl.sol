pragma solidity ^0.5.0;

import "../utils/Create2.sol";
import "../token/ERC20/ERC20.sol";

contract Create2Impl {
    function deploy(bytes32 salt, bytes memory code) public {
        Create2.deploy(salt, code);
    }

    function deployERC20(bytes32 salt) public {
        // solhint-disable-next-line indent
        Create2.deploy(salt, type(ERC20).creationCode);
    }

    function computeAddress(bytes32 salt, bytes memory code) public view returns (address) {
        return Create2.computeAddress(salt, code);
    }

    function computeAddress(bytes32 salt, bytes memory code, address deployer) public pure returns (address) {
        return Create2.computeAddress(salt, code, deployer);
    }
}
