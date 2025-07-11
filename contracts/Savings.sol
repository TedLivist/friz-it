// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Savings {
  uint256 public deadline;
  address public recipientAddress;
  address public owner;

  constructor(uint256 _deadline, address _recipientAddress, address _owner) payable {
    require(msg.value >= 0.01 ether, "Must deploy with at least 0.01 ETH");
    require(block.timestamp < _deadline, "Deadline must be in the future");

    deadline = _deadline;
    recipientAddress = _recipientAddress;
    owner = _owner;
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Only owner can perform this function");
    _;
  }

  
}
