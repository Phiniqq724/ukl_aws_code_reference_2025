const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client();

const TableName = process.env.TABLE_NAME;
const BucketName = process.env.BUCKET_NAME; // PRIVATE_BUCKET_NAME

const corsHeaders = {
  "content-type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
      };
    }
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { name, fileContent, fileType } = body;

      if (!name || !fileContent || !fileType) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Missing required fields" }),
        };
      }

      const id = randomUUID();
      const key = `${id}_${name}`;
      const buffer = Buffer.from(fileContent, "base64");

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BucketName,
          Key: key,
          Body: buffer,
          ContentType: fileType,
        })
      );

      await ddbClient.send(
        new PutCommand({
          TableName,
          Item: { id, name, s3Key: key, uploadedAt: new Date().toISOString() },
        })
      );

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ id, name, s3Key: key }),
      };
    }

    if (event.httpMethod === "GET") {
      const data = await ddbClient.send(new ScanCommand({ TableName }));

      const items = await Promise.all(
        (data.Items || []).map(async (item) => {
          const url = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: BucketName,
              Key: item.s3Key,
            }),
            { expiresIn: 3600 }
          );
          return { ...item, url };
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
