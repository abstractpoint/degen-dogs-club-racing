const { expect } = require("chai");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");
const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("hardhat");
const {
  deployTestFramework,
} = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json");

let sfDeployer;
let contractsFramework;
let sf;
let arena;
let dai;
let daix;

// Test Accounts
let owner;
let account1;
let account2;

const thousandEther = ethers.utils.parseEther("10000");
const oneEther = ethers.utils.parseEther("1");

before(async function () {
  // get hardhat accounts
  [owner, account1, account2] = await ethers.getSigners();
  sfDeployer = await deployTestFramework();

  // GETTING SUPERFLUID FRAMEWORK SET UP

  // deploy the framework locally
  contractsFramework = await sfDeployer.getFramework();

  // initialize framework
  sf = await Framework.create({
    chainId: 31337,
    provider: owner.provider,
    resolverAddress: contractsFramework.resolver, // (empty)
    protocolReleaseVersion: "test",
  });

  // DEPLOYING DAI and DAI wrapper super token (which will be our `spreaderToken`)
  tokenDeployment = await sfDeployer.deployWrapperSuperToken(
    "Fake DAI Token",
    "fDAI",
    18,
    ethers.utils.parseEther("100000000").toString()
  );

  daix = await sf.loadSuperToken("fDAIx");
  dai = new ethers.Contract(daix.underlyingToken.address, TestToken.abi, owner);
  // minting test DAI
  await dai.mint(owner.address, thousandEther);
  await dai.mint(account1.address, thousandEther);
  await dai.mint(account2.address, thousandEther);

  // approving DAIx to spend DAI (Super Token object is not an ethers contract object and has different operation syntax)
  await dai.approve(daix.address, ethers.constants.MaxInt256);
  await dai.connect(account1).approve(daix.address, ethers.constants.MaxInt256);
  await dai.connect(account2).approve(daix.address, ethers.constants.MaxInt256);
  // Upgrading all DAI to DAIx
  const ownerUpgrade = daix.upgrade({ amount: thousandEther });
  const account1Upgrade = daix.upgrade({ amount: thousandEther });
  const account2Upgrade = daix.upgrade({ amount: thousandEther });

  await ownerUpgrade.exec(owner);
  await account1Upgrade.exec(account1);
  await account2Upgrade.exec(account2);

  let Arena = await ethers.getContractFactory("Arena", owner);

  arena = await Arena.deploy(
    sf.settings.config.hostAddress,
    sf.settings.config.cfaV1Address,
    sf.settings.config.idaV1Address,
    daix.address,
    owner.address
  );
  await arena.deployed();
});

describe("Arena", function () {
  it("Owner is able to distribute", async function () {
    await daix
      .createFlow({
        receiver: arena.address,
        flowRate: "100000000000000",
      })
      .exec(account1);

    await time.increase(60000);

    await daix
      .createFlow({
        receiver: arena.address,
        flowRate: "100000000000000",
      })
      .exec(account2);

    await daix
      .updateFlow({
        receiver: arena.address,
        flowRate: "50000000000000",
      })
      .exec(account1);

    await time.increase(60000);

    const contractBalance1 = await daix.balanceOf({
      account: arena.address,
      providerOrSigner: account2,
    });

    console.log(
      await daix.balanceOf({
        account: account1.address,
        providerOrSigner: account1,
      }),
      await daix.balanceOf({
        account: account2.address,
        providerOrSigner: account2,
      })
    );

    let stats1 = await arena.stats1ForSubscriber(account2.address);
    let stats1acc1 = await arena.stats1ForSubscriber(account1.address);
    let stats2 = await arena.stats2ForSubscriber(account2.address);
    let stats2acc1 = await arena.stats2ForSubscriber(account1.address);
    console.log("stats", stats1, stats2, stats1acc1, stats2acc1);

    await arena["preDistribute()"]();

    stats1 = await arena.stats1ForSubscriber(account2.address);
    stats1acc1 = await arena.stats1ForSubscriber(account1.address);
    stats2 = await arena.stats2ForSubscriber(account2.address);
    stats2acc1 = await arena.stats2ForSubscriber(account1.address);
    console.log("stats", stats1, stats2, stats1acc1, stats2acc1);

    await arena.distributeAll();
    await arena.postDistribute();

    await time.increase(60000);

    await daix
      .deleteFlow({
        sender: account2.address,
        receiver: arena.address,
      })
      .exec(account2);

    await time.increase(60000);

    await daix
      .deleteFlow({
        sender: account1.address,
        receiver: arena.address,
      })
      .exec(account1);

    stats1 = await arena.stats1ForSubscriber(account2.address);
    stats1acc1 = await arena.stats1ForSubscriber(account1.address);
    stats2 = await arena.stats2ForSubscriber(account2.address);
    stats2acc1 = await arena.stats2ForSubscriber(account1.address);
    console.log("stats", stats1, stats2, stats1acc1, stats2acc1);

    await arena["distributeCombined()"]();

    const contractBalance2 = await daix.balanceOf({
      account: arena.address,
      providerOrSigner: account2,
    });

    let account1Balance = await daix.balanceOf({
      account: account1.address,
      providerOrSigner: account1,
    });

    let account2Balance = await daix.balanceOf({
      account: account2.address,
      providerOrSigner: account2,
    });

    console.log(contractBalance1);
    console.log(contractBalance2);
    console.log(account1Balance);
    console.log(account2Balance);
  });
});
