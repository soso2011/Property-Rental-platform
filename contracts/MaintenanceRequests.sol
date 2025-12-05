// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RentalAgreement.sol";

contract MaintenanceRequests is ReentrancyGuard {
    RentalAgreement public rentalAgreement;

    enum RequestStatus { Pending, Approved, InProgress, Completed, Rejected }
    enum RequestPriority { Low, Medium, High, Emergency }

    struct MaintenanceRequest {
        uint256 requestId;
        uint256 rentalId;
        uint256 propertyId;
        address tenant;
        address landlord;
        string description;
        string ipfsPhotosHash; // Hash of photos showing the issue
        uint256 timestamp;
        RequestStatus status;
        RequestPriority priority;
        uint256 estimatedCost;
        uint256 actualCost;
        string resolution;
        uint256 completedTimestamp;
    }

    uint256 private requestCounter;
    mapping(uint256 => MaintenanceRequest) public requests; // requestId => Request
    mapping(uint256 => uint256[]) public requestsByProperty; // propertyId => requestIds
    mapping(uint256 => uint256[]) public requestsByRental; // rentalId => requestIds
    mapping(address => uint256[]) public requestsByTenant; // tenant => requestIds

    event MaintenanceRequestCreated(
        uint256 indexed requestId,
        uint256 indexed propertyId,
        uint256 indexed rentalId,
        address tenant,
        RequestPriority priority
    );
    event MaintenanceRequestUpdated(
        uint256 indexed requestId,
        RequestStatus status,
        string resolution
    );
    event MaintenanceRequestCompleted(
        uint256 indexed requestId,
        uint256 actualCost,
        uint256 completedTimestamp
    );

    constructor(address _rentalAgreement) {
        rentalAgreement = RentalAgreement(_rentalAgreement);
    }

    modifier onlyTenant(uint256 _rentalId) {
        RentalAgreement.Rental memory rental = rentalAgreement.getRentalDetails(_rentalId);
        require(rental.tenant == msg.sender, "Not the tenant");
        _;
    }

    modifier onlyLandlord(uint256 _rentalId) {
        RentalAgreement.Rental memory rental = rentalAgreement.getRentalDetails(_rentalId);
        require(rental.landlord == msg.sender, "Not the landlord");
        _;
    }

    function createRequest(
        uint256 _rentalId,
        string memory _description,
        string memory _ipfsPhotosHash,
        RequestPriority _priority
    ) external onlyTenant(_rentalId) nonReentrant returns (uint256) {
        RentalAgreement.Rental memory rental = rentalAgreement.getRentalDetails(_rentalId);
        require(rental.status == RentalAgreement.RentalStatus.Active, "Rental not active");

        requestCounter++;
        uint256 newRequestId = requestCounter;

        MaintenanceRequest memory request = MaintenanceRequest({
            requestId: newRequestId,
            rentalId: _rentalId,
            propertyId: rental.propertyId,
            tenant: msg.sender,
            landlord: rental.landlord,
            description: _description,
            ipfsPhotosHash: _ipfsPhotosHash,
            timestamp: block.timestamp,
            status: RequestStatus.Pending,
            priority: _priority,
            estimatedCost: 0,
            actualCost: 0,
            resolution: "",
            completedTimestamp: 0
        });

        requests[newRequestId] = request;
        requestsByProperty[rental.propertyId].push(newRequestId);
        requestsByRental[_rentalId].push(newRequestId);
        requestsByTenant[msg.sender].push(newRequestId);

        emit MaintenanceRequestCreated(
            newRequestId,
            rental.propertyId,
            _rentalId,
            msg.sender,
            _priority
        );

        return newRequestId;
    }

    function updateRequestStatus(
        uint256 _requestId,
        RequestStatus _newStatus,
        string memory _resolution,
        uint256 _estimatedCost
    ) external nonReentrant {
        MaintenanceRequest storage request = requests[_requestId];
        require(msg.sender == request.landlord, "Not authorized");
        require(request.status != RequestStatus.Completed, "Request already completed");

        request.status = _newStatus;
        request.resolution = _resolution;
        if (_estimatedCost > 0) {
            request.estimatedCost = _estimatedCost;
        }

        emit MaintenanceRequestUpdated(_requestId, _newStatus, _resolution);
    }

    function completeRequest(
        uint256 _requestId,
        uint256 _actualCost
    ) external nonReentrant {
        MaintenanceRequest storage request = requests[_requestId];
        require(msg.sender == request.landlord, "Not authorized");
        require(request.status == RequestStatus.InProgress, "Request not in progress");

        request.status = RequestStatus.Completed;
        request.actualCost = _actualCost;
        request.completedTimestamp = block.timestamp;

        emit MaintenanceRequestCompleted(
            _requestId,
            _actualCost,
            block.timestamp
        );
    }

    // View functions
    function getRequest(uint256 _requestId) external view returns (MaintenanceRequest memory) {
        return requests[_requestId];
    }

    function getRequestsByProperty(uint256 _propertyId) external view returns (uint256[] memory) {
        return requestsByProperty[_propertyId];
    }

    function getRequestsByRental(uint256 _rentalId) external view returns (uint256[] memory) {
        return requestsByRental[_rentalId];
    }

    function getRequestsByTenant(address _tenant) external view returns (uint256[] memory) {
        return requestsByTenant[_tenant];
    }
} 
