import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Collection from '../src/models/Collection.js';
import SavedRequest from '../src/models/SavedRequest.js';
import Environment from '../src/models/Environment.js';
import { env } from '../src/config/env.js';

describe('ShopKart Demo Collection Import', () => {
  let userCookie;
  let userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Demo Import User',
        email: `demo_user_${Date.now()}@example.com`,
        password: 'Password123!',
      });

    userCookie = reg.headers['set-cookie'];
    userId = reg.body.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await Promise.all([
        User.deleteOne({ _id: userId }),
        Collection.deleteMany({ ownerId: userId }),
        SavedRequest.deleteMany({ ownerId: userId }),
        Environment.deleteMany({ ownerId: userId }),
      ]);
    }
    await mongoose.connection.close();
  });

  it('should import the 18-request demo collection on first attempt', async () => {
    const res = await request(app)
      .post('/api/v1/collections/import-shopkart-demo')
      .set('Cookie', userCookie);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.requestCount).toBe(18);
    expect(res.body.isDuplicate).toBe(false);

    // Verify 18 requests exist in DB
    const count = await SavedRequest.countDocuments({
      ownerId: userId,
      collectionId: res.body.collection._id,
    });
    expect(count).toBe(18);

    // Verify Environment was created
    const demoEnv = await Environment.findOne({
      ownerId: userId,
      name: 'ShopKart Local',
    });
    expect(demoEnv).toBeDefined();
    expect(demoEnv.variables.some((v) => v.key === 'baseUrl')).toBe(true);
    expect(demoEnv.variables.some((v) => v.key === 'authToken' && v.isSecret)).toBe(true);
  });

  it('should handle repeat import idempotently without duplicating records', async () => {
    const res = await request(app)
      .post('/api/v1/collections/import-shopkart-demo')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isDuplicate).toBe(true);
    expect(res.body.requestCount).toBe(18);

    // Verify still exactly 1 collection
    const colCount = await Collection.countDocuments({
      ownerId: userId,
      name: 'ShopKart E-Commerce API',
    });
    expect(colCount).toBe(1);

    // Verify still exactly 18 requests
    const reqCount = await SavedRequest.countDocuments({
      ownerId: userId,
    });
    expect(reqCount).toBe(18);
  });
});
