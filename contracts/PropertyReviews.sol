// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RentalAgreement.sol";
import "./UserRegistry.sol";

contract PropertyReviews is ReentrancyGuard {
    RentalAgreement public rentalAgreement;
    UserRegistry public userRegistry;

    struct Review {
        uint256 rentalId;
        address reviewer;
        address reviewed;
        uint256 propertyId;
        uint8 rating; // 1-5 stars
        string comment;
        uint256 timestamp;
        ReviewType reviewType;
    }

    enum ReviewType { PropertyReview, LandlordReview, TenantReview }

    // Mappings to store reviews
    mapping(uint256 => Review[]) public propertyReviews; // propertyId => reviews
    mapping(address => Review[]) public userReviews; // user address => reviews
    mapping(uint256 => bool) public hasReviewedRental; // rentalId => has been reviewed

    event ReviewAdded(
        uint256 indexed rentalId,
        address indexed reviewer,
        address indexed reviewed,
        uint256 propertyId,
        uint8 rating,
        ReviewType reviewType
    );

    constructor(address _rentalAgreement, address _userRegistry) {
        rentalAgreement = RentalAgreement(_rentalAgreement);
        userRegistry = UserRegistry(_userRegistry);
    }

    modifier onlyValidRating(uint8 _rating) {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1-5");
        _;
    }

    function addPropertyReview(
        uint256 _rentalId,
        uint256 _propertyId,
        uint8 _rating,
        string memory _comment
    ) external nonReentrant onlyValidRating(_rating) {
        // Verify the review is from a past tenant
        RentalAgreement.Rental memory rental = rentalAgreement.getRentalDetails(_rentalId);
        require(rental.tenant == msg.sender, "Not the tenant of this property");
        require(rental.status == RentalAgreement.RentalStatus.Ended, "Rental not ended");
        require(!hasReviewedRental[_rentalId], "Already reviewed this rental");

        Review memory review = Review({
            rentalId: _rentalId,
            reviewer: msg.sender,
            reviewed: address(0), // Not reviewing a specific person
            propertyId: _propertyId,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            reviewType: ReviewType.PropertyReview
        });

        propertyReviews[_propertyId].push(review);
        hasReviewedRental[_rentalId] = true;

        emit ReviewAdded(
            _rentalId,
            msg.sender,
            address(0),
            _propertyId,
            _rating,
            ReviewType.PropertyReview
        );
    }

    function addUserReview(
        uint256 _rentalId,
        address _reviewedUser,
        uint8 _rating,
        string memory _comment,
        ReviewType _reviewType
    ) external nonReentrant onlyValidRating(_rating) {
        require(_reviewType != ReviewType.PropertyReview, "Use addPropertyReview for properties");
        require(userRegistry.isUserRegistered(_reviewedUser), "Reviewed user not registered");
        
        // Verify the review relationship
        RentalAgreement.Rental memory rental = rentalAgreement.getRentalDetails(_rentalId);
        if (_reviewType == ReviewType.LandlordReview) {
            require(rental.tenant == msg.sender && rental.landlord == _reviewedUser, "Not tenant reviewing landlord");
        } else {
            require(rental.landlord == msg.sender && rental.tenant == _reviewedUser, "Not landlord reviewing tenant");
        }
        require(rental.status == RentalAgreement.RentalStatus.Ended, "Rental not ended");
        require(!hasReviewedRental[_rentalId], "Already reviewed this rental");

        Review memory review = Review({
            rentalId: _rentalId,
            reviewer: msg.sender,
            reviewed: _reviewedUser,
            propertyId: rental.propertyId,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            reviewType: _reviewType
        });

        userReviews[_reviewedUser].push(review);
        hasReviewedRental[_rentalId] = true;

        emit ReviewAdded(
            _rentalId,
            msg.sender,
            _reviewedUser,
            rental.propertyId,
            _rating,
            _reviewType
        );
    }

    // View functions
    function getPropertyReviews(uint256 _propertyId) external view returns (Review[] memory) {
        return propertyReviews[_propertyId];
    }

    function getUserReviews(address _user) external view returns (Review[] memory) {
        return userReviews[_user];
    }

    function getPropertyAverageRating(uint256 _propertyId) external view returns (uint8) {
        Review[] memory reviews = propertyReviews[_propertyId];
        if (reviews.length == 0) return 0;

        uint256 total = 0;
        for (uint i = 0; i < reviews.length; i++) {
            total += reviews[i].rating;
        }
        return uint8(total / reviews.length);
    }

    function getUserAverageRating(address _user) external view returns (uint8) {
        Review[] memory reviews = userReviews[_user];
        if (reviews.length == 0) return 0;

        uint256 total = 0;
        for (uint i = 0; i < reviews.length; i++) {
            total += reviews[i].rating;
        }
        return uint8(total / reviews.length);
    }
} 
