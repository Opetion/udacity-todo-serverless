import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'


const bucketName = process.env.ATTACHMENTS_S3_BUCKET

const EXPIRE_TIME = 300;
const XAWS = AWSXRay.captureAWS(AWS);

const STORAGE = new XAWS.S3({
  signatureVersion: 'v4',
  region: process.env.REGION,
  params: {Bucket: bucketName}
});

export class AttachmentStorage{

  constructor(){
  };

  async getUploadUrl(todoId: string) : Promise<string> {
    return STORAGE.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: `${todoId}.png`,
      Expires: EXPIRE_TIME
    })
  };

  async getAttachment(todoId: string) : Promise<string> {
    return STORAGE.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: `${todoId}.png`,
      Expires: EXPIRE_TIME
    })
  }
}
