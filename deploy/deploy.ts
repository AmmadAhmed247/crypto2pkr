import { Wallet } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as dotenv from "dotenv";
import {ethers} from "ethers"
dotenv.config();
export default async function (hre:HardhatRuntimeEnvironment) {
    console.log("--- Deployment Process is Started ---");
    const wallet=new Wallet(process.env.WALLET_PRIVATE_KEY!);
    const deployer=new Deployer(hre , wallet);
    const artifact=await deployer.loadArtifact("PakFlowVault");
    const relayServer="0x0fFDd42368714d1D7590778a27b714B594b9d9C3";
const initializedTokensList = ["0x0000000000000000000000000000000000000000","0x3e7676937a7e96cfb7616f215b932465985bc4e0"];
    const vaultContract=await deployer.deploy(artifact , [relayServer , initializedTokensList])
    const contractAddress=await vaultContract.getAddress();
    console.log(`Deployed at:${contractAddress}`);
    
    
}
