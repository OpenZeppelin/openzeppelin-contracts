import "../../munged/token/ERC1155/extensions/ERC1155Supply.sol";


contract ERC1155SupplyHarness is ERC1155Supply {
    address public owner;
    constructor(string memory uri_) ERC1155(uri_) {
        owner = msg.sender;
    }

    // workaround for problem caused by `exists` being a CVL keyword
    function exists_wrapper(uint256 id) public view virtual returns (bool) {
        return exists(id);
    }

    // These rules were not implemented in the base but there are changes in supply 
    // that are affected by the internal contracts so we implemented them. We assume 
    // only the owner can call any of these functions to be able to test them but also 
    // limit false positives.

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function burn( address from, uint256 id, uint256 amount) public virtual onlyOwner {
        _burn(from, id, amount);
    }
    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual onlyOwner {
        _burnBatch(from, ids, amounts);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual onlyOwner { 
        _mintBatch(to, ids, amounts, data);
    }

    // In order to check the invariant that zero address never holds any tokens, we need to remove the require
    // from this function.
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        // require(account != address(0), "ERC1155: address zero is not a valid owner");
        return _balances[id][account];
    }
}

