import { createHmac, randomUUID, randomBytes, randomInt } from 'crypto';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { BigNumber } from 'ethers';
import { verifyMessage } from 'ethers/lib/utils';
import { wordlist } from './wordlist';

export const uuid = () => randomUUID();
export const hash = (str: string) => createHmac('sha256', str).digest('hex');
export const saltedHash = (str: string) => {
    const salt = process.env.HASH_SALT;
    if (!salt) {
        throw new Error('Incorrect configuration: HASH_SALT evironment variable not set');
    }
    return hash(str + salt);
};
export const unmarshallItems = (items: any[] | undefined) =>
    items?.length ? items.map((item) => unmarshall(item)) : [];

// A wad is a decimal number with 18 digits of precision
export const WAD = BigNumber.from(10).pow(18);
// A uad is a decimal number with 6 digits of precision
export const UAD = BigNumber.from(10).pow(6);

export const toDisplayNumber = (number: string, precision = 0) => {
    const divider = BigNumber.from(10).pow(18 - precision);
    return BigNumber.from(number).div(divider).toNumber() / 10 ** precision;
};

export const random = () => {
    const intToFloat = (integer: number) => {
        return integer / Math.pow(2, 64);
    };

    const buffer = randomBytes(8);
    return intToFloat(parseInt(buffer.toString('hex'), 16));
};

export const recoverAddressFromSignature = (signature: string) => {
    const MESSAGE =
        "Welcome to Degen Dogs Club Arena.\nYou are about to sign this message which will give you a limited time code to be able to login to the game from this or completely different device.\nApart from this, you don't need to use a wallet while playing, and the game/web app should never ask you to approve any other transactions (apart from signing this message). You should use SuperFluid Dashboard to start and stop streams into the arena. Have a great time and see you in the arena!";
    return verifyMessage(MESSAGE, signature);
};

export const createLTP = () => {
    const max = wordlist.length - 1;
    const a = randomInt(0, max);
    const b = randomInt(0, max);
    const c = randomInt(0, max);
    return `${wordlist[a]}-${wordlist[b]}-${wordlist[c]}`;
};
