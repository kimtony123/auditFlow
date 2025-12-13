import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { LiskTestToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LiskTestToken", function () {
  // Constants
  const DECIMALS = 18;
  const TOKEN_UNIT = 10n ** 18n;
  const MAX_SUPPLY = 1_000_000n * TOKEN_UNIT;
  const MAX_MINT_PER_ADDRESS = 10_000n * TOKEN_UNIT;

  async function deployTokenFixture() {
    const [owner, account1, account2, account3] = await ethers.getSigners();

    const LiskTestToken = await ethers.getContractFactory("LiskTestToken");
    const token = await LiskTestToken.deploy();

    return { token, owner, account1, account2, account3 };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.equal("LiskTestToken");
      expect(await token.symbol()).to.equal("LTT");
    });

    it("Should have correct decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.decimals()).to.equal(18);
    });

    it("Should return correct constants", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.getMaxSupply()).to.equal(1_000_000);
      expect(await token.getMaxMintPerAddress()).to.equal(10_000);
      expect(await token.DECIMALS()).to.equal(18);
      expect(await token.TOKEN_UNIT()).to.equal(TOKEN_UNIT);
      expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await token.MAX_MINT_PER_ADDRESS()).to.equal(MAX_MINT_PER_ADDRESS);
    });

    it("Should start with zero total supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.totalSupply()).to.equal(0);
      expect(await token.totalSupplyInWholeTokens()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint tokens", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      const mintAmount = 1000n;
      await expect(token.connect(account1).mint(mintAmount))
        .to.emit(token, "TokensMinted")
        .withArgs(account1.address, mintAmount * TOKEN_UNIT);

      expect(await token.balanceOf(account1.address)).to.equal(mintAmount * TOKEN_UNIT);
      expect(await token.balanceOfWholeTokens(account1.address)).to.equal(mintAmount);
      expect(await token.mintedBy(account1.address)).to.equal(mintAmount);
      expect(await token.mintedByInWei(account1.address)).to.equal(mintAmount * TOKEN_UNIT);
    });

    it("Should allow owner to mint tokens", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      const mintAmount = 500n;
      await expect(token.connect(owner).mint(mintAmount))
        .to.emit(token, "TokensMinted")
        .withArgs(owner.address, mintAmount * TOKEN_UNIT);

      expect(await token.balanceOf(owner.address)).to.equal(mintAmount * TOKEN_UNIT);
    });

    it("Should revert when minting zero tokens", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(account1).mint(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should track multiple mints to same address", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      // First mint
      await token.connect(account1).mint(5000n);
      expect(await token.mintedBy(account1.address)).to.equal(5000n);
      expect(await token.remainingMintable(account1.address)).to.equal(5000n);

      // Second mint
      await token.connect(account1).mint(3000n);
      expect(await token.mintedBy(account1.address)).to.equal(8000n);
      expect(await token.remainingMintable(account1.address)).to.equal(2000n);
      expect(await token.remainingMintableInWei(account1.address)).to.equal(2000n * TOKEN_UNIT);
    });

    it("Should revert when exceeding max mint per address", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      // Mint 10,000 tokens (maximum)
      await token.connect(account1).mint(10000n);
      expect(await token.mintedBy(account1.address)).to.equal(10000n);

      // Try to mint one more token
      await expect(
        token.connect(account1).mint(1)
      ).to.be.revertedWith("Exceeds maximum mint per address");
    });

    it("Should revert when exceeding max total supply", async function () {
      const { token, account1, account2, account3 } = await loadFixture(deployTokenFixture);

      // Mint 999,999 tokens across multiple accounts
      // Account1 mints 500,000
      await token.connect(account1).mint(500000n);
      
      // Account2 mints 499,999
      await token.connect(account2).mint(499999n);
      
      expect(await token.totalSupplyInWholeTokens()).to.equal(999999n);

      // Try to mint 2 more tokens (would exceed 1,000,000)
      await expect(
        token.connect(account3).mint(2)
      ).to.be.revertedWith("Exceeds maximum supply");

      // Should be able to mint 1 more token
      await token.connect(account3).mint(1);
      expect(await token.totalSupplyInWholeTokens()).to.equal(1000000n);
    });

    it("Should track minters correctly", async function () {
      const { token, account1, account2, account3 } = await loadFixture(deployTokenFixture);

      // Mint to account1
      await token.connect(account1).mint(1000n);
      let minters = await token.getMinters();
      expect(minters).to.have.lengthOf(1);
      expect(minters[0]).to.equal(account1.address);
      expect(await token.getMinterCount()).to.equal(1);

      // Mint to account2
      await token.connect(account2).mint(2000n);
      minters = await token.getMinters();
      expect(minters).to.have.lengthOf(2);
      expect(await token.getMinterCount()).to.equal(2);

      // Mint again to account1 (should not add duplicate)
      await token.connect(account1).mint(1000n);
      expect(await token.getMinterCount()).to.equal(2);

      // Mint to account3
      await token.connect(account3).mint(3000n);
      expect(await token.getMinterCount()).to.equal(3);
    });

    it("Should allow multiple addresses to mint independently", async function () {
      const { token, account1, account2 } = await loadFixture(deployTokenFixture);

      // Account1 mints 5000 tokens
      await token.connect(account1).mint(5000n);
      expect(await token.balanceOfWholeTokens(account1.address)).to.equal(5000n);
      expect(await token.mintedBy(account1.address)).to.equal(5000n);

      // Account2 mints 8000 tokens
      await token.connect(account2).mint(8000n);
      expect(await token.balanceOfWholeTokens(account2.address)).to.equal(8000n);
      expect(await token.mintedBy(account2.address)).to.equal(8000n);

      // Both should have remaining mintable amounts
      expect(await token.remainingMintable(account1.address)).to.equal(5000n);
      expect(await token.remainingMintable(account2.address)).to.equal(2000n);
    });
  });

  describe("View Functions", function () {
    it("Should return correct remaining mintable amounts", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      // Before any mint
      expect(await token.remainingMintable(account1.address)).to.equal(10000n);
      expect(await token.remainingMintableInWei(account1.address)).to.equal(MAX_MINT_PER_ADDRESS);

      // After partial mint
      await token.connect(account1).mint(3500n);
      expect(await token.remainingMintable(account1.address)).to.equal(6500n);
      expect(await token.remainingMintableInWei(account1.address)).to.equal(6500n * TOKEN_UNIT);

      // After max mint
      await token.connect(account1).mint(6500n);
      expect(await token.remainingMintable(account1.address)).to.equal(0n);
      expect(await token.remainingMintableInWei(account1.address)).to.equal(0n);
    });

    it("Should convert between whole tokens and wei correctly", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      const wholeTokens = 1234n;
      await token.connect(account1).mint(wholeTokens);

      expect(await token.balanceOfWholeTokens(account1.address)).to.equal(wholeTokens);
      expect(await token.balanceOf(account1.address)).to.equal(wholeTokens * TOKEN_UNIT);
      expect(await token.totalSupplyInWholeTokens()).to.equal(wholeTokens);
      expect(await token.totalSupply()).to.equal(wholeTokens * TOKEN_UNIT);
    });

    it("Should return correct minted amounts for addresses", async function () {
      const { token, account1, account2 } = await loadFixture(deployTokenFixture);

      // Account1 mints 2500 tokens
      await token.connect(account1).mint(2500n);
      
      // Account2 mints 7500 tokens
      await token.connect(account2).mint(7500n);

      expect(await token.mintedBy(account1.address)).to.equal(2500n);
      expect(await token.mintedByInWei(account1.address)).to.equal(2500n * TOKEN_UNIT);
      
      expect(await token.mintedBy(account2.address)).to.equal(7500n);
      expect(await token.mintedByInWei(account2.address)).to.equal(7500n * TOKEN_UNIT);
    });
  });

  describe("ERC20 Burnable", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { token, account1 } = await loadFixture(deployTokenFixture);

      // Mint tokens
      const mintAmount = 5000n;
      await token.connect(account1).mint(mintAmount);

      // Burn some tokens
      const burnAmount = 1000n * TOKEN_UNIT;
      await token.connect(account1).burn(burnAmount);

      const expectedBalance = (mintAmount - 1000n) * TOKEN_UNIT;
      expect(await token.balanceOf(account1.address)).to.equal(expectedBalance);
      expect(await token.totalSupply()).to.equal(expectedBalance);
      expect(await token.totalSupplyInWholeTokens()).to.equal(mintAmount - 1000n);
    });

    it("Should allow token holders to burn from another address with allowance", async function () {
      const { token, account1, account2 } = await loadFixture(deployTokenFixture);

      // Mint tokens to account1
      const mintAmount = 5000n;
      await token.connect(account1).mint(mintAmount);

      // Approve account2 to spend tokens
      const approveAmount = 2000n * TOKEN_UNIT;
      await token.connect(account1).approve(account2.address, approveAmount);

      // Burn from account1 using account2
      const burnAmount = 1000n * TOKEN_UNIT;
      await token.connect(account2).burnFrom(account1.address, burnAmount);

      const expectedBalance = (mintAmount - 1000n) * TOKEN_UNIT;
      expect(await token.balanceOf(account1.address)).to.equal(expectedBalance);
      expect(await token.totalSupply()).to.equal(expectedBalance);
    });
  });
});