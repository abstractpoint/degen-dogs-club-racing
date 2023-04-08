const hre = require("hardhat");
const { Framework } = require("@superfluid-finance/sdk-core");
require("dotenv").config();

//to run this script:
//1) Make sure you've created your own .env file
//2) Make sure that you have your network specified in hardhat.config.js
//3) run: npx hardhat run scripts/deploy.js --network goerli
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const provider = new hre.ethers.providers.JsonRpcProvider(
    process.env.POLYGON_URL
  );

  const sf = await Framework.create({
    chainId: (await provider.getNetwork()).chainId,
    provider,
  });

  // Getting the Goerli fDAIx Super Token object from the Framework object
  // This is fDAIx on goerli - you can change this token to suit your network and desired token address
  const bsctAddress = "0x600e5F4920f90132725b43412D47A76bC2219F92";

  const signers = await hre.ethers.getSigners();
  console.log("Account balance:", (await signers[0].getBalance()).toString());
  // We get the contract to deploy
  const Arena = await hre.ethers.getContractFactory("Arena");
  //deploy the arena account using the proper host address and the address of the first signer

  console.log(
    sf.settings.config.hostAddress,
    sf.settings.config.cfaV1Address,
    sf.settings.config.idaV1Address,
    bsctAddress,
    signers[0].address
  );

  const arena = await Arena.deploy(
    sf.settings.config.hostAddress,
    sf.settings.config.cfaV1Address,
    sf.settings.config.idaV1Address,
    bsctAddress,
    signers[0].address
  );

  await arena.deployed();

  console.log("Arena deployed to:", arena.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});