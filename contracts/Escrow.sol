// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Corrected path
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol"; // If needed to track active rentals

contract Escrow is ReentrancyGuard {
    // Address of the RentalAgreement contract (must be authorized to call release functions)
    address public rentalAgreementContract;

    // Balances per rental agreement ID
    mapping(uint256 => uint256) public rentBalance;
    mapping(uint256 => uint256) public depositBalance;

    event RentalAgreementContractSet(address indexed contractAddress);
    event FundsDeposited(
        uint256 indexed rentalId,
        uint256 rentAmount,
        uint256 depositAmount,
        address indexed payer
    );
    event RentReleased(
        uint256 indexed rentalId,
        address indexed landlord,
        uint256 amount
    );
    event DepositReleased(
        uint256 indexed rentalId,
        address indexed tenant,
        uint256 amount
    );
    event RentWithdrawn(
        uint256 indexed rentalId,
        address indexed landlord,
        uint256 amount
    ); // Specific event for landlord withdrawal

    modifier onlyRentalAgreementContract() {
        require(
            msg.sender == rentalAgreementContract,
            "ESC: Caller not RentalAgreement contract"
        );
        _;
    }

    constructor(address _rentalAgreementContractAddress) {
        require(
            _rentalAgreementContractAddress != address(0),
            "ESC: Zero address"
        );
        rentalAgreementContract = _rentalAgreementContractAddress;
        emit RentalAgreementContractSet(_rentalAgreementContractAddress);
    }

    // --- Fund Management (Called by RentalAgreement) ---

    // Called by RentalAgreement when a tenant pays rent or initial deposit+rent
    function depositFunds(
        uint256 _rentalId,
        uint256 _amountForRent,
        uint256 _amountForDeposit,
        address _payer // Keep track of who paid originally
    ) external payable onlyRentalAgreementContract nonReentrant {
        require(
            msg.value == _amountForRent + _amountForDeposit,
            "ESC: Incorrect ETH sent"
        );

        if (_amountForDeposit > 0) {
            require(
                depositBalance[_rentalId] == 0,
                "ESC: Deposit already paid"
            );
            depositBalance[_rentalId] += _amountForDeposit;
        }
        if (_amountForRent > 0) {
            rentBalance[_rentalId] += _amountForRent;
        }

        emit FundsDeposited(
            _rentalId,
            _amountForRent,
            _amountForDeposit,
            _payer
        );
    }

    // Called by RentalAgreement to release *accumulated* rent to the landlord
    // This is typically called *after* the landlord initiates a withdrawal from RentalAgreement
    function releaseRentToLandlord(
        uint256 _rentalId,
        address payable _landlord,
        uint256 _amount
    ) external onlyRentalAgreementContract nonReentrant {
        require(_landlord != address(0), "ESC: Invalid landlord address");
        require(
            rentBalance[_rentalId] >= _amount,
            "ESC: Insufficient rent balance"
        );
        require(_amount > 0, "ESC: Amount must be positive");

        rentBalance[_rentalId] -= _amount;

        (bool success, ) = _landlord.call{value: _amount}("");
        require(success, "ESC: ETH transfer failed");

        emit RentReleased(_rentalId, _landlord, _amount);
        emit RentWithdrawn(_rentalId, _landlord, _amount); // Match frontend action
    }

    // Called by RentalAgreement when conditions are met to refund the deposit
    function releaseDepositToTenant(
        uint256 _rentalId,
        address payable _tenant
    ) external onlyRentalAgreementContract nonReentrant {
        require(_tenant != address(0), "ESC: Invalid tenant address");
        uint256 depositAmount = depositBalance[_rentalId];
        require(depositAmount > 0, "ESC: No deposit to release");

        depositBalance[_rentalId] = 0; // Update balance first (Checks-Effects-Interactions)

        (bool success, ) = _tenant.call{value: depositAmount}("");
        require(success, "ESC: ETH transfer failed");

        emit DepositReleased(_rentalId, _tenant, depositAmount);
    }

    // --- View Functions ---

    function getRentBalance(uint256 _rentalId) external view returns (uint256) {
        return rentBalance[_rentalId];
    }

    function getDepositBalance(
        uint256 _rentalId
    ) external view returns (uint256) {
        return depositBalance[_rentalId];
    }
}
