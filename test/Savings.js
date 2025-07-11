const { loadFixture, time }  = require("@nomicfoundation/hardhat-network-helpers")
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe('Savings', () => {
  async function deployContractAndVariables() {
    const [deployer, secondUser] = await ethers.getSigners()

    console.log("ETH BAL", await ethers.provider.getBalance(deployer))

    const date = Date.now()
    // 60 seconds, 60 minutes (1 hours), 24 hours
    // 30 days, 3 months
    const deadlineInSeconds = (60 * 60 * 24 * 30 * 3)
    const deadlineDate = date + (deadlineInSeconds * 1000)

    const Token = await ethers.getContractFactory('TestERC20');
    const token = await Token.deploy("TestERC20", "TET")

    const Contract = await ethers.getContractFactory('Savings');
    const contract = await Contract.deploy(
      deadlineDate,
      secondUser.address,
      deployer.address,
      {value: ethers.parseEther("0.01")}
    )

    await contract.waitForDeployment()

    console.log("ETH BAL", await ethers.provider.getBalance(deployer))
    console.log("Contract BAL", ethers.formatEther(await ethers.provider.getBalance(contract)))

    return { deployer, token, secondUser }
  }

  it("initialise", async function() {
    const { deployer, token, secondUser } = await loadFixture(deployContractAndVariables)

    // console.log(await token.getAddress())
    // let balance = await token.balanceOf(deployer.address)
    // console.log(ethers.formatEther(balance))
    // const tx = await token.transfer(secondUser.address, ethers.parseEther("100"))
    // tx.wait()
    // console.log("Balance", ethers.formatEther((await token.balanceOf(deployer.address))))
    // console.log("sec acct", ethers.formatEther(await token.balanceOf(secondUser.address)))
    console.log("fanny", deployer.address)
  })
})