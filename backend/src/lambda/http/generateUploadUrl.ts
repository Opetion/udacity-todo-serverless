import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import * as middy from "middy";
import { TodoItem } from '../../models/TodoItem'
import { TodoRepository } from '../../repository/TodoRepository'
import { createLogger } from '../../utils/logger'
import { parseUserIdHeader } from '../../auth/utils'
import { AttachmentStorage } from '../../storage/AttachmentStorage'
import cors from '@middy/http-cors'

const repository: TodoRepository = new TodoRepository();
const storage: AttachmentStorage = new AttachmentStorage();
const logger = createLogger("generateUrlTodo");

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
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

  const url = await storage.getUploadUrl(item.todoId)
  item.attachmentUrl=url;
  await repository.update(item)

  logger.info(`Generated url for ${todoId}`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl:url
    })
  }
});

handler.use(cors());
