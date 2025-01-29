const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Hsadmin9007',
    server: process.env.DB_SERVER || 'DESKTOP-BB7CIP5\\SQLEXPRESS',
    database: process.env.DB_DATABASE || 'CashDB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

const pool = await sql.connect(dbConfig);
