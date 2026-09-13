"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../index");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderRef: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "order_ref",
    },
    // userId FK is managed by the association in models/index.js
    status: {
      type: DataTypes.STRING,
      defaultValue: "confirmed",
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    shippingCost: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "shipping_cost",
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    shippingMethod: {
      type: DataTypes.STRING,
      defaultValue: "standard",
      field: "shipping_method",
    },
    shippingName: {
      type: DataTypes.STRING,
      field: "shipping_name",
    },
    shippingLine1: {
      type: DataTypes.STRING,
      field: "shipping_line1",
    },
    shippingLine2: {
      type: DataTypes.STRING,
      field: "shipping_line2",
    },
    paymentMethod: {
      type: DataTypes.STRING,
      field: "payment_method",
    },
    estimatedDelivery: {
      type: DataTypes.STRING,
      field: "estimated_delivery",
    },
  },
  {
    tableName: "orders",
    underscored: true,
  },
);

module.exports = Order;
