import axios from 'axios';
import { apiUrls } from '../constants';

export const nftMetadata = async (nftId: string) => {
    const { data: metaResponse } = await axios.get(`${apiUrls.nft.meta}/${nftId}`);

    if (!metaResponse || !metaResponse.attributes) {
        return { attributes: [] };
    }

    return metaResponse;
};
