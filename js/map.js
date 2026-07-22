(function (S) {
  S.initMap = function () {
    if (typeof L === "undefined") throw new Error("지도 라이브러리를 불러오지 못했습니다.");
    S.state.map = L.map("map", { scrollWheelZoom: false }).setView([36.4, 127.9], 6.6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(S.state.map);

    S.SPOTS.forEach((spot) => {
      const icon = L.divIcon({ className: "", html: `<div class="surf-pin na" id="pin-${spot.id}"></div>`, iconSize: [26, 26], iconAnchor: [13, 26] });
      const marker = L.marker([spot.lat, spot.lon], { icon }).addTo(S.state.map);
      marker.bindPopup(`<b>${spot.name}</b><br>${spot.region}<br><span id="popup-${spot.id}">불러오는 중...</span>`);
      marker.on("click", () => S.openSpotModal(spot.id));
      S.state.markers[spot.id] = marker;
    });
  };

  S.showMapError = function (message = "지도를 불러오지 못했습니다.") {
    const map = document.getElementById("map");
    if (!map) return;
    map.innerHTML = `<div class="map-error"><span>◌</span><strong>${message}</strong><small>스팟 카드는 계속 확인할 수 있습니다.</small></div>`;
  };

  S.updateMarker = function (spotId) {
    const d = S.state.data[spotId];
    const pin = document.getElementById(`pin-${spotId}`);
    const popup = document.getElementById(`popup-${spotId}`);
    if (!pin) return;
    if (d?.status === "ok") {
      pin.className = `surf-pin ${d.grade}`;
      if (popup) popup.textContent = `${d.source === "khoa" ? "서핑지수" : "서핑 점수"} ${d.score == null ? S.gradeLabel(d.grade) : d.score} · 파고 ${d.wave?.toFixed(1)}m · 바람 ${Math.round(d.wind)}km/h`;
    } else if (d?.status === "error") {
      pin.className = "surf-pin na";
      if (popup) popup.textContent = "데이터 오류: " + d.message;
    } else if (d?.status === "empty") {
      pin.className = "surf-pin na";
      if (popup) popup.textContent = "데이터 없음";
    }
  };
})(window.SurfKorea);
