const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // 파일명 소문자/대문자 확인 (product.js)

// 1. 상품 목록 가져오기 (GET)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. 상품 등록하기 (POST)
router.post('/', async (req, res) => {
  const title = String(req.body.title || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number(req.body.price);
  const description = String(req.body.description || '').trim() || '설명 없음';
  const seller = String(req.body.seller || '익명 서퍼').trim() || '익명 서퍼';
  const image = String(req.body.image || '').trim();

  if (!title) return res.status(400).json({ message: '상품 제목을 입력해 주세요.' });
  if (!category) return res.status(400).json({ message: '카테고리를 선택해 주세요.' });
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: '올바른 가격을 입력해 주세요.' });
  if (image && image.length > 2_000_000) {
    return res.status(400).json({ message: '이미지가 너무 큽니다. 더 작은 사진을 선택해 주세요.' });
  }
  if (image && !/^data:image\/(jpeg|png|webp|gif);base64,/.test(image)) {
    return res.status(400).json({ message: '지원하지 않는 이미지 형식입니다.' });
  }

  const product = new Product({ title, category, price, description, seller, image });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ⚠️ 이 부분이 빠지면 "handler must be a function" 에러가 발생합니다!
module.exports = router;