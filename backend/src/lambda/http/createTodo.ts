import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import {parseUserIdHeader} from "../../auth/utils";
import {createLogger} from "../../utils/logger";
import {TodoRepository} from "../../repository/TodoRepository";
import {TodoItem} from "../../models/TodoItem";

import * as middy from 'middy'
import cors from '@middy/http-cors'

const repository: TodoRepository = new TodoRepository();
const logger = createLogger("createTodo");

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body);
  const authHeader = event.headers["Authorization"];
  const userId = parseUserIdHeader(authHeader);
  logger.info(`Create TODO [${userId}]  with ${newTodo}`);
  const result : TodoItem = await repository.create(newTodo, userId);
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item:result
    })
  }
});

handler.use(cors());
