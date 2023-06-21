// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";

contract XOilSwap is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address private immutable xOilSwapAddress;

    IERC20 public xOilToken;
    IERC20 public nativeToken;

    /// @notice Emitted on a successful swap
    /// @param caller The user who performed the swap
    /// @param amount The amount swapped
    event Swap(address indexed caller, uint256 amount);

    /// @dev Prevents a swap when:
    /// (a) the caller hasn't approved this contract to spend xOilToken on its behalf or
    /// (b) this contract doesn't have enough native token balance
    modifier eligibleToSwap(uint256 amount) {
        require(
            xOilToken.allowance(msg.sender, xOilSwapAddress) >= amount,
            "xOilSwap: amount exceeds allowance"
        );
        require(
            nativeToken.balanceOf(xOilSwapAddress) >= amount,
            "xOilSwap: amount exceeds native token balance"
        );
        _;
    }

    constructor(address _xOilToken, address _nativeToken) {
        xOilToken = IERC20(_xOilToken);
        nativeToken = IERC20(_nativeToken);
        xOilSwapAddress = address(this);
    }

    /// @notice Do a 1-to-1 swap from xOil to native token
    /// @param amount the amount to swap
    function swap(uint256 amount) external eligibleToSwap(amount) nonReentrant {
        xOilToken.safeTransferFrom(msg.sender, xOilSwapAddress, amount);
        nativeToken.safeTransfer(msg.sender, amount);
    }
}
