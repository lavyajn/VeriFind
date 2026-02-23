// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetGuard is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    enum Status { REGISTERED, STOLEN, RECOVERED }

    struct Item {
        string serialNumber;
        Status status;
        uint256 reportDate;
        bool isMinted; // 🛡️ NEW: The ultimate existence check
    }

    mapping(uint256 => Item) public items;
    mapping(string => uint256) public serialToTokenId;
    mapping(string => bool) public serialExists; // 🛡️ NEW: Safely tracks unique serials
    
    mapping(address => bool) public approvedRelayers;

    event ItemReported(uint256 indexed tokenId, Status status);

    constructor() ERC721("AssetGuard", "AGD") Ownable(msg.sender) {}

    function addRelayer(address relayer) public onlyOwner {
        approvedRelayers[relayer] = true;
    }

    // 1. THE MINT (Done by Manufacturer)
    function manufacturerMint(address to, string memory serial, string memory uri) public onlyOwner {
        require(!serialExists[serial], "Error: Serial already registered!");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Mark as minted = true!
        items[tokenId] = Item(serial, Status.REGISTERED, 0, true); 
        serialToTokenId[serial] = tokenId;
        serialExists[serial] = true;
    }

    // 2. THE ANYWHERE "REPORT STOLEN" (Done by User OR Node.js Relayer)
    function reportStolen(uint256 tokenId) public {
        // 🛡️ THE PATCH: Kills the transaction instantly if the item is a ghost
        require(items[tokenId].isMinted == true, "CRITICAL: This device does not exist on the blockchain!");
        
        require(msg.sender == ownerOf(tokenId) || approvedRelayers[msg.sender], "Not authorized!");
        
        items[tokenId].status = Status.STOLEN;
        items[tokenId].reportDate = block.timestamp;
        emit ItemReported(tokenId, Status.STOLEN);
    }
    // 3. THE RECOVERY (Done by User OR Node.js Relayer)
    function reportRecovered(uint256 tokenId) public {
        require(items[tokenId].isMinted == true, "CRITICAL: This device does not exist on the blockchain!");
        // Only the owner or the Relayer can unlock it
        require(msg.sender == ownerOf(tokenId) || approvedRelayers[msg.sender], "Not authorized!");
        require(items[tokenId].status == Status.STOLEN, "Device is not currently stolen.");
        
        items[tokenId].status = Status.RECOVERED;
        emit ItemReported(tokenId, Status.RECOVERED);
    }

    // 4. THE THEFT-BLOCK (Protects against resale)
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
             require(items[tokenId].status != Status.STOLEN, "CRITICAL: Asset is flagged STOLEN. Transfer blocked.");
        }
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}