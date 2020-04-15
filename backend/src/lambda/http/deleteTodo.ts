import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import * as middy from "middy";
import { TodoRepository } from '../../repository/TodoRepository'
import { TodoItem } from '../../models/TodoItem'
import { parseUserIdHeader } from '../../auth/utils'
import cors from '@middy/http-cors'

const repository: TodoRepository = new TodoRepository();
const logger = createLogger("deleteTodo");

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const authHeader = event.headers["Authorization"];
  const userId = parseUserIdHeader(authHeader);

  if (!todoId) {
    return  {
      statusCode: 400,
      body: JSON.stringify({
        "message":"missing parameters"
      })
    };
  }

  const item : TodoItem = await repository.find(todoId);
  if(!item){
    return  {
      statusCode: 404,
      body: JSON.stringify({
        "message":"item not found"
      })
    };
  }

  if(userId !== item.userId) {
    return  {
      statusCode: 403,
      body: JSON.stringify({
        "message":"No permissions to delete the item"
      })
    };
  }

  await repository.delete(todoId);

  logger.info(`Delete TODO [${userId}]  with id: ${todoId}`);
  return {
    statusCode: 200,
    body:JSON.stringify({
      "message":"Item deleted successfully"
    })
  };
});

handler.use(cors());
