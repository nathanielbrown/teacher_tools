import * as ftp from "basic-ftp";
import dotenv from "dotenv";

dotenv.config();

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        const host = process.env.FTP_HOST;
        const user = process.env.FTP_USER;
        const password = process.env.FTP_PASSWORD;

        if (!host || !user || !password) {
            console.error("Error: FTP_HOST, FTP_USER, and FTP_PASSWORD must be defined in the .env file.");
            process.exit(1);
        }

        console.log(`Connecting to FTP server at ${host}...`);
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: process.env.FTP_SECURE === 'true',
            secureOptions: { rejectUnauthorized: false }
        });
        
        console.log("Connected successfully!");
        
        const remoteDir = process.env.FTP_REMOTE_DIR || '/';
        console.log(`Navigating to remote directory: ${remoteDir}`);
        await client.ensureDir(remoteDir);
        
        // Optional: clear remote directory before upload
        if (process.env.FTP_CLEAR_DIR === 'true') {
            console.log("Clearing remote working directory...");
            await client.clearWorkingDir();
        }
        
        console.log("Uploading files from dist/ directory...");
        await client.uploadFromDir("dist");
        
        console.log("Deployment to FTP complete!");
    } catch(err) {
        console.error("Deployment failed:", err);
        process.exit(1);
    } finally {
        client.close();
    }
}

deploy();
