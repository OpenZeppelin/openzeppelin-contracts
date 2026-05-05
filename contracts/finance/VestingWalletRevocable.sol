pragma solidity ^0.8.20;

import {VestingWallet} from "./VestingWallet.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "../token/ERC20/IERC20.sol";

abstract contract VestingWalletRevocable is VestingWallet {
    using SafeERC20 for IERC20;

    bool private _revoked;
    uint256 private _ethAllocationSnapshot;
    mapping(address token => uint256) private _erc20AllocationSnapshot;

    error AlreadyRevoked();
    event VestingRevoked(address indexed owner);
}
