// contracts/MyAccountERC7702.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Account} from "../../../account/Account.sol";
import {ERC721Holder} from "../../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC7821} from "../../../account/extensions/draft-ERC7821.sol";
import {SignerERC7702} from "../../../utils/cryptography/signers/SignerERC7702.sol";

contract MyAccountERC7702 is Account, SignerERC7702, ERC7821, ERC721Holder, ERC1155Holder {
    /// @dev Allows the entry point as an authorized executor.
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}
