// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;
pragma experimental ABIEncoderV2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "./interfaces/IEToken.sol";
import "./interfaces/IEPoolPeriphery.sol";
import "./interfaces/IEPool.sol";
import "./utils/ControllerMixin.sol";
import "./utils/PoolAddress.sol";
import "./utils/TickMath.sol";
import "./utils/TokenUtils.sol";

import "./EPoolLibrary.sol";

contract EPoolPeripheryV3 is ControllerMixin, IEPoolPeriphery {
    using SafeERC20 for IERC20;
    using TokenUtils for IERC20;
    using TokenUtils for IEToken;

    address public immutable override factory;
    address public immutable override router;
    IQuoter public immutable quoter;
    // supported EPools by the periphery
    mapping(address => bool) public override ePools;
    // supported UniswapV3Pool by the periphery
    // mapping(address => mapping(address => uint24)) private override _feeTierForPair;
    mapping(bytes => uint24) private _feeTierForPair;

    event IssuedEToken(
        address indexed ePool, address indexed eToken, uint256 amount, uint256 amountA, uint256 amountB, address user
    );
    event RedeemedEToken(
        address indexed ePool, address indexed eToken, uint256 amount, uint256 amountA, uint256 amountB, address user
    );
    event SetEPoolApproval(address indexed ePool, bool approval);
    event SetFeeTierForPair(address tokenA, address tokenB, uint24 feeTier);
    event RecoveredToken(address token, uint256 amount);

    /**
     * @param _controller Address of the controller
     * @param _factory Address of the Uniswap V2 factory
     * @param _router Address of the Uniswap V2 router
     */
    constructor(
        IController _controller,
        address _factory,
        address _router,
        IQuoter _quoter
    ) ControllerMixin(_controller) {
        factory = _factory;
        router = _router;
        quoter = _quoter;
    }

    /**
     * @notice Returns the address of the Controller
     * @return Address of Controller
     */
    function getController() external view override returns (address) {
        return address(controller);
    }

    /**
     * @notice Updates the Controller
     * @dev Can only called by an authorized sender
     * @param _controller Address of the new Controller
     * @return True on success
     */
    function setController(address _controller) external override onlyDao("EPoolPeriphery: not dao") returns (bool) {
        _setController(_controller);
        return true;
    }

    /**
     * @notice Give or revoke approval a EPool for the EPoolPeriphery
     * @dev Can only called by the DAO or the guardian
     * @param ePool Address of the EPool
     * @param approval Boolean on whether approval for EPool should be given or revoked
     * @return True on success
     */
    function setEPoolApproval(
        IEPool ePool,
        bool approval
    ) external override onlyDaoOrGuardian("EPoolPeriphery: not dao or guardian") returns (bool) {
        if (approval) {
            // assuming EPoolPeriphery only holds funds within calls
            ePool.tokenA().approve(address(ePool), type(uint256).max);
            ePool.tokenB().approve(address(ePool), type(uint256).max);
            ePools[address(ePool)] = true;
        } else {
            ePool.tokenA().approve(address(ePool), 0);
            ePool.tokenB().approve(address(ePool), 0);
            ePools[address(ePool)] = false;
        }
        emit SetEPoolApproval(address(ePool), approval);
        return true;
    }

    /**
     * @notice Set fee tier for determining Uniswap V3 pool
     * @dev Can only be callede by the DAO or the guardian
     * @param feeTier fee tier in bps (defaults to 3000 if set to 0)
     * @return True on success
     */
    function setFeeTierForPair(
        address tokenA, address tokenB, uint24 feeTier
    ) external onlyDaoOrGuardian("EPoolPeriphery: not dao or guardian") returns (bool) {
        _feeTierForPair[(tokenA > tokenB) ? abi.encode(tokenA, tokenB) : abi.encode(tokenB, tokenA)] = feeTier;
        emit SetFeeTierForPair(tokenA, tokenB, feeTier);
        return true;
    }

    /**
     * @notice Issues an amount of EToken for maximum amount of TokenA
     * @dev Reverts if maxInputAmountA is exceeded. Unused amount of TokenA is refunded to msg.sender.
     * Requires setting allowance for TokenA.
     * @param ePool Address of the EPool
     * @param eToken Address of the EToken of the tranche
     * @param amount Amount of EToken to issue
     * @param maxInputAmountA Max. amount of TokenA to deposit
     * @param deadline Timestamp at which tx expires
     * @return True on success
     */
    function issueForMaxTokenA(
        IEPool ePool,
        address eToken,
        uint256 amount,
        uint256 maxInputAmountA,
        uint256 deadline
    ) external override returns (bool) {
        require(ePools[address(ePool)], "EPoolPeriphery: unapproved EPool");
        (IERC20 tokenA, IERC20 tokenB) = (ePool.tokenA(), ePool.tokenB());
        tokenA.safeTransferFrom(msg.sender, address(this), maxInputAmountA);
        IEPool.Tranche memory t = ePool.getTranche(eToken);
        (uint256 amountA, uint256 amountB) = EPoolLibrary.tokenATokenBForEToken(
            t, amount, ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        // swap part of input amount for amountB
        require(maxInputAmountA >= amountA, "EPoolPeriphery: insufficient max. input");
        uint256 amountAToSwap = maxInputAmountA - amountA;
        tokenA.approve(router, amountAToSwap);
        uint256 amountASwappedForAmountB = ISwapRouter(router).exactOutputSingle(ISwapRouter.ExactOutputSingleParams({
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            fee: feeTierForPair(address(tokenA), address(tokenB)),
            recipient: address(this),
            deadline: deadline,
            amountOut: amountB,
            amountInMaximum: amountAToSwap,
            sqrtPriceLimitX96: 0
        }));
        // do the deposit (TokenA is already approved)
        ePool.issueExact(eToken, amount);
        // transfer EToken to msg.sender
        IERC20(eToken).safeTransfer(msg.sender, amount);
        // refund unused maxInputAmountA -= amountA + amountASwappedForAmountB
        tokenA.safeTransfer(msg.sender, maxInputAmountA - amountA - amountASwappedForAmountB);
        emit IssuedEToken(address(ePool), eToken, amount, amountA, amountB, msg.sender);
        return true;
    }

    /**
     * @notice Issues an amount of EToken for maximum amount of TokenB
     * @dev Reverts if maxInputAmountB is exceeded. Unused amount of TokenB is refunded to msg.sender.
     * Requires setting allowance for TokenB.
     * @param ePool Address of the EPool
     * @param eToken Address of the EToken of the tranche
     * @param amount Amount of EToken to issue
     * @param maxInputAmountB Max. amount of TokenB to deposit
     * @param deadline Timestamp at which tx expires
     * @return True on success
     */
    function issueForMaxTokenB(
        IEPool ePool,
        address eToken,
        uint256 amount,
        uint256 maxInputAmountB,
        uint256 deadline
    ) external override returns (bool) {
        require(ePools[address(ePool)], "EPoolPeriphery: unapproved EPool");
        (IERC20 tokenA, IERC20 tokenB) = (ePool.tokenA(), ePool.tokenB());
        tokenB.safeTransferFrom(msg.sender, address(this), maxInputAmountB);
        IEPool.Tranche memory t = ePool.getTranche(eToken);
        (uint256 amountA, uint256 amountB) = EPoolLibrary.tokenATokenBForEToken(
            t, amount, ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        // swap part of input amount for amountB
        require(maxInputAmountB >= amountB, "EPoolPeriphery: insufficient max. input");
        uint256 amountBToSwap = maxInputAmountB - amountB;
        tokenB.approve(router, amountBToSwap);
        uint256 amountBSwappedForAmountA = ISwapRouter(router).exactOutputSingle(ISwapRouter.ExactOutputSingleParams({
            tokenIn: address(tokenB),
            tokenOut: address(tokenA),
            fee: feeTierForPair(address(tokenA), address(tokenB)),
            recipient: address(this),
            deadline: deadline,
            amountOut: amountA,
            amountInMaximum: amountBToSwap,
            sqrtPriceLimitX96: 0
        }));
        // do the deposit (TokenB is already approved)
        ePool.issueExact(eToken, amount);
        // transfer EToken to msg.sender
        IERC20(eToken).safeTransfer(msg.sender, amount);
        // refund unused maxInputAmountB -= amountB + amountBSwappedForAmountA
        tokenB.safeTransfer(msg.sender, maxInputAmountB - amountB - amountBSwappedForAmountA);
        emit IssuedEToken(address(ePool), eToken, amount, amountA, amountB, msg.sender);
        return true;
    }

    /**
     * @notice Redeems an amount of EToken for a min. amount of TokenA
     * @dev Reverts if minOutputA is not met. Requires setting allowance for EToken
     * @param ePool Address of the EPool
     * @param eToken Address of the EToken of the tranche
     * @param amount Amount of EToken to redeem
     * @param minOutputA Min. amount of TokenA to withdraw
     * @param deadline Timestamp at which tx expires
     * @return True on success
     */
    function redeemForMinTokenA(
        IEPool ePool,
        address eToken,
        uint256 amount,
        uint256 minOutputA,
        uint256 deadline
    ) external override returns (bool) {
        require(ePools[address(ePool)], "EPoolPeriphery: unapproved EPool");
        (IERC20 tokenA, IERC20 tokenB) = (ePool.tokenA(), ePool.tokenB());
        IERC20(eToken).safeTransferFrom(msg.sender, address(this), amount);
        // do the withdraw
        IERC20(eToken).approve(address(ePool), amount);
        (uint256 amountA, uint256 amountB) = ePool.redeemExact(eToken, amount);
        // convert amountB withdrawn from EPool into TokenA
        address[] memory path = new address[](2);
        path[0] = address(tokenB);
        path[1] = address(tokenA);
        tokenB.approve(router, amountB);
        uint256 amountOut = ISwapRouter(router).exactInputSingle(ISwapRouter.ExactInputSingleParams({
            tokenIn: address(tokenB),
            tokenOut: address(tokenA),
            fee: feeTierForPair(address(tokenA), address(tokenB)),
            recipient: address(this),
            deadline: deadline,
            amountIn: amountB,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        }));
        uint256 outputA = amountA + amountOut;
        require(outputA >= minOutputA, "EPoolPeriphery: insufficient output amount");
        IERC20(tokenA).safeTransfer(msg.sender, outputA);
        emit RedeemedEToken(address(ePool), eToken, amount, amountA, amountB, msg.sender);
        return true;
    }

    /**
     * @notice Redeems an amount of EToken for a min. amount of TokenB
     * @dev Reverts if minOutputB is not met. Requires setting allowance for EToken
     * @param ePool Address of the EPool
     * @param eToken Address of the EToken of the tranche
     * @param amount Amount of EToken to redeem
     * @param minOutputB Min. amount of TokenB to withdraw
     * @param deadline Timestamp at which tx expires
     * @return True on success
     */
    function redeemForMinTokenB(
        IEPool ePool,
        address eToken,
        uint256 amount,
        uint256 minOutputB,
        uint256 deadline
    ) external override returns (bool) {
        require(ePools[address(ePool)], "EPoolPeriphery: unapproved EPool");
        (IERC20 tokenA, IERC20 tokenB) = (ePool.tokenA(), ePool.tokenB());
        IERC20(eToken).safeTransferFrom(msg.sender, address(this), amount);
        // do the withdraw
        IERC20(eToken).approve(address(ePool), amount);
        (uint256 amountA, uint256 amountB) = ePool.redeemExact(eToken, amount);
        // convert amountB withdrawn from EPool into TokenA
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        tokenA.approve(router, amountA);
        uint256 amountOut = ISwapRouter(router).exactInputSingle(ISwapRouter.ExactInputSingleParams({
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            fee: feeTierForPair(address(tokenA), address(tokenB)),
            recipient: address(this),
            deadline: deadline,
            amountIn: amountA,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        }));
        uint256 outputB = amountB + amountOut;
        require(outputB >= minOutputB, "EPoolPeriphery: insufficient output amount");
        IERC20(tokenB).safeTransfer(msg.sender, outputB);
        emit RedeemedEToken(address(ePool), eToken, amount, amountA, amountB, msg.sender);
        return true;
    }

    /**
     * @notice Rebalances a EPool. Capital required for rebalancing is obtained via a flash swap.
     * The potential slippage between the EPool oracle and uniswap is covered by the KeeperSubsidyPool.
     * @dev Fails if maxFlashSwapSlippage is exceeded in uniswapV2Call
     * @param ePool Address of the EPool to rebalance
     * @param maxSlippage max. allowed slippage between EPool oracle and uniswap when executing a flash swap
     * 1.0e18 is defined as no slippage, 1.03e18 == 3% slippage, if < 1.0e18 then swap always has to make a profit
     * @return True on success
     */
    function rebalanceWithFlashSwap(IEPool ePool, uint256 maxSlippage) external override returns (bool) {
        require(ePools[address(ePool)], "EPoolPeriphery: unapproved EPool");
        (address tokenA, address tokenB) = (address(ePool.tokenA()), address(ePool.tokenB()));
        // map TokenA, TokenB to the pools token0, token1 via getPoolKey
        PoolAddress.PoolKey memory poolKey = PoolAddress.getPoolKey(
            address(tokenA), address(tokenB), feeTierForPair(tokenA, tokenB)
        );
        IUniswapV3Pool pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey));
        // map deltaA, deltaB to zeroForOne and amount
        bool zeroForOne; int256 amount;
        {
        (uint256 deltaA, uint256 deltaB, uint256 rChange) = EPoolLibrary.delta(
            ePool.getTranches(), ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        if (rChange == 0) {
            // release TokenA, add TokenB to EPool -> flash swap TokenB, repay with TokenA
            (zeroForOne, amount) = (address(tokenA) == poolKey.token0, SafeCast.toInt256(deltaB) * -1);
        } else {
            // add TokenA, release TokenB to EPool -> flash swap TokenA, repay with TokenB
            (zeroForOne, amount) = (address(tokenB) == poolKey.token0, SafeCast.toInt256(deltaA) * -1);
        }
        }
        bytes memory data;
        {
        data = abi.encode(poolKey, ePool, msg.sender, maxSlippage);
        }
        pool.swap(
            address(this),
            zeroForOne,
            amount,
            ((zeroForOne) ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1),
            data
        );
        return true;
    }

    /**
     * @notice rebalanceAllWithFlashSwap callback called by the uniswap pool
     * @dev Trusts that deltas are actually forwarded by the EPool.
     * Verifies that funds are forwarded from flash swap of the uniswap pool.
     * @param amount0 amount0Delta
     * @param amount1 amount1Delta
     * @param data Data forwarded in the flash swap
     */
    function uniswapV3SwapCallback(
        int256 amount0,
        int256 amount1,
        bytes calldata data
    ) external {
        (PoolAddress.PoolKey memory poolKey, IEPool ePool, address sender, uint256 maxSlippage) = abi.decode(
            data, (PoolAddress.PoolKey, IEPool, address, uint256)
        );
        require(msg.sender == PoolAddress.computeAddress(factory, poolKey), "EPoolPeriphery: sender is not pool");
        require(ePools[address(ePool)], "EPoolPeriphery: unapproved EPool");
        address tokenIn; uint256 deltaOut;
        {
        // fails if no funds are forwarded in the flash swap callback from the uniswap pool
        // TokenA, TokenB are already approved
        (uint256 deltaA, uint256 deltaB, uint256 rChange) = ePool.rebalance();
        (address tokenA, address tokenB) = (address(ePool.tokenA()), address(ePool.tokenB()));
        require(
            (poolKey.token0 == tokenA && poolKey.token1 == tokenB)
                || (poolKey.token0 == tokenB && poolKey.token1 == tokenA),
            "EPoolPeriphery: token mismatch"
        );
        // determine flash swap repay token (input token of swap) and amount received from rebalancing EPool
        (tokenIn, deltaOut) = (rChange == 0) ? (tokenA, deltaA) : (tokenB, deltaB);
        }
        // determine flash swap repay amount (input amount of swap)
        uint256 amountIn = (poolKey.token0 == tokenIn) ? SafeCast.toUint256(amount0) : SafeCast.toUint256(amount1);
        // if slippage is negative request subsidy, if positive top of KeeperSubsidyPool
        if (amountIn > deltaOut) {
            require(
                amountIn * EPoolLibrary.sFactorI / deltaOut <= maxSlippage,
                "EPoolPeriphery: excessive slippage"
            );
            IERC20(tokenIn).transferFrom(sender, address(this), amountIn - deltaOut);
        } else if (amountIn < deltaOut) {
            IERC20(tokenIn).safeTransfer(address(sender), deltaOut - amountIn);
        }
        // repay flash swap by sending amountIn to pair
        IERC20(tokenIn).safeTransfer(msg.sender, amountIn);
    }

    function feeTierForPair(address tokenA, address tokenB) public view returns (uint24 feeTier) {
        feeTier = _feeTierForPair[(tokenA > tokenB) ? abi.encode(tokenA, tokenB) : abi.encode(tokenB, tokenA)];
        if (feeTier == 0) feeTier = 3000;
    }

    /**
     * @notice Recovers untracked amounts
     * @dev Can only called by an authorized sender
     * @param token Address of the token
     * @param amount Amount to recover
     * @return True on success
     */
    function recover(IERC20 token, uint256 amount) external override onlyDao("EPool: not dao") returns (bool) {
        token.safeTransfer(msg.sender, amount);
        emit RecoveredToken(address(token), amount);
        return true;
    }

    /* ------------------------------------------------------------------------------------------------------- */
    /* view and pure methods                                                                                   */
    /* ------------------------------------------------------------------------------------------------------- */

    function minInputAmountAForEToken(
        IEPool ePool,
        address eToken,
        uint256 amount
    ) external returns (uint256 minTokenA) {
        (uint256 amountA, uint256 amountB) = EPoolLibrary.tokenATokenBForEToken(
            ePool.getTranche(eToken), amount, ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        minTokenA = amountA + quoter.quoteExactOutputSingle(
            address(ePool.tokenA()), address(ePool.tokenB()), 3000, amountB, 0
        );

    }

    // does not include price impact, which would result in a smaller EToken amount
    function eTokenForMinInputAmountA_Unsafe(
        IEPool ePool,
        address eToken,
        uint256 minInputAmountA
    ) external view returns (uint256 amount) {
        IEPool.Tranche memory t = ePool.getTranche(eToken);
        uint256 rate = ePool.getRate();
        uint256 sFactorA = ePool.sFactorA();
        uint256 sFactorB = ePool.sFactorB();
        uint256 ratio = EPoolLibrary.currentRatio(t, rate, sFactorA, sFactorB);
        (uint256 amountAIdeal, uint256 amountBIdeal) = EPoolLibrary.tokenATokenBForTokenA(
            minInputAmountA, ratio, rate, sFactorA, sFactorB
        );
        return EPoolLibrary.eTokenForTokenATokenB(t, amountAIdeal, amountBIdeal, rate, sFactorA, sFactorB);
    }

    function minInputAmountBForEToken(
        IEPool ePool,
        address eToken,
        uint256 amount
    ) external returns (uint256 minTokenB) {
        (uint256 amountA, uint256 amountB) = EPoolLibrary.tokenATokenBForEToken(
            ePool.getTranche(eToken), amount, ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        minTokenB = amountB + quoter.quoteExactOutputSingle(
            address(ePool.tokenB()), address(ePool.tokenA()), 3000, amountA, 0
        );
    }

    // does not include price impact, which would result in a smaller EToken amount
    function eTokenForMinInputAmountB_Unsafe(
        IEPool ePool,
        address eToken,
        uint256 minInputAmountB
    ) external view returns (uint256 amount) {
        IEPool.Tranche memory t = ePool.getTranche(eToken);
        uint256 rate = ePool.getRate();
        uint256 sFactorA = ePool.sFactorA();
        uint256 sFactorB = ePool.sFactorB();
        uint256 ratio = EPoolLibrary.currentRatio(t, rate, sFactorA, sFactorB);
        (uint256 amountAIdeal, uint256 amountBIdeal) = EPoolLibrary.tokenATokenBForTokenB(
            minInputAmountB, ratio, rate, sFactorA, sFactorB
        );
        return EPoolLibrary.eTokenForTokenATokenB(t, amountAIdeal, amountBIdeal, rate, sFactorA, sFactorB);
    }

    function maxOutputAmountAForEToken(
        IEPool ePool,
        address eToken,
        uint256 amount
    ) external returns (uint256 maxTokenA) {
        (uint256 amountA, uint256 amountB) = EPoolLibrary.tokenATokenBForEToken(
            ePool.getTranche(eToken), amount, ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        uint256 feeRate = ePool.feeRate();
        amountA = amountA - amountA * feeRate / EPoolLibrary.sFactorI;
        amountB = amountB - amountB * feeRate / EPoolLibrary.sFactorI;
        maxTokenA = amountA + quoter.quoteExactInputSingle(
            address(ePool.tokenB()), address(ePool.tokenA()), 3000, amountB, 0
        );
    }

    function maxOutputAmountBForEToken(
        IEPool ePool,
        address eToken,
        uint256 amount
    ) external returns (uint256 maxTokenB) {
        (uint256 amountA, uint256 amountB) = EPoolLibrary.tokenATokenBForEToken(
            ePool.getTranche(eToken), amount, ePool.getRate(), ePool.sFactorA(), ePool.sFactorB()
        );
        uint256 feeRate = ePool.feeRate();
        amountA = amountA - amountA * feeRate / EPoolLibrary.sFactorI;
        amountB = amountB - amountB * feeRate / EPoolLibrary.sFactorI;
        maxTokenB = amountB + quoter.quoteExactInputSingle(
            address(ePool.tokenA()), address(ePool.tokenB()), 3000, amountA, 0
        );
    }
}
