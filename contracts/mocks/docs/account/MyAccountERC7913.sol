// contracts/MyAccountERC7913.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Account} from "../../../account/Account.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {ERC721Holder} from "../../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC7739} from "../../../utils/cryptography/signers/draft-ERC7739.sol";
import {ERC7821} from "../../../account/extensions/draft-ERC7821.sol";
import {Initializable} from "../../../proxy/utils/Initializable.sol";
import {SignerERC7913} from "../../../utils/cryptography/signers/SignerERC7913.sol";

contract MyAccountERC7913 is Account, SignerERC7913, ERC7739, ERC7821, ERC721Holder, ERC1155Holder, Initializable {
    constructor() EIP712("MyAccount7913", "1") {}

    function initialize(bytes memory signer) public initializer {
        _setSigner(signer);
    }

    /// @dev Allows the entry point as an authorized executor.
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}
