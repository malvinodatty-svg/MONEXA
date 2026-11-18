
const {
    S3Client,
    ListBucketsCommand,
    PutObjectCommand
} = require("@aws-sdk/client-s3");

const storage = new S3Client({
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    },
    forcePathStyle: true
});

// Mengecek koneksi ke RustFS
async function checkStorageConnection() {
    const result = await storage.send(new ListBucketsCommand({}));
    return result.Buckets || [];
}

// Mengirim file ke bucket RustFS
async function uploadBackup(fileName, fileBuffer) {
    await storage.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || "cloudwallet-backups",
        Key: fileName,
        Body: fileBuffer,
        ContentType: "application/sql"
    }));

    return fileName;
}

module.exports = {
    checkStorageConnection,
    uploadBackup
};
