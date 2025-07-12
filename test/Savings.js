const { loadFixture, time }  = require("@nomicfoundation/hardhat-network-helpers")
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe('Savings', () => {
  async function deployContractAndVariables() {
    const [deployer, secondUser] = await ethers.getSigners()

    // console.log("ETH BAL", await ethers.provider.getBalance(deployer))

    const date = Date.now()
    // 60 seconds, 60 minutes (1 hours), 24 hours
    // 30 days, 3 months
    const deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 3) * 1000)
    // add milliseconds of current date and future deadline
    // convert to seconds with division by 1000 and round up
    // solidity uses seconds, not milliseconds
    const deadlineDate = Math.floor((date + (deadlineInMilliseconds)) / 1000)

    const Token = await ethers.getContractFactory('TestERC20');
    const token = await Token.deploy("TestERC20", "TET")

    const Contract = await ethers.getContractFactory('Savings');
    const contract = await Contract.deploy(
      deadlineDate,
      secondUser.address, // recipient address
      deployer.address, // owner address
      {value: ethers.parseEther("0.01")} // initialize ETH balance of contract
    )

    await contract.waitForDeployment()

    // console.log("ETH BAL", await ethers.provider.getBalance(deployer))
    // console.log("Contract BAL", ethers.formatEther(await ethers.provider.getBalance(contract)))

    return {
      deployer, token, secondUser,
      contract, deadlineDate
    }
  }

  it("initialise variables", async function() {
    const { deployer, token, secondUser, contract, deadlineDate } = await loadFixture(deployContractAndVariables)

    expect(Number(await contract.deadline())).to.equal(deadlineDate)
    expect(await contract.owner()).to.equal(deployer.address)
    expect(await contract.recipientAddress()).to.equal(secondUser.address)
  })

  it("only owner can withdraw", async function() {
    const { contract, secondUser } = await loadFixture(deployContractAndVariables)

    try {
      await contract.connect(secondUser).withdrawBalance();
      assert.fail("Transaction should have reverted");
    } catch (error) {
      expect(error.message).to.include("Only owner can perform this function");
    }
  })

  it("withdrawal cannot be made before deadline", async function() {
    const { contract } = await loadFixture(deployContractAndVariables)

    try {
      await contract.withdrawBalance();
      assert.fail("Transaction should have reverted");
    } catch (error) {
      expect(error.message).to.include("Cannot withdraw before deadline");
    }
  })

  it("transfers balance to the recipient's address", async function() {
    const { contract, secondUser } = await loadFixture(deployContractAndVariables)

    const initialRecipientBalance = ethers.formatEther(await ethers.provider.getBalance(secondUser.address))
    const initialContractBalance = ethers.formatEther(await ethers.provider.getBalance(contract.getAddress()))

    await time.increase(7776000)

    const tx = await contract.withdrawBalance()
    tx.wait()

    const updatedRecipientBalance = ethers.formatEther(await ethers.provider.getBalance(secondUser.address))
    const updatedContractBalance = ethers.formatEther(await ethers.provider.getBalance(contract.getAddress()))

    console.log('New recipient balance', updatedRecipientBalance)
    console.log('New contract balance', updatedContractBalance)
  })
})