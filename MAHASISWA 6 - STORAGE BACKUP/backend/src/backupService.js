
const { spawn } = require("child_process");
const {
    uploadBackup
} = require("./storageService");

const MYSQLDUMP_PATH =
    process.env.MYSQLDUMP_PATH ||
    "C:\\xampp\\mysql\\bin\\mysqldump.exe";

// Membuat file backup database dan mengunggahnya ke RustFS.
async function createDatabaseBackup() {
    const database = process.env.DB_NAME;

    if (!database) {
        throw new Error("DB_NAME belum dikonfigurasi.");
    }

    const args = [
        `--host=${process.env.DB_HOST || "localhost"}`,
        `--port=${process.env.DB_PORT || "3306"}`,
        `--user=${process.env.DB_USER || "root"}`,
        "--single-transaction",
        "--routines",
        "--triggers",
        "--events",
        "--default-character-set=utf8mb4",
        database
    ];

    const chunks = [];
    let stderr = "";

    const dump = spawn(MYSQLDUMP_PATH, args, {
        env: {
            ...process.env,
            MYSQL_PWD: process.env.DB_PASSWORD || ""
        },
        windowsHide: true,
        shell: false
    });

    dump.stdout.on("data", (chunk) => {
        chunks.push(chunk);
    });

    dump.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
    });

    await new Promise((resolve, reject) => {
        dump.on("error", reject);

        dump.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `mysqldump gagal (kode ${code}): ${stderr}`
                    )
                );
            }
        });
    });

    const backupBuffer = Buffer.concat(chunks);

    if (backupBuffer.length === 0) {
        throw new Error("File backup kosong; backup dibatalkan.");
    }

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const fileName = `monexa-backup-${timestamp}.sql`;

    await uploadBackup(fileName, backupBuffer);

    return {
        fileName,
        sizeBytes: backupBuffer.length
    };
}

module.exports = {
    createDatabaseBackup
};
