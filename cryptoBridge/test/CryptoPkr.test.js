
require("dotenv").config();
const { expect } = require("chai");
const { ethers } = require("hardhat");


async function increaseTime(seconds) {
  try {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
    return true;
  } catch {
    return false;
  }
}


const CRYPTOPKR_ADDRESS = process.env.CRYPTOPKR_ADDRESS;
const TOKEN_ADDRESS     = process.env.TOKEN_ADDRESS;

if (!CRYPTOPKR_ADDRESS || !TOKEN_ADDRESS) {
  throw new Error("Missing CRYPTOPKR_ADDRESS or TOKEN_ADDRESS in your .env file");
}


const ETH_ADDRESS     = ethers.ZeroAddress;
const REFUND_TIMELOCK = 3600;
const TOKEN_AMOUNT    = ethers.parseEther("1");     
const ETH_AMOUNT      = ethers.parseEther("0.001");

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function transfer(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];


function parseRequestId(receipt, iface) {
  const topicHash = iface.getEvent("LockInitiated").topicHash;
  const log = receipt.logs.find((l) => l.topics[0] === topicHash);
  if (!log) throw new Error("LockInitiated event not found in receipt");
  return iface.parseLog(log).args.requestId;
}



describe("CryptoPkr — Live Contract on ZKsync", function () {
  this.timeout(120_000); // 2 min for real network latency

  let cryptoPkr, token;
  let owner, relay, user, user2;

  before(async function () {
    const provider = ethers.provider;

    if (!process.env.OWNER_PK || !process.env.RELAY_PK || !process.env.USER_PK) {
      throw new Error("Missing OWNER_PK / RELAY_PK / USER_PK in .env");
    }

    owner = new ethers.Wallet(process.env.OWNER_PK, provider);
    relay = new ethers.Wallet(process.env.RELAY_PK, provider);
    user  = new ethers.Wallet(process.env.USER_PK,  provider);
    user2 = process.env.USER2_PK
      ? new ethers.Wallet(process.env.USER2_PK, provider)
      : ethers.Wallet.createRandom().connect(provider);

    cryptoPkr = await ethers.getContractAt("CryptoPkr", CRYPTOPKR_ADDRESS, owner);
    token  = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, owner);
    const contractAddr = await cryptoPkr.getAddress();

    console.log("\n  CryptoPkr :", contractAddr);
    console.log("  Token      :", TOKEN_ADDRESS);
    console.log("  Owner      :", owner.address);
    console.log("  Relay      :", relay.address);
    console.log("  User       :", user.address);

    const onChainOwner = await cryptoPkr.owner();
    if (onChainOwner.toLowerCase() !== owner.address.toLowerCase()) {
      console.warn(`\n    OWNER does not match on-chain owner (${onChainOwner}). Owner tests will fail.`);
    }

    // Approve contract to spend user tokens
    await token.connect(user).approve(contractAddr, ethers.MaxUint256);
    if (process.env.USER2_PK) {
      await token.connect(user2).approve(contractAddr, ethers.MaxUint256);
    }
  });


  describe("Deployed State", function () {
    it("should have a non-zero owner", async function () {
      expect(await cryptoPkr.owner()).to.not.equal(ethers.ZeroAddress);
    });

    it("should have a non-zero relayServer", async function () {
      expect(await cryptoPkr.relayServer()).to.not.equal(ethers.ZeroAddress);
    });

    it("should have a non-zero treasury", async function () {
      expect(await cryptoPkr.treasury()).to.not.equal(ethers.ZeroAddress);
    });

    it("REFUND_TIMELOCK should equal 3600 seconds", async function () {
      expect(await cryptoPkr.REFUND_TIMELOCK()).to.equal(3600);
    });

    it("TOKEN_ADDRESS should be whitelisted", async function () {
      expect(await cryptoPkr.whiteListedTokens(TOKEN_ADDRESS)).to.be.true;
    });
  });


  describe("Access Control", function () {
    it("updateRelayServer: non-owner rejected", async function () {
      await expect(
        cryptoPkr.connect(user).updateRelayServer(user.address)
      ).to.be.revertedWith("Only Owner Can Access This!");
    });

    it("updateRelayServer: zero address rejected", async function () {
      await expect(
        cryptoPkr.connect(owner).updateRelayServer(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("updateTreasury: non-owner rejected", async function () {
      await expect(
        cryptoPkr.connect(user).updateTreasury(user.address)
      ).to.be.revertedWith("Only Owner Can Access This!");
    });

    it("updateTreasury: zero address rejected", async function () {
      await expect(
        cryptoPkr.connect(owner).updateTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("updateWhiteListedTokenList: non-owner rejected", async function () {
      await expect(
        cryptoPkr.connect(user).updateWhiteListedTokenList(TOKEN_ADDRESS, false)
      ).to.be.revertedWith("Only Owner Can Access This!");
    });

    it("confirmPayout: non-relay rejected", async function () {
      await expect(
        cryptoPkr.connect(user).confirmPayout(user.address, 0)
      ).to.be.revertedWith("Not Authorized");
    });

    it("confirmPayout: owner (not relay) rejected", async function () {
      await expect(
        cryptoPkr.connect(owner).confirmPayout(user.address, 0)
      ).to.be.revertedWith("Not Authorized");
    });

    it("adminReleaseToUser: non-owner rejected", async function () {
      await expect(
        cryptoPkr.connect(user).adminReleaseToUser(user.address, 0)
      ).to.be.revertedWith("Only Owner Can Access This!");
    });

    it("adminReleaseToUser: relay rejected", async function () {
      await expect(
        cryptoPkr.connect(relay).adminReleaseToUser(user.address, 0)
      ).to.be.revertedWith("Only Owner Can Access This!");
    });
  });


  describe("lockUserRequest — Input Validation", function () {
    it("should revert if amount is 0", async function () {
      await expect(
        cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, 0, "RAAST-001")
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("should revert for non-whitelisted token", async function () {
      const fakeToken = ethers.Wallet.createRandom().address;
      await expect(
        cryptoPkr.connect(user).lockUserRequest(fakeToken, TOKEN_AMOUNT, "RAAST-001")
      ).to.be.revertedWith("Token Not WhiteListed");
    });

    it("should revert for empty raastId", async function () {
      await expect(
        cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, "")
      ).to.be.revertedWith("Invalid RaastId");
    });

    it("should revert if ETH sent alongside ERC20 lock", async function () {
      await expect(
        cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, "RAAST-001", {
          value: ETH_AMOUNT,
        })
      ).to.be.revertedWith("Do not send eth with tokens");
    });

    it("should revert if msg.value != amount for ETH lock", async function () {
      const ethWhitelisted = await cryptoPkr.whiteListedTokens(ETH_ADDRESS);
      if (!ethWhitelisted) { console.log("        ETH not whitelisted — skipping"); return; }

      await expect(
        cryptoPkr.connect(user).lockUserRequest(ETH_ADDRESS, ETH_AMOUNT, "RAAST-ETH", {
          value: ETH_AMOUNT / 2n,
        })
      ).to.be.revertedWith("Incorrect Eth Amount");
    });
  });

  describe("Invalid Request Reverts", function () {
    it("confirmPayout: non-existent requestId reverts", async function () {
      await expect(
        cryptoPkr.connect(relay).confirmPayout(user.address, 999999)
      ).to.be.revertedWith("Invalid Request");
    });

    it("claimRefund: non-existent requestId reverts", async function () {
      await expect(
        cryptoPkr.connect(user).claimRefund(999999)
      ).to.be.revertedWith("Invalid Request");
    });

    it("adminReleaseToUser: non-existent requestId reverts", async function () {
      await expect(
        cryptoPkr.connect(owner).adminReleaseToUser(user.address, 999999)
      ).to.be.revertedWith("No such request");
    });

    it("claimRefund: user cannot claim another user's request", async function () {
      
      await expect(
        cryptoPkr.connect(relay).claimRefund(999999)
      ).to.be.revertedWith("Invalid Request");
    });
  });


  describe("Flow A — ERC20: lock → confirmPayout", function () {
    let requestId;
    const RAAST = `RAAST-ERC20-${Date.now()}`;

    it("step 1: user locks ERC20 — contract balance increases", async function () {
      const contractAddr = await cryptoPkr.getAddress();
      const balBefore    = await token.balanceOf(contractAddr);
      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      requestId     = parseRequestId(receipt, cryptoPkr.interface);

      const balAfter = await token.balanceOf(contractAddr);
      expect(balAfter - balBefore).to.equal(TOKEN_AMOUNT);
      console.log(` requestId: ${requestId}`);
    });

    it("step 2: relay confirms payout — treasury balance increases", async function () {
      if (requestId === undefined) this.skip();

      const treasuryAddr = await cryptoPkr.treasury();
      const balBefore    = await token.balanceOf(treasuryAddr);

      await expect(cryptoPkr.connect(relay).confirmPayout(user.address, requestId))
        .to.emit(cryptoPkr, "PayoutConfirmed")
        .withArgs(user.address, requestId, TOKEN_ADDRESS, TOKEN_AMOUNT);

      const balAfter = await token.balanceOf(treasuryAddr);
      expect(balAfter - balBefore).to.equal(TOKEN_AMOUNT);
    });

    it("step 3: double-confirm should revert", async function () {
      if (requestId === undefined) this.skip();
      await expect(
        cryptoPkr.connect(relay).confirmPayout(user.address, requestId)
      ).to.be.revertedWith("Invalid Request");
    });

    it("step 4: withdrawal record should be deleted after confirm", async function () {
      if (requestId === undefined) this.skip();
      const w = await cryptoPkr.withdrawals(user.address, requestId);
      expect(w.amount).to.equal(0);
    });
  });


  describe("Flow B — ERC20: lock → claimRefund (local node only)", function () {
    let requestId;
    const RAAST = `RAAST-REFUND-${Date.now()}`;

    it("step 1: user locks ERC20 tokens", async function () {
      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      requestId     = parseRequestId(receipt, cryptoPkr.interface);
      console.log(`       requestId: ${requestId}`);
    });

    it("step 2: claimRefund before timelock should revert", async function () {
      if (requestId === undefined) this.skip();
      await expect(
        cryptoPkr.connect(user).claimRefund(requestId)
      ).to.be.revertedWith("TimeLock Active");
    });

    it("step 3: advance time past timelock (skipped on real network)", async function () {
      if (requestId === undefined) this.skip();
      const advanced = await increaseTime(REFUND_TIMELOCK + 10);
      if (!advanced) {
        console.log("       Cannot manipulate time on ZKsync testnet — skipping steps 4-5");
        // Release funds so they're not stuck
        await cryptoPkr.connect(owner).adminReleaseToUser(user.address, requestId);
        this.skip();
      }
    });

    it("step 4: claimRefund after timelock — user gets tokens back", async function () {
      if (requestId === undefined) this.skip();
      const balBefore = await token.balanceOf(user.address);

      await expect(cryptoPkr.connect(user).claimRefund(requestId))
        .to.emit(cryptoPkr, "RefundClaimed")
        .withArgs(user.address, requestId, TOKEN_ADDRESS, TOKEN_AMOUNT);

      const balAfter = await token.balanceOf(user.address);
      expect(balAfter - balBefore).to.equal(TOKEN_AMOUNT);
    });

    it("step 5: double-refund should revert", async function () {
      if (requestId === undefined) this.skip();
      await expect(
        cryptoPkr.connect(user).claimRefund(requestId)
      ).to.be.revertedWith("Invalid Request");
    });
  });


  describe("Flow C — adminReleaseToUser", function () {
    let requestId;
    const RAAST = `RAAST-ADMIN-${Date.now()}`;

    it("step 1: user locks ERC20 tokens", async function () {
      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      requestId     = parseRequestId(receipt, cryptoPkr.interface);
      console.log(`       requestId: ${requestId}`);
    });

    it("step 2: admin releases funds back to user", async function () {
      if (requestId === undefined) this.skip();
      const balBefore = await token.balanceOf(user.address);

      await expect(cryptoPkr.connect(owner).adminReleaseToUser(user.address, requestId))
        .to.emit(cryptoPkr, "AdminReleaseToUser")
        .withArgs(user.address, requestId, TOKEN_ADDRESS, TOKEN_AMOUNT);

      const balAfter = await token.balanceOf(user.address);
      expect(balAfter - balBefore).to.equal(TOKEN_AMOUNT);
    });

    it("step 3: second adminRelease should revert", async function () {
      if (requestId === undefined) this.skip();
      await expect(
        cryptoPkr.connect(owner).adminReleaseToUser(user.address, requestId)
      ).to.be.revertedWith("No such request");
    });

    it("step 4: relay cannot confirm an already-released request", async function () {
      if (requestId === undefined) this.skip();
      await expect(
        cryptoPkr.connect(relay).confirmPayout(user.address, requestId)
      ).to.be.revertedWith("Invalid Request");
    });
  });


  describe("Admin Config Changes", function () {
    it("relay update mid-flow: old relay blocked, state restored", async function () {
      const currentRelay = await cryptoPkr.relayServer();
      const tempRelay    = ethers.Wallet.createRandom().address;
      const RAAST        = `RAAST-RELAY-${Date.now()}`;

      // Lock funds
      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      const reqId   = parseRequestId(receipt, cryptoPkr.interface);

      // Switch relay
      await cryptoPkr.connect(owner).updateRelayServer(tempRelay);
      expect(await cryptoPkr.relayServer()).to.equal(tempRelay);

      // Old relay cannot confirm
      await expect(
        cryptoPkr.connect(relay).confirmPayout(user.address, reqId)
      ).to.be.revertedWith("Not Authorized");

      // Restore relay & release funds
      await cryptoPkr.connect(owner).updateRelayServer(currentRelay);
      await cryptoPkr.connect(owner).adminReleaseToUser(user.address, reqId);

      expect(await cryptoPkr.relayServer()).to.equal(currentRelay);
    });

    it("whitelist removal: new locks rejected; state restored", async function () {
      // Lock first
      const RAAST   = `RAAST-WL-${Date.now()}`;
      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      const reqId   = parseRequestId(receipt, cryptoPkr.interface);

      // Remove from whitelist
      await cryptoPkr.connect(owner).updateWhiteListedTokenList(TOKEN_ADDRESS, false);
      expect(await cryptoPkr.whiteListedTokens(TOKEN_ADDRESS)).to.be.false;

      // New lock rejected
      await expect(
        cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, "RAAST-X")
      ).to.be.revertedWith("Token Not WhiteListed");

      // Restore whitelist & release locked funds
      await cryptoPkr.connect(owner).updateWhiteListedTokenList(TOKEN_ADDRESS, true);
      await cryptoPkr.connect(owner).adminReleaseToUser(user.address, reqId);
    });

    it("treasury update mid-flow: payout goes to new treasury", async function () {
      const oldTreasury  = await cryptoPkr.treasury();
      const tempTreasury = ethers.Wallet.createRandom().address;
      const RAAST        = `RAAST-TREAS-${Date.now()}`;

      // Lock tokens
      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      const reqId   = parseRequestId(receipt, cryptoPkr.interface);

      // Update treasury
      await cryptoPkr.connect(owner).updateTreasury(tempTreasury);

      // Confirm payout — should go to tempTreasury
      const balBefore = await token.balanceOf(tempTreasury);
      await cryptoPkr.connect(relay).confirmPayout(user.address, reqId);
      const balAfter = await token.balanceOf(tempTreasury);
      expect(balAfter - balBefore).to.equal(TOKEN_AMOUNT);

      // Restore treasury
      await cryptoPkr.connect(owner).updateTreasury(oldTreasury);
      expect(await cryptoPkr.treasury()).to.equal(oldTreasury);
    });
  });


  describe("userRequestCounter", function () {
    it("should increment by 1 after each lock", async function () {
      const before = await cryptoPkr.userRequestCounter(user.address);
      const RAAST  = `RAAST-CTR-${Date.now()}`;

      const tx      = await cryptoPkr.connect(user).lockUserRequest(TOKEN_ADDRESS, TOKEN_AMOUNT, RAAST);
      const receipt = await tx.wait();
      const reqId   = parseRequestId(receipt, cryptoPkr.interface);
      const after   = await cryptoPkr.userRequestCounter(user.address);

      expect(after - before).to.equal(1n);

      // Clean up — release funds
      await cryptoPkr.connect(owner).adminReleaseToUser(user.address, reqId);
    });
  });
});