// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
using SafeERC20 for IERC20;

contract Savings is ReentrancyGuard {
  uint256 public deadline;
  address public recipientAddress;
  address public owner;
  uint256 private deadlineAdjustmentCount = 0;

  IERC20 public token;

  constructor(uint256 _deadline, address _recipientAddress, address _owner, address tokenAddress) payable {
    require(msg.value >= 0.01 ether, "Must deploy with at least 0.01 ETH");
    require(block.timestamp < _deadline, "Deadline must be in the future");

    deadline = _deadline;
    recipientAddress = _recipientAddress;
    owner = _owner;

    token = IERC20(tokenAddress);
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Only owner can perform this function");
    _;
  }

  receive() external payable {}

  function withdrawBalance() public onlyOwner nonReentrant {
    require(block.timestamp > deadline, "Cannot withdraw before deadline");
    require(address(this).balance > 0, "Balance is empty");
    
    //reentrancy fix
    // another trick is to ensure no state changes occur after ".call"
    uint256 balance = address(this).balance;
    (bool s, ) = address(recipientAddress).call{ value: balance }("");
    require(s, "ETH Balance failed");

    uint256 tokenBalance = token.balanceOf(address(this));
    if (tokenBalance > 0) {
      token.safeTransfer(recipientAddress, tokenBalance);
    }
  }

  function adjustDeadline(uint256 _newDeadline) public onlyOwner {
    require(deadline < _newDeadline, "Deadline must be later than existing deadline");
    require(deadlineAdjustmentCount < 2, "Deadline cannot be changed more than twice");
    deadline = _newDeadline;
    deadlineAdjustmentCount++;
  }

}
