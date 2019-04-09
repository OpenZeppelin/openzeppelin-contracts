pragma solidity ^0.5.2;

contract FallbackGasReporter {
    event RemainingGas(uint256 amount);

    function () external payable {
        emit RemainingGas(gasleft());
    }
}
