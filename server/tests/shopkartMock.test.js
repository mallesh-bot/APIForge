import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('ShopKart Deterministic Mock API', () => {
  const validToken = 'mock_jwt_token_sample_customer_12345';
  const authHeader = `Bearer ${validToken}`;

  // 1. Auth Endpoints
  describe('Customer Authentication', () => {
    it('should register a customer with valid fields', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/customers/register')
        .send({
          fullName: 'Jane Doe',
          email: 'jane.doe@example.com',
          password: 'Password123!',
          phone: '9876543210',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.customer._id).toBeDefined();
    });

    it('should reject registration when fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/customers/register')
        .send({ email: 'incomplete@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should login with valid credentials and return token', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/customers/login')
        .send({
          email: 'jane.doe@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBe(validToken);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/customers/login')
        .send({
          email: 'jane.doe@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/mock/shopkart/customers/me')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.customer.email).toBe('jane.doe@example.com');
    });

    it('should reject profile request without token', async () => {
      const res = await request(app).get('/api/v1/mock/shopkart/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. Product Endpoints
  describe('Product Catalog', () => {
    it('should list all products', async () => {
      const res = await request(app).get('/api/v1/mock/shopkart/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
    });

    it('should search products by keyword', async () => {
      const res = await request(app).get('/api/v1/mock/shopkart/products?search=Keyboard');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.products[0]._id).toBe('prod_102');
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/v1/mock/shopkart/products?category=electronics');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('should get single product details', async () => {
      const res = await request(app).get('/api/v1/mock/shopkart/products/prod_101');
      expect(res.status).toBe(200);
      expect(res.body.product._id).toBe('prod_101');
    });

    it('should return 404 for unknown product', async () => {
      const res = await request(app).get('/api/v1/mock/shopkart/products/prod_nonexistent_999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. Wishlist Endpoints
  describe('Wishlist', () => {
    it('should retrieve wishlist with authentication', async () => {
      const res = await request(app)
        .get('/api/v1/mock/shopkart/wishlist')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should add product to wishlist', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/wishlist/prod_101')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.productId).toBe('prod_101');
    });

    it('should remove product from wishlist', async () => {
      const res = await request(app)
        .delete('/api/v1/mock/shopkart/wishlist/prod_101')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 4. Cart Endpoints
  describe('Cart Management', () => {
    it('should get cart contents', async () => {
      const res = await request(app)
        .get('/api/v1/mock/shopkart/cart')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.cart.items).toBeDefined();
    });

    it('should add item to cart', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/cart/prod_101')
        .set('Authorization', authHeader)
        .send({ quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.item.quantity).toBe(2);
    });

    it('should update item quantity in cart', async () => {
      const res = await request(app)
        .patch('/api/v1/mock/shopkart/cart/prod_101')
        .set('Authorization', authHeader)
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.item.quantity).toBe(3);
    });
  });

  // 5. Order Endpoints (Pure API Contract without Payment Integration)
  describe('Orders (Standard API Contract)', () => {
    it('should create order record without payment gateway requirements', async () => {
      const res = await request(app)
        .post('/api/v1/mock/shopkart/orders')
        .set('Authorization', authHeader)
        .send({
          items: [{ productId: 'prod_101', quantity: 1, unitPrice: 149.99 }],
          shippingAddress: {
            street: '123 Academic Way',
            city: 'Tech City',
            postalCode: '560001',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order._id).toBe('order_mock_789');
      expect(res.body.order.status).toBe('pending');
    });

    it('should retrieve customer orders list', async () => {
      const res = await request(app)
        .get('/api/v1/mock/shopkart/orders')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThan(0);
    });
  });
});
