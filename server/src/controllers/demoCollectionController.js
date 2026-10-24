import Collection from '../models/Collection.js';
import SavedRequest from '../models/SavedRequest.js';
import Environment from '../models/Environment.js';
import { encrypt } from '../utils/crypto.js';
import { env } from '../config/env.js';

export async function importShopKartDemo(req, res, next) {
  try {
    const userId = req.user.id;

    // 1. Idempotency Check: Don't duplicate if already imported
    const existing = await Collection.findOne({
      ownerId: userId,
      name: 'ShopKart E-Commerce API',
    });

    if (existing) {
      const count = await SavedRequest.countDocuments({
        ownerId: userId,
        collectionId: existing._id,
      });

      return res.status(200).json({
        success: true,
        message: 'ShopKart Demo Collection is already present in your workspace',
        collection: existing,
        requestCount: count,
        isDuplicate: true,
      });
    }

    // 2. Create Collection
    const collection = await Collection.create({
      ownerId: userId,
      name: 'ShopKart E-Commerce API',
      description: 'Pre-configured test suite replicating the ShopKart e-commerce endpoints (Auth, Products, Wishlist, Cart, Orders) with assertions.',
      isDemoCollection: true,
    });

    // 3. Create or Update Environment
    let demoEnv = await Environment.findOne({
      ownerId: userId,
      name: 'ShopKart Local',
    });

    const encryptedToken = encrypt('mock_jwt_token_sample_customer_12345', env.ENCRYPTION_KEY);

    const envVariables = [
      { key: 'baseUrl', value: `http://localhost:${env.PORT || 5000}/api/v1/mock/shopkart`, isSecret: false },
      { key: 'sampleProductId', value: 'prod_101', isSecret: false },
      { key: 'authToken', value: encryptedToken, isSecret: true },
    ];

    if (!demoEnv) {
      demoEnv = await Environment.create({
        ownerId: userId,
        name: 'ShopKart Local',
        variables: envVariables,
      });
    }

    // 4. Define All 18 Saved Requests
    const requestsData = [
      // 1. Register Customer (Valid)
      {
        name: 'Auth - Register Customer (Valid)',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/customers/register',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: {
          type: 'json',
          content: JSON.stringify({
            fullName: 'Jane Doe',
            email: 'jane.doe@example.com',
            password: 'Password123!',
            phone: '9876543210',
          }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '201' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
          { type: 'JSON_FIELD_EXISTS', field: 'customer._id' },
        ],
        description: 'Registers a new customer account with valid fields.',
      },

      // 2. Register Customer (Validation Failure)
      {
        name: 'Auth - Register Customer (Validation Failure)',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/customers/register',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: {
          type: 'json',
          content: JSON.stringify({ email: 'incomplete@example.com' }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '400' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'false' },
        ],
        description: 'Tests 400 Bad Request error when required fields are missing.',
      },

      // 3. Login Customer (Valid Credentials)
      {
        name: 'Auth - Login Customer (Valid Credentials)',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/customers/login',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: {
          type: 'json',
          content: JSON.stringify({
            email: 'jane.doe@example.com',
            password: 'Password123!',
          }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
          { type: 'JSON_FIELD_EXISTS', field: 'token' },
        ],
        description: 'Authenticates customer and returns mock session token.',
      },

      // 4. Login Customer (Invalid Password)
      {
        name: 'Auth - Login Customer (Invalid Password)',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/customers/login',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: {
          type: 'json',
          content: JSON.stringify({
            email: 'jane.doe@example.com',
            password: 'WrongPassword!',
          }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '401' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'false' },
        ],
        description: 'Tests 401 Unauthorized error on wrong password.',
      },

      // 5. Get Customer Profile (Authenticated)
      {
        name: 'Auth - Get Profile (Authenticated)',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/customers/me',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [{ key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'customer.email', expected: 'jane.doe@example.com' },
        ],
        description: 'Fetches the authenticated profile using Bearer token.',
      },

      // 6. Get Customer Profile (Missing Token)
      {
        name: 'Auth - Get Profile (Missing Token)',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/customers/me',
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '401' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'false' },
        ],
        description: 'Verifies 401 Unauthorized when Authorization header is omitted.',
      },

      // 7. List All Products
      {
        name: 'Products - List All Products',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/products',
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
          { type: 'RESPONSE_TIME_BELOW', expected: '1000' },
        ],
        description: 'Fetches product catalog with stock and categories.',
      },

      // 8. Search Products by Keyword
      {
        name: 'Products - Search Products by Keyword',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/products',
        params: [{ key: 'search', value: 'Keyboard', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'count', expected: '1' },
        ],
        description: 'Tests query parameter filtering by product title keyword.',
      },

      // 9. Filter Products by Category
      {
        name: 'Products - Filter Products by Category',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/products',
        params: [{ key: 'category', value: 'electronics', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'count', expected: '2' },
        ],
        description: 'Tests category filtering parameter.',
      },

      // 10. Get Single Product Details
      {
        name: 'Products - Get Single Product Details',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/products/{{sampleProductId}}',
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'product._id', expected: 'prod_101' },
        ],
        description: 'Retrieves single product using dynamic URL variable {{sampleProductId}}.',
      },

      // 11. Get Product (Non-Existent 404)
      {
        name: 'Products - Get Product (Non-Existent 404)',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/products/prod_nonexistent_999',
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '404' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'false' },
        ],
        description: 'Verifies 404 Not Found response on unknown product ID.',
      },

      // 12. Get Current User Wishlist
      {
        name: 'Wishlist - Get Current User Wishlist',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/wishlist',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [{ key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
        ],
        description: 'Fetches wishlist items for authenticated customer.',
      },

      // 13. Add Item to Wishlist
      {
        name: 'Wishlist - Add Item to Wishlist',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/wishlist/{{sampleProductId}}',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [{ key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
        ],
        description: 'Adds target product into customer wishlist.',
      },

      // 14. Remove Item from Wishlist
      {
        name: 'Wishlist - Remove Item from Wishlist',
        method: 'DELETE',
        urlTemplate: '{{baseUrl}}/wishlist/{{sampleProductId}}',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [{ key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
        ],
        description: 'Removes item from customer wishlist.',
      },

      // 15. Get Cart Contents
      {
        name: 'Cart - Get Cart Contents',
        method: 'GET',
        urlTemplate: '{{baseUrl}}/cart',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [{ key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
          { type: 'JSON_FIELD_EXISTS', field: 'cart.items' },
        ],
        description: 'Retrieves current shopping cart items and subtotal.',
      },

      // 16. Add Item to Cart
      {
        name: 'Cart - Add Item to Cart',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/cart/{{sampleProductId}}',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true },
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: {
          type: 'json',
          content: JSON.stringify({ quantity: 2 }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'item.quantity', expected: '2' },
        ],
        description: 'Adds item with specified quantity to the shopping cart.',
      },

      // 17. Update Cart Item Quantity
      {
        name: 'Cart - Update Cart Item Quantity',
        method: 'PATCH',
        urlTemplate: '{{baseUrl}}/cart/{{sampleProductId}}',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true },
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: {
          type: 'json',
          content: JSON.stringify({ quantity: 3 }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '200' },
          { type: 'JSON_FIELD_EQUALS', field: 'item.quantity', expected: '3' },
        ],
        description: 'Updates item quantity in shopping cart.',
      },

      // 18. Create Sample Order (Clean API order contract without payment gateways)
      {
        name: 'Orders - Create Sample Order',
        method: 'POST',
        urlTemplate: '{{baseUrl}}/orders',
        auth: { type: 'bearer', token: '{{authToken}}' },
        headers: [
          { key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true },
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        body: {
          type: 'json',
          content: JSON.stringify({
            items: [{ productId: 'prod_101', quantity: 1, unitPrice: 149.99 }],
            shippingAddress: {
              street: '123 Academic Way',
              city: 'Tech City',
              postalCode: '560001',
              country: 'India',
            },
          }, null, 2),
        },
        assertions: [
          { type: 'STATUS_CODE_EQUALS', expected: '201' },
          { type: 'JSON_FIELD_EQUALS', field: 'success', expected: 'true' },
          { type: 'JSON_FIELD_EXISTS', field: 'order._id' },
          { type: 'JSON_FIELD_EQUALS', field: 'order.status', expected: 'pending' },
        ],
        description: 'Submits a sample order record (verifying order creation contract without payment gateways).',
      },
    ];

    const savedDocs = requestsData.map((reqItem, idx) => ({
      ...reqItem,
      ownerId: userId,
      collectionId: collection._id,
      order: idx,
    }));

    await SavedRequest.insertMany(savedDocs);

    return res.status(201).json({
      success: true,
      message: 'ShopKart Demo Collection imported successfully with 18 requests',
      collection,
      environment: demoEnv,
      requestCount: savedDocs.length,
      isDuplicate: false,
    });
  } catch (err) {
    next(err);
  }
}
