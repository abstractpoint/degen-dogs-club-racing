import { createHmac, randomUUID } from 'crypto';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { BigNumber } from 'ethers';

export const uuid = () => randomUUID();
export const hash = (str: string) => createHmac('sha256', str).digest('hex');
export const unmarshallItems = (items: any[] | undefined) =>
    items?.length ? items.map((item) => unmarshall(item)) : [];

// A wad is a decimal number with 18 digits of precision
export const WAD = BigNumber.from(10).pow(18);
// A uad is a decimal number with 6 digits of precision
export const UAD = BigNumber.from(10).pow(6);
