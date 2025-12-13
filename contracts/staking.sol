// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuditFlowStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable liskToken;
    address public daoWallet;
    
    enum Tier { NONE, BASIC, PREMIUM, PRO, ENTERPRISE }
    
    struct TierConfig {
        uint256 baseTokens;      // Tokens for 365 days (1x multiplier) in wei
        uint256 maxTokens;       // Tokens for 1 day (2x multiplier) in wei
        uint256[] featureAccess;
        string name;
        string description;
        uint256 yieldRate;       // APY rate in basis points (1 = 0.01%)
    }
    
    struct TierInfo {
        uint256 tierId;
        string name;
        string description;
        uint256 baseTokens;      // In whole tokens
        uint256 maxTokens;       // In whole tokens
        uint256[] featureAccess;
        uint256 minStakeDays;
        uint256 maxStakeDays;
        uint256 yieldRate;
    }
    
    struct StakingPosition {
        Tier tier;
        uint256 amountStaked;    // In wei
        uint256 stakedAt;
        uint256 unlocksAt;
        uint256 claimedYield;    // In wei
        bool active;
    }
    
    struct UserTierInfo {
        uint256 tierId;
        string tierName;
        string tierDescription;
        bool hasActiveStake;
        uint256 stakedAmount;    // In wei
        uint256 stakeStartTime;
        uint256 stakeEndTime;
        uint256 daysRemaining;
        uint256 accruedYield;    // In wei
        uint256[] accessibleFeatures;
    }
    
    // Constants
    uint256 public constant MAX_STAKE_DAYS = 365;
    uint256 public constant MIN_STAKE_DAYS = 1;
    uint256 public constant DAY_IN_SECONDS = 86400;
    uint256 public constant MULTIPLIER_DECAY_RATE = 25e16; // 2.5 in 1e18 precision
    uint256 public constant MULTIPLIER_BASE = 1e18; // 1.0 in fixed point
    uint256 public constant MULTIPLIER_MAX = 2e18;  // 2.0 in fixed point
    uint256 public constant TOKEN_DECIMALS = 18;
    uint256 public constant YIELD_RATE = 500; // 5% APY in basis points
    uint256 public constant EMERGENCY_PENALTY = 50; // 50% penalty
    
    // State variables
    uint256 public totalStakers;
    uint256 public totalStakedLSK; // In wei
    
    mapping(Tier => TierConfig) public tierConfigs;
    mapping(address => StakingPosition) public positions;
    mapping(address => uint256) public totalYieldContributed; // In wei
    
    // Events
    event Staked(
        address indexed user,
        Tier indexed tier,
        uint256 amount,
        uint256 durationDays,
        uint256 unlocksAt
    );
    
    event Unstaked(
        address indexed user,
        uint256 principal,
        uint256 yieldToDao
    );
    
    event EmergencyUnstake(
        address indexed user,
        uint256 principalReturned,
        uint256 penalty
    );
    
    event DaoWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TierUpdated(Tier indexed tier, uint256 baseTokens, uint256 maxTokens);
    event YieldClaimed(address indexed user, uint256 amount);
    
    constructor(
        address _liskToken, 
        address _daoWallet, 
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_liskToken != address(0), "Invalid token address");
        require(_daoWallet != address(0), "Invalid DAO wallet");
        require(_initialOwner != address(0), "Invalid owner");
        
        liskToken = IERC20(_liskToken);
        daoWallet = _daoWallet;
        
        _initializeTiers();
        
        totalStakers = 0;
        totalStakedLSK = 0;
    }
    
    function _initializeTiers() internal {
        // Basic Tier - Free tier (no staking required)
        tierConfigs[Tier.BASIC] = TierConfig({
            baseTokens: 0,
            maxTokens: 0,
            featureAccess: _createArray(2),
            name: "Basic",
            description: "Free tier with basic features - No staking required",
            yieldRate: 0
        });
        
        tierConfigs[Tier.BASIC].featureAccess[0] = 1; // Feature 1
        tierConfigs[Tier.BASIC].featureAccess[1] = 2; // Feature 2
        
        // Premium Tier
        tierConfigs[Tier.PREMIUM] = TierConfig({
            baseTokens: 100 * (10**TOKEN_DECIMALS),  // 100 LSK
            maxTokens: 200 * (10**TOKEN_DECIMALS),   // 200 LSK
            featureAccess: _createArray(5),
            name: "Premium",
            description: "Premium tier with advanced features - 5% APY",
            yieldRate: YIELD_RATE
        });
        
        for (uint256 i = 0; i < 5; i++) {
            tierConfigs[Tier.PREMIUM].featureAccess[i] = i + 1;
        }
        
        // Pro Tier
        tierConfigs[Tier.PRO] = TierConfig({
            baseTokens: 500 * (10**TOKEN_DECIMALS),  // 500 LSK
            maxTokens: 1000 * (10**TOKEN_DECIMALS), // 1000 LSK
            featureAccess: _createArray(8),
            name: "Pro",
            description: "Professional tier with pro features - 5% APY",
            yieldRate: YIELD_RATE
        });
        
        for (uint256 i = 0; i < 8; i++) {
            tierConfigs[Tier.PRO].featureAccess[i] = i + 1;
        }
        
        // Enterprise Tier
        tierConfigs[Tier.ENTERPRISE] = TierConfig({
            baseTokens: 800 * (10**TOKEN_DECIMALS),  // 800 LSK
            maxTokens: 1600 * (10**TOKEN_DECIMALS), // 1600 LSK
            featureAccess: _createArray(10),
            name: "Enterprise",
            description: "Enterprise tier with all features - 5% APY",
            yieldRate: YIELD_RATE
        });
        
        for (uint256 i = 0; i < 10; i++) {
            tierConfigs[Tier.ENTERPRISE].featureAccess[i] = i + 1;
        }
    }
    
    function _createArray(uint256 length) internal pure returns (uint256[] memory) {
        return new uint256[](length);
    }
    
    /**
     * @dev Get the caller's current tier information
     */
    function getMyTierInfo() external view returns (UserTierInfo memory) {
        address user = msg.sender;
        StakingPosition memory position = positions[user];
        
        if (position.active && block.timestamp <= position.unlocksAt) {
            TierConfig storage config = tierConfigs[position.tier];
            uint256 daysRemaining = 0;
            
            if (block.timestamp < position.unlocksAt) {
                daysRemaining = (position.unlocksAt - block.timestamp) / DAY_IN_SECONDS;
            }
            
            uint256 accruedYield = calculateAccruedYield(user);
            
            return UserTierInfo({
                tierId: uint256(position.tier),
                tierName: config.name,
                tierDescription: config.description,
                hasActiveStake: true,
                stakedAmount: position.amountStaked,
                stakeStartTime: position.stakedAt,
                stakeEndTime: position.unlocksAt,
                daysRemaining: daysRemaining,
                accruedYield: accruedYield,
                accessibleFeatures: config.featureAccess
            });
        } else {
            TierConfig storage basicConfig = tierConfigs[Tier.BASIC];
            
            return UserTierInfo({
                tierId: 1, // BASIC tier
                tierName: basicConfig.name,
                tierDescription: basicConfig.description,
                hasActiveStake: false,
                stakedAmount: 0,
                stakeStartTime: 0,
                stakeEndTime: 0,
                daysRemaining: 0,
                accruedYield: 0,
                accessibleFeatures: basicConfig.featureAccess
            });
        }
    }
    
    /**
     * @dev Get all tiers information for frontend
     */
    function getAllTiers() external view returns (TierInfo[] memory) {
        TierInfo[] memory tiers = new TierInfo[](4);
        
        for (uint256 i = 1; i <= 4; i++) {
            Tier tier = Tier(i);
            TierConfig storage config = tierConfigs[tier];
            
            tiers[i-1] = TierInfo({
                tierId: i,
                name: config.name,
                description: config.description,
                baseTokens: config.baseTokens / (10**TOKEN_DECIMALS),
                maxTokens: config.maxTokens / (10**TOKEN_DECIMALS),
                featureAccess: config.featureAccess,
                minStakeDays: tier == Tier.BASIC ? 0 : MIN_STAKE_DAYS,
                maxStakeDays: tier == Tier.BASIC ? 0 : MAX_STAKE_DAYS,
                yieldRate: config.yieldRate
            });
        }
        
        return tiers;
    }
    
    /**
     * @dev Calculate required stake for a tier and duration
     */
    function calculateRequiredStake(
        Tier tier,
        uint256 durationDays
    ) public view returns (uint256) {
        require(durationDays >= MIN_STAKE_DAYS, "Minimum 1 day required");
        require(durationDays <= MAX_STAKE_DAYS, "Maximum 365 days");
        require(tier != Tier.NONE && tier != Tier.BASIC, "Invalid tier");
        
        TierConfig memory config = tierConfigs[tier];
        
        // Calculate decay factor: e^(-decay_rate * days/365)
        uint256 x = (MULTIPLIER_DECAY_RATE * durationDays * 1e18) / (365 * 1e18);
        uint256 decayFactor = expNegFixed(x);
        
        // Calculate multiplier: 1 + 1 * decay_factor
        uint256 multiplier = MULTIPLIER_BASE + (MULTIPLIER_BASE * decayFactor) / 1e18;
        
        // Required = base * multiplier
        uint256 required = (config.baseTokens * multiplier) / 1e18;
        
        // Ensure it's between base and max
        if (required < config.baseTokens) required = config.baseTokens;
        if (required > config.maxTokens) required = config.maxTokens;
        
        return required;
    }
    
    /**
     * @dev Calculate required stake by tier ID (frontend convenience)
     */
    function calculateRequiredStakeByTierId(
        uint256 tierId, 
        uint256 durationDays
    ) external view returns (uint256 requiredStake) {
        require(tierId >= 2 && tierId <= 4, "Invalid tier ID");
        Tier tier = Tier(tierId);
        requiredStake = calculateRequiredStake(tier, durationDays);
    }
    
    /**
     * @dev Approximate e^(-x) using Taylor series (3 terms)
     */
    function expNegFixed(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 1e18;
        
        uint256 x2 = (x * x) / 1e18;
        uint256 x3 = (x2 * x) / 1e18;
        
        uint256 term1 = x;
        uint256 term2 = x2 / 2;
        uint256 term3 = x3 / 6;
        
        uint256 result = 1e18;
        
        if (result > term1) {
            result -= term1;
        } else {
            return 0;
        }
        
        result += term2;
        
        if (result > term3) {
            result -= term3;
        } else {
            return 0;
        }
        
        return result;
    }
    
    /**
     * @dev Stake tokens for a specific tier
     */
    function stake(
        uint256 tierId,
        uint256 durationDays
    ) external nonReentrant {
        require(!positions[msg.sender].active, "Already staking");
        require(durationDays >= MIN_STAKE_DAYS, "Minimum 1 day");
        require(durationDays <= MAX_STAKE_DAYS, "Maximum 365 days");
        require(tierId >= 2 && tierId <= 4, "Invalid tier");
        
        Tier tier = Tier(tierId);
        uint256 requiredStake = calculateRequiredStake(tier, durationDays);
        uint256 durationSeconds = durationDays * DAY_IN_SECONDS;
        
        // Transfer tokens from user to contract
        liskToken.safeTransferFrom(msg.sender, address(this), requiredStake);
        
        // Record position
        positions[msg.sender] = StakingPosition({
            tier: tier,
            amountStaked: requiredStake,
            stakedAt: block.timestamp,
            unlocksAt: block.timestamp + durationSeconds,
            claimedYield: 0,
            active: true
        });
        
        // Update totals
        totalStakers += 1;
        totalStakedLSK += requiredStake;
        
        emit Staked(
            msg.sender,
            tier,
            requiredStake,
            durationDays,
            block.timestamp + durationSeconds
        );
    }
    
    /**
     * @dev Unstake after lock period
     */
    function unstake() external nonReentrant {
        StakingPosition storage position = positions[msg.sender];
        require(position.active, "No active stake");
        require(block.timestamp >= position.unlocksAt, "Still locked");
        
        uint256 accruedYield = calculateAccruedYield(msg.sender);
        
        // Transfer principal back to user
        liskToken.safeTransfer(msg.sender, position.amountStaked);
        
        // Transfer yield to DAO
        if (accruedYield > 0) {
            liskToken.safeTransfer(daoWallet, accruedYield);
            totalYieldContributed[msg.sender] += accruedYield;
        }
        
        // Update position
        position.active = false;
        position.claimedYield += accruedYield;
        
        // Update totals
        totalStakers -= 1;
        totalStakedLSK -= position.amountStaked;
        
        emit Unstaked(msg.sender, position.amountStaked, accruedYield);
    }
    
    /**
     * @dev Emergency unstake with 50% penalty
     */
    function emergencyUnstake() external nonReentrant {
        StakingPosition storage position = positions[msg.sender];
        require(position.active, "No active stake");
        
        // Calculate penalty (50%)
        uint256 penalty = position.amountStaked * EMERGENCY_PENALTY / 100;
        uint256 userReceives = position.amountStaked - penalty;
        
        // Transfer half to user, penalty to DAO
        liskToken.safeTransfer(msg.sender, userReceives);
        liskToken.safeTransfer(daoWallet, penalty);
        
        // Update position
        position.active = false;
        
        // Update totals
        totalStakers -= 1;
        totalStakedLSK -= position.amountStaked;
        
        emit EmergencyUnstake(msg.sender, userReceives, penalty);
    }
    
    /**
     * @dev Calculate accrued yield for a user
     */
    function calculateAccruedYield(address user) public view returns (uint256) {
        StakingPosition memory position = positions[user];
        
        if (!position.active || block.timestamp <= position.stakedAt) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - position.stakedAt;
        
        // APY = 5% = 0.05
        // yield = principal * 0.05 * timeStaked / (365 days)
        return (position.amountStaked * YIELD_RATE * timeStaked) / (10000 * 365 * DAY_IN_SECONDS);
    }
    
    /**
     * @dev Get user's stake information
     */
    function getUserStake(address user) external view returns (
        bool hasActiveStake,
        uint256 tierId,
        uint256 amountStaked,
        uint256 stakedAt,
        uint256 unlocksAt,
        uint256 accruedYield,
        uint256 daysRemaining
    ) {
        StakingPosition memory position = positions[user];
        
        if (!position.active) {
            return (false, 0, 0, 0, 0, 0, 0);
        }
        
        uint256 yield = calculateAccruedYield(user);
        uint256 remaining = 0;
        
        if (block.timestamp < position.unlocksAt) {
            remaining = (position.unlocksAt - block.timestamp) / DAY_IN_SECONDS;
        }
        
        return (
            true,
            uint256(position.tier),
            position.amountStaked,
            position.stakedAt,
            position.unlocksAt,
            yield,
            remaining
        );
    }
    
    /**
     * @dev Check if user has access to a feature
     */
    function hasFeatureAccess(address user, uint256 featureId) external view returns (bool) {
        StakingPosition memory position = positions[user];
        
        Tier tier = position.active && block.timestamp <= position.unlocksAt 
            ? position.tier 
            : Tier.BASIC;
            
        uint256[] storage features = tierConfigs[tier].featureAccess;
        
        for (uint256 i = 0; i < features.length; i++) {
            if (features[i] == featureId) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get total staked in whole tokens (frontend convenience)
     */
    function getTotalStakedTokens() external view returns (uint256) {
        return totalStakedLSK / (10**TOKEN_DECIMALS);
    }
    
    /**
     * @dev Update DAO wallet address
     */
    function setDaoWallet(address _daoWallet) external onlyOwner {
        require(_daoWallet != address(0), "Invalid DAO wallet");
        emit DaoWalletUpdated(daoWallet, _daoWallet);
        daoWallet = _daoWallet;
    }
    
    /**
     * @dev Update tier configuration
     */
    function updateTier(
        uint256 tierId,
        uint256 baseTokens,
        uint256 maxTokens,
        uint256 yieldRate,
        string memory description
    ) external onlyOwner {
        require(tierId >= 1 && tierId <= 4, "Invalid tier ID");
        require(baseTokens <= maxTokens, "Base cannot exceed max");
        
        Tier tier = Tier(tierId);
        TierConfig storage config = tierConfigs[tier];
        
        config.baseTokens = baseTokens * (10**TOKEN_DECIMALS);
        config.maxTokens = maxTokens * (10**TOKEN_DECIMALS);
        config.yieldRate = yieldRate;
        config.description = description;
        
        emit TierUpdated(tier, config.baseTokens, config.maxTokens);
    }
    
    /**
     * @dev Emergency recovery of ERC20 tokens (not staking token)
     */
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(liskToken), "Cannot withdraw staking token");
        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }
    
    /**
     * @dev Get contract's LSK balance
     */
    function getContractBalance() external view returns (uint256) {
        return liskToken.balanceOf(address(this));
    }
    
    // ================ TESTING HELPER FUNCTIONS ================
    
    /**
     * @dev Helper function to check allowance for a user
     */
    function getAllowance(address user) public view returns (uint256) {
        return (liskToken.allowance(user, address(this)) * (10**TOKEN_DECIMALS));
    }
    
    /**
     * @dev Helper function to get user's token balance
     */
    function getUserTokenBalance(address user) public view returns (uint256) {
        return liskToken.balanceOf(user) * (10**TOKEN_DECIMALS);
    }
    
    /**
     * @dev Helper function to test staking with detailed error messages
     * For testing purposes only
     */
    
    /**
     * @dev Helper function to convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}