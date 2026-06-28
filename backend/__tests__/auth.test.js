const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  // Close the HTTP server so Jest exits cleanly
  const { server } = require('../server');
  await new Promise((resolve) => server.close(resolve));
});

afterEach(async () => {
  await User.deleteMany({});
});

// ─── Registration ─────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  const validPayload = {
    name: 'Alice Test',
    email: 'alice@example.com',
    password: 'Password1',
  };

  it('creates a new user and returns 201 with a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.password).toBeUndefined(); // never leak password
  });

  it('returns 400 when email is already registered', async () => {
    await request(app).post('/api/auth/register').send(validPayload);
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 with validation error for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, password: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/password/i);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: validPayload.email, password: validPayload.password });
    expect(res.status).toBe(400);
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bob Test',
      email: 'bob@example.com',
      password: 'Password1',
    });
  });

  it('returns 200 and a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'Password1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com' });
    expect(res.status).toBe(400);
  });
});

// ─── Protected route ──────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user data for a valid token', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Carol Test',
      email: 'carol@example.com',
      password: 'Password1',
    });
    const { token } = regRes.body;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('carol@example.com');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer tampered.jwt.token');
    expect(res.status).toBe(401);
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns OK with database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.database).toBe('connected');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
