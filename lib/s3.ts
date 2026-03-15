import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Ensure environment variables are set
const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const endpoint = process.env.LOCALSTACK_ENDPOINT;

let s3Client: S3Client | null = null;

if (accessKeyId && secretAccessKey) {
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    endpoint: endpoint || undefined,
    forcePathStyle: endpoint ? true : false,
  });
}

/**
 * Uploads a base64 image to AWS S3.
 *
 * @param base64Image The base64 string of the image (can include data:image/jpeg;base64,... prefix)
 * @param folder The folder path within the S3 bucket (e.g., "profiles" or "punches")
 * @param fileName The desired file name without extension
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToS3(
  base64Image: string,
  folder: string,
  fileName: string
): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error("S3 is not configured properly in environment variables.");
  }

  // Remove the prefix if it exists (e.g., data:image/jpeg;base64,)
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  // Defaulting to jpeg for consistency with getDescriptor matching
  const key = `${folder}/${fileName}.jpg`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/jpeg",
  });

  await s3Client.send(command);

  // Return the URL
  if (endpoint) {
    return `${endpoint}/${bucketName}/${key}`;
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
