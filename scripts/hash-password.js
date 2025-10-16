const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Marcusopman123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('\n=================================');
  console.log('Password hashed successfully!');
  console.log('=================================');
  console.log('\nYour hashed password is:');
  console.log(hashedPassword);
  console.log('\nUse this value in Prisma Studio for the "password" field.');
  console.log('=================================\n');
}

hashPassword();
