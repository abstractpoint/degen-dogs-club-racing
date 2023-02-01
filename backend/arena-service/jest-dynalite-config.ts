// use export default for ts based configs
module.exports = {
    tables: [
        {
            TableName: 'table',
            KeySchema: [
                { AttributeName: 'pk', KeyType: 'HASH' },
                { AttributeName: 'sk', KeyType: 'RANGE' },
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'gs1',
                    KeySchema: [
                        { AttributeName: 'gs1pk', KeyType: 'HASH' },
                        { AttributeName: 'gs1sk', KeyType: 'RANGE' },
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                },
            ],
            AttributeDefinitions: [
                { AttributeName: 'pk', AttributeType: 'S' },
                { AttributeName: 'sk', AttributeType: 'S' },
                { AttributeName: 'gs1pk', AttributeType: 'S' },
                { AttributeName: 'gs1sk', AttributeType: 'S' },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
            },
            data: [],
        },
    ],
    basePort: 8000,
};
