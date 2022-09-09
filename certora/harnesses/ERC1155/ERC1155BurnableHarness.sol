import "../../munged/token/ERC1155/extensions/ERC1155Burnable.sol";

contract ERC1155BurnableHarness is ERC1155Burnable {
    constructor(string memory uri_) ERC1155(uri_) {}
}
