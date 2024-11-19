import React from 'react';
import styles from '../styles/MapDisplay.module.css';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { LoginState } from '../data/context';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import supabase from '../data/supabaseClient';

interface Restaurant {
  title: string;
  price: string | null;
  categoryName: string;
  address: string;
  neighborhood: string;
  street: string;
  city: string;
  state: string;
  countryCode: string;
  phone: string | null;
  phoneUnformatted: string | null;
  latitude: number;
  longitude: number;
  plusCode: string;
  totalScore: number | null;
  imageUrl: string;
}

const INITIAL_CENTER = [
  106.6707418, 10.8546639
];
const INITIAL_ZOOM = 10.12;

export default function MapDisplay({ apikey }: { apikey: string }) {
  const navigate = useNavigate();
  const mapRef = React.useRef<undefined | any>();
  const mapContainerRef = React.useRef();
  const [, setMapLoaded] = React.useState(false);
  const [userSetting, setUserSetting] = React.useState(false);
  const { setIsLoggedIn } = React.useContext(LoginState);
  const [center, setCenter] = React.useState(INITIAL_CENTER);
  const [zoom, setZoom] = React.useState(INITIAL_ZOOM);
  const [dataset, setDataset] = React.useState<Restaurant[]>([]);

  const getData = async () => {
    const { data, error } = await supabase
      .from('gisdata')
      .select();
    if (error) {
      console.log("ERROR: ", error);
      return null;
    }
    else {
      return data;
    }
  };

  // Fetch the data
  React.useEffect(() => {
    const fetchData = async () => {
      const data = await getData();
      if (data) {
        setDataset(data as Restaurant[]);
      }
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    mapboxgl.accessToken = apikey;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    mapRef.current.on('move', () => {
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();

      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    // Manage popup
    let currentPopup: mapboxgl.Popup | null = null;

    mapRef.current.on('load', () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: dataset.map((restaurant: { longitude: any; latitude: any; title: any; price: any; categoryName: any; address: any; neighborhood: any; street: any; city: any; state: any; countryCode: any; phone: any; phoneUnformatted: any; totalScore: any; imageUrl: any; }) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [restaurant.longitude, restaurant.latitude], // [longitude, latitude]
          },
          properties: {
            title: restaurant.title,
            price: restaurant.price,
            categoryName: restaurant.categoryName,
            address: restaurant.address,
            neighborhood: restaurant.neighborhood,
            street: restaurant.street,
            city: restaurant.city,
            state: restaurant.state,
            countryCode: restaurant.countryCode,
            phone: restaurant.phone,
            phoneUnformatted: restaurant.phoneUnformatted,
            totalScore: restaurant.totalScore,
            imageUrl: restaurant.imageUrl,
          }
        }))
      };

      // Add MapboxGeocoder with localGeocoder
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        zoom: 14,
        placeholder: 'Search restaurant',
        localGeocoder: (query: string) => {
          const matchingFeatures = geojsonData.features.filter((feature) =>
            feature.properties.title.toLowerCase().includes(query.toLowerCase())
          );

          return matchingFeatures.map((feature) => ({
            center: feature.geometry.coordinates,
            geometry: feature.geometry,
            place_name: `${feature.properties.title} - ${feature.properties.address || 'Address not available'}`,
            text: feature.properties.title,
            properties: feature.properties,
            type: 'Feature',
          }));
        },
        mapboxgl: mapboxgl,
      });

      mapRef.current.addControl(geocoder);

      geocoder.on('result', (e) => {
        const selectedFeature = e.result;

        if (currentPopup) {
          currentPopup.remove(); // Remove existing popup if any
        }

        if (selectedFeature && selectedFeature.geometry) {
          const { coordinates } = selectedFeature.geometry;
          const { title, address, categoryName, phone, totalScore } = selectedFeature.properties;

          currentPopup = new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <strong>${title}</strong><br>
              <em>Category:</em> ${categoryName || 'Not available'}<br>
              <em>Address:</em> ${address || 'Not available'}<br>
              <em>Phone:</em> ${phone || 'Not available'}<br>
              ${totalScore ? `<strong>Rating:</strong> ${totalScore} ⭐<br>` : ''}
            `)
            .addTo(mapRef.current);

          mapRef.current.flyTo({
            center: coordinates,
            zoom: 14,
          });
        }
      });

      mapRef.current.on('mouseenter', 'restaurant-layer', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });

      mapRef.current.on('mouseleave', 'restaurant-layer', () => {
        mapRef.current.getCanvas().style.cursor = '';
      })

      mapRef.current.addSource('restaurant', {
        type: 'geojson',
        data: geojsonData,
      });
      mapRef.current.addLayer({
        id: 'restaurant-layer',
        type: 'circle',
        source: 'restaurant',
        paint: {
          'circle-radius': 4,
          'circle-stroke-width': 2,
          'circle-color': 'red',
          'circle-stroke-color': 'white'
        }
      });

      setMapLoaded(true);
    });

    mapRef.current.on('click', 'restaurant-layer', (e: any) => {
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ['restaurant-layer']
      });

      if (features.length) {
        const feature = features[0];
        const { title, price, categoryName, address, phone, imageUrl, totalScore } = feature.properties;

        if (currentPopup) {
          currentPopup.remove(); // Remove existing popup if any
        }

        const fallbackImageUrl = "https://via.placeholder.com/150";

        currentPopup = new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
              <strong>${title}</strong><br>
            <em>Category:</em> ${categoryName || 'Not available'}<br>
            <em>Price:</em> ${price || 'Not available'}<br>
            <em>Address:</em> ${address || 'Not available'}<br>
            <em>Phone:</em> ${phone || 'Not available'}<br>
            ${totalScore ? `<strong>Rating:</strong> ${totalScore} ⭐<br>` : ''}
          `)
          .addTo(mapRef.current);
      }

    });

    mapRef.current.on('mouseenter', 'restaurant-layer', () => {
      mapRef.current.getCanvas().style.cursor = 'pointer';
    });

    mapRef.current.on('mouseleave', 'restaurant-layer', () => {
      mapRef.current.getCanvas().style.cursor = '';
    });

    // Add geolocate control to the map.
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      })
    );

    return () => {
      mapRef.current.remove();
    }
  }, []);


  // Gets the first letter from the username and capitalizes it
  const getFirstLetterUsername = () => {
    const str = localStorage.getItem('username');
    return str ? str.charAt(0).toUpperCase() : '';
  };

  return (
    <>
      {/* Map sections */}
      <div
        id="mapboxgl-container"
        ref={mapContainerRef}
        style={{
          height: '100vh',
          width: '100%',
        }}>
        {/* Component Sections */}
        <div className={styles.componentContainer}>
          <div className={styles.topNav}>
            <div className={styles.topLeftNav}>
              <span
                onClick={() => {
                  setUserSetting(!userSetting);
                }}
                className={styles.userSettingText}>{getFirstLetterUsername()}</span>
              {userSetting && <div className={styles.userSettingContainer}>
                <p className={styles.userSettingHeader}>Hello, {localStorage.getItem('username')}</p>
                <p className={styles.userSettingOption1}>Manage your account</p>
                <p
                  className={styles.userSettingOption2}
                  onClick={() => {
                    localStorage.removeItem('username');
                    localStorage.removeItem('isLoggedIn');
                    setIsLoggedIn(false);
                    navigate("/");
                  }}>Log out</p>
              </div>}
              <img src={logo} className={styles.logoMap} />
            </div>
            <div className={styles.topRightNav}>
            </div>
          </div>
        </div>
      </div>
    </>);
}
