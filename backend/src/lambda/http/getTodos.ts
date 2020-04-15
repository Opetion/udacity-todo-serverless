import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from "middy";
import { parseUserIdHeader } from '../../auth/utils'
import { TodoRepository } from '../../repository/TodoRepository'
import { createLogger } from '../../utils/logger'
import cors from '@middy/http-cors'
import { AttachmentStorage } from '../../storage/AttachmentStorage'

const repository: TodoRepository = new TodoRepository();
const storage: AttachmentStorage = new AttachmentStorage();
const logger = createLogger("indexTodos");

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authHeader = event.headers["Authorization"];
  const userId = parseUserIdHeader(authHeader);
  const result = await repository.getAllFromUser(userId)
  logger.info(`Index TODO [${userId}] with ${result}`);

  for(const item of result){
    if(!item.attachmentUrl){
      continue;
    }
    item.attachmentUrl = await storage.getAttachment(item.todoId);
  }

  return {
    statusCode:200,
    body: JSON.stringify({
      items:result
    })
  }
});

handler.use(cors());
