pragma solidity ^0.8.20;

import {ERC2981} from "../../../openzeppelin-contracts/contracts/token/common/ERC2981.sol";
import {IERC2981} from "../../../openzeppelin-contracts/contracts/interfaces/IERC2981.sol";

contract MyERC2981 is ERC2981{

    function SupportsInterface() public returns (bool) {
        return supportsInterface(type(IERC2981).interfaceId);
    }

    function FeeDenominator() public returns (uint96) {
        return _feeDenominator();
    }

    //设置默认值
    function SetDefaultRoyalty(address receiver, uint96 feeNumerator) public {
        _setDefaultRoyalty(receiver, feeNumerator);
    }
    //删除默认值
    function DeleteDefaultRoyalty() public {
        _deleteDefaultRoyalty();
    }

    function SetTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function ResetTokenRoyalty(uint256 tokenId) public {
        _resetTokenRoyalty(tokenId);
    }

}