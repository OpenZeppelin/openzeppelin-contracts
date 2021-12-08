// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC721/extensions/draft-ERC721Royalty.sol)

pragma solidity ^0.8.0;

import "./draft-IERC721Royalty.sol";

/**
 * @dev TBD
 *
 * _Available since v4.5._
 */
abstract contract ERC721Royalty is IERC721Royalty {
    struct RoyaltyInfo {
        address receiver;
        uint256 royaltyAmount;
    }

    RoyaltyInfo private _royaltyInfo;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyalty;

    /*@dev Sets tokens royalties
    *
    * Requirements:
    * - `tokenId` must be already mined.
    * - `recipient` cannot be the zero address.
    * - `value` must indicate the percentage value using two decimals.
    */
    function _setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint256 value
    ) internal {
        require(value <= 10000, 'ERC2981Royalties: Too high');
        _tokenRoyalty[tokenId] = RoyaltyInfo(recipient, value);
    }

    /*@dev Sets global royalty
    *
    * Requirements:
    * - `recipient` cannot be the zero address.
    * - `value` must indicate the percentage value using two decimals.
    */
    function _setRoyalty(
        address recipient,
        uint256 value
    ) internal {
        _royaltyInfo = RoyaltyInfo(recipient, value);
    }

    /**
     * @dev See {IERC721Royalty-royaltyInfo}
     */
    function royaltyInfo(
            uint256 _tokenId,
            uint256 _salePrice
    ) external view returns (
            address receiver,
            uint256 royaltyAmount
    ){
        if(_tokenRoyalty[_tokenId].receiver != address(0)){
            receiver = _tokenRoyalty[_tokenId].receiver;
            royaltyAmount = (_salePrice * _tokenRoyalty[_tokenId].royaltyAmount) / 10000;
        }else{
            receiver = _royaltyInfo.receiver;
            royaltyAmount = (_salePrice * _royaltyInfo.royaltyAmount) / 10000;
        }
    }
}
