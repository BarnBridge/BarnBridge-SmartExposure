// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.1;

import "./IEPool.sol";
import "./IEPoolHelper.sol";
import "./IEPoolPeriphery.sol";
import "./IKeeperCompatibleInterface.sol";

interface IKeeperNetworkAdapter is KeeperCompatibleInterface {

    function getController() external view returns (address);

    function setController(address _controller) external returns (bool);

    function ePools(uint256 i) external returns (IEPool);

    function ePoolHelper() external returns (IEPoolHelper);

    function keeperRebalanceInterval() external returns(uint256);

    function lastKeeperRebalance(IEPool ePool) external returns(uint256);

    function addEPool(IEPool _ePool, IEPoolPeriphery ePoolPeriphery) external returns (bool);

    function removeEPool(IEPool _ePool) external returns (bool);

    function setEPoolHelper(IEPoolHelper _ePoolHelper) external returns (bool);

    function setKeeperRebalanceInterval(uint256 interval) external returns (bool);
}
