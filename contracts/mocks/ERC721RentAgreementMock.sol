// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/IERC721Rent.sol";

contract ERC721RentAgreementMock is IERC721RentAgreement {
    function onChangeAgreement(uint256) external override {}

    function onStartRent(uint256, address) external override {}

    function onStopRent(uint256, RentingRole) external override {}

    function supportsInterface(bytes4) external pure override returns (bool) {
        return true;
    }
}
