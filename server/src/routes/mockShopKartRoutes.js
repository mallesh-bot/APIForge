import express from 'express';
import {
  mockRegisterCustomer,
  mockLoginCustomer,
  mockGetCustomerProfile,
  mockLogoutCustomer,
  mockGetProducts,
  mockGetProductById,
  mockGetWishlist,
  mockAddToWishlist,
  mockRemoveFromWishlist,
  mockGetCart,
  mockAddToCart,
  mockUpdateCart,
  mockRemoveFromCart,
  mockCreateOrder,
  mockGetOrders,
} from '../controllers/mockShopKartController.js';

const router = express.Router();

// Customer Auth
router.post('/customers/register', mockRegisterCustomer);
router.post('/customers/login', mockLoginCustomer);
router.get('/customers/me', mockGetCustomerProfile);
router.post('/customers/logout', mockLogoutCustomer);

// Products
router.get('/products', mockGetProducts);
router.get('/products/:id', mockGetProductById);

// Wishlist
router.get('/wishlist', mockGetWishlist);
router.post('/wishlist/:productId', mockAddToWishlist);
router.delete('/wishlist/:productId', mockRemoveFromWishlist);

// Cart
router.get('/cart', mockGetCart);
router.post('/cart/:productId', mockAddToCart);
router.patch('/cart/:productId', mockUpdateCart);
router.delete('/cart/:productId', mockRemoveFromCart);

// Orders (Standard mock order contracts without payment processing)
router.post('/orders', mockCreateOrder);
router.get('/orders', mockGetOrders);

export default router;
