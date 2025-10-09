// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract ConstructorMock {
    bool foo;

    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    error CustomError();

    constructor(RevertType error) {
        // After transpilation to upgradeable contract, the constructor will become an initializer
        // To silence the `... can be restricted to view` warning, we write to state
        foo = true;

        if (error == RevertType.RevertWithoutMessage) {
            revert();
        } else if (error == RevertType.RevertWithMessage) {
            revert("ConstructorMock: reverting");
        } else if (error == RevertType.RevertWithCustomError) {
            revert CustomError();
        } else if (error == RevertType.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }
    }
}
