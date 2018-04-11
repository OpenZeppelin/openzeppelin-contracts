/* solium-disable security/no-low-level-calls */

pragma solidity ^0.4.21;

import "./ERC995.sol";
import "../ERC20/StandardToken.sol";


/**
 * @title ERC827, an extension of ERC20 token standard
 *
 * @dev Implementation the ERC995, following the ERC20 standard with extra
 * @dev methods to transfer value and data and execute calls in transfers and
 * @dev approvals.
 *
 * @dev Uses OpenZeppelin StandardToken.
 */
contract ERC995Token is ERC995, StandardToken {

  modifier onlyAnotherAddress(address _spender){
    require(_spender != address(this));
    _;
  }

  /**
   * @dev Addition to ERC20 token methods. It allows to
   * @dev approve the transfer of value and execute a call with the sent data.
   *
   * @dev Beware that changing an allowance with this method brings the risk that
   * @dev someone may use both the old and the new allowance by unfortunate
   * @dev transaction ordering. One possible solution to mitigate this race condition
   * @dev is to first reduce the spender's allowance to 0 and set the desired value
   * @dev afterwards:
   * @dev https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   *
   * @param _spender The address that will spend the funds.
   * @param _value The amount of tokens to be spent.
   * @param _preData ABI-encoded contract call to call `_to` address.
   * @param _posData ABI-encoded contract call to call `_to` address.
   *
   * @return true if the call function was executed successfully
   */
  function approve(
    address _spender,
    address _dataContract,
    uint256 _value,
    bytes _preData,
    bytes _posData
  )
    public onlyAnotherAddress(_spender) returns (bool)
  {
    require(_dataContract.call(_preData));
    super.approve(_spender, _value);
    require(_dataContract.call(_posData));
    return true;
  }

  /**
   * @dev Addition to ERC20 token methods. Transfer tokens to a specified
   * @dev address and execute a call with the sent data on the same transaction
   *
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amout of tokens to be transfered
   * @param _preData ABI-encoded contract call to call `_to` address.
   * @param _posData ABI-encoded contract call to call `_to` address.
   *
   * @return true if the call function was executed successfully
   */
  function transfer(
    address _to,
    address _dataContract,
    uint256 _value,
    bytes _preData,
    bytes _posData
  )
    public onlyAnotherAddress(_to) returns (bool)
  {
    require(_dataContract.call(_preData));
    super.transfer(_to, _value);
    require(_dataContract.call(_posData));
    return true;
  }

  /**
   * @dev Addition to ERC20 token methods. Transfer tokens from one address to
   * @dev another and make a contract call on the same transaction
   *
   * @param _from The address which you want to send tokens from
   * @param _to The address which you want to transfer to
   * @param _value The amout of tokens to be transferred
   * @param _preData ABI-encoded contract call to call `_to` address.
   * @param _posData ABI-encoded contract call to call `_to` address.
   *
   * @return true if the call function was executed successfully
   */
  function transferFrom(
    address _from,
    address _to,
    address _dataContract,
    uint256 _value,
    bytes _preData,
    bytes _posData
  )
    public onlyAnotherAddress(_to) returns (bool)
  {
    require(_dataContract.call(_preData));
    super.transferFrom(_from, _to, _value);
    require(_dataContract.call(_posData));
    return true;
  }

  /**
   * @dev Addition to StandardToken methods. Increase the amount of tokens that
   * @dev an owner allowed to a spender and execute a call with the sent data.
   *
   * @dev approve should be called when allowed[_spender] == 0. To increment
   * @dev allowed value is better to use this function to avoid 2 calls (and wait until
   * @dev the first transaction is mined)
   * @dev From MonolithDAO Token.sol
   *
   * @param _spender The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   * @param _preData ABI-encoded contract call to call `_to` address.
   * @param _posData ABI-encoded contract call to call `_to` address.
   */
  function increaseApproval(
    address _spender,
    uint _addedValue,
    address _dataContract,
    bytes _preData,
    bytes _posData
  )
    public onlyAnotherAddress(_spender) returns (bool)
  {
    require(_dataContract.call(_preData));
    super.increaseApproval(_spender, _addedValue);
    require(_dataContract.call(_posData));
    return true;
  }

  /**
   * @dev Addition to StandardToken methods. Decrease the amount of tokens that
   * @dev an owner allowed to a spender and execute a call with the sent data.
   *
   * @dev approve should be called when allowed[_spender] == 0. To decrement
   * @dev allowed value is better to use this function to avoid 2 calls (and wait until
   * @dev the first transaction is mined)
   * @dev From MonolithDAO Token.sol
   *
   * @param _spender The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   * @param _preData ABI-encoded contract call to call `_to` address.
   * @param _posData ABI-encoded contract call to call `_to` address.
   */
  function decreaseApproval(
    address _spender,
    uint _subtractedValue,
    address _dataContract,
    bytes _preData,
    bytes _posData
  )
    public onlyAnotherAddress(_spender) returns (bool)
  {
    require(_dataContract.call(_preData));
    super.decreaseApproval(_spender, _subtractedValue);
    require(_dataContract.call(_posData));
    return true;
  }
}