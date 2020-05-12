const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  development: {
    username: 'root',
    password: process.env.DB_PASSWORD,
    database: 'graphql-server',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    operatorsAliases: false,
    timezone: "+09:00",
  },
  test: {
    username: 'root',
    password: process.env.DB_PASSWORD,
    database: 'graphql-server',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    operatorsAliases: false,
    timezone: "+09:00",
  },
  production: {
    username: 'root',
    password: process.env.DB_PASSWORD,
    database: 'graphql-server',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    operatorsAliases: false,
    timezone: "+09:00",
  },
};
