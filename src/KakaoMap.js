import React, { useEffect,useState,useRef } from "react";

const KakaoMap = () => {
  const isLoaded = useRef(false); // ✅ 중복 실행 방지
  const [estimatedTime, setEstimatedTime] = useState(null);
  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;

    const loadKakaoMap = async () => {
      if (window.kakao && window.kakao.maps) {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
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

        console.log("출발지:", startLat, startLng, "도착지:", endLat, endLng);

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
              map: map,
              title: "출발지",
              image: new window.kakao.maps.MarkerImage(
                "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png", // ✅ 빨간색 깃발
                new window.kakao.maps.Size(36, 37),
                { offset: new window.kakao.maps.Point(18, 37) }
              )
            });

            const endMarker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(destination.y, destination.x),
              map: map,
              title: "도착지",
              image: new window.kakao.maps.MarkerImage(
                "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png", // ✅ 파란색 깃발
                new window.kakao.maps.Size(36, 37),
                { offset: new window.kakao.maps.Point(18, 37) }
              )
            });
            // 선형 보간 예시: 각 두 점 사이에 numSegments개의 중간 점 생성
            function interpolatePoints(points, numSegments) {
              const interpolated = [];
              for (let i = 0; i < points.length - 1; i++) {
                const start = points[i];
                const end = points[i + 1];
                interpolated.push(start); // 시작 점 추가
                for (let t = 1; t < numSegments; t++) {
                  const ratio = t / numSegments;
                  const lat = start.getLat() + (end.getLat() - start.getLat()) * ratio;
                  const lng = start.getLng() + (end.getLng() - start.getLng()) * ratio;
                  interpolated.push(new window.kakao.maps.LatLng(lat, lng));
                }
              }
              interpolated.push(points[points.length - 1]); // 마지막 점 추가
              return interpolated;
            }
            // ✅ 경로(Polyline) 좌표 변환 → `guides` 활용하여 자연스럽게 표시
            let polylinePath = [];
            sections.guides.forEach(guide => {
              polylinePath.push(new window.kakao.maps.LatLng(guide.y, guide.x));
            });
            // 각 구간에 5개의 중간 점을 추가 (선형 보간)
            const smoothPath = interpolatePoints(polylinePath, 5);
            // ✅ 경로 그리기
            const polyline = new window.kakao.maps.Polyline({
              path: smoothPath,
              strokeWeight: 3,
              strokeColor: "#66D760",
              strokeOpacity: 1,
              strokeStyle: "solid"
            });
            polyline.setMap(map);

            // ✅ 거리 & 예상 시간 가져오기
            const distance = route.summary.distance; // 미터 단위
            const duration = route.summary.duration; // 초 단위
            console.log(`📍 거리: ${distance}m, ⏳ 소요 시간: ${duration}초`);

           

            // // ✅ 중간 지점 (경로의 절반 지점) 찾기
            // const middleIndex = Math.floor(polylinePath.length / 2 + polylinePath.length /9);
            // const middlePoint = polylinePath[middleIndex];
            // console.log(`


            //   middlePoint ${middlePoint}
              
            //   `,)
            const estimatedTimeMinutes = (duration / 60).toFixed(0);
            setEstimatedTime(estimatedTimeMinutes);
            
            // ✅ 웹뷰에서 네이티브 앱으로 예상 소요 시간 전달
            const messageData = {
              type: 'estimatedTime',
              estimatedTime: estimatedTimeMinutes,
              distance: distance,
              duration: duration
            };
            
           
            
            // React Native WebView
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
            }
            
            // ✅ CustomOverlay를 사용하여 예상 소요 시간 표시
            // const timeOverlay = new window.kakao.maps.CustomOverlay({
            //   position: middlePoint,
            //   content: `<div style="
            //     background: #fff;
            //     padding: 5px 10px;
            //     border-radius: 5px;
            //     font-size: 12px;
            //     font-weight: bold;
            //     box-shadow: 0px 2px 5px rgba(0,0,0,0.2);
            //   ">🚗 예상 소요 시간: ${(duration / 60).toFixed(0)}분</div>`,
            //   yAnchor: 1.5
            // });
            // timeOverlay.setMap(map);

            // ✅ 지도 중심을 경로 전체가 보이도록 설정
            const bounds = new window.kakao.maps.LatLngBounds();
            polylinePath.forEach(point => bounds.extend(point));
            map.setBounds(bounds);
          }
        } catch (error) {
          console.error("🚨 Kakao Directions API 호출 실패:", error);
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
      <div id="map" style={{ width: "100%", height: "100%" }}>
        {/* 왼쪽 상단 고정 패널 */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        background: "#fff",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        fontWeight: "bold",
        boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
        zIndex: 100
      }}>
        <div>🚗 예상 소요 시간: {estimatedTime ? estimatedTime : "불러오는 중..."}분</div>
        {/* {estimatedTime && (
          <button 
            onClick={() => {
              const messageData = {
                type: 'estimatedTime',
                estimatedTime: estimatedTime,
                timestamp: new Date().toISOString()
              };
              
              // Android WebView
              if (window.Android && window.Android.onEstimatedTimeReceived) {
                window.Android.onEstimatedTimeReceived(JSON.stringify(messageData));
              }
              
              // iOS WebView
              if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.estimatedTimeHandler) {
                window.webkit.messageHandlers.estimatedTimeHandler.postMessage(messageData);
              }
              
              // React Native WebView
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
              }
              
              console.log('📱 앱으로 데이터 전송 완료:', messageData);
            }}
            style={{
              marginTop: "5px",
              padding: "5px 10px",
              background: "#007AFF",
              color: "white",
              border: "none",
              borderRadius: "3px",
              fontSize: "10px",
              cursor: "pointer"
            }}
          >
            📱 앱으로 전송
          </button>
        )} */}
      </div>
      </div>
    </div>
  );
};

export default KakaoMap;