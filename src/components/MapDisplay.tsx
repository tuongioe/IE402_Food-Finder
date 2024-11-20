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
  const geolocateControlRef = React.useRef<mapboxgl.GeolocateControl | null>(null);
  const [, setMapLoaded] = React.useState(false);
  const [userSetting, setUserSetting] = React.useState(false);
  const { setIsLoggedIn } = React.useContext(LoginState);
  const [center, setCenter] = React.useState(INITIAL_CENTER);
  const [zoom, setZoom] = React.useState(INITIAL_ZOOM);
  const [dataset, setDataset] = React.useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);

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

        if (selectedFeature && selectedFeature.geometry) {
          const { coordinates } = selectedFeature.geometry;
          setSelectedRestaurant({
            title: selectedFeature.properties.title,
            price: selectedFeature.properties.price || null,
            categoryName: selectedFeature.properties.categoryName || 'Not available',
            address: selectedFeature.properties.address || 'Not available',
            neighborhood: selectedFeature.properties.neighborhood || 'Not available',
            street: selectedFeature.properties.street || 'Not available',
            city: selectedFeature.properties.city || 'Not available',
            state: selectedFeature.properties.state || 'Not available',
            countryCode: selectedFeature.properties.countryCode || 'Not available',
            phone: selectedFeature.properties.phone || 'Not available',
            phoneUnformatted: selectedFeature.properties.phoneUnformatted || null,
            latitude: coordinates[1],
            longitude: coordinates[0],
            plusCode: selectedFeature.properties.plusCode || '',
            totalScore: selectedFeature.properties.totalScore || null,
            imageUrl: selectedFeature.properties.imageUrl || '',
          });

          mapRef.current.flyTo({
            center: coordinates,
            zoom: 14,
          });
        }
      });

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
        const feature = features[0].properties as Restaurant;
        setSelectedRestaurant(feature);
      }

    });

    mapRef.current.on('mouseenter', 'restaurant-layer', () => {
      mapRef.current.getCanvas().style.cursor = 'pointer';
    });

    mapRef.current.on('mouseleave', 'restaurant-layer', () => {
      mapRef.current.getCanvas().style.cursor = '';
    });

    mapRef.current.on('click', 'restaurant-layer', (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ['restaurant-layer'],
      });

      if (features.length) {
        const feature = features[0];

        const restaurant: Restaurant = {
          title: feature.properties?.title || 'Unknown',
          price: feature.properties?.price || null,
          categoryName: feature.properties?.categoryName || 'Not available',
          address: feature.properties?.address || 'Not available',
          neighborhood: feature.properties?.neighborhood || 'Not available',
          street: feature.properties?.street || 'Not available',
          city: feature.properties?.city || 'Not available',
          state: feature.properties?.state || 'Not available',
          countryCode: feature.properties?.countryCode || 'Not available',
          phone: feature.properties?.phone || 'Not available',
          phoneUnformatted: feature.properties?.phoneUnformatted || null,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          totalScore: feature.properties?.totalScore || null,
          imageUrl: feature.properties?.imageUrl || '',
          plusCode: '',
        };

        setSelectedRestaurant(restaurant);

        mapRef.current.flyTo({
          center: [restaurant.longitude, restaurant.latitude],
          zoom: 14,
        });
      }
    });

    // Add geolocate control to the map.
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });

    mapRef.current.addControl(geolocateControl, 'top-left');
    geolocateControlRef.current = geolocateControl;

    return () => {
      mapRef.current.remove();
    }
  }, [dataset]);


  // Gets the first letter from the username and capitalizes it
  const getFirstLetterUsername = () => {
    const str = localStorage.getItem('username');
    return str ? str.charAt(0).toUpperCase() : '';
  };

  // Fetch direction
  const getDirections = async (latitude: number, longitude: number) => {
    const geolocateControl = geolocateControlRef.current;
    if (!geolocateControl) {
      console.error('GeolocateControl not initialized');
      return;
    }

    if (selectedRestaurant === null)
      return;

    const userLocation = await new Promise<[number, number]>((resolve, reject) => {
      geolocateControl.once('geolocate', (e) => {
        resolve([e.coords.longitude, e.coords.latitude]);
      });
      geolocateControl.trigger(); // Trigger geolocation
    });

    const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${selectedRestaurant.longitude},${selectedRestaurant.latitude}?geometries=geojson&access_token=${apikey}`);
    const data = await response.json();

    if (data.routes && data.routes.length) {
      const route = data.routes[0].geometry;

      // Add or update the route source
      if (mapRef.current?.getSource('route')) {
        mapRef.current.getSource('route').setData({
          type: 'Feature',
          geometry: route,
        });
      } else {
        mapRef.current?.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: route,
          },
        });

        mapRef.current?.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#4264fb',
            'line-width': 5,
          },
        });
      }

      // Fit map bounds to route
      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach(([lng, lat]: [number, number]) => bounds.extend([lng, lat]));
      mapRef.current?.fitBounds(bounds, { padding: 20 });
    } else {
      console.error('No route found');
    }
  };

  // Cancel direction
  const cancelDirections = () => {
    if (mapRef.current) {
      // Check if the 'route' layer exists before trying to remove it
      if (mapRef.current.getLayer('route')) {
        mapRef.current.removeLayer('route');
      }
      // Check if the 'route' source exists before trying to remove it
      if (mapRef.current.getSource('route')) {
        mapRef.current.removeSource('route');
      }
    }
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
        {selectedRestaurant &&
          <div className={styles.sidebarContainer} id="sidebar">
            <button
              className={styles.closeButton}
              onClick={() => setSelectedRestaurant(null)}
            >X</button>
            <div>
              <h2>{selectedRestaurant.title}</h2>
              <p>
                <strong>Category:</strong> {selectedRestaurant.categoryName || 'Not available'}
              </p>
              <p>
                <strong>Address:</strong> {selectedRestaurant.address || 'Not available'}
              </p>
              <p>
                <strong>Phone:</strong> {selectedRestaurant.phone || 'Not available'}
              </p>
              <p>
                <strong>Rating:</strong> {selectedRestaurant.totalScore || 'Not available'} ⭐
              </p>
              <button
                className={styles.directionButton}
                onClick={() => { getDirections(selectedRestaurant.latitude, selectedRestaurant.longitude) }}
              >
                Directions
              </button>
              <button
                className={styles.cancelDirections}
                onClick={cancelDirections}
              >
                Cancel Directions
              </button>
            </div>
          </div>}
      </div>
    </>);
}
