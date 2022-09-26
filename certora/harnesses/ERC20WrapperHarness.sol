import "../munged/token/ERC20/extensions/ERC20Wrapper.sol";

contract ERC20WrapperHarness is ERC20Wrapper {
    constructor(
        IERC20 _underlying,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) ERC20Wrapper(_underlying) {}

    function underlyingTotalSupply() public view returns (uint256) {
        return underlying.totalSupply();
    }

    function underlyingBalanceOf(address account) public view returns (uint256) {
        return underlying.balanceOf(account);
    }
}
