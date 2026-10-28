// The app's getDb() connects to NETLIFY_DB_URL, so point it at the test
// database (checked to be local in globalSetup.ts).
process.env.NETLIFY_DB_URL = process.env.TEST_DATABASE_URL;
