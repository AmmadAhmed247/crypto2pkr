import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify"; // Optional: verification ke liye

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.5.15", 
    settings: {},
  },
  defaultNetwork: "zkSyncSepolia",
  networks: {
    zkSyncSepolia: {
      url: "https://sepolia.era.zksync.dev", 
      ethNetwork: "sepolia",
      zksync: true,
      timeout: 600000,      
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
  },
  solidity: {
    version: "0.8.24",
  },
};

export default config;