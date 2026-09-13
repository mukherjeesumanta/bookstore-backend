"use strict";

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Leaf & Letter Bookstore API",
      version: "1.0.0",
      description: "APIs used by the Leaf & Letter bookstore frontend.",
    },
    servers: [{ url: "http://localhost:4000/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Book: {
          type: "object",
          required: ["id", "title", "author", "price"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            author: { type: "string" },
            price: { type: "number", format: "float" },
            cover: { type: "string" },
            category: { type: "string" },
            rating: { type: "number" },
            inStock: { type: "boolean" },
          },
        },
        CartItem: {
          type: "object",
          required: ["title", "price", "quantity"],
          properties: {
            bookId: { type: "string" },
            title: { type: "string" },
            author: { type: "string" },
            price: { type: "number" },
            quantity: { type: "integer", minimum: 1 },
          },
        },
        ShippingAddress: {
          type: "object",
          properties: {
            name: { type: "string" },
            line1: { type: "string" },
            line2: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          summary: "Home",
          description: "Landing page data",
          responses: { 200: { description: "Landing page data" } },
        },
      },
      "/catalogue": {
        get: {
          summary: "Catalogue",
          description: "All books, searchable and filterable",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "inStock", in: "query", schema: { type: "boolean" } },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
            },
          ],
          responses: { 200: { description: "Book catalogue" } },
        },
      },
      "/books/{id}": {
        get: {
          summary: "BookDetails",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Book details" },
            404: { description: "Book not found" },
          },
        },
      },
      "/cart": {
        get: {
          summary: "Cart",
          description: "Return the current client cart",
          responses: { 200: { description: "Cart contents" } },
        },
        put: {
          summary: "Cart",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CartItem" },
                },
              },
            },
          },
          responses: { 200: { description: "Updated cart" } },
        },
      },
      "/checkout": {
        post: {
          summary: "Checkout",
          description: "Calculate shipping and tax for checkout",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CartItem" },
                    },
                    shippingMethod: {
                      type: "string",
                      enum: ["standard", "express"],
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Checkout totals" } },
        },
      },
      "/payment": {
        post: {
          summary: "Payment",
          description: "Submit payment and create an order",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            201: { description: "Created order" },
            401: { description: "Authentication required" },
          },
        },
      },
      "/order-confirmation": {
        get: {
          summary: "OrderConfirmation",
          parameters: [
            {
              name: "orderRef",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Order receipt" } },
        },
      },
      "/login": {
        post: {
          summary: "Login",
          description: "Login form submission",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string" },
                    password: { type: "string", format: "password" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "JWT and user" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/profile": {
        get: {
          summary: "Profile",
          description: "Authenticated user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User profile" },
            401: { description: "Authentication required" },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
