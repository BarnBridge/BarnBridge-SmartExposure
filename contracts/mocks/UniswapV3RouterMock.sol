// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapV3RouterMock {
    address tokenA;
    address tokenB;
    uint8 internal decA;
    uint8 internal decB;
    uint256 internal rate;

    constructor(address _tokenA, address _tokenB, uint8 _decA, uint8 _decB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        decA = _decA;
        decB = _decB;
    }

    function setRate(uint256 _rate) external {
        rate = _rate;
    }

    function exactInputSingle(
        ISwapRouter.ExactInputSingleParams calldata params
    ) external returns (uint256 amountOut) {
        if (params.tokenIn == tokenA && params.tokenOut == tokenB) {
            amountOut = (((params.amountIn * rate) / 10**decA) * 10**decB) / 1e18; // TokenB
        } else if (params.tokenIn == tokenB && params.tokenOut == tokenA) {
            amountOut = (((params.amountIn * 1e18) / 10**decB) * 10**decA) / rate; // TokenA
        } else {
            revert("UniswapV3RouterMock: Not mocked");
        }

        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        IERC20(params.tokenOut).transfer(params.recipient, amountOut);
    }

    function exactOutputSingle(
        ISwapRouter.ExactOutputSingleParams calldata params
    ) external returns (uint256 amountIn) {
        if (params.tokenIn == tokenA && params.tokenOut == tokenB) {
            amountIn = (((params.amountOut * 1e18) / 10**decB) * 10**decA) / rate; // TokenA
        } else if (params.tokenIn == tokenB && params.tokenOut == tokenA) {
            amountIn = (((params.amountOut * rate) / 10**decA) * 10**decB) / 1e18; // TokenB
        } else {
            revert("UniswapV3RouterMock: Not mocked");
        }

        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(params.tokenOut).transfer(params.recipient, params.amountOut);
    }
}
