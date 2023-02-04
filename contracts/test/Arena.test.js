const { expect } = require("chai");
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
  it("Access Control #1 - Should deploy properly with the correct owner", async function () {
    expect(await arena.owner()).to.equal(owner.address);
  });
  it("Access Control #2 - Should allow you to add account to account list", async function () {
    await arena.allowAccount(account1.address);

    expect(await arena.accountList(account1.address)).to.equal(true);
  });
  it("Access Control #3 - Should allow for removing accounts from whitelist", async function () {
    await arena.removeAccount(account1.address);

    expect(await arena.accountList(account1.address)).to.equal(false);
  });
  it("Access Control #4 - Should allow for change in ownership", async function () {
    await arena.changeOwner(account1.address);

    expect(await arena.owner(), account1.address);
  });
  it("Contract Receives Funds #1 - lump sum is transferred to contract", async function () {
    //transfer ownership back to real owner...
    await arena.connect(account1).changeOwner(owner.address);
    await daix
      .transfer({
        receiver: arena.address,
        amount: ethers.utils.parseEther("100"),
      })
      .exec(owner);

    let contractDAIxBalance = await daix.balanceOf({
      account: arena.address,
      providerOrSigner: owner,
    });
    expect(contractDAIxBalance, ethers.utils.parseEther("100"));
  });
  it("Contract Receives Funds #2 - a flow is created into the contract", async function () {
    await daix
      .createFlow({
        receiver: arena.address,
        flowRate: "100000000000000",
      })
      .exec(owner);

    let ownerContractFlowRate = await daix.getFlow({
      sender: owner.address,
      receiver: arena.address,
      providerOrSigner: owner,
    });

    expect(ownerContractFlowRate.flowRate).to.equal("100000000000000");
  });
  it("Contract Recieves Funds #3 - a flow into the contract is updated", async function () {
    await daix
      .updateFlow({
        receiver: arena.address,
        flowRate: "200000000000000",
      })
      .exec(owner);

    let ownerContractFlowRate = await daix.getFlow({
      sender: owner.address,
      receiver: arena.address,
      providerOrSigner: owner,
    });

    expect(ownerContractFlowRate.flowRate).to.equal("200000000000000");
  });
  it("Contract Receives Funds #4 - a flow into the contract is deleted", async function () {
    await arena.deleteFlowIntoContract(daix.address);

    let ownerContractFlowRate = await daix.getFlow({
      sender: owner.address,
      receiver: arena.address,
      providerOrSigner: owner,
    });

    expect(ownerContractFlowRate.flowRate).to.equal("0");
  });
  it("Contract sends funds #1 - withdrawing a lump sum from the contract", async function () {
    await daix
      .transfer({
        receiver: arena.address,
        amount: ethers.utils.parseEther("100"),
      })
      .exec(owner);

    let contractStartingBalance = await daix.balanceOf({
      account: arena.address,
      providerOrSigner: owner,
    });

    await arena.withdrawFunds(daix.address, ethers.utils.parseEther("10"));

    let contractFinishingBalance = await daix.balanceOf({
      account: arena.address,
      providerOrSigner: owner,
    });

    expect(contractStartingBalance - ethers.utils.parseEther("10")).to.equal(
      Number(contractFinishingBalance)
    );
  });
});
