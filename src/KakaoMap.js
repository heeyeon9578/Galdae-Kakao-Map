import React, { useEffect } from "react";

const KakaoMap = () => {
  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao && window.kakao.maps) {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 기본 서울 중심 좌표
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);

        // 📌 Query Parameter에서 출발지 & 도착지 가져오기
        function getQueryParam(param) {
          const urlParams = new URLSearchParams(window.location.search);
          return urlParams.get(param);
        }

        const startLat = parseFloat(getQueryParam("startLat")) || 37.5665;
        const startLng = parseFloat(getQueryParam("startLng")) || 126.9780;
        const endLat = parseFloat(getQueryParam("endLat")) || 37.5013;
        const endLng = parseFloat(getQueryParam("endLng")) || 127.0396;

        // 출발지 마커 추가
        const startMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(startLat, startLng),
          map: map
        });

        // 도착지 마커 추가
        const endMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(endLat, endLng),
          map: map
        });

        // 경로 검색 및 표시
        const directionsService = new window.kakao.maps.services.Directions();
        directionsService.route({
          origin: new window.kakao.maps.LatLng(startLat, startLng),
          destination: new window.kakao.maps.LatLng(endLat, endLng),
          success: function(result) {
            const route = result.routes[0];
            if (route && route.sections.length > 0) {
              const polylinePath = route.sections[0].roads.map(road => 
                new window.kakao.maps.LatLng(road.y, road.x)
              );
              const distance = route.sections[0].distance;
              const duration = route.sections[0].duration;

              // 경로 그리기
              const polyline = new window.kakao.maps.Polyline({
                path: polylinePath,
                strokeWeight: 5,
                strokeColor: "#FF0000",
                strokeOpacity: 0.7,
                strokeStyle: "solid"
              });
              polyline.setMap(map);

              // 거리 & 예상 시간 표시
              document.getElementById("routeInfo").innerText = 
                `📍 거리: ${(distance / 1000).toFixed(2)} km, ⏳ 예상 시간: ${(duration / 60).toFixed(2)} 분`;
            }
          },
          fail: function(status) {
            console.error("길찾기 API 실패:", status);
            document.getElementById("routeInfo").innerText = "경로를 불러올 수 없습니다.";
          }
        });

      } else {
        console.error("Kakao Maps API 로드 실패");
      }
    };

    // ✅ Kakao Maps API가 없으면 동적 로드
    if (!window.kakao || !window.kakao.maps) {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(loadKakaoMap);
      };
      document.head.appendChild(script);
    } else {
      loadKakaoMap();
    }
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
      <div 
        id="routeInfo" 
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "5px",
          boxShadow: "0px 2px 5px rgba(0,0,0,0.2)"
        }}>
        📍 경로 정보 로딩 중...
      </div>
    </div>
  );
};

export default KakaoMap;