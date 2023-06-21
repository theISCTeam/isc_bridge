// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../src/XOilSwap.sol";

contract XOilSwapDeployScript is Script {
    address private xOilTokenAddress;
    address private nativeTokenAddress;
    XOilSwap private xOilSwap;

    function setUp() public {
        xOilTokenAddress = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512; // TODO: change to actual xOIL token addres
        nativeTokenAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3; // TODO: change to actual native token addres
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        xOilSwap = new XOilSwap(xOilTokenAddress, nativeTokenAddress);

        vm.stopBroadcast();
    }
}

// NOTE: you may not want to use this in production as this
// script assumes that the sender already has a native token balance
contract FundXOilSwapScript is Script {
    uint256 private amount;
    address private xOilSwapAddress;
    address private nativeTokenAddress;
    IERC20 private nativeTokenContract;

    function setUp() public {
        amount = 100; // TODO: change to actual amount you want to fund
        xOilSwapAddress = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9; // TODO: change to actual xOILSwap contract addres
        nativeTokenAddress = 0x5FbDB2315678afecb367f032d93F642f64180aa3; // TODO: change to actual native token addres
        nativeTokenContract = IERC20(nativeTokenAddress);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        nativeTokenContract.transfer(xOilSwapAddress, amount);
        vm.stopBroadcast();
    }
}
