(function (S) {
  let savedConditions = {};
  let savedFavorites = [];
  try {
    savedConditions = JSON.parse(sessionStorage.getItem("sk_conditions_cache") || "{}");
  } catch (error) {
    savedConditions = {};
  }
  try {
    const parsedFavorites = JSON.parse(localStorage.getItem("sk_favorites") || "[]");
    savedFavorites = Array.isArray(parsedFavorites) ? parsedFavorites : [];
  } catch (error) {
    savedFavorites = [];
  }
  S.SPOTS = [
    { id: "gangneung-gyeongpo", name: "경포해수욕장", region: "강원 강릉", lat: 37.80551, lon: 128.90811, image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=85&w=900&auto=format&fit=crop", desc: "강릉 대표 해변에서 즐기는 접근성 좋은 서핑 스팟." },
    { id: "jeju-gwakji", name: "곽지해수욕장", region: "제주 제주시", lat: 33.4517, lon: 126.305, image: "https://images.unsplash.com/photo-1466378258422-0e6b9d2e6bbd?q=85&w=900&auto=format&fit=crop", desc: "제주 서쪽의 여유로운 해변과 초보자 친화적인 라인업." },
    { id: "gangneung-geumjin", name: "금진해수욕장", region: "강원 강릉", lat: 37.63645, lon: 129.04496, image: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?q=85&w=900&auto=format&fit=crop", desc: "강릉 남쪽에 자리한 한적한 동해안 서핑 스팟." },
    { id: "yangyang-namae3ri", name: "남애3리해수욕장", region: "강원 양양", lat: 37.947, lon: 128.7821, image: "https://images.unsplash.com/photo-1439405326854-014607f694d7?q=85&w=900&auto=format&fit=crop", desc: "양양의 로컬한 분위기와 동해안 파도를 함께 즐길 수 있는 곳." },
    { id: "goheung-namyeol", name: "남열해수욕장", region: "전남 고흥", lat: 34.58051, lon: 127.48643, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=900&auto=format&fit=crop", desc: "남해안의 여유로운 풍경 속에서 즐기는 서핑 스팟." },
    { id: "busan-dadaepo", name: "다대포해수욕장", region: "부산 사하구", lat: 35.0481, lon: 128.9624, image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=85&w=900&auto=format&fit=crop", desc: "넓은 백사장과 일몰로 유명한 부산 서남부 해변." },
    { id: "taean-mallipo", name: "만리포해수욕장", region: "충남 태안", lat: 36.78599, lon: 126.14305, image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=85&w=900&auto=format&fit=crop", desc: "서해안에서 꾸준히 찾는 대표 서핑 해변." },
    { id: "donghae-mangsang", name: "망상해수욕장", region: "강원 동해", lat: 37.59359, lon: 129.09065, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?q=85&w=900&auto=format&fit=crop", desc: "넓은 해변과 동해안 스웰을 즐길 수 있는 스팟." },
    { id: "wando-myeongsasimni", name: "명사십리해수욕장", region: "전남 완도", lat: 34.3276, lon: 126.80899, image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=85&w=900&auto=format&fit=crop", desc: "남해안의 긴 백사장과 잔잔한 분위기가 매력적인 해변." },
    { id: "namhae-songjeong-solbaram", name: "송정솔바람해수욕장", region: "경남 남해안", lat: 34.7222, lon: 128.0218, image: "https://images.unsplash.com/photo-1466378258422-0e6b9d2e6bbd?q=85&w=900&auto=format&fit=crop", desc: "남해안 특유의 풍경과 한적함을 즐길 수 있는 서핑 스팟." },
    { id: "busan-songjeong", name: "송정해수욕장", region: "부산 해운대구", lat: 35.1786, lon: 129.1997, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=900&auto=format&fit=crop", desc: "도심 접근성이 좋은 남부 대표 서핑 스팟." },
    { id: "goseong-songjiho", name: "송지호해수욕장", region: "강원 고성", lat: 38.3313, lon: 128.5283, image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=85&w=900&auto=format&fit=crop", desc: "고성의 한적한 해변에서 여유롭게 즐기는 동해안 서핑." },
    { id: "gangneung-okgye", name: "옥계해수욕장", region: "강원 강릉", lat: 37.6303, lon: 129.0486, image: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?q=85&w=900&auto=format&fit=crop", desc: "강릉 남부의 조용한 해변과 동해안 파도를 만날 수 있는 곳." },
    { id: "jeju-woljeongri", name: "월정리해수욕장", region: "제주 제주시", lat: 33.55598, lon: 126.7978, image: "https://images.unsplash.com/photo-1439405326854-014607f694d7?q=85&w=900&auto=format&fit=crop", desc: "제주 동쪽의 감각적인 해변 풍경과 서핑을 함께 즐기는 곳." },
    { id: "pohang-wolpo", name: "월포해수욕장", region: "경북 포항", lat: 36.20313, lon: 129.37126, image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=85&w=900&auto=format&fit=crop", desc: "포항 북부의 동해안 스웰을 받는 대표적인 해변." },
    { id: "yangyang-jukdo", name: "죽도해수욕장", region: "강원 양양", lat: 37.97496, lon: 128.75947, image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=85&w=900&auto=format&fit=crop", desc: "국내 서핑 메카 양양의 대표 스팟. 초보자부터 상급자까지 찾는 해변." },
    { id: "jeju-jungmun", name: "중문색달해수욕장", region: "제주 서귀포", lat: 33.2442, lon: 126.4088, image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=85&w=900&auto=format&fit=crop", desc: "제주 남쪽 스웰을 받는 스팟, 겨울철 파워풀한 파도." },
    { id: "ulsan-jinha", name: "진하해수욕장", region: "울산 울주", lat: 35.3833, lon: 129.3461, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?q=85&w=900&auto=format&fit=crop", desc: "명선도 앞 넓은 백사장을 낀 동남부 스팟." },
  ];

  S.REVIEWS = {
    "yangyang-jukdo": [{ user: "서핑초보", rating: 5, text: "강습샵이 많아서 초보자에게 최고예요. 주말엔 사람이 많아요." }, { user: "웨이브헌터", rating: 4, text: "가을 스웰 들어올 때 파워가 좋습니다." }],
    "yangyang-ingu": [{ user: "롱보더K", rating: 4, text: "죽도보다 한적해서 롱보드 타기 좋아요." }],
    "busan-songjeong": [{ user: "부산로컬", rating: 4, text: "퇴근 후 저녁 서핑하기 좋은 접근성." }, { user: "여행자J", rating: 3, text: "여름엔 물놀이객이 많아 라인업이 붐빕니다." }],
    "jeju-jungmun": [{ user: "제주살이", rating: 5, text: "겨울 스웰이 파워풀해서 상급자에게 추천." }],
    "goseong-bongsudae": [{ user: "한적함추구", rating: 5, text: "사람 적고 물 깨끗해요. 편의시설은 적은 편." }],
    "pohang-dogu": [{ user: "동해서퍼", rating: 3, text: "바람 방향 잘 보고 가야 함." }],
    "gangneung-sacheon": [{ user: "카페투어", rating: 4, text: "서핑 후 근처 카페거리 들르기 좋아요." }],
    "ulsan-jinha": [{ user: "울산토박이", rating: 4, text: "백사장이 넓어서 초보 연습하기 편합니다." }],
  };

  S.state = {
    favorites: savedFavorites.filter((id) => S.SPOTS.some((spot) => spot.id === id)),
    user: (() => {
      try {
        const raw = sessionStorage.getItem("sk_user");
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    })(),
    loggedIn: (() => {
      try {
        if (sessionStorage.getItem("sk_user")) return true;
        return sessionStorage.getItem("sk_logged_in") === "true";
      } catch (error) {
        return false;
      }
    })(),
    showFavOnly: false,
    search: "",
    page: 0,
    simMode: "normal",
    data: {},
    conditionsCache: savedConditions,
    map: null,
    markers: {},
  };
})(window.SurfKorea = window.SurfKorea || {});
