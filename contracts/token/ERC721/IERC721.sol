pragma solidity ^0.6.2;

import "../../introspection/IERC165.sol";

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of NFTs in `owner`'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the NFT specified by `tokenId`.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Transfers a specific NFT (`tokenId`) from one account (`from`) to
     * another (`to`).
     *
     * Requirements:
     * - `from`, `to` cannot be zero.
     * - `tokenId` must be owned by `from`.
     * - If the caller is not `from`, it must be have been allowed to move this
     * NFT by either {approve} or {setApprovalForAll}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers a specific NFT (`tokenId`) from one account (`from`) to
     * another (`to`).
     *
     * Requirements:
     * - If the caller is not `from`, it must be approved to move this NFT by
     * either {approve} or {setApprovalForAll}.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Approves the transfer of a specific NFT (`tokenId`) to an account (`to`)
     *
     * Requirements:
     * - The caller must own the token or be an approved operator
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Gets the approved account for a specific NFT (`tokenId`)
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Enable or disable (`_approved`) an account (`operator`) to manage all of the assets of the sender (`msg.sender`).
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool _approved) external;

    /**
     * @dev Queries if an account (`operator`) is allowed to manage all of the assets of another account (`owner`)
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /**
     * @dev Safely transfers a specific NFT (`tokenId`) from one account (`from`) to another (`to`)
     *
     * Requirements:
     *  - If the caller is not `from`, it must be approved to move this NFT by etheir {approve} or {setApprovalForAll}
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}
