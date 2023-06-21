// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/XOilSwap.sol";
import "../src/CustomMintableToken.sol";

contract OilSwapTest is Test {
    XOilSwap private xOilSwap;
    CustomMintableToken private xOilContract;
    CustomMintableToken private IscContract;
    address private alice;

    function setUp() public {
        alice = 0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326;
        xOilContract = new CustomMintableToken(1000, "Wormhole xOil", "xOIL");
        IscContract = new CustomMintableToken(
            1000,
            "International Stable Currency",
            "ISC"
        );

        // init swap contract
        xOilSwap = new XOilSwap(address(xOilContract), address(IscContract));

        // fund a user with some xOil
        xOilContract.transfer(address(alice), 100);

        // fund the swap contract with native token
        IscContract.transfer(address(xOilSwap), 50);
    }

    function testNotEnoughXOilAllowance() public {
        vm.startPrank(address(alice));
        vm.expectRevert("xOilSwap: amount exceeds allowance");
        xOilSwap.swap(100);
        vm.stopPrank();

        // sanity check that no balances changed
        assertEq(xOilContract.balanceOf(address(alice)), 100);
        assertEq(IscContract.balanceOf(address(xOilSwap)), 50);
    }

    function testNotEnoughNativeTokenBalance() public {
        vm.startPrank(address(alice));
        xOilContract.approve(address(xOilSwap), 100);
        vm.expectRevert("xOilSwap: amount exceeds native token balance");
        xOilSwap.swap(100);
        vm.stopPrank();

        // sanity check that no balances changed
        assertEq(xOilContract.balanceOf(address(alice)), 100);
        assertEq(IscContract.balanceOf(address(xOilSwap)), 50);
    }

    function testSuccessfulSwap() public {
        assertEq(IscContract.balanceOf(address(alice)), 0);
        vm.startPrank(address(alice));
        xOilContract.approve(address(xOilSwap), 100);
        xOilSwap.swap(45);
        vm.stopPrank();

        assertEq(xOilContract.balanceOf(address(alice)), 55);
        assertEq(IscContract.balanceOf(address(alice)), 45);
        assertEq(IscContract.balanceOf(address(xOilSwap)), 5);
    }

    function testSwapDrainsContractBalance() public {
        assertEq(IscContract.balanceOf(address(alice)), 0);
        vm.startPrank(address(alice));
        xOilContract.approve(address(xOilSwap), 100);
        xOilSwap.swap(50);
        vm.stopPrank();

        assertEq(xOilContract.balanceOf(address(alice)), 50);
        assertEq(IscContract.balanceOf(address(alice)), 50);
        assertEq(IscContract.balanceOf(address(xOilSwap)), 0);

        vm.startPrank(address(alice));
        vm.expectRevert("xOilSwap: amount exceeds native token balance");
        xOilSwap.swap(1);
        vm.stopPrank();
    }
}
