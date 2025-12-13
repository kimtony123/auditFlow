import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { LiskTestToken__factory, TOKEN_ADDRESS } from '../utils/contractHelpers';
import { DivviService } from '../services/Divvi';

interface UseMintWithReferralProps {
  account: string | null;
  getSigner: () => Promise<ethers.Signer | null>;
  isOnLisk: boolean;
}

export const useMintWithReferral = ({ account, getSigner, isOnLisk }: UseMintWithReferralProps) => {
  const [mintLoading, setMintLoading] = useState(false);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const handleMintWithReferral = useCallback(async () => {
    if (!account || !isOnLisk) {
      setMintError(!account ? "Please connect your wallet first" : "Please switch to Lisk Sepolia network");
      return;
    }

    setMintLoading(true);
    setMintError(null);
    setMintSuccess(null);
    setReferralStatus('idle');

    try {
      const signer = await getSigner();
      if (!signer) throw new Error("No signer available");

      const tokenContract = LiskTestToken__factory.connect(TOKEN_ADDRESS, signer);
      const mintAmount = 1000;

      // Step 1: Check remaining mints
      const remaining = await tokenContract.remainingMintable(account);
      const remainingNumber = Number(remaining);
      const currentMintsLeft = Math.floor(remainingNumber / 1000);
      
      if (currentMintsLeft <= 0) {
        throw new Error("No mints remaining");
      }

      // Step 2: Generate referral tag using Divvi
      let referralTag = '';
      let isDivviEnabled = false;
      
      if (DivviService.isConfigured()) {
        try {
          referralTag = DivviService.generateReferralTag(account);
          isDivviEnabled = !!referralTag;
          console.log('Divvi referral tag generated:', referralTag);
        } catch (error) {
          console.warn('Divvi tag generation failed, proceeding without referral:', error);
        }
      }

      // Step 3: Prepare transaction data with referral tag
      let tx;
      
      if (isDivviEnabled && referralTag) {
        // Method 1: Append referral tag to mint function call
        const mintFunction = tokenContract.interface.encodeFunctionData("mint", [mintAmount]);
        const dataWithReferral = mintFunction + referralTag.slice(2); // Remove '0x' prefix
        
        // Estimate gas for the modified transaction
        const gasEstimate = await signer.estimateGas({
          to: TOKEN_ADDRESS,
          data: dataWithReferral,
        });
        
        const gasLimit = gasEstimate * 150n / 100n;
        
        // Send transaction with referral data
        tx = await signer.sendTransaction({
          to: TOKEN_ADDRESS,
          data: dataWithReferral,
          gasLimit,
        });
      } else {
        // Method 2: Standard mint (fallback if Divvi fails)
        const gasEstimate = await tokenContract.mint.estimateGas(mintAmount);
        const gasLimit = gasEstimate * 150n / 100n;
        
        tx = await tokenContract.mint(mintAmount, {
          gasLimit,
        });
      }

      // Show transaction hash
      const shortHash = `${tx.hash.substring(0, 8)}...${tx.hash.substring(tx.hash.length - 6)}`;
      setMintSuccess(`Transaction sent! Hash: ${shortHash}`);
      
      // Step 4: Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        setMintSuccess(`Successfully minted 1,000 LTT tokens!`);
        
        // Step 5: Submit referral to Divvi after confirmation
        if (isDivviEnabled) {
          setReferralStatus('pending');
          const chainId = (await signer.provider?.getNetwork())?.chainId || 4202;
          
          const referralSubmitted = await DivviService.submitReferral({
            txHash: tx.hash,
            chainId: Number(chainId),
            userAddress: account,
          });
          
          setReferralStatus(referralSubmitted ? 'success' : 'error');
          
          if (referralSubmitted) {
            setMintSuccess(prev => `${prev} Referral tracking enabled!`);
          }
        }
        
        // Update UI state
        // You'll need to refetch token info here or update parent component
        
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Mint error:", error);
      
      // User-friendly error messages
      if (error.code === 4001 || error.message?.includes("user rejected")) {
        setMintError("Transaction was cancelled");
      } else if (error.message?.includes("Exceeds maximum mint per address")) {
        setMintError("You've reached your mint limit (10,000 tokens max)");
      } else if (error.message?.includes("Exceeds maximum supply")) {
        setMintError("Maximum token supply has been reached");
      } else if (error.message?.includes("No mints remaining")) {
        setMintError("No mints remaining");
      } else if (error.code === -32603) {
        setMintError("Network error - please try again");
      } else {
        setMintError(error.message || "Failed to mint tokens");
      }
      
      setReferralStatus('error');
    } finally {
      setMintLoading(false);
    }
  }, [account, getSigner, isOnLisk]);

  return {
    mintLoading,
    mintSuccess,
    mintError,
    referralStatus,
    handleMintWithReferral,
  };
};