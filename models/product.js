const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },       // 상품 제목
  category: { type: String, required: true },    // 카테고리 (보드, 슈트 등)
  price: { type: Number, required: true },       // 가격
  description: { type: String, default: '설명 없음' },
  seller: { type: String, required: true },      // 판매자 이름 또는 ID
  image: { type: String, default: '' },          // 상품 사진 (data URL, Atlas에 함께 저장)
  status: { type: String, default: 'selling' },  // 판매 상태 (selling, reserved, sold)
  createdAt: { type: Date, default: Date.now }   // 등록 날짜
});

// 이 코드로 되어 있는지 확인해주세요!
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);







