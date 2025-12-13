// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract LiskTestToken is ERC20, ERC20Burnable {
    uint256 public constant DECIMALS = 18;
    uint256 public constant TOKEN_UNIT = 10**DECIMALS;
    uint256 public constant MAX_SUPPLY = 1_000_000 * TOKEN_UNIT; // 1,000,000 tokens
    uint256 public constant MAX_MINT_PER_ADDRESS = 10_000 * TOKEN_UNIT; // 10,000 tokens
    
    // Track how much each address has minted (in wei)
    mapping(address => uint256) private _mintedAmounts;
    
    // Track addresses that have minted
    address[] private _minters;
    
    // Event emitted when tokens are minted
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() 
        ERC20("LiskTestToken", "LTT") 
    {
        // Contract starts with 0 supply
    }
    
    /**
     * @dev Mint tokens to a specific address
     * @param wholeTokens The amount of whole tokens to mint (not wei)
     */
    function mint(uint256 wholeTokens) external {
        require(wholeTokens > 0, "Amount must be greater than 0");
        
        // Convert whole tokens to wei (with decimals)
        uint256 amountInWei = wholeTokens * TOKEN_UNIT;
        
        require(totalSupply() + amountInWei <= MAX_SUPPLY, "Exceeds maximum supply");
        require(_mintedAmounts[msg.sender] + amountInWei <= MAX_MINT_PER_ADDRESS, "Exceeds maximum mint per address");
        
        // Update minted amount for the address
        _mintedAmounts[msg.sender] += amountInWei;
        
        // Track minter if this is their first mint
        if (_mintedAmounts[msg.sender] == amountInWei) {
            _minters.push(msg.sender);
        }
        
        // Mint the tokens to the sender
        _mint(msg.sender, amountInWei);
        
        emit TokensMinted(msg.sender, amountInWei);
    }
    
    /**
     * @dev Get the amount minted by a specific address in whole tokens
     * @param account The address to check
     * @return The amount of whole tokens minted by the address
     */
    function mintedBy(address account) public view returns (uint256) {
        return _mintedAmounts[account] / TOKEN_UNIT;
    }
    
    /**
     * @dev Get the amount minted by a specific address in wei
     * @param account The address to check
     * @return The amount in wei minted by the address
     */
    function mintedByInWei(address account) public view returns (uint256) {
        return _mintedAmounts[account];
    }
    
    /**
     * @dev Check how many whole tokens an address can still mint
     * @param account The address to check
     * @return The remaining mintable whole tokens for the address
     */
    function remainingMintable(address account) public view returns (uint256) {
        uint256 minted = _mintedAmounts[account];
        if (minted >= MAX_MINT_PER_ADDRESS) {
            return 0;
        }
        return (MAX_MINT_PER_ADDRESS - minted) / TOKEN_UNIT;
    }
    
    /**
     * @dev Check how many tokens in wei an address can still mint
     * @param account The address to check
     * @return The remaining mintable amount in wei for the address
     */
    function remainingMintableInWei(address account) public view returns (uint256) {
        uint256 minted = _mintedAmounts[account];
        if (minted >= MAX_MINT_PER_ADDRESS) {
            return 0;
        }
        return MAX_MINT_PER_ADDRESS - minted;
    }
    
    /**
     * @dev Get all addresses that have minted tokens
     * @return Array of minter addresses
     */
    function getMinters() external view returns (address[] memory) {
        return _minters;
    }
    
    /**
     * @dev Get total number of minters
     * @return Count of unique addresses that have minted
     */
    function getMinterCount() external view returns (uint256) {
        return _minters.length;
    }
    
    /**
     * @dev Get the maximum supply in whole tokens
     * @return The maximum token supply in whole tokens
     */
    function getMaxSupply() external pure returns (uint256) {
        return MAX_SUPPLY / TOKEN_UNIT;
    }
    
    /**
     * @dev Get the maximum mint per address in whole tokens
     * @return The maximum tokens an address can mint in whole tokens
     */
    function getMaxMintPerAddress() external pure returns (uint256) {
        return MAX_MINT_PER_ADDRESS / TOKEN_UNIT;
    }
    
    /**
     * @dev Get the current total supply in whole tokens
     * @return Current total supply in whole tokens
     */
    function totalSupplyInWholeTokens() external view returns (uint256) {
        return totalSupply() / TOKEN_UNIT;
    }
    
    /**
     * @dev Get balance in whole tokens
     * @param account The address to check
     * @return Balance in whole tokens
     */
    function balanceOfWholeTokens(address account) external view returns (uint256) {
        return balanceOf(account) / TOKEN_UNIT;
    }
}