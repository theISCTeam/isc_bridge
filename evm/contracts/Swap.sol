// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Swap is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address private immutable xOilSwapAddress;

    IERC20 public xOilToken;
    IERC20 public nativeToken;

    /// @notice Emitted on a successful swap
    /// @param caller The user who performed the swap
    /// @param amount The amount swapped
    event swap_event(address indexed caller, uint256 amount, bool indexed toNativeToken);

    /// @dev Prevents a swap when:
    /// (a) the caller hasn't approved this contract to spend input token on its behalf or
    /// (b) this contract doesn't have enough output token balance
    /// @param amount the amount to swap
    /// @param toNativeToken true if xOil to native token swap, false if native token to xOil swap
    modifier eligibleToSwap(uint256 amount, bool toNativeToken) {
        IERC20 inputToken = toNativeToken ? xOilToken : nativeToken;
        IERC20 outputToken = toNativeToken ? nativeToken : xOilToken;
        require(
            inputToken.allowance(msg.sender, xOilSwapAddress) >= amount,
            "xOilSwap: amount exceeds input token allowance"
        );
        require(
            outputToken.balanceOf(xOilSwapAddress) >= amount,
            "xOilSwap: amount exceeds output token balance"
        );
        _;
    }

    constructor(address _xOilToken, address _nativeToken) {
        xOilToken = IERC20(_xOilToken);
        nativeToken = IERC20(_nativeToken);
        xOilSwapAddress = address(this);
    }

    /// @notice Do a 1-to-1 swap between xOil and native token
    /// @param amount the amount to swap
    /// @param toNativeToken true if xOil to native token swap, false if native token to xOil swap
    function swap(uint256 amount, bool toNativeToken) external eligibleToSwap(amount, toNativeToken) nonReentrant {
        IERC20 inputToken = toNativeToken ? xOilToken : nativeToken;
        IERC20 outputToken = toNativeToken ? nativeToken : xOilToken;
        inputToken.safeTransferFrom(msg.sender, xOilSwapAddress, amount);
        outputToken.safeTransfer(msg.sender, amount);
        emit swap_event(msg.sender, amount, toNativeToken);
    }
}
