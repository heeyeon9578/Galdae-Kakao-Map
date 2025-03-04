import React, { useEffect } from "react";

const KakaoMap = () => {
  useEffect(() => {
    const loadKakaoMap = async () => {
      if (window.kakao && window.kakao.maps) {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 기본 위치 (서울)
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

        // ✅ Kakao REST API 호출하여 경로 정보 가져오기
        const KAKAO_REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
        const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${startLng},${startLat}&destination=${endLng},${endLat}&priority=RECOMMEND`;

        try {
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Authorization": `KakaoAK ${KAKAO_REST_API_KEY}`,
              "Content-Type": "application/json"
            }
          });

          const result = await response.json();
          console.log("🚀 API 응답:", result);

          if (result.routes) {
            const route = result.routes[0];
            const sections = route.sections[0];

            // ✅ 출발지 & 도착지 마커 설정
            const origin = route.summary.origin;
            const destination = route.summary.destination;

            const startMarker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(origin.y, origin.x),
              map: map
            });

            const endMarker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(destination.y, destination.x),
              map: map
            });

            // ✅ 길(Polyline) 좌표 변환
            let polylinePath = [];
            sections.roads.forEach(road => {
              const vertexes = road.vertexes; // (경도, 위도, 경도, 위도, ...) 구조
              for (let i = 0; i < vertexes.length; i += 2) {
                polylinePath.push(new window.kakao.maps.LatLng(vertexes[i + 1], vertexes[i]));
              }
            });

            // ✅ 경로 그리기
            const polyline = new window.kakao.maps.Polyline({
              path: polylinePath,
              strokeWeight: 5,
              strokeColor: "#FF0000",
              strokeOpacity: 0.7,
              strokeStyle: "solid"
            });
            polyline.setMap(map);

            // ✅ 거리 & 예상 시간 표시
            const distance = route.summary.distance; // 단위: 미터
            const duration = route.summary.duration; // 단위: 초
            document.getElementById("routeInfo").innerText = 
              `📍 거리: ${(distance / 1000).toFixed(2)} km, ⏳ 예상 시간: ${(duration / 60).toFixed(2)} 분`;

            // ✅ 지도의 중심을 출발지 & 도착지 사이로 맞추기
            const bounds = new window.kakao.maps.LatLngBounds();
            bounds.extend(new window.kakao.maps.LatLng(origin.y, origin.x));
            bounds.extend(new window.kakao.maps.LatLng(destination.y, destination.x));
            map.setBounds(bounds);
          }
        } catch (error) {
          console.error("🚨 Kakao Directions API 호출 실패:", error);
          document.getElementById("routeInfo").innerText = "❌ 경로를 불러올 수 없습니다.";
        }
      } else {
        console.error("🚨 Kakao Maps API 로드 실패");
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