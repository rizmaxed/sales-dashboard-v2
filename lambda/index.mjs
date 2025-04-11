import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pkg from 'pg';
const { Client } = pkg;

export const handler = async () => {
    console.log("Lambda execution started");

    const secretArn = process.env.DB_SECRET_ARN;
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;

    try {
        console.log("Fetching database credentials from Secrets Manager");
        const secretsClient = new SecretsManagerClient();
        const secret = await secretsClient.send(
            new GetSecretValueCommand({ SecretId: secretArn })
        );
        const creds = JSON.parse(secret.SecretString);
        console.log("Successfully retrieved credentials");

        console.log("Connecting to PostgreSQL");
        const dbClient = new Client({
            user: creds.username,
            password: creds.password,
            host: dbHost,
            port: Number(dbPort),
            database: dbName,
            ssl: {
                rejectUnauthorized: false, // disable cert validation, for lab purposes only
            },
            connectionTimeoutMillis: 5000 // optional: fast fail on network issues
        });

        await dbClient.connect();
        console.log("Database connection established");

        console.log("Executing sales summary query");
        const result = await dbClient.query(`
            SELECT TO_CHAR(txn_date, 'YYYY-MM') AS month, 
                   SUM(amount)::INT AS total_amount
            FROM transactions
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        `);
        console.log("Query execution completed");

        await dbClient.end();
        console.log("Database connection closed");

        const formatted = result.rows;
        console.log("Query results:", JSON.stringify(formatted));

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(formatted),
        };

    } catch (error) {
        console.error("Error during Lambda execution:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                error: "Internal Server Error",
                detail: error.message,
            }),
        };
    }
};