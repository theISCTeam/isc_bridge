// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/CustomMintableToken.sol";

contract OilSwapTest is Test {
    CustomMintableToken private token;

    function setUp() public {
        token = new CustomMintableToken(1000, "token", "TKN");
    }

    function testSupply() public {
        assertEq(token.totalSupply(), 1000);
    }

    function testName() public {
        assertEq(token.name(), "token");
    }

    function testSymbol() public {
        assertEq(token.symbol(), "TKN");
    }

    function testInitialBalanceOfOwner() public {
        assertEq(token.balanceOf(address(this)), 1000);
    }

    function testMint() public {
        token.mint(address(this), 1000);
        assertEq(token.balanceOf(address(this)), 2000);
    }

    function testMintByWrongOwner() public {
        vm.startPrank(address(0));
        vm.expectRevert("Ownable: caller is not the owner");
        token.mint(address(this), 1000);
        vm.stopPrank();
    }
}
