// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    struct UserProfile {
        string name;
        bool isRegistered; // Better flag than checking name length
        // Add more profile fields if needed (e.g., contact info IPFS hash)
    }

    mapping(address => UserProfile) public users;
    // Removed userProperties mapping - better handled off-chain via events from PropertyListing

    event UserRegistered(address indexed user, string name);
    event ProfileUpdated(address indexed user, string newName);

    function registerUser(string memory _name) external {
        require(!users[msg.sender].isRegistered, "UR: User already registered");
        require(bytes(_name).length > 0, "UR: Name cannot be empty");

        users[msg.sender] = UserProfile({ name: _name, isRegistered: true });

        emit UserRegistered(msg.sender, _name);
    }

    function getUserProfile(address _userAddress) external view returns (UserProfile memory) {
        // No need to check if registered, returns default struct if not
        return users[_userAddress];
    }

    function updateProfile(string memory _newName) external {
        require(users[msg.sender].isRegistered, "UR: User not registered");
        require(bytes(_newName).length > 0, "UR: Name cannot be empty");

        users[msg.sender].name = _newName;
        emit ProfileUpdated(msg.sender, _newName);
    }

    function isUserRegistered(address _userAddress) external view returns (bool) {
        return users[_userAddress].isRegistered;
    }
}
