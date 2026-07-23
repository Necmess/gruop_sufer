require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI가 없습니다.');
  console.error('   1) .env.example 을 복사해 .env 파일을 만드세요.');
  console.error('   2) MongoDB Atlas 연결 문자열을 MONGODB_URI에 넣으세요.');
  process.exit(1);
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '3mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    const { name, host, port } = mongoose.connection;
    const isAtlas = String(host).includes('mongodb.net');
    console.log(`MongoDB 연결 성공 → DB: ${name}, Host: ${host}${port ? `:${port}` : ''}`);
    if (!isAtlas) {
      console.warn('⚠️  Atlas가 아닌 로컬 MongoDB에 연결됐습니다. Atlas를 쓰려면 .env의 MONGODB_URI를 확인하세요.');
    }
    const { seedDefaultUser } = require('./lib/seedAdmin');
    seedDefaultUser()
      .then(startServer)
      .catch((err) => {
        console.error('기본 계정 생성 실패:', err.message);
        startServer();
      });
  })
  .catch((err) => {
    console.error('MongoDB 연결 실패:', err.message);
    if (/bad auth|authentication failed/i.test(err.message)) {
      const user = MONGODB_URI.match(/^mongodb\+srv:\/\/([^:]+):/)?.[1];
      console.error('');
      console.error('→ Atlas "Database Access" 사용자 비밀번호와 .env가 일치하는지 확인하세요.');
      console.error(`→ .env에 적힌 DB 사용자: ${user || '(확인 불가)'}`);
      console.error('→ Atlas 로그인(구글/이메일) 비번이 아니라, Database Access에서 만든 Username/Password 입니다.');
      console.error('→ 비번을 새로 만들었다면 .env의 : 와 @ 사이 문자열도 꼭 같이 바꾸세요.');
    }
    process.exit(1);
  });

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const surfingHandler = require('./api/surfing');
const kmaWeatherHandler = require('./api/kma-weather');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.get('/api/surfing', surfingHandler);
app.get('/api/kma-weather', kmaWeatherHandler);

function startServer() {
  app.listen(PORT, () => {
    console.log(`서버 실행: http://127.0.0.1:${PORT}`);
  });
}
