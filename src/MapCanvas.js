import { useEffect, useState } from "react";
import { Map } from "react-kakao-maps-sdk";
import { getBoundsOfDistance } from "geolib";

const MapCanvas = () => {
    const [map, setMap] = useState();

    const isPointInBounds = (point, bounds) => {
        return (
            point.longitude >= bounds[0].longitude &&
            point.latitude >= bounds[0].latitude &&
            point.longitude <= bounds[1].longitude &&
            point.latitude <= bounds[1].latitude
        );
    };

    const isEnd = (point, bounds) => {
        return point.latitude < bounds[0].latitude;
    };

    const getNextPoint = (currentPoint, distance, bounds) => {
        const [sw, ne] = getBoundsOfDistance(currentPoint, distance * 2);
        let nextPoint = { latitude: currentPoint.latitude, longitude: ne.longitude };

        // 오른쪽으로 넘어간 경우
        if (!isPointInBounds(nextPoint, bounds)) {
            nextPoint = { latitude: sw.latitude, longitude: bounds[0].longitude };
        }
        return nextPoint;
    };

    const sleep = (ms) => {
        return new Promise((r) => setTimeout(r, ms));
    };

    const { kakao } = window;

    useEffect(() => {
        if (!map) return;

        const calcFunc = async () => {
            const output = [];

            // center (37.37011987, 126.88353789)
            const center = { latitude: 37.37011987, longitude: 126.88353789 };
            const [southWest, northEest] = getBoundsOfDistance(center, 20000);
            const startPoint = { latitude: northEest.latitude, longitude: southWest.longitude };

            const ps = new kakao.maps.services.Places();

            const keyword = "맛집";

            let movablePoint = startPoint;
            let i = 0;
            while (true) {
                if (isEnd(movablePoint, [southWest, northEest])) {
                    break;
                }
                const [originSW, originNE] = getBoundsOfDistance(movablePoint, 500);
                const kakaoSW = new kakao.maps.LatLng(originSW.latitude, originSW.longitude);
                const kakaoNE = new kakao.maps.LatLng(originNE.latitude, originNE.longitude);
                const searchBounds = new kakao.maps.LatLngBounds(kakaoSW, kakaoNE);
                const searchOption = {
                    bounds: searchBounds,
                    sort: kakao.maps.services.SortBy.DISANCE,
                    page: 1,
                };

                const placesSearchCB = (data, status, pagination) => {
                    if (pagination && pagination.totalCount > 0 && pagination.current < pagination.last) {
                        searchOption["page"] = pagination.current + 1;
                        ps.keywordSearch(keyword, placesSearchCB, searchOption);
                    }
                    if (status === kakao.maps.services.Status.OK) {
                        for (var i = 0; i < data.length; i++) {
                            output.push({
                                placeUrl: data[i].place_url,
                                x: data[i].x, // longitude
                                y: data[i].y, // latitude
                                placeKeyword: keyword,
                            });
                        }
                    }
                };

                await sleep(1);
                ps.keywordSearch(keyword, placesSearchCB, searchOption);
                console.log(i);
                i++;

                movablePoint = getNextPoint(movablePoint, 500, [southWest, northEest]);
            }

            fetch("http://localhost:5002", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: output.reduce((acc, current) => {
                        if (acc.findIndex(({ placeUrl }) => placeUrl === current.placeUrl) === -1) {
                            acc.push(current);
                        }
                        return acc;
                    }, []),
                }),
            });
        };

        calcFunc();
    }, [map]);

    return (
        <>
            <Map
                center={{ lat: 33.5563, lng: 126.79581 }}
                style={{ width: "100%", height: "720px" }}
                onCreate={setMap}
            ></Map>
        </>
    );
};

export default MapCanvas;
