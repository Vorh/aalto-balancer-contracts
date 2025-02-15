import { ethers } from "hardhat";
import { deployWeightedFactory } from "./utils/factories/weighted-factory";
import { predictAddresses } from "./utils/predictAddresses";
import { DAY, MONTH, ONE_MONTH_SECONDS } from "./utils/time";

export async function deployVault(WETH: string) {
  try {
    // - ProtocolFeesCollector
    // - BalancerHelpers

    const admin = (await ethers.getSigners())[0];
    const { vaultAddress, authorizerAddress } = await predictAddresses(admin.address);
    console.log("Predicted Vault address: " + vaultAddress);
    console.log("Predicted TimelockAuthorizer address: " + authorizerAddress);

    const pauseWindowDuration = ONE_MONTH_SECONDS * 3;
    const bufferPeriodDuration = DAY;

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(
      authorizerAddress,
      WETH,
      pauseWindowDuration,
      bufferPeriodDuration
    );
    await vault.deployed();
    console.log("Vault deployed to: ", vault.address);

    // AUTH
    const rootTransferDelay = 0; // Timelock until root(admin/boss) status can be transferred
    const TimelockAuthorizer = await ethers.getContractFactory("TimelockAuthorizer");
    const authorizer = await TimelockAuthorizer.deploy(
      admin.address,
      vault.address,
      rootTransferDelay
    );
    await authorizer.deployed();
    console.log("TimelockAuthorizer deployed to: ", authorizer.address);

    return vault;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
