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

    token.waitForDeployment()
    const tokenAddress = await token.getAddress()

    const Contract = await ethers.getContractFactory('Savings');
    const contract = await Contract.deploy(
      deadlineDate,
      secondUser.address, // recipient address
      deployer.address, // owner address
      tokenAddress,
      {value: ethers.parseEther("0.01")} // initialize ETH balance of contract
    )

    await contract.waitForDeployment()
    
    // transfer 100,000 units of TET token to contract
    const contractAddress = await contract.getAddress()
    await token.transfer(contractAddress, ethers.parseUnits("100000", 18))
    
    return {
      deployer, token, secondUser,
      contract, deadlineDate
    }
  }

  it("initialise variables", async function() {
    const { deployer, token, secondUser, contract, deadlineDate } = await loadFixture(deployContractAndVariables)

    const deployerTokenBalance = ethers.formatEther(await token.balanceOf(deployer.address))
    const contractTokenBalance = ethers.formatEther(await token.balanceOf(await contract.getAddress()))

    expect(Number(await contract.deadline())).to.equal(deadlineDate)
    expect(await contract.owner()).to.equal(deployer.address)
    expect(await contract.recipientAddress()).to.equal(secondUser.address)
    expect(Number(deployerTokenBalance)).to.equal(900000)
    expect(Number(contractTokenBalance)).to.equal(100000)
  })

  describe('Withdrawing balance', async function() {
    it("only owner can withdraw", async function() {
      const { contract, secondUser } = await loadFixture(deployContractAndVariables)

      const contractBalance = await ethers.provider.getBalance(await contract.getAddress())
  
      await expect(contract.connect(secondUser).withdrawBalance())
        .to.be.revertedWith("Only owner can perform this function")
      expect(await ethers.provider.getBalance(await contract.getAddress()))
        .to.equal(contractBalance)
    })
  
    it("withdrawal cannot be made before deadline", async function() {
      const { contract } = await loadFixture(deployContractAndVariables)
  
      await expect(contract.withdrawBalance())
        .to.be.rejectedWith("Cannot withdraw before deadline")
    })
  
    it("transfers balance to the recipient's address", async function() {
      const { contract, secondUser, token } = await loadFixture(deployContractAndVariables)

      const initialRecipientBalance = ethers.formatEther(await ethers.provider.getBalance(secondUser.address))
      const initialContractBalance = ethers.formatEther(await ethers.provider.getBalance(contract.getAddress()))

      const initialContractTokenBalance = Number(
        await ethers.formatUnits(
          await token.balanceOf(await contract.getAddress())
        ))
      const initialRecipientTokenBalance = Number(
        await ethers.formatUnits(
          await token.balanceOf(secondUser.address)
        ))
  
      // fast-forward the time
      await time.increase(7776000)

      const tx = await contract.withdrawBalance()
      tx.wait()
  
      const updatedRecipientBalance = ethers.formatEther(await ethers.provider.getBalance(secondUser.address))
      const updatedContractBalance = ethers.formatEther(await ethers.provider.getBalance(contract.getAddress()))
  
      expect(Number(updatedRecipientBalance)).to.equal(Number(initialRecipientBalance) + Number(initialContractBalance))
      expect(Number(updatedContractBalance)).to.equal(0)

      // token withdrawal
      const updatedContractTokenBalance = Number(
        await ethers.formatUnits(
          await token.balanceOf(await contract.getAddress())
        ))
      const updatedRecipientTokenBalance = Number(
        await ethers.formatUnits(
          await token.balanceOf(secondUser.address)
        ))

      expect(updatedRecipientTokenBalance).to.equal(initialRecipientTokenBalance + initialContractTokenBalance)
      expect(updatedContractTokenBalance).to.equal(0)
    })
  })

  describe('Adjusting deadline', async function() {
    it("only owner can adjust deadline", async function() {
      const { contract, secondUser } = await loadFixture(deployContractAndVariables)

      await expect(contract.connect(secondUser).adjustDeadline(12333))
        .to.be.revertedWith('Only owner can perform this function')
    })
    
    it("deadline must be later than existing deadline", async function() {
      const { contract } = await loadFixture(deployContractAndVariables)

      const date = Date.now()
      // try changing to 2 months, instead of existing 3 months
      const deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 2) * 1000)
      const deadlineDate = Math.floor((date + (deadlineInMilliseconds)) / 1000)

      await expect(contract.adjustDeadline(deadlineDate))
        .to.be.revertedWith('Deadline must be later than existing deadline')
    })

    it("new deadline must be within a year", async function() {
      const { contract } = await loadFixture(deployContractAndVariables)

      const date = Date.now()
      // try changing to more than 12 months
      const deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 13) * 1000)
      const deadlineDate = Math.floor((date + (deadlineInMilliseconds)) / 1000)

      await expect(contract.adjustDeadline(deadlineDate))
        .to.be.revertedWith('New deadline cannot be upto one year')
    })
    
    it("sets the deadline when it's later than existing one", async function() {
      const { contract } = await loadFixture(deployContractAndVariables)

      const date = Date.now()
      // try changing to 4 months, instead of existing 3 months
      const deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 4) * 1000)
      const newDeadline = Math.floor((date + (deadlineInMilliseconds)) / 1000)

      const oldContractDeadline = Number(await contract.deadline())
      
      // existing deadline is different from proposed deadline
      expect(oldContractDeadline).to.not.equal(newDeadline)

      await contract.adjustDeadline(newDeadline)
      const contractDeadline = Number(await contract.deadline())

      // existing deadline is now same as proposed deadline 
      expect(contractDeadline).to.equal(newDeadline)
    })

    it('deadline cannot be changed more than twice', async function() {
      const { contract } = await loadFixture(deployContractAndVariables)

       const date = Date.now()
      // try changing to 4 months, instead of existing 3 months
      let deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 4) * 1000)
      const deadline1 = Math.floor((date + (deadlineInMilliseconds)) / 1000)
      await expect(contract.adjustDeadline(deadline1))
        .to.not.be.reverted

      deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 5) * 1000)
      const deadline2 = Math.floor((date + (deadlineInMilliseconds)) / 1000)
      await expect(contract.adjustDeadline(deadline2))
        .to.not.be.reverted

      deadlineInMilliseconds = ((60 * 60 * 24 * 30 * 6) * 1000)
      const deadline3 = Math.floor((date + (deadlineInMilliseconds)) / 1000)
      await expect(contract.adjustDeadline(deadline3))
        .to.be.revertedWith('Deadline cannot be changed more than twice')
    })
  })
})