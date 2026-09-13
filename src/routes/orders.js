"use strict";

/**
 * Orders Routes  (all routes require a valid JWT)
 *
 * POST  /api/orders              — place a new order
 * GET   /api/orders              — list current user's orders
 * GET   /api/orders/:orderRef    — single order detail
 */

const router = require("express").Router();
const { body } = require("express-validator");
const { Order, OrderItem } = require("../db/models");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// All orders routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateOrderRef() {
  const num = Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000);
  return `LL${num}`;
}

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

// ---------------------------------------------------------------------------
// POST /api/orders
// Body:
//   items            — [{ bookId?, title, author?, price, quantity }]
//   shippingMethod   — "standard" | "express"  (default: "standard")
//   shippingAddress  — { name, line1, line2 }
//   paymentMethod    — string (e.g. "Visa **** 4242" | "PayPal")
//   estimatedDelivery — string
// ---------------------------------------------------------------------------
router.post(
  "/",
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one item is required."),
    body("items.*.title")
      .notEmpty()
      .withMessage("Each item must have a title."),
    body("items.*.price")
      .isFloat({ min: 0 })
      .withMessage("Each item must have a valid price."),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Each item must have a quantity ≥ 1."),
    body("shippingMethod")
      .optional()
      .isIn(["standard", "express"])
      .withMessage("shippingMethod must be 'standard' or 'express'."),
    body("shippingAddress.name").optional().isString(),
    body("shippingAddress.line1").optional().isString(),
    body("shippingAddress.line2").optional().isString(),
    body("paymentMethod").optional().isString(),
  ],
  validate,
  async (req, res) => {
    const {
      items,
      shippingMethod = "standard",
      shippingAddress = {},
      paymentMethod = "",
      estimatedDelivery = "",
    } = req.body;

    // Totals calculated server-side
    const subtotal =
      Math.round(
        items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100,
      ) / 100;
    const shippingCost = shippingMethod === "express" ? 14.99 : 5.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;

    const order = await Order.create(
      {
        orderRef: generateOrderRef(),
        userId: req.user.id,
        status: "confirmed",
        subtotal,
        shippingCost,
        tax,
        total,
        shippingMethod,
        shippingName: shippingAddress.name || null,
        shippingLine1: shippingAddress.line1 || null,
        shippingLine2: shippingAddress.line2 || null,
        paymentMethod,
        estimatedDelivery,
        items: items.map((i) => ({
          bookId: i.bookId ? parseInt(i.bookId, 10) : null,
          title: i.title,
          author: i.author || "",
          price: i.price,
          quantity: i.quantity,
        })),
      },
      { include: [{ model: OrderItem, as: "items" }] },
    );

    // Reload to ensure eager-loaded items are populated
    await order.reload({ include: [{ model: OrderItem, as: "items" }] });
    return res.status(201).json({ order: formatOrder(order) });
  },
);

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, as: "items" }],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ orders: orders.map(formatOrder) });
});

// ---------------------------------------------------------------------------
// GET /api/orders/:orderRef
// ---------------------------------------------------------------------------
router.get("/:orderRef", async (req, res) => {
  const order = await Order.findOne({
    where: { orderRef: req.params.orderRef, userId: req.user.id },
    include: [{ model: OrderItem, as: "items" }],
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  return res.json({ order: formatOrder(order) });
});

module.exports = router;
