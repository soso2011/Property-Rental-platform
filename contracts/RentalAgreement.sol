// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./PropertyListing.sol"; // Import PropertyListing contract;
import "./Escrow.sol"; // Import Escrow contract

contract RentalAgreement is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _rentalIds;

    // Addresses of other contracts
    PropertyListing public propertyListingContract;
    Escrow public escrowContract;
    address private _escrowAddress; // Add private variable to store address

    enum RentalStatus {
        PendingDeposit,
        Active,
        Ended,
        DepositReleaseRequested,
        DepositReleased
    }

    struct Rental {
        uint256 rentalId;
        uint256 propertyId;
        address tenant;
        address landlord;
        uint256 startDate; // Timestamp
        uint256 endDate; // Timestamp
        uint256 monthlyRentAmount; // Wei
        uint256 securityDepositAmount; // Wei
        uint256 rentPaidUntil; // Timestamp until which rent is covered
        RentalStatus status;
        bool landlordApprovedDepositRelease; // For the release mechanism
    }

    mapping(uint256 => Rental) public rentals; // rentalId => Rental
    mapping(uint256 => uint256) public activeRentalIdForProperty; // propertyId => active rentalId
    mapping(address => uint256[]) public rentalsByTenant;
    mapping(address => uint256[]) public rentalsByLandlord;

    event PropertyRented(
        uint256 indexed rentalId,
        uint256 indexed propertyId,
        address indexed tenant,
        address landlord,
        uint256 endDate,
        uint256 monthlyRentAmount,
        uint256 securityDepositAmount
    );
    event RentPaid(uint256 indexed rentalId, uint256 paidUntil, uint256 amount);
    event RentWithdrawalRequested(
        uint256 indexed rentalId,
        address indexed landlord
    ); // Matches frontend MyProperties
    // RentWithdrawn event comes from Escrow after successful transfer
    event DepositReleaseRequested(
        uint256 indexed rentalId,
        address indexed tenant
    ); // Matches frontend MyRentals
    event LandlordApprovedDepositRelease(
        uint256 indexed rentalId,
        address indexed landlord
    );
    event RentalEnded(uint256 indexed rentalId, uint256 propertyId); // Indicates deposit released & property available
    // DepositReleased event comes from Escrow

    modifier onlyTenant(uint256 _rentalId) {
        require(
            rentals[_rentalId].tenant == msg.sender,
            "RA: Caller not tenant"
        );
        _;
    }

    modifier onlyLandlord(uint256 _rentalId) {
        require(
            rentals[_rentalId].landlord == msg.sender,
            "RA: Caller not landlord"
        );
        _;
    }

    modifier rentalIsActive(uint256 _rentalId) {
        require(
            rentals[_rentalId].status == RentalStatus.Active,
            "RA: Rental not active"
        );
        _;
    }

    modifier escrowIsSet() {
        require(_escrowAddress != address(0), "RA: Escrow contract not set");
        _;
    }

    constructor(address _propertyListingAddress, address _escrowAddressInitial) {
        require(_propertyListingAddress != address(0), "RA: Zero PL address");
        // Allow address(0) initially for Escrow, to be set later
        propertyListingContract = PropertyListing(_propertyListingAddress);
        _escrowAddress = _escrowAddressInitial; // Store initial address
        if (_escrowAddressInitial != address(0)) {
             escrowContract = Escrow(_escrowAddressInitial);
        }
    }

    // --- Setter Function --- 
    // Add access control (e.g., onlyOwner) if this should be restricted outside deployment scripts
    function setEscrowContract(address _newEscrowAddress) external {
        require(_newEscrowAddress != address(0), "RA: Zero Escrow address");
        require(_escrowAddress == address(0), "RA: Escrow address already set"); // Prevent changing once set
        _escrowAddress = _newEscrowAddress;
        escrowContract = Escrow(_newEscrowAddress);
        // Add an event emission if desired
    }

    // --- Rental Lifecycle Functions ---

    function rentProperty(uint256 _propertyId) external payable nonReentrant escrowIsSet {
        PropertyListing.Property memory property = propertyListingContract
            .getProperty(_propertyId);

        require(property.isListed, "RA: Property not listed");
        require(property.isAvailable, "RA: Property not available");
        require(
            block.timestamp >= property.availableFromTimestamp,
            "RA: Property not yet available"
        );
        require(
            property.owner != msg.sender,
            "RA: Owner cannot rent own property"
        );

        uint256 firstMonthRent = property.pricePerMonth;
        uint256 securityDeposit = property.securityDeposit;
        uint256 requiredPayment = firstMonthRent + securityDeposit;

        require(msg.value == requiredPayment, "RA: Incorrect payment amount");

        _rentalIds.increment();
        uint256 newRentalId = _rentalIds.current();

        uint256 rentalDurationSeconds = uint256(
            property.minRentalPeriodMonths
        ) * 30 days; // Approximation
        uint256 startDate = block.timestamp;
        uint256 endDate = startDate + rentalDurationSeconds;
        uint256 rentPaidUntil = startDate + 30 days; // Covers the first month

        rentals[newRentalId] = Rental({
            rentalId: newRentalId,
            propertyId: _propertyId,
            tenant: msg.sender,
            landlord: property.owner,
            startDate: startDate,
            endDate: endDate,
            monthlyRentAmount: firstMonthRent,
            securityDepositAmount: securityDeposit,
            rentPaidUntil: rentPaidUntil,
            status: RentalStatus.Active, // Active once deposit+rent is paid
            landlordApprovedDepositRelease: false
        });

        activeRentalIdForProperty[_propertyId] = newRentalId;
        rentalsByTenant[msg.sender].push(newRentalId);
        rentalsByLandlord[property.owner].push(newRentalId);

        // Mark property as rented in PropertyListing contract
        propertyListingContract.markAsRented(
            _propertyId,
            msg.sender,
            newRentalId
        );

        // Deposit funds into Escrow contract
        escrowContract.depositFunds{value: requiredPayment}(
            newRentalId,
            firstMonthRent,
            securityDeposit,
            msg.sender
        );

        emit PropertyRented(
            newRentalId,
            _propertyId,
            msg.sender,
            property.owner,
            endDate,
            firstMonthRent,
            securityDeposit
        );
    }

    function payRent(
        uint256 _rentalId
    )
        external
        payable
        nonReentrant
        onlyTenant(_rentalId)
        rentalIsActive(_rentalId)
        escrowIsSet
    {
        Rental storage rental = rentals[_rentalId];
        require(
            block.timestamp >= rental.rentPaidUntil - 7 days,
            "RA: Too early to pay next rent"
        ); // Allow paying a bit early
        require(
            msg.value == rental.monthlyRentAmount,
            "RA: Incorrect rent amount"
        );

        // Update rent paid until date
        rental.rentPaidUntil += 30 days; // Simple monthly addition

        // Deposit rent into Escrow
        escrowContract.depositFunds{value: msg.value}(
            _rentalId,
            msg.value, // Amount for rent
            0,         // Amount for deposit (none for regular rent payment)
            msg.sender
        );

        emit RentPaid(_rentalId, rental.rentPaidUntil, msg.value);
    }

    // Called by Landlord to initiate withdrawal of accumulated rent (matches My Properties UI)
    function withdrawRent(
        uint256 _rentalId
    ) external nonReentrant onlyLandlord(_rentalId) escrowIsSet {
        // Can be called when rental is Active or Ended (to collect final rent)
        require(
            rentals[_rentalId].status == RentalStatus.Active ||
                rentals[_rentalId].status == RentalStatus.Ended,
            "RA: Rental not active or ended"
        );

        uint256 availableRent = escrowContract.getRentBalance(_rentalId);
        require(availableRent > 0, "RA: No rent available to withdraw");

        emit RentWithdrawalRequested(_rentalId, msg.sender);

        // Tell Escrow to release the funds
        escrowContract.releaseRentToLandlord(
            _rentalId,
            payable(msg.sender),
            availableRent
        );
        // Escrow contract emits RentWithdrawn event upon success
    }

    // Called by Tenant to request deposit release after rental period ends (matches My Rentals UI)
    function requestDepositRelease(
        uint256 _rentalId
    ) external nonReentrant onlyTenant(_rentalId) {
        Rental storage rental = rentals[_rentalId];
        require(
            rental.status == RentalStatus.Active ||
                rental.status == RentalStatus.Ended,
            "RA: Rental not active/ended"
        );
        require(
            block.timestamp >= rental.endDate,
            "RA: Rental period not yet ended"
        );
        // Ideally check if all rent was paid, add complexity if needed

        rental.status = RentalStatus.DepositReleaseRequested;
        emit DepositReleaseRequested(_rentalId, msg.sender);
    }

    // Called by Landlord to approve deposit release
    function approveDepositRelease(
        uint256 _rentalId
    ) external nonReentrant onlyLandlord(_rentalId) escrowIsSet {
        Rental storage rental = rentals[_rentalId];
        require(
            rental.status == RentalStatus.DepositReleaseRequested,
            "RA: Deposit release not requested by tenant"
        );

        rental.landlordApprovedDepositRelease = true;
        rental.status = RentalStatus.Ended; // Mark as fully ended now

        emit LandlordApprovedDepositRelease(_rentalId, msg.sender);

        // Trigger the actual release from Escrow
        escrowContract.releaseDepositToTenant(
            _rentalId,
            payable(rental.tenant)
        );
        // Escrow contract emits DepositReleased event

        // Mark property as available again in PropertyListing
        propertyListingContract.markAsAvailable(rental.propertyId);

        // Clean up active rental mapping
        delete activeRentalIdForProperty[rental.propertyId];

        emit RentalEnded(_rentalId, rental.propertyId);
        // Note: We don't delete the rental struct itself to preserve history.
        // Removing from arrays (rentalsByTenant, rentalsByLandlord) is complex/costly. Filter off-chain.
    }

    // --- View Functions ---

    function getRentalDetails(
        uint256 _rentalId
    ) external view returns (Rental memory) {
        require(rentals[_rentalId].rentalId != 0, "RA: Rental does not exist");
        return rentals[_rentalId];
    }

    function getTenantRentals(
        address _tenant
    ) external view returns (uint256[] memory) {
        return rentalsByTenant[_tenant];
    }

    function getLandlordRentals(
        address _landlord
    ) external view returns (uint256[] memory) {
        return rentalsByLandlord[_landlord];
    }

    function getActiveRentalIdForProperty(
        uint256 _propertyId
    ) external view returns (uint256) {
        return activeRentalIdForProperty[_propertyId];
    }
}
