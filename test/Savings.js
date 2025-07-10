const { loadFixture, time }  = require("@nomicfoundation/hardhat-network-helpers")
const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

describe('Savings', () => {
  async function deployContractAndVariables() {
    const [deployer, secondUser] = await ethers.getSigners()

    const Token = await ethers.getContractFactory('TestERC20');
    const token = await Token.deploy("TestERC20", "TET")

    return { deployer, token, secondUser }
  }

  it("initialise", async function() {
    const { deployer, token, secondUser } = await loadFixture(deployContractAndVariables)

    console.log(await token.getAddress())
    let balance = await token.balanceOf(deployer.address)
    console.log(ethers.formatEther(balance))
    const tx = await token.transfer(secondUser.address, ethers.parseEther("100"))
    tx.wait()
    console.log("Balance", ethers.formatEther((await token.balanceOf(deployer.address))))
    console.log("sec acct", ethers.formatEther(await token.balanceOf(secondUser.address)))
    console.log("fanny", deployer.address)
  })
})