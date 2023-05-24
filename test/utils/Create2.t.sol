// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../contracts/utils/Create2.sol";
import "../../contracts/finance/VestingWallet.sol";

contract Create2Test is Test {
    /**
     * @dev Not enough balance for performing a CREATE2 deploy.
     */
    error Create2InsufficientBalance(uint256 balance, uint256 needed);

    /**
     * @dev There's no code to deploy.
     */
    error Create2EmptyBytecode();

    /**
     * @dev The deployment failed.
     */
    error Create2FailedDeployment();

    function setUp() public {}

    function testDeployExistentAddress() public {
        address addr;
        uint256 amount = 0;
        bytes memory bytecode = type(VestingWallet).creationCode;
        bytes32 salt = keccak256("salt message");

        if (address(this).balance < amount) {
            revert Create2InsufficientBalance(address(this).balance, amount);
        }
        if (bytecode.length == 0) {
            revert Create2EmptyBytecode();
        }
        /// @solidity memory-safe-assembly
        assembly {
            addr := create2(amount, add(bytecode, 0x20), mload(bytecode), salt)
        }
        console.log(addr);
        if (addr == address(0)) {
            revert Create2FailedDeployment();
        }

        console.log(1);
        // Create2.deploy(0, salt, bytecode);
    }
}
