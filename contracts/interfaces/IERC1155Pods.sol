// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v5.0.0 (interfaces/IERC20Pods.sol)

pragma solidity ^0.8.0;

import "./IERC1155.sol";

interface IERC1155Pods is IERC1155 {
    function hasPod(address account, address pod, uint256 id) external view returns(bool);
    function podsCount(address account, uint256 id) external view returns(uint256);
    function podAt(address account, uint256 index, uint256 id) external view returns(address);
    function pods(address account, uint256 id) external view returns(address[] memory);
    function podBalanceOf(address pod, address account, uint256 id) external view returns(uint256);

    function addPod(address pod, uint256 id) external;
    function removePod(address pod, uint256 id) external;
    function removeAllPods(uint256 id) external;
}
