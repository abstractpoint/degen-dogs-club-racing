import { ScheduledEvent } from 'aws-lambda';
import { scheduleHandler } from '../../app';
import { ddb } from '../../clients/ddb';
import { marshall } from '@aws-sdk/util-dynamodb';

jest.setTimeout(20e3);

describe('Unit test for schedule handler', function () {
    it('Works', async () => {
        const timestamp = new Date().toISOString();

        await ddb.putItem({
            TableName: 'table',
            Item: marshall({
                pk: 'ARENA#CURRENT',
                sk: `#PLAYER#${timestamp}#0x4444ad20879051b696a1c14ccf6e3b0459466666`,
                gs1pk: `PLAYER#0x4444ad20879051b696a1c14ccf6e3b0459466666`,
                gs1sk: `#SELF`,
                id: '0x4444ad20879051b696a1c14ccf6e3b0459466666',
                image: '2',
                flowRate: '0000005400000000000000',
                balance: '1000000000000000000000',
                adjustment: '0000000000000000000000',
                strength: 0.6,
                inArena: true,
                timestamp: timestamp,
                attributes: [
                    { trait_type: 'Background', value: 'None' },
                    { trait_type: 'Body', value: 'Alien' },
                    { trait_type: 'Neck', value: 'RedCollar' },
                    { trait_type: 'Mouth', value: 'Pizza' },
                    { trait_type: 'Ears', value: 'None' },
                    { trait_type: 'Head', value: 'StripedBeanie' },
                    { trait_type: 'Eyes', value: 'BlueLaserEyes' },
                ],
            }),
        });

        jest.spyOn(ddb, 'transactWriteItems').mockImplementation(
            async (payload) =>
                await Promise.all(
                    payload.TransactItems!.map(async (each: any) => {
                        console.log('Each', JSON.stringify(each, undefined, 2));
                        if (each.Update) await ddb.updateItem(each.Update);
                        if (each.Put) await ddb.putItem(each.Put);
                    }),
                ),
        );
        const event: ScheduledEvent = {
            'detail-type': 'Scheduled Event',
            account: '',
            detail: undefined,
            id: '',
            region: '',
            resources: [],
            source: '',
            time: '',
            version: '',
        };
        const result = await scheduleHandler(event);

        expect(result).toBeUndefined();
    });
});
