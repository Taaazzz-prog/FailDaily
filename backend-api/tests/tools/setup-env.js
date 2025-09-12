// Ensure tests run in test mode
process.env.NODE_ENV = 'test';
// Keep JWT secret available to avoid validation issues
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_with_min_length_32_________';
