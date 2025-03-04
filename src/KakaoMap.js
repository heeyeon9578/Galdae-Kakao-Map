import React, { useEffect } from "react";

const KakaoMap = () => {
  useEffect(() => {
    const loadKakaoMap = () => {
      if (window.kakao && window.kakao.maps) {
        // ✅ API가 로드된 후 실행
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심 좌표
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);

        // 마커 추가
        const markerPosition = new window.kakao.maps.LatLng(37.5665, 126.9780);
        const marker = new window.kakao.maps.Marker({ position: markerPosition });
        marker.setMap(map);
      } else {
        console.error("Kakao Maps API 로드 실패");
      }
    };

    // ✅ Kakao Maps API가 없으면 동적 로드
    if (!window.kakao || !window.kakao.maps) {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_API_KEY}&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(loadKakaoMap); // ✅ API가 완전히 로드된 후 실행
      };
      document.head.appendChild(script);
    } else {
      loadKakaoMap();
    }
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
};

export default KakaoMap;