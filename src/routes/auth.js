"use strict";

/**
 * Auth Routes
 *
 * POST  /api/auth/register  — create a new account, returns JWT + user
 * POST  /api/auth/login     — verify credentials, returns JWT + user with orders
 * GET   /api/auth/me        — return current user + orders  [protected]
 */

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const { Op } = require("sequelize");
const { User, Order, OrderItem } = require("../db/models");
const { authenticate, signToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe public shape for a user. */
function formatUser(user, orders = []) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    orders,
  };
}

/** Format a Sequelize Order instance (with eager-loaded items) for the API. */
function formatOrder(order) {
  return {
    id: order.orderRef,
    date: order.createdAt,
    status: order.status,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    total: order.total,
    shippingMethod: order.shippingMethod,
    shippingAddress: {
      name: order.shippingName,
      line1: order.shippingLine1,
      line2: order.shippingLine2,
    },
    paymentMethod: order.paymentMethod,
    estimatedDelivery: order.estimatedDelivery,
    items: (order.items || []).map((i) => ({
      id: i.id,
      bookId: i.bookId ? String(i.bookId) : null,
      title: i.title,
      author: i.author,
      price: i.price,
      quantity: i.quantity,
    })),
  };
}

/** Load all orders with their items for a user id. */
async function getUserOrders(userId) {
  const orders = await Order.findAll({
    where: { userId },
    include: [{ model: OrderItem, as: "items" }],
    order: [["createdAt", "DESC"]],
  });
  return orders.map(formatOrder);
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters."),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
  ],
  validate,
  async (req, res) => {
    const { name, username, email, password } = req.body;

    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Username or email already taken." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, email, password: hashed });
    const token = signToken(user);

    return res.status(201).json({ token, user: formatUser(user) });
  },
);

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = signToken(user);
    const orders = await getUserOrders(user.id);

    return res.json({ token, user: formatUser(user, orders) });
  },
);

// ---------------------------------------------------------------------------
// GET /api/auth/me  [protected]
// ---------------------------------------------------------------------------
router.get("/me", authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const orders = await getUserOrders(user.id);
  return res.json({ user: formatUser(user, orders) });
});

module.exports = router;
