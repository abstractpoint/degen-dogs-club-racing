const hre = require("hardhat");
const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("hardhat");
require("dotenv").config();
const ArenaABI = require("../artifacts/contracts/Arena.sol/Arena.json").abi;

//to run this script:
//1) Make sure you've created your own .env file
//2) Make sure that you have your network and accounts specified in hardhat.config.js
//3) Make sure that you add the address of your own arena contract
//4) Make sure that you change the 'amount' field in the arenaApproval operation to reflect the proper amount
//3) run: npx hardhat run scripts/tokenApproval.js --network goerli
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  //NOTE - make sure you add the address of the previously deployed arena contract on your network
  const arenaAddress = "0xCc47B7CAeC1C6e1eeBcB943C6a381fD29e1d7e04";

  const provider = new hre.ethers.providers.JsonRpcProvider(
    process.env.GOERLI_URL
  );

  const sf = await Framework.create({
    chainId: (await provider.getNetwork()).chainId,
    provider,
  });

  const signers = await hre.ethers.getSigners();

  const arena = new ethers.Contract(arenaAddress, ArenaABI, provider);

  const daix = await sf.loadSuperToken("fDAIx");

  //approve contract to spend 1000 daix
  const arenaApproval = daix.approve({
    receiver: arena.address,
    amount: ethers.utils.parseEther("1000"),
  });

  await arenaApproval.exec(signers[0]).then(function (tx) {
    console.log(`
        Congrats! You've just successfully approved the arena contract. 
        Tx Hash: ${tx.hash}
    `);
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
