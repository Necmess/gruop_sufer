# SURF KOREA

국내 서핑 스팟의 위치와 오늘의 서핑 컨디션을 확인하는 HTML/CSS/JavaScript 기반 프론트엔드 초안입니다.

## 실행 방법

HTML 섹션을 `fetch()`로 불러오기 때문에 `index.html`을 직접 열기보다 로컬 서버로 실행합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:8000
```

## 주요 기능

- 영상 기반 히어로 화면
- 국립해양조사원 API 기준 18개 서핑 스팟 지도
- 스팟 이미지 카드
- 파고와 바람을 조합한 서핑 점수
- 좋음 / 보통 / 나쁨 등급 표시
- 오늘의 추천 스팟·비추천 스팟
- 스팟 및 지역 검색
- 즐겨찾기 저장 및 필터
- 스팟별 리뷰 상세 모달
- 초보자용 서핑 레슨 영상
- `admin / admin` 데모 로그인
- 로그인 후 마이페이지 및 즐겨찾기 목록
- 로딩·API 실패·결과 없음·인증키 오류·요청 제한 상태에 대한 예외 처리

## 폴더 구조

```text
surf-korea/
├── index.html              공통 레이아웃·네비게이션·모달
├── login.html              별도 로그인 페이지
├── styles.css              CSS 엔트리 파일
├── sections/               화면별 HTML 조각
│   ├── home.html
│   └── mypage.html
├── css/                    기능별 스타일
│   ├── base.css
│   ├── navigation.css
│   ├── sections.css
│   ├── auth.css
│   ├── responsive.css
│   └── accessibility.css
└── js/                     기능별 JavaScript
    ├── data.js             스팟·리뷰·공용 상태
    ├── ui.js               토스트·공통 UI
    ├── map.js              Leaflet 지도·마커
    ├── weather.js          날씨 API·서핑 점수
    ├── spots.js            카드·검색·즐겨찾기
    ├── reviews.js          리뷰·상세 모달
    ├── auth.js             로그인·로그아웃·페이지 전환
    ├── login-page.js       별도 로그인 페이지 인증
    ├── mypage.js           마이페이지
    └── app.js              섹션 로딩·초기화
```

## 데모 로그인

```text
아이디: admin
비밀번호: admin
```

홈 화면의 로그인 버튼을 누르면 `login.html`로 이동합니다. 로그인에 성공하면 `index.html?view=mypage`로 연결되어 마이페이지에서 저장한 즐겨찾기 스팟을 확인할 수 있습니다.

## 데이터 및 외부 서비스

- 지도: Leaflet + OpenStreetMap
- 파고: Open-Meteo Marine API
- 바람: Open-Meteo Forecast API
- 서핑지수: 국립해양조사원 서핑지수 API
- 기온·날씨 상태: 기상청 단기예보 격자 API
- 이미지: Unsplash URL
- 레슨 영상: YouTube iframe

서핑지수와 기온 API는 Vercel 서버리스 프록시(`/api/surfing`, `/api/kma-weather`)를 통해 호출하며, 해안 격자값이 비어 있으면 최대 3칸 안의 가장 가까운 유효 격자를 사용합니다. API 키는 브라우저에 노출하지 않습니다. 실제 서비스에서는 인증·리뷰·즐겨찾기 데이터도 백엔드와 연결해야 합니다.

## API 예외 상태 확인

개발 중에는 `S.state.simMode` 값을 바꿔 다음 상태를 확인할 수 있습니다. 일반 사용자 화면에는 테스트용 조작부를 노출하지 않습니다.

- 정상
- 로딩 지연
- API 호출 실패
- 결과 없음
- 인증키 오류
- 요청 제한 초과

실제 API 요청에는 10초 타임아웃과 5분 캐시가 적용되며, 스팟을 2곳씩 순차 조회해 초기 요청이 한꺼번에 몰리지 않도록 처리합니다. 화면을 열어둔 경우 5분마다 자동으로 최신 데이터를 다시 조회하고, 백그라운드 탭에서 복귀할 때도 갱신합니다.

## 협업 규칙

- 스팟 데이터 수정: `js/data.js`
- 지도 수정: `js/map.js`
- 날씨 및 점수 로직 수정: `js/weather.js`
- 카드·검색·즐겨찾기 수정: `js/spots.js`
- 로그인 수정: `js/auth.js`
- 마이페이지 수정: `js/mypage.js`
- 화면 구조 수정: `sections/`
- 스타일 수정: `css/`

각 기능은 `window.SurfKorea` 공용 객체를 통해 상태와 함수를 공유합니다. 새로운 전역 변수를 만들기보다 해당 네임스페이스 안에 기능을 추가하는 방식을 권장합니다.
