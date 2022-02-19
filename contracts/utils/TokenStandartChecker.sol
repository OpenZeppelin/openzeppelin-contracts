// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

import "./introspection/ERC165Checker.sol";
import "./../token/ERC20/extensions/IERC20Metadata.sol";
import "./../token/ERC721/extensions/IERC721Metadata.sol";
import "./../token/ERC1155/extensions/IERC1155MetadataURI.sol";

library TokenStandartChecker {
    using ERC165Checker for address;

    enum tokenStandart{
        erc20,
        erc721,
        erc1155
    }

    bytes4 private constant ERC20InterfaceID = type(IERC20).interfaceId;
    bytes4 private constant ERC20MetadataInterfaceID = type(IERC20Metadata).interfaceId;
    bytes4 private constant ERC721InterfaceID = type(IERC721).interfaceId;
    bytes4 private constant ERC721MetadataInterfaceID = type(IERC721Metadata).interfaceId;
    bytes4 private constant ERC1155InterfaceID = type(IERC1155).interfaceId;
    bytes4 private constant ERC1155MetadataInterfaceID = type(IERC1155MetadataURI).interfaceId;

    function isERC20Standart(address token) internal view returns (bool){
        return token.supportsInterface(ERC20InterfaceID) &&
        token.supportsInterface(ERC20MetadataInterfaceID);
    }
    
    function isERC721Standart(address nftAddress) internal view returns (bool){
        return nftAddress.supportsInterface(ERC721InterfaceID) &&
        nftAddress.supportsInterface(ERC721MetadataInterfaceID);
    }

    function isERC1155Standart(address nftAddress) internal view returns (bool){
        return nftAddress.supportsInterface(ERC1155InterfaceID) &&
        nftAddress.supportsInterface(ERC1155MetadataInterfaceID);
    }

    function isERC20Custom(address token) internal view returns (bool){
        return !isERC721Standart(token) &&
        !isERC1155Standart(token) &&
        !isERC20Standart(token) &&
        haveDecimals(token);
    }

    function isERC721Custom(address nftAddress) internal view returns (bool){
        return !isERC721Standart(nftAddress) &&
        !isERC1155Standart(nftAddress) &&
        !isERC20Standart(nftAddress) &&
        haveTokenURI(nftAddress);
    }

    function isERC1155Custom(address nftAddress) internal view returns (bool){
        return !isERC1155Standart(nftAddress) &&
        !isERC1155Standart(nftAddress) &&
        !isERC20Standart(nftAddress) &&
        haveURI(nftAddress);
    }

    function isCustomNft(address nftAddress) internal view returns (bool) {
        return !isERC721Custom(nftAddress) && !isERC1155Custom(nftAddress) &&
        !isERC721Standart(nftAddress) && !isERC1155Standart(nftAddress) &&
        !isERC20Custom(nftAddress) && !isERC20Standart(nftAddress);
    }

    function usedProtocolCustomNft(address nftAddress) internal returns (tokenStandart) {
        unchecked{
            (bool test11551st, ) = nftAddress.delegatecall(
                abi.encodeWithSelector(
                    IERC1155.safeTransferFrom.selector,
                    address(0), address(0), 0, 0, ""
                )
            );
            (bool test11552nd, ) = nftAddress.delegatecall(
                abi.encodeWithSelector(
                    IERC1155.safeBatchTransferFrom.selector,
                    address(0), address(0), [0], [0], ""
                )
            );
            if(test11551st && test11552nd){
                return tokenStandart.erc1155;
            }

            (bool test201st, ) = nftAddress.delegatecall(
                abi.encodeWithSelector(
                    IERC20.transferFrom.selector,
                    address(0), address(0), 0
                )
            );
            (bool test202nd, ) = nftAddress.delegatecall(
                abi.encodeWithSelector(
                    IERC20.transfer.selector,
                    address(0), 0
                )
            );
            if(test201st && test202nd){
                return tokenStandart.erc20;
            }

            return tokenStandart.erc721;
        }
    }

    function haveTokenURI(address nftAddress) private view returns (bool){
        unchecked{
            bytes memory encodedParams = abi.encodeWithSelector(IERC721Metadata.tokenURI.selector, 0);
            (, bytes memory result) = nftAddress.staticcall(encodedParams);
            
            if(result.length > 0){
                return true;
            }

            return false;
        }
    }

    function haveURI(address nftAddress) private view returns (bool){
        unchecked{
            bytes memory encodedParams = abi.encodeWithSelector(IERC1155MetadataURI.uri.selector, 0);
            (, bytes memory result) = nftAddress.staticcall(encodedParams);
            
            if(result.length > 0){
                return true;
            }

            return false;
        }
    }

    function haveDecimals(address token) private view returns (bool){
        unchecked{
            bytes memory encodedParams = abi.encodeWithSelector(IERC20Metadata.decimals.selector);
            (, bytes memory result) = token.staticcall(encodedParams);
            
            if(result.length > 0){
                return true;
            }

            return false;
        }
    }
}
