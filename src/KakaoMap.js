import React, { useEffect } from "react";

const KakaoMap = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=3c70762ac3e65b60c8501c34cb1c3257&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
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
      });
    };
  }, []);

  return <div id="map" style={{ width: "100vw", height: "100vh" }} />;
};

export default KakaoMap;