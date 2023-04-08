import { ScheduledEvent } from 'aws-lambda';
import { scheduleHandler } from '../../app';
import { ddb } from '../../clients/ddb';

jest.setTimeout(10e3);

describe('Unit test for schedule handler', function () {
    it('Works', async () => {
        jest.spyOn(ddb, 'transactWriteItems').mockImplementation(
            async (payload) =>
                await Promise.all(
                    payload.TransactItems!.map(async (each: any) => {
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
