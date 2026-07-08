// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LaunchToken.sol";
import "./interfaces/IUniswapV2Router02.sol";

/**
 * @title  TokenLaunchpad — BOT Chain
 * @notice Pump-style bonding curve launchpad.
 *         Raises 500 BOT → sends 350 BOT + 70% supply to DEX as locked LP
 *         → 150 BOT to admin as revenue.
 */
contract TokenLaunchpad is ReentrancyGuard, Ownable {

    uint256 public constant TOTAL_SUPPLY      = 1_000_000_000 * 1e18;
    uint256 public constant GRADUATION_BOT    = 500  * 1e18;
    uint256 public constant DEX_BOT           = 350  * 1e18;
    uint256 public constant ADMIN_BOT         = 150  * 1e18;
    uint256 public constant DEX_TOKEN_PCT     = 70;
    uint256 public constant VIRTUAL_BOT_INIT  = 30   * 1e18;
    uint256 public constant VIRTUAL_TOK_INIT  = 1_073_000_191 * 1e18;
    uint256 public constant CREATE_FEE        = 5    * 1e15;  // 0.005 BOT
    address public constant DEAD              = 0x000000000000000000000000000000000000dEaD;

    struct TokenInfo {
        address creator;
        uint256 vBot;
        uint256 vToken;
        uint256 botRaised;
        bool    graduated;
        uint256 createdAt;
    }

    address public dexRouter;
    address public adminWallet;

    mapping(address => TokenInfo) public tokens;
    address[] public tokenList;

    event TokenCreated(address indexed token, address indexed creator, string name, string symbol, uint256 ts);
    event TokenBought(address indexed token, address indexed buyer, uint256 botIn, uint256 tokOut, uint256 price);
    event TokenSold(address indexed token, address indexed seller, uint256 tokIn, uint256 botOut, uint256 price);
    event TokenGraduated(address indexed token, uint256 botLiq, uint256 tokLiq);
    event RouterUpdated(address router);

    constructor(address _dexRouter, address _adminWallet) Ownable(msg.sender) {
        dexRouter   = _dexRouter;
        adminWallet = _adminWallet;
    }

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageURI,
        string calldata description,
        string calldata websiteURL,
        string calldata twitterURL
    ) external payable returns (address tokenAddr) {
        require(msg.value >= CREATE_FEE, "Pay creation fee");
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Empty name/symbol");

        LaunchToken t = new LaunchToken(name, symbol, imageURI, description, websiteURL, twitterURL, msg.sender);
        tokenAddr = address(t);

        tokens[tokenAddr] = TokenInfo({
            creator:   msg.sender,
            vBot:      VIRTUAL_BOT_INIT,
            vToken:    VIRTUAL_TOK_INIT,
            botRaised: 0,
            graduated: false,
            createdAt: block.timestamp
        });
        tokenList.push(tokenAddr);

        payable(adminWallet).transfer(msg.value);
        emit TokenCreated(tokenAddr, msg.sender, name, symbol, block.timestamp);
    }

    function buyTokens(address tokenAddr, uint256 minTokensOut) external payable nonReentrant {
        TokenInfo storage info = tokens[tokenAddr];
        require(info.creator != address(0), "Unknown token");
        require(!info.graduated, "Graduated — trade on DEX");
        require(msg.value > 0, "Send BOT");

        uint256 tokOut = _botToTok(msg.value, info.vBot, info.vToken);
        require(tokOut >= minTokensOut, "Slippage");
        require(IERC20(tokenAddr).balanceOf(address(this)) >= tokOut, "Low liquidity");

        info.vBot      += msg.value;
        info.vToken    -= tokOut;
        info.botRaised += msg.value;

        IERC20(tokenAddr).transfer(msg.sender, tokOut);
        emit TokenBought(tokenAddr, msg.sender, msg.value, tokOut, _price(info.vBot, info.vToken));

        if (info.botRaised >= GRADUATION_BOT) _graduate(tokenAddr, info);
    }

    function sellTokens(address tokenAddr, uint256 tokenAmount, uint256 minBotOut) external nonReentrant {
        TokenInfo storage info = tokens[tokenAddr];
        require(info.creator != address(0), "Unknown token");
        require(!info.graduated, "Graduated — trade on DEX");
        require(tokenAmount > 0, "Zero amount");

        uint256 botOut = _tokToBot(tokenAmount, info.vBot, info.vToken);
        require(botOut >= minBotOut, "Slippage");
        require(address(this).balance >= botOut, "Insufficient BOT");

        IERC20(tokenAddr).transferFrom(msg.sender, address(this), tokenAmount);
        info.vBot   -= botOut;
        info.vToken += tokenAmount;
        if (info.botRaised >= botOut) info.botRaised -= botOut;
        else info.botRaised = 0;

        payable(msg.sender).transfer(botOut);
        emit TokenSold(tokenAddr, msg.sender, tokenAmount, botOut, _price(info.vBot, info.vToken));
    }

    function _graduate(address tokenAddr, TokenInfo storage info) internal {
        info.graduated = true;
        uint256 tokForDex = (TOTAL_SUPPLY * DEX_TOKEN_PCT) / 100;
        uint256 bal = IERC20(tokenAddr).balanceOf(address(this));
        if (bal > tokForDex) IERC20(tokenAddr).transfer(DEAD, bal - tokForDex);

        if (dexRouter != address(0)) {
            IERC20(tokenAddr).approve(dexRouter, tokForDex);
            try IUniswapV2Router02(dexRouter).addLiquidityETH{value: DEX_BOT}(
                tokenAddr, tokForDex, 0, 0, DEAD, block.timestamp + 600
            ) returns (uint256, uint256, uint256) {
                emit TokenGraduated(tokenAddr, DEX_BOT, tokForDex);
            } catch {
                info.graduated = false;
                IERC20(tokenAddr).approve(dexRouter, 0);
                return;
            }
        }
        payable(adminWallet).transfer(ADMIN_BOT);
    }

    function manualGraduate(address tokenAddr) external onlyOwner {
        TokenInfo storage info = tokens[tokenAddr];
        require(!info.graduated && info.botRaised >= GRADUATION_BOT, "Not ready");
        _graduate(tokenAddr, info);
    }

    // ── View helpers ────────────────────────────────────────────────────────
    function previewBuy(address t, uint256 botIn) external view returns (uint256) {
        return _botToTok(botIn, tokens[t].vBot, tokens[t].vToken);
    }
    function previewSell(address t, uint256 tokIn) external view returns (uint256) {
        return _tokToBot(tokIn, tokens[t].vBot, tokens[t].vToken);
    }
    function getCurrentPrice(address t) external view returns (uint256) {
        return _price(tokens[t].vBot, tokens[t].vToken);
    }
    function getProgress(address t) external view returns (uint256) {
        if (tokens[t].graduated) return 100;
        return (tokens[t].botRaised * 100) / GRADUATION_BOT;
    }
    function getTokenCount() external view returns (uint256) { return tokenList.length; }
    function getTokenList(uint256 offset, uint256 limit) external view returns (address[] memory out) {
        uint256 total = tokenList.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        out = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) out[i - offset] = tokenList[i];
    }

    // ── Math ────────────────────────────────────────────────────────────────
    function _botToTok(uint256 bIn, uint256 vB, uint256 vT) internal pure returns (uint256) {
        return vT - (vB * vT) / (vB + bIn);
    }
    function _tokToBot(uint256 tIn, uint256 vB, uint256 vT) internal pure returns (uint256) {
        return vB - (vB * vT) / (vT + tIn);
    }
    function _price(uint256 vB, uint256 vT) internal pure returns (uint256) {
        return vT == 0 ? 0 : (vB * 1e18) / vT;
    }

    // ── Admin ────────────────────────────────────────────────────────────────
    function setDexRouter(address r)   external onlyOwner { dexRouter = r; emit RouterUpdated(r); }
    function setAdminWallet(address a) external onlyOwner { require(a != address(0)); adminWallet = a; }

    receive() external payable {}
}
