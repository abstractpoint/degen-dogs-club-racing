const hre = require("hardhat");

async function main() {

    const Arena = await hre.ethers.getContractFactory("Arena");
    console.log(Arena);
    const eventName = 'InterimAccountUpdate';
    const event = Arena.interface.getEvent(eventName);
    const topicHash = Arena.interface.getEventTopic(event);

    console.log(topicHash);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
