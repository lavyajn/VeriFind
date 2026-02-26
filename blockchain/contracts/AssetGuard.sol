// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetGuard is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // 🔥 V2 UPGRADE: Added LOST state
    enum Status { REGISTERED, LOST, STOLEN, RECOVERED }

    struct Item {
        string serialNumber;
        Status status;
        uint256 reportDate;
        bool isMinted; 
    }

    mapping(uint256 => Item) public items;
    mapping(string => uint256) public serialToTokenId;
    mapping(string => bool) public serialExists; 
    
    mapping(address => bool) public approvedRelayers;

    event ItemReported(uint256 indexed tokenId, Status status);

    constructor() ERC721("AssetGuard", "AGD") Ownable(msg.sender) {
        approvedRelayers[msg.sender] = true; 
    }

    function addRelayer(address relayer) public onlyOwner {
        approvedRelayers[relayer] = true;
    }

    // 1. THE MINT (Your URI logic was already perfect here)
    function manufacturerMint(address to, string memory serial, string memory uri) public {
        require(msg.sender == owner() || approvedRelayers[msg.sender], "Not authorized");
        require(!serialExists[serial], "Error: Serial already registered!");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        items[tokenId] = Item(serial, Status.REGISTERED, 0, true); 
        serialToTokenId[serial] = tokenId;
        serialExists[serial] = true;
    }

    // 2. REPORT STOLEN
    function reportStolen(uint256 tokenId) public {
        require(items[tokenId].isMinted == true, "CRITICAL: This device does not exist on the blockchain!");
        require(msg.sender == ownerOf(tokenId) || approvedRelayers[msg.sender], "Not authorized!");
        
        items[tokenId].status = Status.STOLEN;
        items[tokenId].reportDate = block.timestamp;
        emit ItemReported(tokenId, Status.STOLEN);
    }

    // 🔥 V2 UPGRADE: REPORT LOST
    function reportLost(uint256 tokenId) public {
        require(items[tokenId].isMinted == true, "CRITICAL: This device does not exist on the blockchain!");
        require(msg.sender == ownerOf(tokenId) || approvedRelayers[msg.sender], "Not authorized!");
        
        items[tokenId].status = Status.LOST;
        items[tokenId].reportDate = block.timestamp;
        emit ItemReported(tokenId, Status.LOST);
    }

    // 3. THE RECOVERY (Upgraded to allow recovery from LOST or STOLEN)
    function reportRecovered(uint256 tokenId) public {
        require(items[tokenId].isMinted == true, "CRITICAL: This device does not exist on the blockchain!");
        require(msg.sender == ownerOf(tokenId) || approvedRelayers[msg.sender], "Not authorized!");
        require(items[tokenId].status == Status.STOLEN || items[tokenId].status == Status.LOST, "Device is not currently missing.");
        
        items[tokenId].status = Status.RECOVERED;
        emit ItemReported(tokenId, Status.RECOVERED);
    }

    // 4. SECONDARY MARKET (Blocks LOST and STOLEN)
    function transferAsset(address to, uint256 tokenId) public {
        require(items[tokenId].isMinted == true, "Device does not exist");
        require(items[tokenId].status != Status.STOLEN && items[tokenId].status != Status.LOST, "CRITICAL: Cannot transfer a locked asset!");
        require(msg.sender == ownerOf(tokenId) || approvedRelayers[msg.sender], "Not authorized");

        _transfer(ownerOf(tokenId), to, tokenId);
    }

    // 5. THE THEFT-BLOCK (Protects against resale, upgraded for LOST)
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
             require(items[tokenId].status != Status.STOLEN, "CRITICAL: Asset is flagged STOLEN. Transfer blocked.");
             require(items[tokenId].status != Status.LOST, "CRITICAL: Asset is flagged LOST. Transfer blocked.");
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