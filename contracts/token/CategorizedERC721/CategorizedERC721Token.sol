pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol';

contract CategorizedERC721Token is ERC721Token, Ownable {

  // event fired when a new category is created
  event CategoryCreated(uint categoryId, uint fromTokenId, uint toTokenId);

  // array with the supply of each category
  uint[] categoriesSupply;

  // mapping between the tokenId and categoryId
  mapping (uint => uint) private tokenIdCategoryId;

  // method used to create a new category and mint the tokens
  function createCategory(uint _supply) public onlyOwner{
    uint categoryId = categoriesSupply.push(_supply);

    uint startTokenId = totalSupply();
    uint lastTokenId = startTokenId + _supply - 1;
    for(uint tokenId = startTokenId; tokenId <= lastTokenId; tokenId++) {
      _mint(msg.sender, tokenId);
      tokenIdCategoryId[tokenId] = categoryId;
    }

    CategoryCreated(categoryId, startTokenId, lastTokenId);
  }
  // method to extend the amount of tokens for a given category
  function increaseCategorySupply(uint _categoryId, uint _extraSupply) public onlyOwner{
    require(categoriesSupply[_categoryId] > 0);

    uint currentSupply = categoriesSupply[_categoryId];

    uint newSupply = currentSupply + _extraSupply;
    categoriesSupply[_categoryId] = newSupply;

    uint startTokenId = totalSupply();
    uint lastTokenId = startTokenId + _extraSupply - 1;
    for(uint tokenId = startTokenId; tokenId <= lastTokenId; tokenId++) {
      _mint(msg.sender, tokenId);
      tokenIdCategoryId[tokenId] = _categoryId;
    }
  }

  // get the categoryId for a given token
  function getCategoryId(uint _tokenId) public view returns (uint) {
    require(_tokenId < totalSupply());
    return tokenIdCategoryId[_tokenId];
  }

  // get the total supply for a given category
  function getCategorySupply(uint _categoryId) public view returns (uint){
    require(_categoryId < categoriesSupply.length);
    return categoriesSupply[_categoryId];
  }
}
