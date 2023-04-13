// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./token/ERC20MulticallMock.sol";

contract MulticallTest {
    function checkReturnValues(
        ERC20MulticallMock multicallToken,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        uint256 recipientsLen = recipients.length;
        bytes[] memory calls = new bytes[](recipientsLen);
        for (uint256 i = 0; i < recipientsLen; i++) {
            calls[i] = abi.encodeWithSignature("transfer(address,uint256)", recipients[i], amounts[i]);
        }

        bytes[] memory results = multicallToken.multicall(calls);
        uint256 resultsLen = results.length;
        for (uint256 i = 0; i < resultsLen; i++) {
            require(abi.decode(results[i], (bool)));
        }
    }
}
