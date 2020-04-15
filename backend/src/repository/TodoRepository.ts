import * as uuid from 'uuid'
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {TodoItem} from "../models/TodoItem";
import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger("todo-repository");

export class TodoRepository {

    constructor(
        private readonly docClient = createDynamoDBClient(),
        private readonly TODO_USER_INDEX = process.env.TODO_USER_INDEX,
        private readonly TODO_TABLE = process.env.TODO_TABLE) {
    }

    async getAllFromUser(userId: string): Promise<TodoItem[]> {

        const result = await this.docClient.query({
            TableName : this.TODO_TABLE,
            IndexName: this.TODO_USER_INDEX,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();


        const items = result.Items;
        logger.info(result);
        return items as TodoItem[];
   }

    async find(id: string): Promise<TodoItem> {

        const params = {
            TableName: this.TODO_TABLE,
            Key: {
                "todoId": id
            }
        };

        const result = await this.docClient.get(params).promise();

        const item = result.Item;
        logger.info(`ID: ${id} -> ${item}`);

        return item as TodoItem;
    }

    async delete(todoId: string) : Promise<void> {
        const params = {
            TableName: this.TODO_TABLE,
            Key:{
                "todoId": todoId
            }
        };

        await this.docClient.delete(params).promise();
    }

    async update(request: TodoItem): Promise<TodoItem> {
        const params = {
            TableName: this.TODO_TABLE,
            Item: request
        };

        await this.docClient.put(params).promise();

        return request;
    }


    async create(request: CreateTodoRequest, userId: string): Promise<TodoItem> {
        const item: TodoItem = {
            userId: userId,
            todoId: uuid.v4(),
            createdAt: new Date().toISOString(),
            name: request.name,
            dueDate: request.dueDate,
            done: false
        };

        const params = {
            TableName: this.TODO_TABLE,
            Item: item
        }

        await this.docClient.put(params).promise();

        return item;
    }

}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }
    return new XAWS.DynamoDB.DocumentClient()
}


