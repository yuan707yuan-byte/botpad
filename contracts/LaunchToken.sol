// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LaunchToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    address public immutable launchpad;
    address public immutable creator;
    string  public imageURI;
    string  public description;
    string  public websiteURL;
    string  public twitterURL;
    uint256 public createdAt;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory imageURI_,
        string memory description_,
        string memory websiteURL_,
        string memory twitterURL_,
        address creator_
    ) ERC20(name_, symbol_) {
        launchpad   = msg.sender;
        creator     = creator_;
        imageURI    = imageURI_;
        description = description_;
        websiteURL  = websiteURL_;
        twitterURL  = twitterURL_;
        createdAt   = block.timestamp;
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
