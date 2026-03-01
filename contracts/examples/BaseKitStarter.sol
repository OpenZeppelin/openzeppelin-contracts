// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BaseKitMarket {
    struct Listing {
        address payable seller; // 'payable' olarak güncellendi
        uint256 price;
    }

    mapping(uint256 => Listing) public listings;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // NFT listeleme
    function listNFT(uint256 _tokenId, uint256 _price) public {
        require(_price > 0, "Fiyat 0 olamaz");
        listings[_tokenId] = Listing(payable(msg.sender), _price); // payable yapıldı
    }

    // NFT satın alma
    function buyNFT(uint256 _tokenId) public payable {
        Listing memory item = listings[_tokenId];
        require(msg.value >= item.price, "Yetersiz odeme");
        require(item.price > 0, "Bu urun satista degil");

        // Transfer işlemi
        (bool success, ) = item.seller.call{value: msg.value}("");
        require(success, "Odeme basarisiz");

        delete listings[_tokenId];
    }
}
