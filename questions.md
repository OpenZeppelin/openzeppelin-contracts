# Questions

## Contracts

* buyTokens: why not `require(beneficiary != address(0));``?
   - OK done in `_preValidatePurchase`.


* `_emitTokens` & `_processPurchase`: do we need both?
  - Used in PostDeliveryCrowdsale.


* Comment "overrideability" of `forwardFunds`.


* Can plain `Crowdsale` function on its own, or "virtual"?
  - Works, but useful for anything?


* `mapping(address => bool) public whitelist;` ex. in `WhitelistedCrowdsale`, benefits of mapping over vector/list?


* `super.` order of calls in multiple inheritance?


* Lack of constructor in inheritance: does `super` get called anyway?? With right parameters?


* What's this: "Warning: Function state mutability can be restricted to pure?" in Crowdsale functions?


* ERC20 token not Ownable, CHECK for safety in Crowdsale!


* As I cannot instantiate abstract contracts, which "heir" should I use in tests. More specifically, I need a token for testing crowdsales, but ERC20 is virtual, should I use StandardToken? DetailedERC20? It'd be nice to be clearer in which are abstract and which aren't.
  - Used examples/SimpleToken per Ale's suggestion.


* `CappedCrowdsale` is now `TimedCrowdsale`, which replicates prior functionality, but do we want it to be such? Maybe one should inherit from both. Whitelisted, for instance, is not Timed.. Shouldn't this be consistent?
  - Yes, fixed this, now Capped is not Timed.


* Are `using SafeMath for uint256;` statements inherited? Otherwise lacking in TimedCrowdsale.
  - Tested this, they are (despite docs & discussion, see https://github.com/ethereum/solidity/issues/1213). Repeating them just in case as per Fran's suggestion.


* Do we want `hasEnded()` to refer exclusively to TIME? what happens with Capped when cap is reached?
  1) No method (but if it's both Timed AND Capped, reaching the cap will return FALSE). in this case maybe call it TimeElapsed?
  2) Method answering only for cap (but then how to make sure BOTH are called in the multiple inheritance case!?).
  - Chose 1), and capReached() for Capped.


* Check for reentrancy in `_postValidatePurchase`. when it reverts, no transfer right?


* Which token to use in `CappedCrowdsaleImpl`? Simple, like the one used in test or ERC20? Both work.


* What does integer division do in safeMath?


* `IncreasingTimeCrowdsale`: I'm making externally available the current price by `getCurrentRate`, is that desirable? Also, this gets called each time someone buys token, is there an extra cost of making this external/public? Check `view` modifier.
  - Talked with Fran, update.

* What is the point in using `Impl`s as opposed to passing arguments to base constructors? In particular, from Solidity docs: "Derived contracts need to provide all arguments needed for the base constructors."
  - Talked to Fran, due to multiple inheritance, would repeat base constructor calls with no guarantee of actually calling it twice :-\


* Does `IncreasingTimeCrowdsale` work as is with decreasing price?
  - Looks like it doesn't due to uints. Changed name, adding require() to ensure this.

## Tests

* Check crowdsale funding, need to finely tune amount, smarter way? strange, is this the gas? high rate? rate should be inverse?!
  - This was due to `INITIAL_SUPPLY` in SimpleToken, changed the rate from 1000 to 1 to prevent this.


* Order of arguments in `CappedCrowdsale` constructor in _old_ `CappedCrowdsale` test?? cap before token!??
  - OK, it's not AUTOMATIC, this is provided in `CappedCrowdsaleImpl`!


* Do I need to explicitly call a super constructor if it takes no params?
  - Looks like I don't, but CHECK.


* `IndividuallyCappedCrowdsale`: what cap value does it default to?
  - 0, this is due to mappings defaulting to bytes in 0, int reads as 0.


* `safeMath` for `IndividuallyCappedCrowdsale`?
  - Yes, checks for over bounds (though it sould be inherited, but we decided for safety).



# PENDING

* CHECK all mocks!!


# BUGS

* Wrong constructor in `TimedCrowdsale.sol`?
  - FIXED


* Lacking constructor in `WhitelistedCrowdsale`.. does this work?! This should be fine, CHECK DOCS, but this pattern is present throughout.
  - OK


* Lacking `using SafeMath for uint256;` in TimedCrowdsale? CHECK whether it is inherited.
  - CHECKED, it is, but repeating anyway.



# CHECKED

## Global
  - Crowdsale

## Validation
  - TimedCrowdsale
  - CappedCrowdsale
  - WhitelistedCrowdsale
  - IndividuallyCappedCrowdsale

## Price
  - IncreasingPriceCrowdsale

# PENDING

## Distribution
  - FinalizableCrowdsale
  - PostDeliveryCrowdsale
  - RefundableCrowdsale

## Emission
  - ApprovedCrowdsale: token not Ownable by default, so _tokenOwner is meaningless, and token.transferFrom will fail. Discuss if meaningful to implement this with an Ownable token.
  - MintedCrowdsale: Impl necessary??
