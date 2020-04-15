import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as middy from "middy";
import { TodoItem } from '../../models/TodoItem'
import { parseUserIdHeader } from '../../auth/utils'
import { TodoRepository } from '../../repository/TodoRepository'
import { createLogger } from '../../utils/logger'
import cors from '@middy/http-cors'

const repository: TodoRepository = new TodoRepository();
const logger = createLogger("updateTodo");

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  const item : TodoItem = await repository.find(todoId);
  const authHeader = event.headers["Authorization"];
  const userId = parseUserIdHeader(authHeader);

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
        "message":"No permissions on the item"
      })
    };
  }
  item.name = updatedTodo.name
  item.done = updatedTodo.done
  item.dueDate = updatedTodo.dueDate

  const result = await repository.update(item)
  logger.info(`Updated TODO [${userId}] with ${item}`);
  return {
    statusCode:200,
    body: JSON.stringify({
      result
    })
  };
});

handler.use(cors());
