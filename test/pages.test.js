const request = require("supertest");
const app = require("../src/server");

describe.skip("page API integration", () => {
  it("documents the page endpoints", async () => {
    const response = await request(app).get("/api/openapi.json");
    expect(response.status).toBe(200);
    expect(response.body.paths["/catalogue"]).toBeDefined();
    expect(response.body.paths["/profile"]).toBeDefined();
  });
});
