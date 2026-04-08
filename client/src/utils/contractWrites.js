import { Contract, parseUnits } from "ethers";
import {
  getProvider,
  getSignedContract,
  CONTRACT_ADDRESS,
  ERC20_ABI,
  ZKSYNC_SEPOLIA,
} from "./contractHelpers";


export const switchToZkSyncSepolia = async (wallets) => {
  if (!wallets?.length) throw new Error("No wallet connected");
  try {
    await wallets[0].switchChain(ZKSYNC_SEPOLIA.chainId);
    return true;
  } catch (error) {
    console.error("Failed to switch network:", error);
    throw new Error(
      "Failed to switch to zkSync Sepolia. Please switch manually in your wallet."
    );
  }
};


export const lockUserFund = async ({ tokenAddress, amount, raastId, wallets, address }) => {
  try {
    if (!wallets?.length) throw new Error("No wallet connected");

    // Derive a single provider + signer from the active address.
    // Both the approval tx and the lock tx must come from the same
    // signer — using wallets[0] for approval and getSignedContract
    // for the lock was the root cause of the estimateGas revert.
    const provider = await getProvider(wallets, address);
    const signer = await provider.getSigner();
    console.log("Signer address:", await signer.getAddress());

    const contract = await getSignedContract(wallets, address);
    const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";

    if (!isEth) {
      const isWhitelisted = await contract.whiteListedTokens(tokenAddress);
      if (!isWhitelisted) throw new Error("Token is NOT whitelisted in the contract!");
    }

    const decimal = isEth ? 18 : 6;
    const parsedAmount = parseUnits(amount.toString(), decimal);

    if (!isEth) {
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const currentAllowance = await tokenContract.allowance(address, CONTRACT_ADDRESS);
      console.log("Allowance:", currentAllowance.toString(), "/ needed:", parsedAmount.toString());

      if (BigInt(currentAllowance) < BigInt(parsedAmount)) {
        console.log("Approving...");
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, parsedAmount);
        await approveTx.wait(1);
        console.log("Approval confirmed.");
      } else {
        console.log("Allowance sufficient, skipping approval.");
      }
    }

    const lockTx = isEth
      ? await contract.lockUserRequest(tokenAddress, parsedAmount, raastId, { value: parsedAmount })
      : await contract.lockUserRequest(tokenAddress, parsedAmount, raastId);

    await lockTx.wait(1);
    console.log("Funds locked:", lockTx.hash);
    return lockTx;
  } catch (error) {
    console.error("lockUserFund failed:", error);

    if (error.code === 4001 || error.code === "ACTION_REJECTED")
      throw new Error("Transaction rejected by user");
    if (error.code === "INSUFFICIENT_FUNDS")
      throw new Error("Insufficient balance for amount + gas");
    if (error.message?.includes("Wait for previous request"))
      throw new Error("You have a pending request. Please wait.");
    if (error.message?.includes("Token Not WhiteListed"))
      throw new Error("This token is not supported");

    throw error;
  }
};


export const refundUserFunds = async (wallets, address, requestId) => {
  if (!wallets?.length) throw new Error("No wallet connected");
  try {
    const contract = await getSignedContract(wallets, address);
    const tx = await contract.claimRefund(requestId);
    console.log(`Refund tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Refund confirmed: ${receipt.hash}`);
    return receipt;
  } catch (error) {
    console.error("refundUserFunds failed:", error);

    if (error.code === 4001 || error.code === "ACTION_REJECTED")
      throw new Error("Transaction rejected by user.");
    if (error.message?.includes("TimeLock Active"))
      throw new Error("Please wait — the 24h timelock is still active.");
    if (error.message?.includes("Invalid Request"))
      throw new Error("This request doesn't exist or was already claimed.");

    throw error;
  }
};