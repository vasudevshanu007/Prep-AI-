// Test environment variables — never use real secrets here
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-chars-long-enough';
process.env.JWT_EXPIRE = '1d';
process.env.GEMINI_API_KEY = 'placeholder';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepai_test';
process.env.PORT = '5001';
process.env.CLOUDINARY_CLOUD_NAME = 'placeholder';
process.env.CLOUDINARY_API_KEY = 'placeholder';
process.env.CLOUDINARY_API_SECRET = 'placeholder';
