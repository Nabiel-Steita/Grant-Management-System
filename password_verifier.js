const bcrypt = require('bcrypt');

const hash = '$2b$10$6krn9lH14OoBQEseqS3JQugXtjSyb8seg6CN5fglB53lGaJii3.Ie';

// Function to verify a password against the hash
function verifyPassword(password) {
  return bcrypt.compareSync(password, hash);
}

// Example usage
const testPasswords = [
  'password',
  '123456',
  'admin',
  'test',
  'user',
  // Add more passwords to test
];

console.log('Testing passwords against hash:', hash);
console.log('=====================================');

testPasswords.forEach(password => {
  const isValid = verifyPassword(password);
  console.log(`Password "${password}": ${isValid ? 'MATCHES' : 'does not match'}`);
});

// Interactive mode - uncomment to test your own passwords
// const readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// rl.question('Enter a password to test: ', (password) => {
//   const isValid = verifyPassword(password);
//   console.log(`Password "${password}": ${isValid ? 'MATCHES' : 'does not match'}`);
//   rl.close();
// });
