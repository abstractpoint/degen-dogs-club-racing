import { ethers, BigNumber } from 'ethers';
import { dogABI } from './abis/dog';
import { arenaABI } from './abis/arena';
import { directory } from '../constants';

const providerPrimary = new ethers.providers.JsonRpcProvider(
    process.env.PRIMARY_RPC_URL,
    Number(process.env.PRIMARY_CHAIN_ID),
);
const providerSecondary = new ethers.providers.JsonRpcProvider(
    process.env.SECONDARY_RPC_URL,
    Number(process.env.SECONDARY_CHAIN_ID),
);

export async function getNFTId(userAddress: string, nftAddress: string, tokenId: string) {
    const nftContract = new ethers.Contract(nftAddress, dogABI, providerPrimary);

    const nft = await nftContract.tokenOfOwnerByIndex(userAddress, tokenId);

    return nft.toString();
}

export async function getSubscriberBalance(subscriberAddress: string) {
    const arenaContract = new ethers.Contract(directory.arena, arenaABI, providerSecondary);

    const balance = await arenaContract.subscriberBalance(subscriberAddress);

    return balance.toString();
}
