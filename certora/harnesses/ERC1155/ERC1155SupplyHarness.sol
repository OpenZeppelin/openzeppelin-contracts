import "../../munged/token/ERC1155/extensions/ERC1155Supply.sol";

contract ERC1155SupplyHarness is ERC1155Supply {
    constructor(string memory uri_)
        ERC1155(uri_)
    {}

    // workaround for problem caused by `exists` being a CVL keyword
    function exists_wrapper(uint256 id) public view virtual returns (bool) {
        return exists(id);
    }

}

