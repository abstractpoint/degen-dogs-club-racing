import axios from 'axios';
import { apiUrls } from '../constants';

const accountTokenSnapshotQuery = (account: string, token: string) => `query ($id: ID = "") {
    account(id: $id) {
        createdAtTimestamp
        createdAtBlockNumber
        updatedAtBlockNumber
        updatedAtTimestamp
        inflows {
            currentFlowRate
            token {
                id
            }
            sender {
                id
            }
        }
        publishedIndexes {
            id
            subscriptions {
                id
                units
            }
        }
    }
    accountTokenSnapshot(
        id: "${account}-${token}"
) {
        balanceUntilUpdatedAt
        totalNetFlowRate
        updatedAtTimestamp
    }
}`;

interface Inflow {
    currentFlowRate: string;
    token: {
        id: string;
    };
    sender: {
        id: string;
    };
}

export const accountTokenSnapshot = async (account: string, token: string) => {
    const { data: graphResponse } = await axios.post(apiUrls.mumbai.graph, {
        query: accountTokenSnapshotQuery(account, token),
        variables: {
            id: account,
        },
    });

    return {
        snapshot: graphResponse.data.accountTokenSnapshot,
        inflows: graphResponse.data.account.inflows.map((inflow: Inflow) => ({
            currentFlowRate: inflow.currentFlowRate,
            sender: inflow.sender.id,
        })),
    };
};
