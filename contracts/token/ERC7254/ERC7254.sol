// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9; 
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/**
* @dev Implementation of the {IERC7254} interface.
*
* This implementation is agnostic to the way tokens are created. This means
* that a supply mechanism has to be added in a derived contract using {_mint}.

 
* Additionally, an {Approval} event is emitted on calls to {transferFrom}.
* This allows applications to reconstruct the allowance for all accounts just
* by listening to said events. Other implementations of the EIP may not emit
* these events, as it isn't required by the specification.
*
* Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
* functions have been added to mitigate the well-known issues around setting
* allowances. See {IERC7254-approve}.
*/
contract ERC7254 is ERC20 {
    struct UserInformation {
        uint256 inReward;
        uint256 outReward;
        uint256 withdraw;
    }
    mapping(address => mapping(address => UserInformation)) private userInformation;
    mapping(address => uint256) private rewardPerShare;
    mapping(address => bool) private isTokenReward;
    address[] private _tokenReward;
    uint256 public constant MAX = 2**128;
    /**
    * @dev Emitted when the add reward  of a `contributor` is set by
    * a call to {approve}.
    */
    event UpdateReward(address indexed contributor, uint256 value);

    /**
    * @dev Emitted when `value` tokens reward to another (`to`) from caller
    * `caller`.
    *
    * Note that `value` may be zero.
    */
    event GetReward(address indexed owner, address indexed to, uint256 value);

    /**
    * @dev Emitted when `token` tokens reward is added.
    * 
    */
    event Add(address token);

    /**
    * @dev Sets the values for {name} and {symbol} and {tokenReward}.
    *
    * The default value of {decimals} is 18. To select a different value for
    * {decimals} you should overload it.
    *
    * All three of these values are immutable: they can only be set once during
    * construction.
    */
    constructor(string memory name_, string memory symbol_, address tokenReward_) ERC20(name_, symbol_){
        _tokenReward.push(tokenReward_);
        isTokenReward[tokenReward_] = true;
    }

    /**
    * @dev Returns max token reward.
    */
    function maxTokenReward() public view virtual returns(uint256){
        return 8;
    }

    /**
    * @dev Returns list user information by `account`.
    */
    function informationOfBatch(address account) public view virtual returns (UserInformation[] memory) {
        UserInformation[] memory user = new UserInformation[](_tokenReward.length);
        for (uint256 i = 0; i < _tokenReward.length; ++i) {
            user[i] = userInformation[_tokenReward[i]][account];
        }
        return user;
    }

    /**
    * @dev Returns user information by `token reward` and `account`.
    */
    function informationOf(address token, address account) public view virtual returns(UserInformation memory){
        return userInformation[token][account];
    }

    /**
    * @dev Returns list token reward.
    */
    function tokenReward() public view virtual returns (address[] memory) {
        return _tokenReward;
    }

    /**
    * @dev Returns reward per share.
    */
    function getRewardPerShare(address token) public view virtual returns (uint256){
        return rewardPerShare[token];
    }

    /**
    * @dev Indicates whether token exist.
    */
    function existsTokenReward(address token) public view virtual returns (bool){
        return isTokenReward[token];
    }

    /**
    * @dev Returns the amount of reward by `account`.
    */
    function viewReward(address account) public view virtual returns (uint256[] memory){
        uint256[] memory rewardOf = new uint256[](_tokenReward.length);
        for( uint256 i = 0; i < _tokenReward.length; ++i){
            UserInformation memory user = informationOf(_tokenReward[i], account);
            uint256 reward = balanceOf(account) * rewardPerShare[_tokenReward[i]] + user.inReward - user.withdraw - user.outReward;
            rewardOf[i] = reward / MAX;
        }
        return rewardOf;
    }

    /**
    * @dev Add `amount` tokens .
    *
    * Emits a {UpdateReward} event.
    */
    function updateReward(address[] memory token, uint256[] memory amount) public virtual {   
        require(token.length == amount.length, "ERC7254: token and amount length mismatch");
        address owner = _msgSender();
        if(totalSupply() != 0){
            for( uint256 i = 0; i < token.length; ++i){
                require(isTokenReward[token[i]], "ERC7254: token reward is not approved");
                IERC20(token[i]).transferFrom(owner, address(this), amount[i]);
                _updateRewardPerShare(token[i], amount[i]);
                emit UpdateReward(owner, amount[i]);
            }
            
        }    
    }

    /**
    * @dev Moves reward to another (`to`) from caller.
    *
    *
    * Emits a {GetReward} event.
    */
    function getReward(address[] memory token, address to) public virtual {
        address owner = _msgSender();
        for( uint256 i = 0; i < token.length; ++i){
            UserInformation storage user = userInformation[token[i]][owner];
            uint256 reward =  balanceOf(owner) * rewardPerShare[token[i]] + user.inReward - user.withdraw - user.outReward;
            _withdraw(token[i], owner, reward);
            if(reward / MAX > 0){
                IERC20(token[i]).transfer(to, reward / MAX);
            }  
            emit GetReward(owner, to, reward);
        }
    }

    /**
    * @dev Update list inReward of user.
    *
    */
    function _inReward(address user, uint256 amount) internal virtual {
        for (uint256 i = 0; i < _tokenReward.length; ++i){
            UserInformation storage userFrom = userInformation[_tokenReward[i]][user];
            userFrom.inReward += amount * rewardPerShare[_tokenReward[i]];
        }
    }

    /**
    * @dev Update list outReward of user.
    *
    */
    function _outReward(address user, uint256 amount) internal virtual {
        for (uint i = 0; i < _tokenReward.length; ++i){
            UserInformation storage userTo = userInformation[_tokenReward[i]][user];
            userTo.outReward +=  amount * rewardPerShare[_tokenReward[i]];
        }
    }
    

    /**
    * @dev add reward withdraw of owner.
    *
    */
    function _withdraw(address token, address owner, uint256 reward) internal virtual {
        require(owner != address(0), "ERC7254: withdraw from the zero address");
        UserInformation storage user = userInformation[token][owner];
        user.withdraw += reward;
    }

    /**
    * @dev Update reward per share.
    *
    */
    function _updateRewardPerShare(address token, uint256 amount) internal virtual {
        require(token != address(0), "ERC7254: token the zero address");
        require(totalSupply() != 0, "ERC7254: totalSupply is zero");
        rewardPerShare[token] = rewardPerShare[token] + amount * MAX / totalSupply();
    }

    /**
    * @dev add token reward.
    *
    */
    function _add(address[] memory token) internal virtual {
        require(_tokenReward.length + token.length <= maxTokenReward(), "ERC7254: exceeds maxTokenReward");
        for ( uint256 i = 0; i < token.length; ++i ){
            require(!existsTokenReward(token[i]), "ERC7254: token already exists");
            require(token[i] != address(0), "ERC7254: token reward from the zero address");
            _tokenReward.push(token[i]);
            isTokenReward[token[i]] = true;
            emit Add(token[i]);
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0)) {
            _inReward(from, amount);
        }
        if (to != address(0)) {
            _outReward(to, amount);
        }
    }
}