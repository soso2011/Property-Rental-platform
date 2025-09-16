// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RentalAgreement.sol";
import "./Escrow.sol";

contract DisputeResolution is ReentrancyGuard, Ownable {
    RentalAgreement public rentalAgreement;
    Escrow public escrow;

    enum DisputeStatus { Pending, UnderReview, Resolved, Cancelled }
    enum DisputeType { Deposit, Maintenance, RentPayment, PropertyDamage, Other }
    enum Resolution { PendingResolution, TenantFavor, LandlordFavor, Compromise }

    struct Dispute {
        uint256 disputeId;
        uint256 rentalId;
        uint256 propertyId;
        address tenant;
        address landlord;
        string description;
        string evidence; // IPFS hash containing evidence files
        uint256 amount; // Amount in dispute (if applicable)
        uint256 timestamp;
        DisputeStatus status;
        DisputeType disputeType;
        Resolution resolution;
        string resolutionDetails;
        address resolver; // Address of the arbitrator who resolved the dispute
        uint256 resolvedTimestamp;
    }

    uint256 private disputeCounter;
    mapping(uint256 => Dispute) public disputes; // disputeId => Dispute
    mapping(uint256 => uint256[]) public disputesByRental; // rentalId => disputeIds
    mapping(address => bool) public approvedArbitrators;

    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed rentalId,
        address indexed initiator,
        DisputeType disputeType
    );
    event DisputeStatusUpdated(
        uint256 indexed disputeId,
        DisputeStatus status
    );
    event DisputeResolved(
        uint256 indexed disputeId,
        Resolution resolution,
        address resolver
    );
    event ArbitratorAdded(address indexed arbitrator);
    event ArbitratorRemoved(address indexed arbitrator);

    constructor(address _rentalAgreement, address _escrow) Ownable() {
        rentalAgreement = RentalAgreement(_rentalAgreement);
        escrow = Escrow(_escrow);
    }

    modifier onlyArbitrator() {
        require(approvedArbitrators[msg.sender], "Not an approved arbitrator");
        _;
    }

    modifier onlyParticipant(uint256 _disputeId) {
        Dispute storage dispute = disputes[_disputeId];
        require(
            msg.sender == dispute.tenant || 
            msg.sender == dispute.landlord || 
            approvedArbitrators[msg.sender],
            "Not authorized"
        );
        _;
    }

    // Admin functions
    function addArbitrator(address _arbitrator) external onlyOwner {
        require(!approvedArbitrators[_arbitrator], "Already an arbitrator");
        approvedArbitrators[_arbitrator] = true;
        emit ArbitratorAdded(_arbitrator);
    }

    function removeArbitrator(address _arbitrator) external onlyOwner {
        require(approvedArbitrators[_arbitrator], "Not an arbitrator");
        approvedArbitrators[_arbitrator] = false;
        emit ArbitratorRemoved(_arbitrator);
    }

    // Dispute functions
    function createDispute(
        uint256 _rentalId,
        string memory _description,
        string memory _evidence,
        uint256 _amount,
        DisputeType _disputeType
    ) external nonReentrant returns (uint256) {
        RentalAgreement.Rental memory rental = rentalAgreement.getRentalDetails(_rentalId);
        require(
            msg.sender == rental.tenant || msg.sender == rental.landlord,
            "Not a rental participant"
        );

        disputeCounter++;
        uint256 newDisputeId = disputeCounter;

        Dispute memory dispute = Dispute({
            disputeId: newDisputeId,
            rentalId: _rentalId,
            propertyId: rental.propertyId,
            tenant: rental.tenant,
            landlord: rental.landlord,
            description: _description,
            evidence: _evidence,
            amount: _amount,
            timestamp: block.timestamp,
            status: DisputeStatus.Pending,
            disputeType: _disputeType,
            resolution: Resolution.PendingResolution,
            resolutionDetails: "",
            resolver: address(0),
            resolvedTimestamp: 0
        });

        disputes[newDisputeId] = dispute;
        disputesByRental[_rentalId].push(newDisputeId);

        emit DisputeCreated(
            newDisputeId,
            _rentalId,
            msg.sender,
            _disputeType
        );

        return newDisputeId;
    }

    function updateDisputeStatus(
        uint256 _disputeId,
        DisputeStatus _newStatus
    ) external onlyArbitrator nonReentrant {
        require(_newStatus != DisputeStatus.Resolved, "Use resolveDispute for resolution");
        
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status != DisputeStatus.Resolved, "Dispute already resolved");
        
        dispute.status = _newStatus;
        emit DisputeStatusUpdated(_disputeId, _newStatus);
    }

    function resolveDispute(
        uint256 _disputeId,
        Resolution _resolution,
        string memory _resolutionDetails
    ) external onlyArbitrator nonReentrant {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status != DisputeStatus.Resolved, "Already resolved");
        require(_resolution != Resolution.PendingResolution, "Invalid resolution");

        dispute.status = DisputeStatus.Resolved;
        dispute.resolution = _resolution;
        dispute.resolutionDetails = _resolutionDetails;
        dispute.resolver = msg.sender;
        dispute.resolvedTimestamp = block.timestamp;

        // Handle financial resolutions if needed
        if (dispute.amount > 0) {
            if (_resolution == Resolution.TenantFavor) {
                // Implementation depends on dispute type
                // Example: Refund deposit to tenant
                if (dispute.disputeType == DisputeType.Deposit) {
                    escrow.releaseDepositToTenant(dispute.rentalId, payable(dispute.tenant));
                }
            } else if (_resolution == Resolution.LandlordFavor) {
                // Example: Release disputed amount to landlord
                if (dispute.disputeType == DisputeType.PropertyDamage) {
                    escrow.releaseRentToLandlord(dispute.rentalId, payable(dispute.landlord), dispute.amount);
                }
            }
            // Compromise would need custom handling
        }

        emit DisputeResolved(
            _disputeId,
            _resolution,
            msg.sender
        );
    }

    // View functions
    function getDispute(uint256 _disputeId) external view returns (Dispute memory) {
        return disputes[_disputeId];
    }

    function getDisputesByRental(uint256 _rentalId) external view returns (uint256[] memory) {
        return disputesByRental[_rentalId];
    }

    function isArbitrator(address _address) external view returns (bool) {
        return approvedArbitrators[_address];
    }
} 
