import { ethers } from "hardhat";
import { readFileSync } from "fs";

async function main() {
  const { address } = JSON.parse(readFileSync("deployments/localhost.json", "utf8"));
  const [admin, manu, dist, ret, cust] = await ethers.getSigners();
  const sc = await ethers.getContractAt("SupplyChain", address, admin);

  await (await sc.grantRole(await sc.MANUFACTURER_ROLE(), manu.address)).wait();
  await (await sc.grantRole(await sc.DISTRIBUTOR_ROLE(), dist.address)).wait();
  await (await sc.grantRole(await sc.RETAILER_ROLE(), ret.address)).wait();

  await (await sc.connect(manu).registerProduct("Organic Coffee", "Kenya", "QmDemoHash")).wait();
  await (await sc.connect(manu).transferCustody(1, dist.address)).wait();
  await (await sc.connect(dist).updateStatus(1, 2, "In transit to retailer")).wait();
  await (await sc.connect(dist).transferCustody(1, ret.address)).wait();
  await (await sc.connect(ret).transferCustody(1, cust.address)).wait();
  console.log("Seeded product #1 through full lifecycle");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
