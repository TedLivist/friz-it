require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  gasReporter: {
    enabled: false
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
