const { createClient } = require("@libsql/client");

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const run = async (query, args = []) => {
  const result = await turso.execute({ sql: query, args });
  return result;
};

const get = async (query, args = []) => {
  const result = await turso.execute({ sql: query, args });
  return result.rows[0];
};

const all = async (query, args = []) => {
  const result = await turso.execute({ sql: query, args });
  return result.rows;
};

module.exports = { run, get, all, turso };
