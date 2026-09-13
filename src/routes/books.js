"use strict";

/**
 * Books Routes
 *
 * GET  /api/books             — list all books (search, filter, paginate)
 * GET  /api/books/categories  — distinct category list
 * GET  /api/books/featured    — featured books only
 * GET  /api/books/:id         — single book detail
 */

const router = require("express").Router();
const { Op } = require("sequelize");
const { Book } = require("../db/models");

// ---------------------------------------------------------------------------
// Helper: safe public shape expected by the frontend
// ---------------------------------------------------------------------------
function formatBook(book) {
  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    price: book.price,
    originalPrice: book.originalPrice,
    cover: book.cover,
    category: book.category,
    rating: book.rating,
    reviewCount: book.reviewCount,
    isbn: book.isbn,
    pages: book.pages,
    publisher: book.publisher,
    publishedYear: book.publishedYear,
    description: book.description,
    tags: book.tags,           // already parsed by the model getter
    inStock: book.inStock,
    featured: book.featured,
  };
}

// ---------------------------------------------------------------------------
// GET /api/books/categories
// Declared before /:id so the literal "categories" is not captured as a param.
// ---------------------------------------------------------------------------
router.get("/categories", async (_req, res) => {
  const rows = await Book.findAll({
    attributes: ["category"],
    group: ["category"],
    order: [["category", "ASC"]],
  });
  return res.json({ categories: rows.map((r) => r.category) });
});

// ---------------------------------------------------------------------------
// GET /api/books/featured
// ---------------------------------------------------------------------------
router.get("/featured", async (_req, res) => {
  const books = await Book.findAll({ where: { featured: true } });
  return res.json({ books: books.map(formatBook) });
});

// ---------------------------------------------------------------------------
// GET /api/books
// Query params:
//   q        — search term (title or author, case-insensitive)
//   category — exact category name
//   inStock  — "true" to return only in-stock books
//   page     — 1-based page number (default 1)
//   limit    — page size (default 20, max 100)
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const { q, category, inStock, page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const where = {};

  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { author: { [Op.like]: `%${q}%` } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (inStock === "true") {
    where.inStock = true;
  }

  const { count, rows } = await Book.findAndCountAll({
    where,
    order: [["title", "ASC"]],
    limit: limitNum,
    offset,
  });

  return res.json({
    books: rows.map(formatBook),
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/books/:id
// ---------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid book ID." });
  }

  const book = await Book.findByPk(id);
  if (!book) {
    return res.status(404).json({ error: "Book not found." });
  }

  return res.json({ book: formatBook(book) });
});

module.exports = router;
