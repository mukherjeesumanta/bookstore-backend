"use strict";

const path = require("path");
const { Sequelize } = require("sequelize");

const DB_PATH = path.resolve(
  process.env.DB_PATH || path.join(__dirname, "../../data/bookstore.db")
);

// Ensure the data directory exists
const fs = require("fs");
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: DB_PATH,
  logging: false,           // set to console.log to see generated SQL
});

module.exports = sequelize;
