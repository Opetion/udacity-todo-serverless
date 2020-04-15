import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'

import { JwtPayload } from '../../auth/JwtPayload'
import * as middy from "middy";
// import Axios from 'axios'

import {getToken} from "../../auth/utils";

const logger = createLogger('auth');

// const jwkToPem = require('jwk-to-pem');
// const jwksUrl = 'https://opetion.eu.auth0.com/.well-known/jwks.json';

const AUTH_0_SECRET = process.env.AUTH_0_SECRET;

export const handler = middy(async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken);
  try {
    const jwtToken = await verifyToken(event.authorizationToken);
    logger.info('User was authorized', jwtToken);

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message });

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
});

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader);
  var verifedToken = verify(token,AUTH_0_SECRET,{algorithms:['HS256']})

  return verifedToken as JwtPayload;
}
