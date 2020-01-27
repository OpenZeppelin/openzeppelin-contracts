pragma solidity ^0.5.0;

import "./ERC1155.sol";
import "./IERC1155MetadataURI.sol";
import "../../introspection/ERC165.sol";

contract ERC1155MetadataURICatchAll is ERC165, ERC1155, IERC1155MetadataURI {
    // Catch-all URI with placeholders, e.g. https://example.com/{locale}/{id}.json
    string private _uri;

     /*
     *     bytes4(keccak256('uri(uint256)')) == 0x0e89341c
     */
    bytes4 private constant _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;

    /**
     * @dev Constructor function
     */
    constructor (string memory uri) public {
        _setURI(uri);

        // register the supported interfaces to conform to ERC1155 via ERC165
        _registerInterface(_INTERFACE_ID_ERC1155_METADATA_URI);
    }

    /**
     * @notice A distinct Uniform Resource Identifier (URI) for a given token.
     * @dev URIs are defined in RFC 3986.
     * The URI MUST point to a JSON file that conforms to the "ERC-1155 Metadata URI JSON Schema".
     * param id uint256 ID of the token to query (ignored in this particular implementation,
     * as an {id} parameter in the string is expected)
     * @return URI string
    */
    function uri(uint256 /*id*/) external view returns (string memory) {
        return _uri;
    }

    /**
     * @dev Internal function to set a new URI
     * @param newuri New URI to be set
     */
    function _setURI(string memory newuri) internal {
        _uri = newuri;
        emit URI(_uri, 0);
    }
}
