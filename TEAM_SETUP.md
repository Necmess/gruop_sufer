# 팀원 설정 가이드

PR(`dev01` → `main`) 받은 뒤, 중고마켓·Atlas DB를 쓰기 위한 순서입니다.

---

## 카톡/슬랙 붙여넣기용 (짧은 버전)

```
[SURF KOREA 팀 설정]

1) 코드 받기
git clone https://github.com/Necmess/gruop_sufer.git
cd gruop_sufer
git checkout dev01 && git pull origin dev01
(또는 main에 머지됐으면: git checkout main && git pull origin main)

2) .env 만들기 (팀장에게 URI 따로 받기!)
cp .env.example .env
→ .env 열어서 MONGODB_URI에 팀장이 준 Atlas 주소 붙여넣기

3) 실행
npm install
npm start

4) 브라우저
http://127.0.0.1:3000

※ python3 -m http.server 로는 중고마켓 안 됨
※ .env는 GitHub에 올리지 말 것
```

---

## 1. 코드 받기

### 처음 받는 경우

```bash
git clone https://github.com/Necmess/gruop_sufer.git
cd gruop_sufer
git checkout dev01
git pull origin dev01
```

PR이 `main`에 머지된 뒤라면:

```bash
git checkout main
git pull origin main
```

### 이미 프로젝트가 있는 경우

```bash
git fetch origin
git checkout dev01
git pull origin dev01
```

---

## 2. Node.js 확인

```bash
node -v
npm -v
```

없으면 https://nodejs.org 에서 LTS 설치.

---

## 3. `.env` 만들기 (필수)

`.env`는 Git에 없습니다. **팀장에게 Atlas URI**를 카톡/슬랙으로 받으세요.

```bash
cp .env.example .env
```

`.env` 예시:

```env
MONGODB_URI=mongodb+srv://...(팀장이 공유한 URI)
PORT=3000
```

성공 시 `npm start` 터미널:

```text
MongoDB 연결 성공 → DB: Surfing_market, Host: ...mongodb.net...
서버 실행: http://127.0.0.1:3000
```

---

## 4. 설치 & 실행

```bash
npm install
npm start
```

브라우저: **http://127.0.0.1:3000**

> `python3 -m http.server`만 쓰면 화면은 보여도 **중고마켓 API·상품 저장은 안 됩니다.**

---

## 5. 확인 체크리스트

- [ ] 중고마켓 메뉴 → 상품 목록 로드
- [ ] 상품 등록 + 사진 업로드
- [ ] 다른 팀원이 등록한 상품도 보임
- [ ] Atlas: `Surfing_market` → `products` (`Surfing` / `stuff` 아님)

---

## 자주 나는 오류

| 증상 | 해결 |
|------|------|
| `MONGODB_URI가 없습니다` | `.env` 파일 생성 여부 확인 |
| `bad auth` | Atlas DB 사용자 비밀번호 ↔ `.env` 비밀번호 일치 확인 |
| `EADDRINUSE :::3000` | `lsof -ti :3000 \| xargs kill` 후 `npm start` |
| 상품 목록 안 불러옴 | **http://127.0.0.1:3000** 으로 접속했는지 확인 |
| Atlas에 DB 안 보임 | `Surfing_market` → `products` 선택 후 Refresh |

---

## 팀장이 공유해야 하는 것

| 공유 OK | 공유 X |
|---------|--------|
| GitHub 저장소 / PR 링크 | `.env`를 GitHub에 commit |
| Atlas `MONGODB_URI` (카톡/슬랙) | Atlas 로그인(구글) 비밀번호 |

DB 사용자 아이디·비밀번호만 `.env` URI에 들어갑니다.

---

## PR 링크

https://github.com/Necmess/gruop_sufer/pull/3
