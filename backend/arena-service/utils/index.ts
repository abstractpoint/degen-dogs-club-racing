import { createHmac, randomUUID, randomBytes } from 'crypto';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { BigNumber } from 'ethers';

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
