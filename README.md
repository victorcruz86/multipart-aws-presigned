# Angular - Multipart Aws Pre-signed URL
![enter image description here](https://res.cloudinary.com/du4jrqkyo/image/upload/v1609492542/multipart-aws-presigned.png)

Example

https://multipart-aws-presigned.stackblitz.io/ 

https://stackblitz.com/edit/multipart-aws-presigned?file=src/app/app.component.html 

Download Backend:
https://www.dropbox.com/s/9tm8w3ujaqbo017/serverless-multipart-aws-presigned.tar.gz?dl=0

To upload large files into an S3 bucket using pre-signed url it is necessary to use multipart upload, basically splitting the file into many parts which allows parallel upload.

Here we will leave a basic example of the backend and frontend.

## Backend (Serveless Typescript)

```
const AWSData = {
  accessKeyId: 'Access Key',
  secretAccessKey: 'Secret Access Key'
};
```

There are 3 endpoints 

#### Endpoint 1: /start-upload

Ask S3 to start the multipart upload, the answer is an UploadId associated to each part that will be uploaded.

```
export const start: APIGatewayProxyHandler = async (event, _context) => {
  const params = {
    Bucket: event.queryStringParameters.bucket, /* Bucket name */
    Key: event.queryStringParameters.fileName /* File name */
  };

  const s3 = new AWS.S3(AWSData);

  const res = await s3.createMultipartUpload(params).promise()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      data: {
        uploadId: res.UploadId
      }
    })
  };
}
```

#### Endpoint 2: /get-upload-url

Create a pre-signed URL for each part that was split for the file to be uploaded.

```
export const uploadUrl: APIGatewayProxyHandler = async (event, _context) => {
  let params = {
    Bucket: event.queryStringParameters.bucket, /* Bucket name */
    Key: event.queryStringParameters.fileName, /* File name */
    PartNumber: event.queryStringParameters.partNumber, /* Part to create pre-signed url */
    UploadId: event.queryStringParameters.uploadId /* UploadId from Endpoint 1 response */
  };

  const s3 = new AWS.S3(AWSData);

  const res = await s3.getSignedUrl('uploadPart', params)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(res)
  };
}
```

#### Endpoint 3: /complete-upload

After uploading all the parts of the file it is necessary to inform that they have already been uploaded and this will make the object assemble correctly in S3.

```
export const completeUpload: APIGatewayProxyHandler = async (event, _context) => {
  // Parse the post body
  const bodyData = JSON.parse(event.body);

  const s3 = new AWS.S3(AWSData);

  const params: any = {
    Bucket: bodyData.bucket, /* Bucket name */
    Key: bodyData.fileName, /* File name */
    MultipartUpload: {
      Parts: bodyData.parts /* Parts uploaded */
    },
    UploadId: bodyData.uploadId /* UploadId from Endpoint 1 response */
  }

  const data = await s3.completeMultipartUpload(params).promise()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      // 'Access-Control-Allow-Methods': 'OPTIONS,POST',
      // 'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(data)
  };
}
```

## Frontend (Angular 9)

The file is divided into 10MB parts 

Having the file, the multipart upload to Endpoint 1 is requested

With the UploadId you divide the file in several parts of 10MB and from each one you get the pre-signed url upload using the Endpoint 2

A PUT is made with the part converted to blob to the pre-signed url obtained in Endpoint 2

When you finish uploading each part you make a last request the Endpoint 3

In the example of all this the function uploadMultipartFile
