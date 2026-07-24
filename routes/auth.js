const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const router = express.Router();

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function sanitizeUser(user) {
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
  };
}

router.post('/register', async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const displayName = String(req.body.displayName || '').trim() || username;

  if (!USERNAME_PATTERN.test(username)) {
    return res.status(400).json({ message: '아이디는 3~20자의 영문 소문자, 숫자, _ 만 사용할 수 있습니다.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ message: '비밀번호는 4자 이상 입력해 주세요.' });
  }

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, displayName });
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해 주세요.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: '아이디 또는 비밀번호를 다시 확인해 주세요.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: '아이디 또는 비밀번호를 다시 확인해 주세요.' });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
