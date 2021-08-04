// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapRouterMock {
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

    function swapExactTokensForTokens(
        uint amountIn,
        uint /* amountOutMin */,
        address[] calldata path,
        address to,
        uint /* deadline */
    ) external returns (uint[] memory amounts) {
        amounts = new uint[](2);
        if (path[0] == tokenA && path[1] == tokenB) {
            amounts[0] = amountIn; // TokenA
            amounts[1] = (((amountIn * rate) / 10**decA) * 10**decB) / 1e18; // TokenB
        } else if (path[0] == tokenB && path[1] == tokenA) {
            amounts[0] = amountIn; // TokenB
            amounts[1] = (((amountIn * 1e18) / 10**decB) * 10**decA) / rate; // TokenA
        } else {
            revert("UniswapRouterMock: Not mocked");
        }

        IERC20(path[0]).transferFrom(msg.sender, address(this), amounts[0]);
        IERC20(path[1]).transfer(to, amounts[1]);
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint /* amountInMax */,
        address[] calldata path,
        address to,
        uint /* deadline */
    ) external returns (uint[] memory amounts) {
        amounts = new uint[](2);
        if (path[0] == tokenA && path[1] == tokenB) {
            amounts[0] = (((amountOut * 1e18) / 10**decB) * 10**decA) / rate; // TokenA
            amounts[1] = amountOut; // TokenB
        } else if (path[0] == tokenB && path[1] == tokenA) {
            amounts[0] = (((amountOut * rate) / 10**decA) * 10**decB) / 1e18; // TokenB
            amounts[1] = amountOut; // TokenA
        } else {
            revert("UniswapRouterMock: Not mocked");
        }

        IERC20(path[0]).transferFrom(msg.sender, address(this), amounts[0]);
        IERC20(path[1]).transfer(to, amounts[1]);
    }
}
