// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../src/XOilSwap.sol";
import "../src/CustomMintableToken.sol";

contract XOilSwapToNativeTokenTest is Test {
    XOilSwap private xOilSwap;
    IERC20 private inputTokenContract;
    IERC20 private outputTokenContract;
    address private alice;
    bool private toNativeToken;

    function setUp() public {
        toNativeToken = true;
        alice = 0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326;
        CustomMintableToken xOilContract = new CustomMintableToken(1000, "Wormhole xOil", "xOIL");
        CustomMintableToken iscContract = new CustomMintableToken(
            1000,
            "International Stable Currency",
            "ISC"
        );

        // init swap contract
        xOilSwap = new XOilSwap(address(xOilContract), address(iscContract));

        // in this test we're swapping from xOIL to native token,
        // so input is xOIL and output is  native token (ISC)
        inputTokenContract = xOilContract;
        outputTokenContract = iscContract;

        // fund a user with some xOil
        inputTokenContract.transfer(address(alice), 100);

        // fund the swap contract with native token
        outputTokenContract.transfer(address(xOilSwap), 50);
    }

    function testRevertWhenNotEnoughXOilAllowanceSetByUser() public {
        vm.startPrank(address(alice));
        vm.expectRevert("xOilSwap: amount exceeds input token allowance");
        xOilSwap.swap(100, toNativeToken);
        vm.stopPrank();

        // sanity check that no balances changed
        assertEq(inputTokenContract.balanceOf(address(alice)), 100);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 50);
    }

    function testRevertWhenNotEnoughNativeTokenBalanceInTheSwapContract() public {
        vm.startPrank(address(alice));
        inputTokenContract.approve(address(xOilSwap), 100);
        vm.expectRevert("xOilSwap: amount exceeds output token balance");
        xOilSwap.swap(100, toNativeToken);
        vm.stopPrank();

        // sanity check that no balances changed
        assertEq(inputTokenContract.balanceOf(address(alice)), 100);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 50);
    }

    function testSuccessfulSwap() public {
        assertEq(outputTokenContract.balanceOf(address(alice)), 0);
        vm.startPrank(address(alice));
        inputTokenContract.approve(address(xOilSwap), 100);
        xOilSwap.swap(45, toNativeToken);
        vm.stopPrank();

        assertEq(inputTokenContract.balanceOf(address(alice)), 55);
        assertEq(outputTokenContract.balanceOf(address(alice)), 45);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 5);
    }

    function testSwapDrainsContractBalance() public {
        assertEq(outputTokenContract.balanceOf(address(alice)), 0);
        vm.startPrank(address(alice));
        inputTokenContract.approve(address(xOilSwap), 100);
        xOilSwap.swap(50, toNativeToken);
        vm.stopPrank();

        assertEq(inputTokenContract.balanceOf(address(alice)), 50);
        assertEq(outputTokenContract.balanceOf(address(alice)), 50);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 0);

        vm.startPrank(address(alice));
        vm.expectRevert("xOilSwap: amount exceeds output token balance");
        xOilSwap.swap(1, toNativeToken);
        vm.stopPrank();
    }
}

contract XOilSwapToXOilTokenTest is Test {
    XOilSwap private xOilSwap;
    IERC20 private inputTokenContract;
    IERC20 private outputTokenContract;
    address private alice;
    bool private toNativeToken;

    function setUp() public {
        toNativeToken = false;
        alice = 0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326;
        CustomMintableToken xOilContract = new CustomMintableToken(1000, "Wormhole xOil", "xOIL");
        CustomMintableToken iscContract = new CustomMintableToken(
            1000,
            "International Stable Currency",
            "ISC"
        );

        // init swap contract
        xOilSwap = new XOilSwap(address(xOilContract), address(iscContract));


        // this test is the inverse of the previous test suite,
        // which means we're swapping from native token to xOil,
        // so input is native token (ISC) and output is xOIL
        inputTokenContract = iscContract;
        outputTokenContract = xOilContract;

        // fund a user with some xOil
        inputTokenContract.transfer(address(alice), 100);

        // fund the swap contract with native token
        outputTokenContract.transfer(address(xOilSwap), 50);
    }

    function testRevertWhenNotEnoughNativeTokenAllowanceSetByUser() public {
        vm.startPrank(address(alice));
        vm.expectRevert("xOilSwap: amount exceeds input token allowance");
        xOilSwap.swap(100, toNativeToken);
        vm.stopPrank();

        // sanity check that no balances changed
        assertEq(inputTokenContract.balanceOf(address(alice)), 100);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 50);
    }

    function testRevertWhenNotEnoughXOilBalanceInTheSwapContract() public {
        vm.startPrank(address(alice));
        inputTokenContract.approve(address(xOilSwap), 100);
        vm.expectRevert("xOilSwap: amount exceeds output token balance");
        xOilSwap.swap(100, toNativeToken);
        vm.stopPrank();

        // sanity check that no balances changed
        assertEq(inputTokenContract.balanceOf(address(alice)), 100);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 50);
    }

    function testSuccessfulSwap() public {
        assertEq(outputTokenContract.balanceOf(address(alice)), 0);
        vm.startPrank(address(alice));
        inputTokenContract.approve(address(xOilSwap), 100);
        xOilSwap.swap(45, toNativeToken);
        vm.stopPrank();

        assertEq(inputTokenContract.balanceOf(address(alice)), 55);
        assertEq(outputTokenContract.balanceOf(address(alice)), 45);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 5);
    }

    function testSwapDrainsContractBalance() public {
        assertEq(outputTokenContract.balanceOf(address(alice)), 0);
        vm.startPrank(address(alice));
        inputTokenContract.approve(address(xOilSwap), 100);
        xOilSwap.swap(50, toNativeToken);
        vm.stopPrank();

        assertEq(inputTokenContract.balanceOf(address(alice)), 50);
        assertEq(outputTokenContract.balanceOf(address(alice)), 50);
        assertEq(outputTokenContract.balanceOf(address(xOilSwap)), 0);

        vm.startPrank(address(alice));
        vm.expectRevert("xOilSwap: amount exceeds output token balance");
        xOilSwap.swap(1, toNativeToken);
        vm.stopPrank();
    }
}