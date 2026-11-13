import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  const sc = await ethers.deployContract("SupplyChain", [deployer.address]);
  await sc.waitForDeployment();
  const address = await sc.getAddress();
  console.log("SupplyChain deployed to:", address);
  mkdirSync("deployments", { recursive: true });
  writeFileSync("deployments/localhost.json", JSON.stringify({ address }, null, 2));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
