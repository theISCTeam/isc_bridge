// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "src/CustomMintableToken.sol";

contract NativeTokenDeployScript is Script {
    CustomMintableToken private token;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // TODO: modify constructor inputs to your liking
        token = new CustomMintableToken(
            10000,
            "International Stable Currency",
            "ISC"
        );

        vm.stopBroadcast();
    }
}

// NOTE: this is a mock xOIL token contract that should be deployed only for testing
contract MockXOilTokenDeployScript is Script {
    CustomMintableToken private token;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        token = new CustomMintableToken(10000, "MOCK: Wormhole xOil", "xOIL");

        vm.stopBroadcast();
    }
}
