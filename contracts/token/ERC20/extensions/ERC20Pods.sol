// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v5.0.0 (token/ERC20/extensions/ERC20Pods.sol)

pragma solidity ^0.8.0;

import "../ERC20.sol";
import "../../../interfaces/IERC20Pods.sol";
import "../../../utils/behavior/PodsLib.sol";

abstract contract ERC20Pods is ERC20, IERC20Pods {
    using PodsLib for PodsLib.Data;

    error PodsLimitReachedForAccount();

    uint256 public immutable podsLimit;

    PodsLib.Data private _pods;

    constructor(uint256 podsLimit_) {
        podsLimit = podsLimit_;
    }

    function hasPod(address account, address pod) public view virtual returns(bool) {
        return _pods.hasPod(account, pod);
    }

    function podsCount(address account) public view virtual returns(uint256) {
        return _pods.podsCount(account);
    }

    function podAt(address account, uint256 index) public view virtual returns(address) {
        return _pods.podAt(account, index);
    }

    function pods(address account) public view virtual returns(address[] memory) {
        return _pods.pods(account);
    }

    function podBalanceOf(address pod, address account) public view returns(uint256) {
        if (_pods.hasPod(account, pod)) {
            return balanceOf(account);
        }
        return 0;
    }

    function addPod(address pod) public virtual {
        if (_pods.addPod(msg.sender, pod, balanceOf(msg.sender)) > podsLimit) revert PodsLimitReachedForAccount();
    }

    function removePod(address pod) public virtual {
        _pods.removePod(msg.sender, pod, balanceOf(msg.sender));
    }

    function removeAllPods() public virtual {
        _pods.removeAllPods(msg.sender, balanceOf(msg.sender));
    }

    // ERC20 Overrides

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override virtual {
        super._afterTokenTransfer(from, to, amount);
        _pods.updateBalances(from, to, amount);
    }
}
