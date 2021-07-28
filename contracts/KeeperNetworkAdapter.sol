// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;

import "./interfaces/IKeeperNetworkAdapter.sol";
import "./interfaces/IEPoolPeriphery.sol";
import "./interfaces/IEPoolHelper.sol";
import "./interfaces/IEPool.sol";
import "./EPoolLibrary.sol";
import "./utils/ControllerMixin.sol";

contract KeeperNetworkAdapter is ControllerMixin, IKeeperNetworkAdapter {

    IEPool public override ePool;
    IEPoolHelper public override ePoolHelper;
    IEPoolPeriphery public override ePoolPeriphery;

    uint256 public override keeperRebalanceInterval;
    uint256 public override lastKeeperRebalance;

    event SetEPool(address indexed ePool);
    event SetEPoolHelper(address indexed ePoolHelper);
    event SetEPoolPeriphery(address indexed ePoolPeriphery);
    event SetKeeperRebalanceMinRDiv(uint256 minRDiv);
    event SetKeeperRebalanceInterval(uint256 interval);

    constructor(
        IController _controller,
        IEPool _ePool,
        IEPoolHelper _ePoolHelper,
        IEPoolPeriphery _ePoolPeriphery
    ) ControllerMixin(_controller) {
        ePool = _ePool;
        ePoolHelper = _ePoolHelper;
        ePoolPeriphery = _ePoolPeriphery;
    }

    /**
     * @notice Returns the address of the current Aggregator which provides the exchange rate between TokenA and TokenB
     * @return Address of aggregator
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
    function setController(
        address _controller
    ) external override onlyDao("KeeperNetworkAdapter: not dao") returns (bool) {
        _setController(_controller);
        return true;
    }

    function setEPool(
        IEPool _ePool
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        ePool = _ePool;
        emit SetEPool(address(_ePool));
        return true;
    }

    function setEPoolHelper(
        IEPoolHelper _ePoolHelper
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        ePoolHelper = _ePoolHelper;
        emit SetEPoolHelper(address(_ePoolHelper));
        return true;
    }

    function setEPoolPeriphery(
        IEPoolPeriphery _ePoolPeriphery
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        ePoolPeriphery = _ePoolPeriphery;
        emit SetEPoolPeriphery(address(_ePoolPeriphery));
        return true;
    }

    function setKeeperRebalanceInterval(
        uint256 interval
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        keeperRebalanceInterval = interval;
        emit SetKeeperRebalanceInterval(interval);
        return true;
    }

    function checkUpkeep(
        bytes calldata /*checkData*/
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        address keeperSubsidyPool = address(ePoolPeriphery.keeperSubsidyPool());
        (uint256 deltaA, uint256 deltaB, uint256 rChange) = ePoolHelper.delta(ePool);
        uint256 maxFlashSwapSlippage = ePoolPeriphery.maxFlashSwapSlippage();
        bool funded;
        if (rChange == 0) {
            funded = (
                ePool.tokenB().balanceOf(keeperSubsidyPool)
                    >= (uint256(deltaB) * maxFlashSwapSlippage / EPoolLibrary.sFactorI) - uint256(deltaB)
            );
        } else {
            funded = (
                ePool.tokenA().balanceOf(keeperSubsidyPool)
                    >= (uint256(deltaA) * maxFlashSwapSlippage / EPoolLibrary.sFactorI) - uint256(deltaA)
            );

        }
        return (block.timestamp >= lastKeeperRebalance + keeperRebalanceInterval && funded, new bytes(0));
    }

    function performUpkeep(bytes calldata /*performData*/) external override {
        lastKeeperRebalance = block.timestamp;
        ePoolPeriphery.rebalanceWithFlashSwap(ePool, 1e18);
    }
}
