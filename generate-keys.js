const crypto = require('crypto');

// Generate JWT Secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=', jwtSecret);

// Generate Encryption Key (32 bytes base64)
const encryptionKey = crypto.randomBytes(32).toString('base64');
console.log('ENCRYPTION_KEY=', encryptionKey);

// Output will look like:
// JWT_SECRET= f3a2b5c8e9d7f6a1b4c8e9d7f6a1b4c8e9d7f6a1b4c8e9d7f6a1b4c8e9d7f6a
// ENCRYPTION_KEY= w8xNUVpXvT3yK7mRgHjqZcF5bL9nM2sP1=