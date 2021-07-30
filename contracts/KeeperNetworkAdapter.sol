// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;

import "./interfaces/IKeeperNetworkAdapter.sol";
import "./interfaces/IEPoolPeriphery.sol";
import "./interfaces/IEPoolHelper.sol";
import "./interfaces/IEPool.sol";
import "./EPoolLibrary.sol";
import "./utils/ControllerMixin.sol";

contract KeeperNetworkAdapter is ControllerMixin, IKeeperNetworkAdapter {

    uint256 public constant EPOOL_UPKEEP_LIMIT = 10;

    // required for retrieving information about the EPool to be rebalanced
    IEPoolHelper public override ePoolHelper;

    // maintained EPools
    IEPool[] public override ePools;
    mapping (IEPool => IEPoolPeriphery) public peripheryForEPool;

    // safety interval for avoiding bursts of performUpkeep calls
    // should be smaller than EPool.rebalanceInterval
    uint256 public override keeperRebalanceInterval;
    mapping(IEPool => uint256) public override lastKeeperRebalance;

    event AddedEPool(address indexed ePool, address indexed ePoolPeriphery);
    event RemovedEPool(address indexed ePool);
    event SetEPoolHelper(address indexed ePoolHelper);
    event SetKeeperRebalanceInterval(uint256 interval);

    constructor(IController _controller, IEPoolHelper _ePoolHelper) ControllerMixin(_controller) {
        ePoolHelper = _ePoolHelper;
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
    function setController(
        address _controller
    ) external override onlyDao("KeeperNetworkAdapter: not dao") returns (bool) {
        _setController(_controller);
        return true;
    }

    /**
     * @notice Adds an EPool to the list of upkeeps.
     * If the EPoolPeriphery is updated the EPool has to be removed and added again.
     * @dev Can only be called by an authorized sender
     * @param ePool Address of the EPool to be maintained
     * @param ePoolPeriphery Address of the EPoolPeriphery of the EPool
     * @return True on success
     */
    function addEPool(
        IEPool ePool, IEPoolPeriphery ePoolPeriphery
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        require(ePools.length < EPOOL_UPKEEP_LIMIT - 1, "KeeperNetworkAdapter: too many EPools");
        for (uint256 i = 0; i < ePools.length; i++) {
            require(address(ePool) != address(ePools[i]), "KeeperNetworkAdapter: already registered");
        }
        ePools.push(ePool);
        peripheryForEPool[ePool] = ePoolPeriphery;
        emit AddedEPool(address(ePool), address(ePoolPeriphery));
        return true;
    }

    /**
     * @notice Removes an EPool to the list of upkeeps.
     * @dev Can only be called by an authorized sender
     * @param ePool Address of the EPool to be maintained
     * @return True on success
     */
    function removeEPool(
        IEPool ePool
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        bool exists;
        uint256 index;
        for (uint256 i = 0; i < ePools.length; i++) {
            if (address(ePool) == address(ePools[i])) {
                (exists, index) = (true, i);
                break;
            }
        }
        require(exists, "KeeperNetworkAdapter: does not exist");
        peripheryForEPool[ePools[index]] = IEPoolPeriphery(address(0));
        for (uint i = index; i < ePools.length - 1; i++) {
            ePools[i] = ePools[i + 1];
        }
        ePools.pop();
        emit RemovedEPool(address(ePool));
        return true;
    }

    /**
     * @notice Updates the EPoolHelper
     * @dev Can only called by an authorized sender
     * @param _ePoolHelper Address of the new EPoolHelper
     * @return True on success
     */
    function setEPoolHelper(
        IEPoolHelper _ePoolHelper
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        ePoolHelper = _ePoolHelper;
        emit SetEPoolHelper(address(_ePoolHelper));
        return true;
    }

    /**
     * @notice Updates the interval between rebalances triggered by keepers for each EPool
     * @dev Can only called by an authorized sender
     * @param interval Interval in seconds
     * @return True on success
     */
    function setKeeperRebalanceInterval(
        uint256 interval
    ) external override onlyDaoOrGuardian("KeeperNetworkAdapter: not dao or guardian") returns (bool) {
        keeperRebalanceInterval = interval;
        emit SetKeeperRebalanceInterval(interval);
        return true;
    }

    function _shouldRebalance(IEPool ePool) private view returns (bool) {
        IEPoolPeriphery ePoolPeriphery = peripheryForEPool[ePool];
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
        return (block.timestamp >= lastKeeperRebalance[ePool] + keeperRebalanceInterval && funded);
    }

    function checkUpkeep(
        bytes calldata /*checkData*/
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        for (uint256 i = 0; i < ePools.length; i++) {
            IEPool ePool = ePools[i];
            if (_shouldRebalance(ePool)) {
                return (true, abi.encode(ePool));
            }
        }
        return (false, new bytes(0));
    }

    function performUpkeep(bytes calldata performData) external override {
        IEPool ePool = abi.decode(performData, (IEPool));
        lastKeeperRebalance[ePool] = block.timestamp;
        peripheryForEPool[ePool].rebalanceWithFlashSwap(ePool, 1e18);
    }
}
