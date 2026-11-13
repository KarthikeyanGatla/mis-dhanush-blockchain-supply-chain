// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title SupplyChain
/// @notice Records every custody handoff of a product batch on-chain.
contract SupplyChain is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    enum Status { Manufactured, Shipped, InTransit, Delivered, Recalled }

    struct Product {
        uint256 id;
        string name;
        string origin;
        string details; // JSON: category, quantity, description
        string ipfsHash;
        address manufacturer;
        address currentOwner;
        Status status;
        uint64 createdAt;
        bool exists;
    }

    struct HistoryEntry {
        address from;
        address to;
        Status status;
        uint64 timestamp;
        string note;
    }

    uint256 public productCount;
    mapping(uint256 => Product) private _products;
    mapping(uint256 => HistoryEntry[]) private _history;

    event ProductRegistered(uint256 indexed id, address indexed manufacturer, string name, string origin, string ipfsHash, uint64 timestamp);
    event CustodyTransferred(uint256 indexed id, address indexed from, address indexed to, uint64 timestamp);
    event StatusUpdated(uint256 indexed id, Status status, address indexed by, string note, uint64 timestamp);
    event ProductRecalled(uint256 indexed id, address indexed by, string reason, uint64 timestamp);

    error ProductNotFound(uint256 id);
    error NotCurrentOwner(uint256 id, address caller);
    error ProductIsRecalled(uint256 id);
    error InvalidRecipient(address to);
    error InvalidHandoff(address from, address to);
    error InvalidStatus();
    error EmptyName();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    modifier productExists(uint256 id) {
        if (!_products[id].exists) revert ProductNotFound(id);
        _;
    }

    modifier onlyOwnerOf(uint256 id) {
        if (_products[id].currentOwner != msg.sender) revert NotCurrentOwner(id, msg.sender);
        _;
    }

    modifier notRecalled(uint256 id) {
        if (_products[id].status == Status.Recalled) revert ProductIsRecalled(id);
        _;
    }

    /// @notice Register a new product batch. Caller becomes first owner.
    function registerProduct(
        string calldata name,
        string calldata origin,
        string calldata details,
        string calldata ipfsHash
    )
        external
        onlyRole(MANUFACTURER_ROLE)
        returns (uint256 id)
    {
        if (bytes(name).length == 0) revert EmptyName();
        id = ++productCount;
        uint64 ts = uint64(block.timestamp);
        Product storage p = _products[id];
        p.id = id;
        p.name = name;
        p.origin = origin;
        p.details = details;
        p.ipfsHash = ipfsHash;
        p.manufacturer = msg.sender;
        p.currentOwner = msg.sender;
        p.status = Status.Manufactured;
        p.createdAt = ts;
        p.exists = true;
        _history[id].push(HistoryEntry(address(0), msg.sender, Status.Manufactured, ts, "Registered"));
        emit ProductRegistered(id, msg.sender, name, origin, ipfsHash, ts);
    }

    /// @notice Hand custody to the next participant. Valid hops:
    /// manufacturer -> distributor -> retailer, or retailer -> any consumer address.
    function transferCustody(uint256 id, address to)
        external
        productExists(id)
        onlyOwnerOf(id)
        notRecalled(id)
    {
        if (to == address(0) || to == msg.sender) revert InvalidRecipient(to);
        bool fromManu = hasRole(MANUFACTURER_ROLE, msg.sender);
        bool fromDist = hasRole(DISTRIBUTOR_ROLE, msg.sender);
        bool fromRet = hasRole(RETAILER_ROLE, msg.sender);

        bool valid = (fromManu && hasRole(DISTRIBUTOR_ROLE, to)) ||
            (fromDist && hasRole(RETAILER_ROLE, to)) ||
            (fromRet && !_isSupplyParticipant(to));
        if (!valid) revert InvalidHandoff(msg.sender, to);

        Product storage p = _products[id];
        address from = p.currentOwner;
        p.currentOwner = to;
        p.status = Status.Shipped;
        uint64 ts = uint64(block.timestamp);
        _history[id].push(HistoryEntry(from, to, Status.Shipped, ts, "Custody transferred"));
        emit CustodyTransferred(id, from, to, ts);
    }

    /// @notice Current owner updates status (not Recalled — use recallProduct).
    function updateStatus(uint256 id, Status status, string calldata note)
        external
        productExists(id)
        onlyOwnerOf(id)
        notRecalled(id)
    {
        if (status == Status.Recalled) revert InvalidStatus();
        _products[id].status = status;
        uint64 ts = uint64(block.timestamp);
        _history[id].push(HistoryEntry(msg.sender, msg.sender, status, ts, note));
        emit StatusUpdated(id, status, msg.sender, note, ts);
    }

    /// @notice Admin or the original manufacturer can flag a recall.
    function recallProduct(uint256 id, string calldata reason) external productExists(id) notRecalled(id) {
        Product storage p = _products[id];
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && msg.sender != p.manufacturer) {
            revert NotCurrentOwner(id, msg.sender);
        }
        p.status = Status.Recalled;
        uint64 ts = uint64(block.timestamp);
        _history[id].push(HistoryEntry(msg.sender, p.currentOwner, Status.Recalled, ts, reason));
        emit ProductRecalled(id, msg.sender, reason, ts);
    }

    /// @notice Public verification: product record.
    function getProduct(uint256 id) external view productExists(id) returns (Product memory) {
        return _products[id];
    }

    /// @notice Public verification: full provenance timeline.
    function getHistory(uint256 id) external view productExists(id) returns (HistoryEntry[] memory) {
        return _history[id];
    }

    /// @notice Counterfeit check: true only if id is registered and not recalled.
    function isAuthentic(uint256 id) external view returns (bool) {
        return _products[id].exists && _products[id].status != Status.Recalled;
    }

    function _isSupplyParticipant(address a) private view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, a) || hasRole(DISTRIBUTOR_ROLE, a) || hasRole(RETAILER_ROLE, a);
    }
}
