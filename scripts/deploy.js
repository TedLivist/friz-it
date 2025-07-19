const { ethers } = require("hardhat");
require("dotenv").config()

const deployContractAddress = '0xC6dca50314D9F52F4F42DEd4FccE4867cfE0ED6b'

async function main() {
    const date = Date.now()
    // 60 seconds, 60 minutes (1 hours), 24 hours
    // 30 days, 1 month
    const deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 1) * 1000)
    // add milliseconds of current date and future deadline
    // convert to seconds with division by 1000 and round up
    // solidity uses seconds, not milliseconds
    const deadlineDate = Math.floor((date + (deadlineInMilliseconds)) / 1000)
    const recipientAddress = '0xe1827DC13548CAAF9c346590592423FE77101b14'
    const [ deployer ] = await ethers.getSigners()
    deployerAddress = deployer.address
    const tokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // USDC token sepolia contract

    const Savings = await ethers.getContractFactory('Savings');
    const savings = await Savings.deploy(
      deadlineDate,
      recipientAddress, // recipient address
      deployer.address, // owner address
      tokenAddress,
      {value: ethers.parseEther("0.01")} // initialize ETH balance of contract
    )


    await savings.waitForDeployment();
    const savingsAddress = await savings.getAddress();
    console.log(savingsAddress);
}

main()
  .catch(console.error);