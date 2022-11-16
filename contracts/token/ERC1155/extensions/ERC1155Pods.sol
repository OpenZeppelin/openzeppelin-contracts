// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v5.0.0 (token/ERC1155/extensions/ERC1155Pods.sol)


pragma solidity ^0.8.0;

import "../ERC1155.sol";
import "../../../interfaces/IERC1155Pods.sol";
import "../../../utils/behavior/PodsLib.sol";

abstract contract ERC1155Pods is ERC1155, IERC1155Pods {
    using PodsLib for PodsLib.Data;

    error PodsLimitReachedForAccount();

    uint256 public immutable podsLimit;

    mapping(uint256 => PodsLib.Data) private _pods;

    constructor(uint256 podsLimit_) {
        podsLimit = podsLimit_;
    }

    function hasPod(address account, address pod, uint256 id) public view virtual returns(bool) {
        return _pods[id].hasPod(account, pod);
    }

    function podsCount(address account, uint256 id) public view virtual returns(uint256) {
        return _pods[id].podsCount(account);
    }

    function podAt(address account, uint256 index, uint256 id) public view virtual returns(address) {
        return _pods[id].podAt(account, index);
    }

    function pods(address account, uint256 id) public view virtual returns(address[] memory) {
        return _pods[id].pods(account);
    }

    function podBalanceOf(address pod, address account, uint256 id) public view returns(uint256) {
        if (_pods[id].hasPod(account, pod)) {
            return balanceOf(account, id);
        }
        return 0;
    }

    function addPod(address pod, uint256 id) public virtual {
        if (_pods[id].addPod(msg.sender, pod, balanceOf(msg.sender, id)) > podsLimit) revert PodsLimitReachedForAccount();
    }

    function removePod(address pod, uint256 id) public virtual {
        _pods[id].removePod(msg.sender, pod, balanceOf(msg.sender, id));
    }

    function removeAllPods(uint256 id) public virtual {
        _pods[id].removeAllPods(msg.sender, balanceOf(msg.sender, id));
    }

    // ERC1155 Overrides

    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override virtual {
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; i++) {
            _pods[ids[i]].updateBalances(from, to, amounts[i]);
        }
    }
}
