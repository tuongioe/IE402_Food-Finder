import React from "react";
import styles from "../styles/MapDisplay.module.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { LoginState } from "../data/context";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchBox } from "@mapbox/search-js-react";
import { MdMyLocation } from "react-icons/md";

const INITIAL_CENTER = [106.6707418, 10.8546639];
const INITIAL_ZOOM = 10.12;

const ButtonGeolocation = ({
  mapRef,
}: {
  mapRef?: React.MutableRefObject<any>;
}) => {
  const customElement = () => {
    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage = "url(./src/assets/userLocation.png)";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.width = "40px";
    markerElement.style.height = "40px";
    markerElement.style.borderRadius = "50%";
    return markerElement;
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (mapRef?.current) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              essential: true,
            });

            const userLocationMarker = new mapboxgl.Marker({
              element: customElement(),
            })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current);
          }
        },
        (error) => {
          console.log("Error getting geolocation: ", error);
          alert("Unable to retrieve your location.");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className={styles.geoButtonMyLocation} onClick={handleGeolocation}>
      <MdMyLocation />
    </div>
  );
};

export default function MapDisplay({ apikey }: { apikey: string }) {
  const navigate = useNavigate();
  const mapRef = React.useRef();
  const mapContainerRef = React.useRef();
  const [, setMapLoaded] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [userSetting, setUserSetting] = React.useState(false);
  const { setIsLoggedIn } = React.useContext(LoginState);
  const [center, setCenter] = React.useState(INITIAL_CENTER);
  const [zoom, setZoom] = React.useState(INITIAL_ZOOM);

  React.useEffect(() => {
    mapboxgl.accessToken = apikey;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: center,
      zoom: zoom,
    });

    mapRef.current.on("move", () => {
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();

      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    mapRef.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  // Gets the first letter from the username and capitalizes it
  const getFirstLetterUsername = () => {
    const str = localStorage.getItem("username");
    return str ? str.charAt(0).toUpperCase() : "";
  };

  return (
    <>
      {/* Map sections */}
      <div
        id="mapboxgl-container"
        ref={mapContainerRef}
        style={{
          height: "100vh",
          width: "100%",
        }}
      >
        {/* Component Sections */}
        <div className={styles.componentContainer}>
          <div className={styles.topNav}>
            <div className={styles.topLeftNav}>
              <img src={logo} className={styles.logoMap} />
              <div className={styles.searchBarContainer}>
                <SearchBox
                  accessToken={apikey}
                  map={mapRef.current}
                  mapboxgl={mapboxgl}
                  value={inputValue}
                  onChange={(d) => {
                    setInputValue(d);
                  }}
                  marker
                />
              </div>
              <ButtonGeolocation mapRef={mapRef} />
            </div>
            <div className={styles.topRightNav}>
              <span
                onClick={() => {
                  setUserSetting(!userSetting);
                }}
                className={styles.userSettingText}
              >
                {getFirstLetterUsername()}
              </span>
              {userSetting && (
                <div className={styles.userSettingContainer}>
                  <p className={styles.userSettingHeader}>
                    Hello, {localStorage.getItem("username")}
                  </p>
                  <p className={styles.userSettingOption1}>
                    Manage your account
                  </p>
                  <p
                    className={styles.userSettingOption2}
                    onClick={() => {
                      localStorage.removeItem("username");
                      localStorage.removeItem("isLoggedIn");
                      setIsLoggedIn(false);
                      navigate("/");
                    }}
                  >
                    Log out
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
