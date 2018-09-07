pragma solidity ^0.4.24;

import "../../token/ERC20/ERC20.sol";
import "./ERC1132.sol";


contract LockableToken is ERC20, ERC1132 {
  /**
   * @dev Error messages for require statements
   */
  string internal constant ALREADY_LOCKED = "Tokens already locked";
  string internal constant NOT_LOCKED = "No tokens locked";
  string internal constant AMOUNT_ZERO = "Amount can not be 0";

  /**
   * @dev constructor to mint initial tokens
   */
  constructor(uint256 _supply) public {
    _mint(msg.sender, _supply);
  }

  /**
   * @dev Locks a specified amount of tokens against an address,
   *   for a specified reason and time
   * @param _reason The reason to lock tokens
   * @param _amount Number of tokens to be locked
   * @param _time Lock time in seconds
   */
  function lock(bytes32 _reason, uint256 _amount, uint256 _time)
    public
    returns (bool)
  {
    uint256 validUntil = now.add(_time); //solhint-disable-line

    // If tokens are already locked, then functions extendLock or
    // increaseLockAmount should be used to make any changes
    require(tokensLocked(msg.sender, _reason) == 0, ALREADY_LOCKED);
    require(_amount != 0, AMOUNT_ZERO);

    if (locked[msg.sender][_reason].amount == 0)
      lockReason[msg.sender].push(_reason);

    transfer(address(this), _amount);

    locked[msg.sender][_reason] = LockToken(_amount, validUntil, false);

    emit TokensLocked(
      msg.sender,
      _reason, 
      _amount, 
      validUntil
    );
    return true;
  }
  
  /**
   * @dev Transfers and Locks a specified amount of tokens,
   *   for a specified reason and time
   * @param _to adress to which tokens are to be transfered
   * @param _reason The reason to lock tokens
   * @param _amount Number of tokens to be transfered and locked
   * @param _time Lock time in seconds
   */
  function transferWithLock(
    address _to, 
    bytes32 _reason, 
    uint256 _amount, 
    uint256 _time
  )
    public
    returns (bool)
  {
    uint256 validUntil = now.add(_time); //solhint-disable-line

    require(tokensLocked(_to, _reason) == 0, ALREADY_LOCKED);
    require(_amount != 0, AMOUNT_ZERO);

    if (locked[_to][_reason].amount == 0)
      lockReason[_to].push(_reason);

    transfer(address(this), _amount);

    locked[_to][_reason] = LockToken(_amount, validUntil, false);
    
    emit TokensLocked(
      _to, 
      _reason, 
      _amount, 
      validUntil
    );
    return true;
  }

  /**
   * @dev Returns tokens locked for a specified address for a
   *   specified reason
   *
   * @param _of The address whose tokens are locked
   * @param _reason The reason to query the lock tokens for
   */
  function tokensLocked(address _of, bytes32 _reason)
    public
    view
    returns (uint256 amount)
  {
    if (!locked[_of][_reason].claimed)
      amount = locked[_of][_reason].amount;
  }
  
  /**
   * @dev Returns tokens locked for a specified address for a
   *   specified reason at a specific time
   *
   * @param _of The address whose tokens are locked
   * @param _reason The reason to query the lock tokens for
   * @param _time The timestamp to query the lock tokens for
   */
  function tokensLockedAtTime(address _of, bytes32 _reason, uint256 _time)
    public
    view
    returns (uint256 amount)
  {
    if (locked[_of][_reason].validity > _time)
      amount = locked[_of][_reason].amount;
  }

  /**
   * @dev Returns total tokens held by an address (locked + transferable)
   * @param _of The address to query the total balance of
   */
  function totalBalanceOf(address _of)
    public
    view
    returns (uint256 amount)
  {
    amount = balanceOf(_of);

    for (uint256 i = 0; i < lockReason[_of].length; i++) {
      amount = amount.add(tokensLocked(_of, lockReason[_of][i]));
    }  
  }  
  
  /**
   * @dev Extends lock for a specified reason and time
   * @param _reason The reason to lock tokens
   * @param _time Lock extension time in seconds
   */
  function extendLock(bytes32 _reason, uint256 _time)
    public
    returns (bool)
  {
    require(tokensLocked(msg.sender, _reason) > 0, NOT_LOCKED);

    locked[msg.sender][_reason].validity += _time;

    emit TokensLocked(
      msg.sender, _reason, 
      locked[msg.sender][_reason].amount, 
      locked[msg.sender][_reason].validity
    );
    return true;
  }
  
  /**
   * @dev Increase number of tokens locked for a specified reason
   * @param _reason The reason to lock tokens
   * @param _amount Number of tokens to be increased
   */
  function increaseLockAmount(bytes32 _reason, uint256 _amount)
    public
    returns (bool)
  {
    require(tokensLocked(msg.sender, _reason) > 0, NOT_LOCKED);
    transfer(address(this), _amount);

    locked[msg.sender][_reason].amount += _amount;

    emit TokensLocked(
      msg.sender, _reason, 
      locked[msg.sender][_reason].amount,
      locked[msg.sender][_reason].validity
    );
    return true;
  }

  /**
   * @dev Returns unlockable tokens for a specified address for a specified reason
   * @param _of The address to query the the unlockable token count of
   * @param _reason The reason to query the unlockable tokens for
   */
  function tokensUnlockable(address _of, bytes32 _reason)
    public
    view
    returns (uint256 amount)
  {
    //solhint-disable-next-line
    if (locked[_of][_reason].validity <= now && 
      !locked[_of][_reason].claimed) 
      amount = locked[_of][_reason].amount;
  }

  /**
   * @dev Unlocks the unlockable tokens of a specified address
   * @param _of Address of user, claiming back unlockable tokens
   */
  function unlock(address _of)
    public
    returns (uint256 unlockableTokens)
  {
    uint256 lockedTokens;

    for (uint256 i = 0; i < lockReason[_of].length; i++) {
      lockedTokens = tokensUnlockable(_of, lockReason[_of][i]);
      if (lockedTokens > 0) {
        unlockableTokens = unlockableTokens.add(lockedTokens);
        locked[_of][lockReason[_of][i]].claimed = true;
        emit TokensUnlocked(_of, lockReason[_of][i], lockedTokens);
      }
    } 

    if (unlockableTokens > 0)
      this.transfer(_of, unlockableTokens);
  }

  /**
   * @dev Gets the unlockable tokens of a specified address
   * @param _of The address to query the the unlockable token count of
   */
  function getUnlockableTokens(address _of)
    public
    view
    returns (uint256 unlockableTokens)
  {
    for (uint256 i = 0; i < lockReason[_of].length; i++) {
      unlockableTokens = unlockableTokens.add(
        tokensUnlockable(_of, lockReason[_of][i])
      );
    } 
  }
}