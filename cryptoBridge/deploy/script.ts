import { Wallet } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as dotenv from "dotenv";

dotenv.config();

export default async function (hre: HardhatRuntimeEnvironment) {
    console.log("--- Deployment Process Started ---");

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("WALLET_PRIVATE_KEY is missing in .env");
    }
    const wallet = new Wallet(privateKey);
    const deployer = new Deployer(hre, wallet);
    console.log("Loading Artifact: CryptoPkr...");
    const artifact = await deployer.loadArtifact("CryptoPkr");
    const relayServer = "0x0A8010403eAC9BB9691F5809Ac5C9D913C905582"; 
    const treasury = "0x645145f71c22e2EBcD4fcf2c6D300b321cA37D3b";
    
    const whitelistedTokens = [
        "0x0000000000000000000000000000000000000000",
        "0xAe045DE5638162fa134807Cb558E15A3F5A7F853" 
    ];

    console.log("Deploying CryptoPkr to zkSync...");
    const contract = await deployer.deploy(artifact, [
        relayServer, 
        treasury, 
        whitelistedTokens
    ]);

    const contractAddress = await contract.getAddress();

    console.log("-----------------------------------------");
    console.log(`Success! CryptoPkr deployed at: ${contractAddress}`);
    console.log("-----------------------------------------");
}