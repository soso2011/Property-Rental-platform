// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Use a recent fixed version


import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Corrected path
import "hardhat/console.sol";

// Interface for RentalAgreement contract to update property status
interface IRentalAgreement {
    function getActiveRentalIdForProperty(uint256 propertyId) external view returns (uint256);
}

contract PropertyListing is ReentrancyGuard {
    // Instead of using Counters, you can simply use a uint256 variable
    // and increment it manually, or use another approach for ID generation
    uint256 private _propertyIds;

    // Address of the RentalAgreement contract (set by deployer/admin)
    address public rentalAgreementContract;

    struct Property {
        uint256 id;
        address owner;
        string location; // Added
        uint256 pricePerMonth; // Renamed for clarity (in Wei)
        uint256 securityDeposit; // (in Wei)
        uint8 bedrooms; // Added
        uint8 bathrooms; // Added
        uint16 areaSqMeters; // Added
        uint256 availableFromTimestamp; // Added (Unix timestamp)
        uint8 minRentalPeriodMonths; // Added
        string ipfsMetadataHash; // For description, images, detailed amenities etc.
        bool isListed; // To distinguish between unlisted and rented
        bool isAvailable; // True if listed and not currently rented
        address currentTenant; // Added
        uint256 currentRentalId; // Link to RentalAgreement
    }

    mapping(uint256 => Property) public properties;
    mapping(address => uint256[]) public propertiesByOwner;
    // Consider using events for scalable querying instead of propertiesByOwner for large datasets

    event PropertyListed(
        uint256 indexed propertyId,
        address indexed owner,
        string location,
        uint256 pricePerMonth,
        uint256 securityDeposit,
        string ipfsMetadataHash
    );
    event PropertyUpdated( // More specific event for updates
        uint256 indexed propertyId,
        string location,
        uint256 pricePerMonth,
        uint256 securityDeposit,
        string ipfsMetadataHash,
        uint8 minRentalPeriodMonths,
        uint256 availableFromTimestamp
    );
    event PropertyUnlisted(uint256 indexed propertyId);
    event PropertyAvailabilityChanged(uint256 indexed propertyId, bool isAvailable, address indexed tenant, uint256 rentalId);
    event RentalAgreementContractSet(address indexed contractAddress);

    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "PL: Caller not owner");
        _;
    }

    modifier whenListed(uint256 _propertyId) {
        require(properties[_propertyId].isListed, "PL: Property not listed");
        _;
    }

    constructor() {
        // Deployer can set the RentalAgreement contract address later
    }

    // --- Admin Function ---
    function setRentalAgreementContract(address _contractAddress) external { // Add onlyOwner if needed
        // Add access control (e.g., Ownable) if this should be restricted
        require(_contractAddress != address(0), "PL: Zero address");
        rentalAgreementContract = _contractAddress;
        emit RentalAgreementContractSet(_contractAddress);
    }

    // --- Property Management Functions ---

    function listProperty(
        string memory _location,
        uint256 _pricePerMonth, // Expect Wei
        uint256 _securityDeposit, // Expect Wei
        uint8 _bedrooms,
        uint8 _bathrooms,
        uint16 _areaSqMeters,
        uint256 _availableFromTimestamp,
        uint8 _minRentalPeriodMonths,
        string memory _ipfsMetadataHash
    ) external nonReentrant returns (uint256) {
        require(_pricePerMonth > 0, "PL: Price must be > 0");
        require(_securityDeposit > 0, "PL: Deposit must be > 0");
        require(bytes(_location).length > 0, "PL: Location required");
        require(_minRentalPeriodMonths > 0, "PL: Min rental period required");

        _propertyIds++;
        uint256 newPropertyId = _propertyIds;

        properties[newPropertyId] = Property({
            id: newPropertyId,
            owner: msg.sender,
            location: _location,
            pricePerMonth: _pricePerMonth,
            securityDeposit: _securityDeposit,
            bedrooms: _bedrooms,
            bathrooms: _bathrooms,
            areaSqMeters: _areaSqMeters,
            availableFromTimestamp: _availableFromTimestamp,
            minRentalPeriodMonths: _minRentalPeriodMonths,
            ipfsMetadataHash: _ipfsMetadataHash,
            isListed: true,
            isAvailable: true, // Initially available
            currentTenant: address(0),
            currentRentalId: 0
        });

        propertiesByOwner[msg.sender].push(newPropertyId);

        emit PropertyListed(
            newPropertyId,
            msg.sender,
            _location,
            _pricePerMonth,
            _securityDeposit,
            _ipfsMetadataHash
        );
        return newPropertyId;
    }

    function updateProperty(
        uint256 _propertyId,
        string memory _location,
        uint256 _pricePerMonth, // Expect Wei
        uint256 _securityDeposit, // Expect Wei
        uint8 _bedrooms,
        uint8 _bathrooms,
        uint16 _areaSqMeters,
        uint256 _availableFromTimestamp,
        uint8 _minRentalPeriodMonths,
        string memory _ipfsMetadataHash
    ) external onlyPropertyOwner(_propertyId) whenListed(_propertyId) nonReentrant {
        require(properties[_propertyId].isAvailable, "PL: Cannot update rented property details");
        // Can add more granular checks if some fields are updatable while rented

        Property storage property = properties[_propertyId];
        property.location = _location;
        property.pricePerMonth = _pricePerMonth;
        property.securityDeposit = _securityDeposit;
        property.bedrooms = _bedrooms;
        property.bathrooms = _bathrooms;
        property.areaSqMeters = _areaSqMeters;
        property.availableFromTimestamp = _availableFromTimestamp;
        property.minRentalPeriodMonths = _minRentalPeriodMonths;
        property.ipfsMetadataHash = _ipfsMetadataHash;

        emit PropertyUpdated(
            _propertyId,
            _location,
            _pricePerMonth,
            _securityDeposit,
            _ipfsMetadataHash,
            _minRentalPeriodMonths,
             _availableFromTimestamp
       );
    }

    function unlistProperty(uint256 _propertyId) external onlyPropertyOwner(_propertyId) whenListed(_propertyId) nonReentrant {
         require(properties[_propertyId].isAvailable, "PL: Cannot unlist rented property");
         // In a real system, might need to handle ending listings gracefully

         properties[_propertyId].isListed = false;
         properties[_propertyId].isAvailable = false; // If unlisted, it's not available

         // Removing from propertiesByOwner array is complex and gas-intensive.
         // It's often better to filter off-chain using the isListed flag.

         emit PropertyUnlisted(_propertyId);
    }

    // --- Internal/Cross-Contract Functions ---

    // Called by RentalAgreement contract when a property is rented
    function markAsRented(uint256 _propertyId, address _tenant, uint256 _rentalId) external nonReentrant {
        require(msg.sender == rentalAgreementContract, "PL: Caller not RentalAgreement contract");
        Property storage property = properties[_propertyId];
        require(property.isListed && property.isAvailable, "PL: Property not available for rent");
        require(block.timestamp >= property.availableFromTimestamp, "PL: Property not yet available");

        property.isAvailable = false;
        property.currentTenant = _tenant;
        property.currentRentalId = _rentalId;

        emit PropertyAvailabilityChanged(_propertyId, false, _tenant, _rentalId);
    }

    // Called by RentalAgreement contract when a rental ends
    function markAsAvailable(uint256 _propertyId) external nonReentrant {
        require(msg.sender == rentalAgreementContract, "PL: Caller not RentalAgreement contract");
        Property storage property = properties[_propertyId];
        // Ensure it was actually rented before marking available
        require(property.isListed && !property.isAvailable, "PL: Property was not rented");

        address previousTenant = property.currentTenant;
        uint256 previousRentalId = property.currentRentalId;

        property.isAvailable = true;
        property.currentTenant = address(0);
        property.currentRentalId = 0;

        emit PropertyAvailabilityChanged(_propertyId, true, previousTenant, previousRentalId); // Event shows it became available
    }

    // --- View Functions ---

    function getProperty(uint256 _propertyId) external view returns (Property memory) {
        require(properties[_propertyId].id != 0, "PL: Property does not exist");
        return properties[_propertyId];
    }

    function getOwnerProperties(address _owner) external view returns (uint256[] memory) {
        return propertiesByOwner[_owner];
    }

    function getTotalProperties() external view returns (uint256) {
        return _propertyIds;
    }
}
