"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../index");

const Book = sequelize.define(
  "Book",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.FLOAT,
      field: "original_price",
    },
    cover: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "review_count",
    },
    isbn: {
      type: DataTypes.STRING,
      unique: true,
    },
    pages: {
      type: DataTypes.INTEGER,
    },
    publisher: {
      type: DataTypes.STRING,
    },
    publishedYear: {
      type: DataTypes.INTEGER,
      field: "published_year",
    },
    description: {
      type: DataTypes.TEXT,
    },
    // Stored as a JSON string; getter/setter transparently serialise the array
    tags: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        const raw = this.getDataValue("tags");
        try {
          return JSON.parse(raw || "[]");
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue("tags", JSON.stringify(Array.isArray(val) ? val : []));
      },
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "in_stock",
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "books",
    underscored: true,
  }
);

module.exports = Book;
