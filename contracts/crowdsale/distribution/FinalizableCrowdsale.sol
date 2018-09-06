pragma solidity ^0.4.24;

import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";
import "../validation/TimedCrowdsale.sol";


/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract FinalizableCrowdsale is Ownable, TimedCrowdsale {
  using SafeMath for uint256;

  bool private finalized_ = false;

  event CrowdsaleFinalized();

  /**
   * @return true if the crowdsale is finalized, false otherwise.
   */
  function finalized() public view returns(bool) {
    return finalized_;
  }

  /**
   * @dev Must be called after crowdsale ends, to do some extra finalization
   * work. Calls the contract's finalization function.
   */
  function finalize() public onlyOwner {
    require(!finalized_);
    require(hasClosed());

    _finalization();
    emit CrowdsaleFinalized();

    finalized_ = true;
  }

  /**
   * @dev Can be overridden to add finalization logic. The overriding function
   * should call super._finalization() to ensure the chain of finalization is
   * executed entirely.
   */
  function _finalization() internal {
  }

}
