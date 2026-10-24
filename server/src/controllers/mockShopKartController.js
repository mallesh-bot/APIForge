// In-memory deterministic mock data for ShopKart demo endpoints
const MOCK_PRODUCTS = [
  {
    _id: 'prod_101',
    title: 'Wireless Noise-Canceling Headphones',
    price: 149.99,
    category: 'electronics',
    stock: 25,
    description: 'Premium over-ear headphones with active noise cancellation and 40h battery life.',
  },
  {
    _id: 'prod_102',
    title: 'Ergonomic Mechanical Keyboard',
    price: 89.99,
    category: 'electronics',
    stock: 40,
    description: 'Hot-swappable tactile mechanical keyboard with RGB backlighting.',
  },
  {
    _id: 'prod_103',
    title: 'Stainless Steel Water Bottle',
    price: 24.50,
    category: 'lifestyle',
    stock: 100,
    description: 'Double-wall vacuum insulated water bottle (750ml).',
  },
  {
    _id: 'prod_104',
    title: 'Organic Cotton Hoodie',
    price: 54.00,
    category: 'apparel',
    stock: 15,
    description: 'Heavyweight organic French terry cotton hoodie.',
  },
];

const VALID_MOCK_TOKENS = new Set([
  'mock_jwt_token_sample_customer_12345',
  'test_token_shopkart',
]);

function checkMockAuth(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return VALID_MOCK_TOKENS.has(token);
}

// 1. Register customer
export function mockRegisterCustomer(req, res) {
  const { fullName, email, password, phone } = req.body || {};

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  if (email === 'existing@example.com') {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Customer registered successfully',
    customer: {
      _id: 'cust_mock_01',
      fullName,
      email,
      phone,
    },
  });
}

// 2. Login customer
export function mockLoginCustomer(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  if (password === 'WrongPassword!' || email === 'wrong@example.com') {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token: 'mock_jwt_token_sample_customer_12345',
    customer: {
      _id: 'cust_mock_01',
      fullName: 'Jane Doe',
      email,
    },
  });
}

// 3. Customer Profile
export function mockGetCustomerProfile(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  return res.status(200).json({
    success: true,
    customer: {
      _id: 'cust_mock_01',
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '9876543210',
    },
  });
}

// 4. Logout customer
export function mockLogoutCustomer(_req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

// 5. Products list (with search and category filtering)
export function mockGetProducts(req, res) {
  let products = [...MOCK_PRODUCTS];

  const rawSearch = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;
  const rawCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;

  const search = rawSearch ? String(rawSearch).toLowerCase().trim() : '';
  const category = rawCategory ? String(rawCategory).toLowerCase().trim() : '';

  if (category) {
    products = products.filter((p) => p.category.toLowerCase() === category);
  }

  if (search) {
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
    );
  }

  return res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
}

// 6. Single product details
export function mockGetProductById(req, res) {
  const { id } = req.params;
  const product = MOCK_PRODUCTS.find((p) => p._id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  return res.status(200).json({
    success: true,
    product,
  });
}

// 7. Get wishlist
export function mockGetWishlist(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  return res.status(200).json({
    success: true,
    count: 1,
    items: [
      {
        productId: 'prod_101',
        title: 'Wireless Noise-Canceling Headphones',
        price: 149.99,
      },
    ],
  });
}

// 8. Add to wishlist
export function mockAddToWishlist(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  const { productId } = req.params;
  return res.status(200).json({
    success: true,
    message: 'Product added to wishlist',
    productId,
  });
}

// 9. Remove from wishlist
export function mockRemoveFromWishlist(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  const { productId } = req.params;
  return res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
    productId,
  });
}

// 10. Get cart
export function mockGetCart(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  return res.status(200).json({
    success: true,
    cart: {
      items: [
        {
          productId: 'prod_101',
          title: 'Wireless Noise-Canceling Headphones',
          quantity: 1,
          unitPrice: 149.99,
          totalPrice: 149.99,
        },
      ],
      subtotal: 149.99,
      totalItems: 1,
    },
  });
}

// 11. Add to cart
export function mockAddToCart(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  const { productId } = req.params;
  const quantity = Number(req.body?.quantity) || 1;

  return res.status(200).json({
    success: true,
    message: 'Item added to cart',
    item: {
      productId,
      quantity,
      unitPrice: 149.99,
    },
  });
}

// 12. Update cart quantity
export function mockUpdateCart(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  const { productId } = req.params;
  const quantity = Number(req.body?.quantity) || 1;

  return res.status(200).json({
    success: true,
    message: 'Cart updated',
    item: {
      productId,
      quantity,
      unitPrice: 149.99,
    },
  });
}

// 13. Remove from cart
export function mockRemoveFromCart(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  const { productId } = req.params;
  return res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    productId,
  });
}

// 14. Create sample order (Standard order contract without payment gateways)
export function mockCreateOrder(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  const { items = [] } = req.body || {};

  return res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: {
      _id: 'order_mock_789',
      status: 'pending',
      totalAmount: 149.99,
      itemCount: items.length || 1,
      createdAt: new Date().toISOString(),
    },
  });
}

// 15. Get user orders
export function mockGetOrders(req, res) {
  if (!checkMockAuth(req)) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  return res.status(200).json({
    success: true,
    count: 1,
    orders: [
      {
        _id: 'order_mock_789',
        status: 'pending',
        totalAmount: 149.99,
        itemCount: 1,
        createdAt: new Date().toISOString(),
      },
    ],
  });
}
