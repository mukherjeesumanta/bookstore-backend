"use strict";

/**
 * Central models barrel.
 * Import this everywhere instead of individual model files so that
 * associations are always registered before any query runs.
 *
 * Usage:
 *   const { User, Book, Order, OrderItem } = require("../db/models");
 */

const bcrypt = require("bcryptjs");
const sequelize = require("../index");
const User = require("./User");
const Book = require("./Book");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// ---------------------------------------------------------------------------
// Associations
// ---------------------------------------------------------------------------
// Use the full foreignKey object so Sequelize knows both the JS property name
// (name) and the actual SQLite column name (field).
User.hasMany(Order, {
  foreignKey: { name: "userId", field: "user_id" },
  as: "orders",
  onDelete: "CASCADE",
});
Order.belongsTo(User, {
  foreignKey: { name: "userId", field: "user_id" },
  as: "user",
});

Order.hasMany(OrderItem, {
  foreignKey: { name: "orderId", field: "order_id" },
  as: "items",
  onDelete: "CASCADE",
});
OrderItem.belongsTo(Order, {
  foreignKey: { name: "orderId", field: "order_id" },
  as: "order",
});

// Soft reference: item → book (no FK constraint so deletions don't cascade)
OrderItem.belongsTo(Book, {
  foreignKey: { name: "bookId", field: "book_id" },
  as: "book",
  constraints: false,
});

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const BOOKS = [
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas & Andrew Hunt",
    price: 39.99,
    originalPrice: 49.99,
    cover: "https://covers.openlibrary.org/b/id/8739161-L.jpg",
    category: "Programming",
    rating: 4.8,
    reviewCount: 2341,
    isbn: "978-0135957059",
    pages: 352,
    publisher: "Addison-Wesley",
    publishedYear: 2019,
    description:
      "The Pragmatic Programmer is one of those rare tech books you'll read, re-read, and read again over the years.",
    tags: ["Software Engineering", "Best Practices", "Career"],
    inStock: true,
    featured: true,
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    price: 34.99,
    originalPrice: 44.99,
    cover: "https://covers.openlibrary.org/b/id/8370614-L.jpg",
    category: "Programming",
    rating: 4.7,
    reviewCount: 3102,
    isbn: "978-0132350884",
    pages: 431,
    publisher: "Prentice Hall",
    publishedYear: 2008,
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
    tags: ["Refactoring", "Best Practices", "OOP"],
    inStock: true,
    featured: true,
  },
  {
    title: "Design Patterns",
    author: "Gang of Four",
    price: 44.99,
    originalPrice: 54.99,
    cover: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    category: "Architecture",
    rating: 4.6,
    reviewCount: 1892,
    isbn: "978-0201633610",
    pages: 395,
    publisher: "Addison-Wesley",
    publishedYear: 1994,
    description:
      "Four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.",
    tags: ["OOP", "Patterns", "Architecture"],
    inStock: true,
    featured: true,
  },
  {
    title: "You Don't Know JS",
    author: "Kyle Simpson",
    price: 29.99,
    originalPrice: 29.99,
    cover: "https://covers.openlibrary.org/b/id/10804993-L.jpg",
    category: "JavaScript",
    rating: 4.9,
    reviewCount: 4120,
    isbn: "978-1491904244",
    pages: 278,
    publisher: "O'Reilly Media",
    publishedYear: 2015,
    description:
      "No matter how much experience you have with JavaScript, odds are you don't fully understand the language.",
    tags: ["JavaScript", "Web", "Fundamentals"],
    inStock: true,
    featured: false,
  },
  {
    title: "The Linux Command Line",
    author: "William Shotts",
    price: 27.99,
    originalPrice: 34.99,
    cover: "https://covers.openlibrary.org/b/id/8758108-L.jpg",
    category: "Systems",
    rating: 4.7,
    reviewCount: 1560,
    isbn: "978-1593279523",
    pages: 480,
    publisher: "No Starch Press",
    publishedYear: 2019,
    description:
      "This book gives you the skills to write shell scripts and take full advantage of the command line.",
    tags: ["Linux", "CLI", "Shell"],
    inStock: true,
    featured: false,
  },
  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    price: 31.99,
    originalPrice: 38.99,
    cover: "https://covers.openlibrary.org/b/id/8760810-L.jpg",
    category: "JavaScript",
    rating: 4.8,
    reviewCount: 2875,
    isbn: "978-1593279509",
    pages: 472,
    publisher: "No Starch Press",
    publishedYear: 2018,
    description:
      "Eloquent JavaScript dives into the JavaScript language to show you how to write beautiful, effective code.",
    tags: ["JavaScript", "Web", "Functional Programming"],
    inStock: false,
    featured: false,
  },
  {
    title: "Python Crash Course",
    author: "Eric Matthes",
    price: 32.99,
    originalPrice: 39.99,
    cover: "https://covers.openlibrary.org/b/id/12003709-L.jpg",
    category: "Python",
    rating: 4.8,
    reviewCount: 5430,
    isbn: "978-1718502703",
    pages: 544,
    publisher: "No Starch Press",
    publishedYear: 2023,
    description:
      "Python Crash Course is the world's best-selling guide to the Python programming language.",
    tags: ["Python", "Beginner", "Projects"],
    inStock: true,
    featured: true,
  },
  {
    title: "Refactoring",
    author: "Martin Fowler",
    price: 42.99,
    originalPrice: 52.99,
    cover: "https://covers.openlibrary.org/b/id/8739201-L.jpg",
    category: "Programming",
    rating: 4.6,
    reviewCount: 1340,
    isbn: "978-0134757599",
    pages: 448,
    publisher: "Addison-Wesley",
    publishedYear: 2018,
    description:
      "Refactoring is a controlled technique for improving the design of an existing code base.",
    tags: ["Refactoring", "Code Quality", "OOP"],
    inStock: true,
    featured: false,
  },
];

async function seedDatabase() {
  const bookCount = await Book.count();
  if (bookCount === 0) {
    await Book.bulkCreate(BOOKS);
    console.log(`[seed] Inserted ${BOOKS.length} books.`);
  }

  const userCount = await User.count();
  if (userCount === 0) {
    const hashed = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Alex Reader",
      username: "alexreader",
      email: "alex@example.com",
      password: hashed,
    });
    console.log(
      "[seed] Demo user → username: alexreader / password: password123",
    );
  }
}

// ---------------------------------------------------------------------------
// Initialise: sync tables then seed
// ---------------------------------------------------------------------------
async function initDb() {
  await sequelize.authenticate();
  // alter:true updates existing columns without dropping data
  await sequelize.sync();
  await seedDatabase();
  console.log(`[db] SQLite ready at ${sequelize.options.storage}`);
}

module.exports = { sequelize, User, Book, Order, OrderItem, initDb };
