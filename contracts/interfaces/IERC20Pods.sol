// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v5.0.0 (interfaces/IERC20Pods.sol)

pragma solidity ^0.8.0;

import "./IERC20.sol";

interface IERC20Pods is IERC20 {
    function hasPod(address account, address pod) external view returns(bool);
    function podsCount(address account) external view returns(uint256);
    function podAt(address account, uint256 index) external view returns(address);
    function pods(address account) external view returns(address[] memory);
    function podBalanceOf(address pod, address account) external view returns(uint256);

    function addPod(address pod) external;
    function removePod(address pod) external;
    function removeAllPods() external;
}
