// Script to create .env.local file
const fs = require('fs');
const path = require('path');

const envContent = `# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://rijalboy94:kvPfojAOpzITixtP@studiocontacts.t1x8fae.mongodb.net/contacts

# Environment
NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log(`.env.local file created successfully at ${envPath}`);
} catch (err) {
  console.error('Error creating .env.local file:', err);
} 