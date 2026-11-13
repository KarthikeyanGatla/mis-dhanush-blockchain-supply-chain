import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SupplyChain", () => {
  async function deploy() {
    const [admin, manu, dist, ret, cust, rando] = await ethers.getSigners();
    const sc = await ethers.deployContract("SupplyChain", [admin.address]);
    await sc.grantRole(await sc.MANUFACTURER_ROLE(), manu.address);
    await sc.grantRole(await sc.DISTRIBUTOR_ROLE(), dist.address);
    await sc.grantRole(await sc.RETAILER_ROLE(), ret.address);
    await sc.connect(manu).registerProduct("Coffee", "Kenya", "{}", "Qm123");
    return { sc, admin, manu, dist, ret, cust, rando };
  }

  describe("registerProduct", () => {
    it("registers and emits event", async () => {
      const { sc, manu } = await loadFixture(deploy);
      await expect(sc.connect(manu).registerProduct("Tea", "India", "{}", "Qm9"))
        .to.emit(sc, "ProductRegistered");
      expect(await sc.productCount()).to.equal(2);
      const p = await sc.getProduct(2);
      expect(p.currentOwner).to.equal(manu.address);
    });
    it("reverts for non-manufacturer", async () => {
      const { sc, rando } = await loadFixture(deploy);
      await expect(sc.connect(rando).registerProduct("X", "Y", "{}", "Z")).to.be.reverted;
    });
    it("reverts on empty name", async () => {
      const { sc, manu } = await loadFixture(deploy);
      await expect(sc.connect(manu).registerProduct("", "Y", "{}", "Z")).to.be.revertedWithCustomError(sc, "EmptyName");
    });
  });

  describe("transferCustody", () => {
    it("walks manufacturer -> distributor -> retailer -> customer", async () => {
      const { sc, manu, dist, ret, cust } = await loadFixture(deploy);
      await expect(sc.connect(manu).transferCustody(1, dist.address)).to.emit(sc, "CustodyTransferred");
      await sc.connect(dist).transferCustody(1, ret.address);
      await sc.connect(ret).transferCustody(1, cust.address);
      expect((await sc.getProduct(1)).currentOwner).to.equal(cust.address);
      expect(await sc.getHistory(1)).to.have.length(4);
    });
    it("reverts for unknown product", async () => {
      const { sc, manu, dist } = await loadFixture(deploy);
      await expect(sc.connect(manu).transferCustody(99, dist.address)).to.be.revertedWithCustomError(sc, "ProductNotFound");
    });
    it("reverts if caller is not owner", async () => {
      const { sc, dist, ret } = await loadFixture(deploy);
      await expect(sc.connect(dist).transferCustody(1, ret.address)).to.be.revertedWithCustomError(sc, "NotCurrentOwner");
    });
    it("rejects skipping a step (manufacturer -> retailer)", async () => {
      const { sc, manu, ret } = await loadFixture(deploy);
      await expect(sc.connect(manu).transferCustody(1, ret.address)).to.be.revertedWithCustomError(sc, "InvalidHandoff");
    });
    it("rejects zero address and self transfer", async () => {
      const { sc, manu } = await loadFixture(deploy);
      await expect(sc.connect(manu).transferCustody(1, ethers.ZeroAddress)).to.be.revertedWithCustomError(sc, "InvalidRecipient");
      await expect(sc.connect(manu).transferCustody(1, manu.address)).to.be.revertedWithCustomError(sc, "InvalidRecipient");
    });
    it("rejects handoff to an unauthorised address", async () => {
      const { sc, manu, rando } = await loadFixture(deploy);
      await expect(sc.connect(manu).transferCustody(1, rando.address)).to.be.revertedWithCustomError(sc, "InvalidHandoff");
    });
    it("rejects retailer handing to another supply participant", async () => {
      const { sc, manu, dist, ret } = await loadFixture(deploy);
      await sc.connect(manu).transferCustody(1, dist.address);
      await sc.connect(dist).transferCustody(1, ret.address);
      await expect(sc.connect(ret).transferCustody(1, dist.address)).to.be.revertedWithCustomError(sc, "InvalidHandoff");
    });
  });

  describe("updateStatus", () => {
    it("owner updates status and emits event", async () => {
      const { sc, manu } = await loadFixture(deploy);
      await expect(sc.connect(manu).updateStatus(1, 2, "On truck")).to.emit(sc, "StatusUpdated");
      expect((await sc.getProduct(1)).status).to.equal(2);
    });
    it("reverts for non-owner", async () => {
      const { sc, rando } = await loadFixture(deploy);
      await expect(sc.connect(rando).updateStatus(1, 1, "")).to.be.revertedWithCustomError(sc, "NotCurrentOwner");
    });
    it("reverts for unknown product", async () => {
      const { sc, manu } = await loadFixture(deploy);
      await expect(sc.connect(manu).updateStatus(5, 1, "")).to.be.revertedWithCustomError(sc, "ProductNotFound");
    });
    it("cannot set Recalled via updateStatus", async () => {
      const { sc, manu } = await loadFixture(deploy);
      await expect(sc.connect(manu).updateStatus(1, 4, "")).to.be.revertedWithCustomError(sc, "InvalidStatus");
    });
  });

  describe("recallProduct", () => {
    it("manufacturer can recall; blocks further handoffs", async () => {
      const { sc, manu, dist } = await loadFixture(deploy);
      await expect(sc.connect(manu).recallProduct(1, "Contaminated")).to.emit(sc, "ProductRecalled");
      expect(await sc.isAuthentic(1)).to.equal(false);
      await expect(sc.connect(manu).transferCustody(1, dist.address)).to.be.revertedWithCustomError(sc, "ProductIsRecalled");
      await expect(sc.connect(manu).updateStatus(1, 1, "")).to.be.revertedWithCustomError(sc, "ProductIsRecalled");
      await expect(sc.connect(manu).recallProduct(1, "again")).to.be.revertedWithCustomError(sc, "ProductIsRecalled");
    });
    it("admin can recall", async () => {
      const { sc, admin } = await loadFixture(deploy);
      await sc.connect(admin).recallProduct(1, "Regulator order");
      expect((await sc.getProduct(1)).status).to.equal(4);
    });
    it("reverts for unauthorised caller", async () => {
      const { sc, rando } = await loadFixture(deploy);
      await expect(sc.connect(rando).recallProduct(1, "x")).to.be.revertedWithCustomError(sc, "NotCurrentOwner");
    });
    it("reverts for unknown product", async () => {
      const { sc, admin } = await loadFixture(deploy);
      await expect(sc.connect(admin).recallProduct(42, "x")).to.be.revertedWithCustomError(sc, "ProductNotFound");
    });
  });

  describe("views", () => {
    it("isAuthentic is false for unknown ids and true for registered", async () => {
      const { sc } = await loadFixture(deploy);
      expect(await sc.isAuthentic(1)).to.equal(true);
      expect(await sc.isAuthentic(999)).to.equal(false);
    });
    it("getProduct / getHistory revert for unknown ids", async () => {
      const { sc } = await loadFixture(deploy);
      await expect(sc.getProduct(999)).to.be.revertedWithCustomError(sc, "ProductNotFound");
      await expect(sc.getHistory(999)).to.be.revertedWithCustomError(sc, "ProductNotFound");
    });
  });
});
