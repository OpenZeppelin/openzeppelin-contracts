pragma solidity ^0.5.0;

/**
 * @title Create2
 *
 * @dev Utility library that focus on the use of CREATE2 EVM opcode for
 * contracts deployment. It also provides a function to precompute the address
 * where the smart contracts with the specified salt and bytecode would be
 * deployed.
 */
library Create2 {

    /**
     * @dev Deploy contract with CREATE2
     * @param salt The salt used to the contract address computation
     * @param code The bytecode of of the contract to be deployed
     */
    function deploy(bytes32 salt, bytes memory code) internal returns (address) {
        address addr = _deploy(salt, code);
        return addr;
    }


    /**
     * @dev Function to compute the address of a contract created with CREATE2.
     * @param salt The salt used to the contract address computation
     * @param code The bytecode of the contract to be deployed
     * @return the computed address of the smart contract.
     */
    function computeAddress(
        bytes32 salt, bytes memory code
    ) internal view returns (address) {
        return computeAddress(salt, code, address(this));
    }

    /**
     * @dev Function to compute the address of a contract created with CREATE2
     * with the deployer address.
     * @param deployer the address of the contract that will deploy the contract
     * @param salt The salt used to the contract address computation
     * @param code The bytecode of the contract to be deployed
     * @return the computed address of the smart contract.
     */
    function computeAddress(
        bytes32 salt, bytes memory code, address deployer
    ) internal pure returns (address) {
        bytes32 codeHash = keccak256(code);
        bytes32 _data = keccak256(
            abi.encodePacked(bytes1(0xff), deployer, salt, codeHash)
        );
        return address(bytes20(_data << 96));
    }

    /**
     * @dev Internal function to deploy contract with CREATE2
     * @param _salt The salt used to the contract address computation
     * @param _code The bytecode of the contract to be deployed
     */
    function _deploy(
        bytes32 _salt, bytes memory _code
    ) private returns(address) {
        address _addr;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            _addr := create2(0, add(_code, 0x20), mload(_code), _salt)
            if iszero(extcodesize(_addr)) {
                revert(0, 0)
            }
        }
        return _addr;
    }

}
