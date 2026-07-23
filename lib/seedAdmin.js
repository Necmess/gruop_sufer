const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function seedDefaultUser() {
  const count = await User.countDocuments();
  if (count > 0) return;

  const passwordHash = await bcrypt.hash('admin', 10);
  await User.create({
    username: 'admin',
    passwordHash,
    displayName: 'admin',
  });

  console.log('기본 계정 생성: admin / admin (Atlas users 컬렉션)');
}

module.exports = { seedDefaultUser };
