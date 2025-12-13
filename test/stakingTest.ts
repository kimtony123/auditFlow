import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { AuditFlowStaking, LiskTestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AuditFlowStaking", function () {
  // Constants
  const DAY_IN_SECONDS = 86400;
  const MAX_STAKE_DAYS = 365;
  const MIN_STAKE_DAYS = 1;

  // Tier IDs
  const NONE = 0;
  const BASIC = 1;
  const PREMIUM = 2;
  const PRO = 3;
  const ENTERPRISE = 4;

  async function deployStakingFixture() {
    const [owner, daoWallet, user1, user2, user3] = await ethers.getSigners();

    // Deploy LiskTestToken
    const LiskTestToken = await ethers.getContractFactory("LiskTestToken");
    const token = (await LiskTestToken.deploy()) as LiskTestToken;

    // Deploy AuditFlowStaking
    const AuditFlowStaking = await ethers.getContractFactory("AuditFlowStaking");
    const staking = await AuditFlowStaking.deploy(
      await token.getAddress(),
      daoWallet.address,
      owner.address
    );

    // Mint tokens to users for testing - USING UPDATED MINT FUNCTION
    const mintAmount = 2000n; // 100,000 tokens each
    await token.connect(user1).mint(mintAmount);
    await token.connect(user2).mint(mintAmount);
    await token.connect(user3).mint(mintAmount);

    // Approve staking contract to spend tokens
    const approveAmount = ethers.parseEther("2000");
    await token.connect(user1).approve(await staking.getAddress(), approveAmount);
    await token.connect(user2).approve(await staking.getAddress(), approveAmount);
    await token.connect(user3).approve(await staking.getAddress(), approveAmount);

    return { staking, token, owner, daoWallet, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      const { staking, token } = await loadFixture(deployStakingFixture);

      expect(await staking.liskToken()).to.equal(await token.getAddress());
    });

    it("Should set the right DAO wallet", async function () {
      const { staking, daoWallet } = await loadFixture(deployStakingFixture);

      expect(await staking.daoWallet()).to.equal(daoWallet.address);
    });

    it("Should set the right owner", async function () {
      const { staking, owner } = await loadFixture(deployStakingFixture);

      expect(await staking.owner()).to.equal(owner.address);
    });

    it("Should initialize tiers correctly", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      // Test Basic tier
      const basicTier = await staking.getTier(BASIC);
      expect(basicTier.name).to.equal("Basic");
      expect(basicTier.baseTokens).to.equal(0);
      expect(basicTier.maxTokens).to.equal(0);
      expect(basicTier.featureAccess).to.have.lengthOf(2);
      expect(basicTier.featureAccess[0]).to.equal(1);
      expect(basicTier.featureAccess[1]).to.equal(2);

      // Test Premium tier
      const premiumTier = await staking.getTier(PREMIUM);
      expect(premiumTier.name).to.equal("Premium");
      expect(premiumTier.baseTokens).to.equal(100);
      expect(premiumTier.maxTokens).to.equal(200);
      expect(premiumTier.featureAccess).to.have.lengthOf(5);
      expect(premiumTier.yieldRate).to.equal(500); // 5%

      // Test Pro tier
      const proTier = await staking.getTier(PRO);
      expect(proTier.name).to.equal("Pro");
      expect(proTier.baseTokens).to.equal(500);
      expect(proTier.maxTokens).to.equal(1000);
      expect(proTier.featureAccess).to.have.lengthOf(8);

      // Test Enterprise tier
      const enterpriseTier = await staking.getTier(ENTERPRISE);
      expect(enterpriseTier.name).to.equal("Enterprise");
      expect(enterpriseTier.baseTokens).to.equal(800);
      expect(enterpriseTier.maxTokens).to.equal(1600);
      expect(enterpriseTier.featureAccess).to.have.lengthOf(10);
    });
  });

  describe("Tier Information", function () {
    it("Should get all tiers", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      const allTiers = await staking.getAllTiers();
      expect(allTiers).to.have.lengthOf(4);
      expect(allTiers[0].name).to.equal("Basic");
      expect(allTiers[1].name).to.equal("Premium");
      expect(allTiers[2].name).to.equal("Pro");
      expect(allTiers[3].name).to.equal("Enterprise");
    });

    it("Should get tiers overview", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      const [names, descriptions, minStakes, maxStakes, yieldRates] = 
        await staking.getTiersOverview();

      expect(names).to.have.lengthOf(4);
      expect(names[0]).to.equal("Basic");
      expect(minStakes[0]).to.equal(0);
      expect(maxStakes[0]).to.equal(0);
    });

    it("Should get tier features", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      const basicFeatures = await staking.getTierFeatures(BASIC);
      expect(basicFeatures).to.have.lengthOf(2);

      const premiumFeatures = await staking.getTierFeatures(PREMIUM);
      expect(premiumFeatures).to.have.lengthOf(5);
    });

    it("Should get tiers with specific feature", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      const tiersWithFeature1 = await staking.getTiersWithFeature(1);
      expect(tiersWithFeature1).to.have.lengthOf(4); // All tiers have feature 1

      const tiersWithFeature10 = await staking.getTiersWithFeature(10);
      expect(tiersWithFeature10).to.have.lengthOf(1); // Only Enterprise has feature 10
      expect(tiersWithFeature10[0]).to.equal(ENTERPRISE);
    });
  });

  describe("Stake Calculations", function () {
    it("Should calculate required stake for different durations", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      // Test Premium tier
      const premiumStake365 = await staking.calculateRequiredStakeByTierId(PREMIUM, 365);
      expect(premiumStake365).to.equal(100); // Base amount for 365 days

      const premiumStake1 = await staking.calculateRequiredStakeByTierId(PREMIUM, 1);
      expect(Number(premiumStake1)).to.be.closeTo(200, 10); // Max amount for 1 day

      // Test Pro tier
      const proStake180 = await staking.calculateRequiredStakeByTierId(PRO, 180);
      const expectedProStake180 = 500 + (1000 - 500) * Math.exp(-2.5 * 180/365);
      expect(Number(proStake180)).to.be.closeTo(expectedProStake180, 10);
    });

    it("Should calculate required stakes for multiple durations", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      const durations = [1, 30, 180, 365];
      const requiredStakes = await staking.calculateRequiredStakesForDurations(
        PREMIUM,
        durations
      );

      expect(requiredStakes).to.have.lengthOf(4);
      expect(Number(requiredStakes[3])).to.equal(100); // 365 days = base amount
    });

    it("Should revert for invalid durations", async function () {
      const { staking } = await loadFixture(deployStakingFixture);

      await expect(
        staking.calculateRequiredStakeByTierId(PREMIUM, 0)
      ).to.be.reverted;

      await expect(
        staking.calculateRequiredStakeByTierId(PREMIUM, 366)
      ).to.be.reverted;
    });
  });

  describe("Staking", function () {
    it("Should allow user to stake tokens", async function () {
      const { staking, token, user1 } = await loadFixture(deployStakingFixture);

      const durationDays = 30;
      const requiredStake = await staking.calculateRequiredStakeByTierId(PREMIUM, durationDays);
      
      // Get user balance before staking
      const balanceBefore = await token.balanceOf(user1.address);

      // Stake tokens
      await expect(
        staking.connect(user1).stake(PREMIUM, durationDays)
      )
        .to.emit(staking, "Staked")
        .withArgs(
          user1.address,
          PREMIUM,
          ethers.parseEther(requiredStake.toString()),
          durationDays,
          (await time.latest()) + durationDays * DAY_IN_SECONDS
        );

      // Check user balance decreased
      const balanceAfter = await token.balanceOf(user1.address);
      expect(balanceAfter).to.be.lt(balanceBefore);

      // Check stake info
      const stakeInfo = await staking.getStakeInfo(user1.address);
      expect(stakeInfo.hasActiveStake).to.be.true;
      expect(stakeInfo.tier).to.equal(PREMIUM);
      expect(stakeInfo.daysRemaining).to.be.closeTo(durationDays, 1);
    });

    it("Should revert when staking with invalid tier", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await expect(
        staking.connect(user1).stake(NONE, 30)
      ).to.be.revertedWith("Invalid tier");

      await expect(
        staking.connect(user1).stake(BASIC, 30)
      ).to.be.revertedWith("Invalid tier");
    });

    it("Should revert when staking with invalid duration", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await expect(
        staking.connect(user1).stake(PREMIUM, 0)
      ).to.be.revertedWith("Minimum 1 day");

      await expect(
        staking.connect(user1).stake(PREMIUM, 366)
      ).to.be.revertedWith("Maximum 365 days");
    });

    it("Should revert when already staking", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // First stake
      await staking.connect(user1).stake(PREMIUM, 30);

      // Try to stake again
      await expect(
        staking.connect(user1).stake(PREMIUM, 60)
      ).to.be.revertedWith("Already staking");
    });

    it("Should calculate yield correctly", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      const durationDays = 365;
      const requiredStake = await staking.calculateRequiredStakeByTierId(PREMIUM, durationDays);
      const requiredStakeWei = ethers.parseEther(requiredStake.toString());

      // Stake tokens
      await staking.connect(user1).stake(PREMIUM, durationDays);

      // Check initial yield (should be 0)
      let yieldAmount = await staking.calculateYield(requiredStakeWei, await time.latest());
      expect(yieldAmount).to.equal(0);

      // Advance time by 180 days
      await time.increase(180 * DAY_IN_SECONDS);

      // Calculate expected yield: principal * 0.05 * timeStaked / (365 days)
      const expectedYield = (requiredStakeWei * 5n * 180n * BigInt(DAY_IN_SECONDS)) / (100n * 365n * BigInt(DAY_IN_SECONDS));
      
      yieldAmount = await staking.calculateYield(requiredStakeWei, await time.latest() - 180 * DAY_IN_SECONDS);
      expect(yieldAmount).to.be.closeTo(expectedYield, expectedYield / 100n); // Within 1%
    });
  });

  describe("User Tier Information", function () {
    it("Should return Basic tier info for non-stakers", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      const tierInfo = await staking.connect(user1).getMyTierInfo();
      expect(tierInfo.tierName).to.equal("Basic");
      expect(tierInfo.hasActiveStake).to.be.false;
      expect(tierInfo.accessibleFeatures).to.have.lengthOf(2);
    });

    it("Should return correct tier info for stakers", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // User stakes for Premium tier
      await staking.connect(user1).stake(PREMIUM, 30);

      const tierInfo = await staking.connect(user1).getMyTierInfo();
      expect(tierInfo.tierName).to.equal("Premium");
      expect(tierInfo.hasActiveStake).to.be.true;
      expect(tierInfo.accessibleFeatures).to.have.lengthOf(5);
      expect(tierInfo.daysRemaining).to.be.closeTo(30, 1);
    });

    it("Should return Basic tier after stake expires", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // User stakes for 7 days
      await staking.connect(user1).stake(PREMIUM, 7);

      // Advance time beyond stake period
      await time.increase(8 * DAY_IN_SECONDS);

      const tierInfo = await staking.connect(user1).getMyTierInfo();
      expect(tierInfo.tierName).to.equal("Basic");
      expect(tierInfo.hasActiveStake).to.be.false;
    });

    it("Should get user access information", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // Before staking
      let [tier, features, unlocksAt, tierName] = await staking.getUserAccess(user1.address);
      expect(tierName).to.equal("Basic");
      expect(features).to.have.lengthOf(2);

      // After staking
      await staking.connect(user1).stake(PREMIUM, 30);
      [tier, features, unlocksAt, tierName] = await staking.getUserAccess(user1.address);
      expect(tierName).to.equal("Premium");
      expect(features).to.have.lengthOf(5);
      expect(unlocksAt).to.be.gt(await time.latest());
    });
  });

  describe("Unstaking", function () {
    it("Should allow unstaking after lock period", async function () {
      const { staking, token, user1, daoWallet } = await loadFixture(deployStakingFixture);

      const durationDays = 30;
      await staking.connect(user1).stake(PREMIUM, durationDays);

      // Get stake info
      const stakeInfoBefore = await staking.getStakeInfo(user1.address);
      const expectedYield = await staking.calculateYield(
        stakeInfoBefore.amountStaked,
        stakeInfoBefore.stakedAt
      );

      // Get balances before unstaking
      const userBalanceBefore = await token.balanceOf(user1.address);
      const daoBalanceBefore = await token.balanceOf(daoWallet.address);
      const contractBalanceBefore = await token.balanceOf(await staking.getAddress());

      // Advance time to unlock
      await time.increaseTo(stakeInfoBefore.unlocksAt);

      // Unstake
      await expect(staking.connect(user1).unstake())
        .to.emit(staking, "Unstaked")
        .withArgs(user1.address, stakeInfoBefore.amountStaked, expectedYield);

      // Check balances
      const userBalanceAfter = await token.balanceOf(user1.address);
      const daoBalanceAfter = await token.balanceOf(daoWallet.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore + stakeInfoBefore.amountStaked);
      expect(daoBalanceAfter).to.equal(daoBalanceBefore + expectedYield);

      // Check stake info is cleared
      const stakeInfoAfter = await staking.getStakeInfo(user1.address);
      expect(stakeInfoAfter.hasActiveStake).to.be.false;
    });

    it("Should revert when trying to unstake early", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await staking.connect(user1).stake(PREMIUM, 30);

      // Try to unstake immediately
      await expect(
        staking.connect(user1).unstake()
      ).to.be.revertedWith("Still locked");
    });

    it("Should revert when no active stake", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await expect(
        staking.connect(user1).unstake()
      ).to.be.revertedWith("No active stake");
    });
  });

  describe("Emergency Unstaking", function () {
    it("Should allow emergency unstake with 50% penalty", async function () {
      const { staking, token, user1, daoWallet } = await loadFixture(deployStakingFixture);

      await staking.connect(user1).stake(PREMIUM, 30);

      const stakeInfo = await staking.getStakeInfo(user1.address);
      const penalty = stakeInfo.amountStaked / 2n;
      const userReceives = stakeInfo.amountStaked - penalty;

      // Get balances before
      const userBalanceBefore = await token.balanceOf(user1.address);
      const daoBalanceBefore = await token.balanceOf(daoWallet.address);

      // Emergency unstake
      await expect(staking.connect(user1).emergencyUnstake())
        .to.emit(staking, "EmergencyUnstake")
        .withArgs(user1.address, userReceives, penalty);

      // Check balances
      const userBalanceAfter = await token.balanceOf(user1.address);
      const daoBalanceAfter = await token.balanceOf(daoWallet.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore + userReceives);
      expect(daoBalanceAfter).to.equal(daoBalanceBefore + penalty);

      // Check stake is cleared
      const stakeInfoAfter = await staking.getStakeInfo(user1.address);
      expect(stakeInfoAfter.hasActiveStake).to.be.false;
    });

    it("Should revert emergency unstake with no active stake", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await expect(
        staking.connect(user1).emergencyUnstake()
      ).to.be.revertedWith("No active stake");
    });
  });

  describe("Upgrade Checks", function () {
    it("Should check if user can upgrade tier", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // User has Basic tier initially
      const [canUpgrade, currentTier, requiredStake] = 
        await staking.connect(user1).canUpgradeToTier(PREMIUM);
      
      expect(currentTier).to.equal(BASIC);
      expect(canUpgrade).to.be.true;
      expect(requiredStake).to.be.gt(0);

      // User stakes for Premium tier
      await staking.connect(user1).stake(PREMIUM, 30);

      // Now try to upgrade to Pro
      const [canUpgrade2, currentTier2, requiredStake2] = 
        await staking.connect(user1).canUpgradeToTier(PRO);
      
      expect(currentTier2).to.equal(PREMIUM);
      expect(canUpgrade2).to.be.true;
      expect(requiredStake2).to.be.gt(0);
    });

    it("Should not allow downgrade", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // User stakes for Pro tier
      await staking.connect(user1).stake(PRO, 30);

      // Try to "upgrade" to Premium (which is actually a downgrade)
      const [canUpgrade, currentTier] = 
        await staking.connect(user1).canUpgradeToTier(PREMIUM);
      
      expect(canUpgrade).to.be.false;
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update tier configuration", async function () {
      const { staking, owner } = await loadFixture(deployStakingFixture);

      const newBaseTokens = 150;
      const newMaxTokens = 250;
      const newYieldRate = 600; // 6%
      const newDescription = "Updated Premium tier";

      await expect(
        staking.connect(owner).updateTierConfig(
          PREMIUM,
          newBaseTokens,
          newMaxTokens,
          newYieldRate,
          newDescription
        )
      )
        .to.emit(staking, "TierUpdated")
        .withArgs(PREMIUM, "Premium", ethers.parseEther("150"), ethers.parseEther("250"));

      const updatedTier = await staking.getTier(PREMIUM);
      expect(updatedTier.baseTokens).to.equal(newBaseTokens);
      expect(updatedTier.maxTokens).to.equal(newMaxTokens);
      expect(updatedTier.yieldRate).to.equal(newYieldRate);
      expect(updatedTier.description).to.equal(newDescription);
    });

    it("Should revert when non-owner tries to update tier config", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await expect(
        staking.connect(user1).updateTierConfig(
          PREMIUM,
          150,
          250,
          600,
          "Updated tier"
        )
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update DAO wallet", async function () {
      const { staking, owner, user1 } = await loadFixture(deployStakingFixture);

      const oldDaoWallet = await staking.daoWallet();
      
      await expect(staking.connect(owner).setDaoWallet(user1.address))
        .to.emit(staking, "DaoWalletUpdated")
        .withArgs(oldDaoWallet, user1.address);

      expect(await staking.daoWallet()).to.equal(user1.address);
    });

    it("Should allow owner to recover accidentally sent ERC20 tokens", async function () {
      const { staking, token, owner } = await loadFixture(deployStakingFixture);

      // Deploy a different ERC20 token
      const MockToken = await ethers.getContractFactory("LiskTestToken");
      const mockToken = await MockToken.deploy();
      
      // Mint some tokens to the test account and then transfer to staking contract
      await mockToken.connect(owner).mint(1000n);
      await mockToken.connect(owner).transfer(await staking.getAddress(), 1000n);

      // Owner recovers the tokens
      await expect(
        staking.connect(owner).recoverERC20(await mockToken.getAddress(), 1000)
      ).to.not.be.reverted;

      // Should revert when trying to recover the staking token
      await expect(
        staking.connect(owner).recoverERC20(await token.getAddress(), 1000)
      ).to.be.revertedWith("Cannot withdraw staking token");
    });
  });

  describe("Contract Balance and Yield", function () {
    it("Should track total yield contributed", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      // Initially zero
      expect(await staking.getMyTotalYieldContributed()).to.equal(0);

      // Stake and unstake after time passes
      await staking.connect(user1).stake(PREMIUM, 365);
      
      // Advance time by 180 days
      await time.increase(180 * DAY_IN_SECONDS);
      
      // Unstake
      await staking.connect(user1).unstake();

      // Should have contributed yield
      const contributedYield = await staking.getMyTotalYieldContributed();
      expect(contributedYield).to.be.gt(0);
    });

    it("Should return contract balance", async function () {
      const { staking, token, user1 } = await loadFixture(deployStakingFixture);

      // Initially zero
      const initialBalance = await staking.getContractBalance();
      expect(initialBalance).to.equal(0);

      // After someone stakes
      await staking.connect(user1).stake(PREMIUM, 30);

      const balanceAfter = await staking.getContractBalance();
      expect(balanceAfter).to.be.gt(0);
    });
  });
});
