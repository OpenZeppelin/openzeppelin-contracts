import "../munged/token/ERC20/extensions/draft-ERC20Permit.sol";

contract ERC20PermitHarness is ERC20Permit {
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
        ERC20Permit(_name)
    {}
}

