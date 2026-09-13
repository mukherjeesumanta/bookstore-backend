"use strict";

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { Book } = require("../db/models");

let cart = [];

router.get("/", async (_req, res) => {
  const books = await Book.findAll({ where: { featured: true }, limit: 4 });
  return res.json({ featured: books });
});

router.get("/cart", (_req, res) => res.json({ items: cart }));
router.put("/cart", (req, res) => {
  cart = Array.isArray(req.body) ? req.body : req.body.items || [];
  return res.json({ items: cart });
});

router.post("/checkout", (req, res) => {
  const items = req.body.items || [];
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const shippingMethod = req.body.shippingMethod || "standard";
  const shippingCost = shippingMethod === "express" ? 14.99 : 5.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  return res.json({ subtotal, shippingCost, tax, total: Math.round((subtotal + shippingCost + tax) * 100) / 100 });
});

router.get("/profile", authenticate, (req, res) => res.redirect(307, "/api/auth/me"));
router.get("/order-confirmation", authenticate, (req, res) => res.redirect(307, `/api/orders/${encodeURIComponent(req.query.orderRef)}`));

module.exports = router;
