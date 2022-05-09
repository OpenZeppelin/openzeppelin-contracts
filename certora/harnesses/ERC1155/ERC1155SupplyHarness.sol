import "../../munged/token/ERC1155/extensions/ERC1155Supply.sol";

contract ERC1155SupplyHarness is ERC1155Supply {
    constructor(string memory uri_)
        ERC1155(uri_)
    {}
}

