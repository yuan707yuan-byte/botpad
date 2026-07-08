require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true }
  },
  networks: {
    botchain: {
      url: process.env.BOT_CHAIN_RPC || "https://rpc.bohr.life",
      chainId: 968,
      accounts: process.env.PRIVATE_KEY
        ? [`0x${process.env.PRIVATE_KEY.replace(/^0x/, "")}`]
        : []
    }
  },
  etherscan: {
    apiKey: { botchain: process.env.EXPLORER_API_KEY || "nokey" },
    customChains: [{
      network: "botchain",
      chainId: 968,
      urls: {
        apiURL: "https://scan.bohr.life/api",
        browserURL: "https://scan.bohr.life"
      }
    }]
  }
};
