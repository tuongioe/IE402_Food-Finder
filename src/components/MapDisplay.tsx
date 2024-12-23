import React from "react";
import styles from "../styles/MapDisplay.module.css";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { LoginState } from "../data/context";
import mapboxgl from "mapbox-gl";
import "../styles/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "../styles/mapbox-gl-geocoder.css";
import supabase from "../data/supabaseClient";
import { FaBan, FaDirections, FaRegHeart } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { IoIosStar } from "react-icons/io";
import { MdOutlineRestaurant } from "react-icons/md";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { haversine } from "../func/nearbyLocation";
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

const INITIAL_CENTER = [106.6707418, 10.8546639];
const INITIAL_ZOOM = 12;
const INITIAL_RADIUS = 5;

export default function MapDisplay({ apikey }: { apikey: string }) {
  const navigate = useNavigate();
  const mapRef = React.useRef<undefined | any>();
  const mapContainerRef = React.useRef();
  const geolocateControlRef = React.useRef<mapboxgl.GeolocateControl | null>(
    null
  );
  const [userSetting, setUserSetting] = React.useState(false);
  const { setIsLoggedIn } = React.useContext(LoginState);
  const [center, setCenter] = React.useState(INITIAL_CENTER);
  const [zoom, setZoom] = React.useState(INITIAL_ZOOM);
  const [dataset, setDataset] = React.useState<Restaurant[]>([]);
  const [isSelectedRestaurant, setIsSelectedRestaurant] = React.useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    React.useState<Restaurant | null>(null);
  const [isShownDirection, setIsShownDirection] = React.useState(false);
  const [directionDistance, setDirectionDistance] = React.useState({
    unit: "",
    distance: 0,
  });
  const [buttonSelectedMethod, setButtonSelectedMethod] = React.useState({
    isSelectedAllLocation: true,
    isSelectedNearbyRestaurant: false,
    isSelectedFavoriteRestaurant: false,
  });
  const [nearbyRestaurant, setNearbyRestaurant] = React.useState<Restaurant[]>([]);
  const [favoriteRestaurant, setFavoriteRestaurant] = React.useState<Restaurant[]>([]);
  const [allowUserLocation, setAllowUserLocation] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{ latitude: number | null, longitude: number | null }>({
    latitude: null,
    longitude: null,
  })

  const checkLocationPermission = async (): Promise<boolean> => {
    if (!navigator.permissions || !navigator.geolocation) {
      console.error("Geolocation or Permissions API is not supported in this browser.");
      return false;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" });

      if (permissionStatus.state === "granted") {
        console.log("Permission granted for location access.");

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setAllowUserLocation(true);
              setUserLocation({ latitude, longitude }); // Set the user's location
              resolve(true);
            },
            (error) => {
              console.error("Error getting location:", error);
              resolve(false);
            }
          );
        });
      } else if (permissionStatus.state === "prompt") {
        console.log("Permission is prompt. Asking for location access...");

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log("Location access granted after prompt.");
              setAllowUserLocation(true);
              setUserLocation({ latitude, longitude }); // Set the user's location
              resolve(true);
            },
            (error) => {
              console.error("Location access denied after prompt.", error);
              resolve(false);
            }
          );
        });
      } else {
        console.error("Permission denied for location access.");
        setAllowUserLocation(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
      setAllowUserLocation(false);
      return false;
    }
  };

  const geocoderRef = React.useRef<any | null>(null); //Search geocoder
  const isDirectionActive = React.useRef(false);

  const getData = async () => {
    const { data, error } = await supabase.from("gisdata").select();
    if (error) {
      console.log("ERROR: ", error);
      return null;
    } else {
      return data;
    }
  };

  const getFavoriteData = async () => {
    const { data, error } = await supabase
      .from('favouriteLocation')
      .select(`
        latitude, 
        longitude,
        gisdata (
          latitude,
          longitude,
          *
        )
      `)
      .eq('email', localStorage.getItem('email'));
    if (error) {
      console.error('Error fetching data:', error);
      return null;
    } else {
      return data;
    }
  }

  // Add/Rempve the restaurant
  const roundToPrecision = (value: number, precision: number) => {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  };

  const addToFavorite = async (restaurant: Restaurant) => {
    try {
      const email = localStorage.getItem('email'); // Ensure user is logged in
      if (!email) {
        console.error("User is not logged in.");
        return;
      }

      // Step 1: Normalize latitude and longitude precision
      const normalizedLatitude = roundToPrecision(restaurant.latitude, 5); // Match the precision of gisdata
      const normalizedLongitude = roundToPrecision(restaurant.longitude, 5);

      // Step 2: Check if the restaurant exists in `gisdata`
      const { data: gisdataRecord, error: gisdataError } = await supabase
        .from('gisdata')
        .select('latitude, longitude')
        .eq('latitude', normalizedLatitude)
        .eq('longitude', normalizedLongitude);

      if (gisdataError) {
        console.error("Error checking gisdata:", gisdataError);
        return;
      }

      // Step 3: If not found in `gisdata`, insert it
      if (!gisdataRecord || gisdataRecord.length === 0) {
        const { error: insertGisdataError } = await supabase.from('gisdata').insert({
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
          // Add any other necessary fields required by `gisdata`
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
        });

        if (insertGisdataError) {
          console.error("Error inserting into gisdata:", insertGisdataError);
          return;
        }
      }

      // Step 4: Add to `favouriteLocation`
      const { error } = await supabase.from('favouriteLocation').insert({
        email,
        latitude: normalizedLatitude,
        longitude: normalizedLongitude,
      });

      if (error) {
        console.error("Error adding to favorites:", error);
      } else {
        console.log("Added to favorites successfully.");

        // Step 5: Update local state
        setFavoriteRestaurant((prev) => [...prev, { ...restaurant, latitude: normalizedLatitude, longitude: normalizedLongitude }]);
      }
    } catch (err) {
      console.error("Failed to add to favorites:", err);
    }
  };

  const removeFromFavorite = async (restaurant: Restaurant) => {
    try {
      const userEmail = localStorage.getItem('email');
      if (!userEmail) {
        console.log('Missing email! Did you log in?');
        return;
      }

      const { error } = await supabase
        .from('favouriteLocation')
        .delete()
        .eq('email', userEmail)
        .eq('latitude', roundToPrecision(restaurant.latitude, 5))
        .eq('longitude', roundToPrecision(restaurant.longitude, 5))

      if (error) {
        console.error('Error removing from favorites:', error);
      }

      setFavoriteRestaurant((prev) =>
        prev.filter(
          (fav) =>
            roundToPrecision(fav.latitude, 5) !== roundToPrecision(restaurant.latitude, 5) ||
            roundToPrecision(fav.longitude, 5) !== roundToPrecision(restaurant.longitude, 5)
        )
      );

    }
    catch (error) {
      console.error('Error: ', error);
    }
  };

  // Fetch the data
  React.useEffect(() => {
    const fetchFullData = async () => {
      const data = await getData();
      if (data) {
        setDataset(data as Restaurant[]);
      }
    };

    const fetchFavoriteData = async () => {
      const data = await getFavoriteData();
      if (data) {
        let packageData = [] as Restaurant[];
        data.forEach((index) => {
          packageData.push(index.gisdata)
        })
        packageData.map((restaurant) => ({
          ...restaurant, latitude: roundToPrecision(restaurant.latitude, 5),
          longitude: roundToPrecision(restaurant.longitude, 5),
        }));
        setFavoriteRestaurant(packageData as Restaurant[])
      }
    }

    fetchFavoriteData();
    fetchFullData();
  }, []);

  // Fetch nearby restaurant based on (1. Dataset, 2. Favorite Restaurant)
  React.useEffect(() => {
    const fetchNearbyRestaurant = (radius: number) => {
      if (buttonSelectedMethod.isSelectedNearbyRestaurant) {
        // Ensure the user's location is valid
        if (userLocation.latitude === null || userLocation.longitude === null) {
          console.error("User location is not available.");
          return;
        }

        // If only Nearby is selected, filter from the full dataset
        if (!buttonSelectedMethod.isSelectedFavoriteRestaurant) {
          const nearby = dataset
            .filter((restaurant) => {
              const distance = haversine(
                userLocation.latitude,
                userLocation.longitude,
                roundToPrecision(restaurant.latitude, 5),
                roundToPrecision(restaurant.longitude, 5)
              );
              return distance <= radius; // Only include restaurants within the radius
            })
            .map((restaurant) => ({
              ...restaurant,
              latitude: roundToPrecision(restaurant.latitude, 5),
              longitude: roundToPrecision(restaurant.longitude, 5),
            })); // Round lat/lon in the resulting nearby list

          setNearbyRestaurant(nearby); // Update the state with nearby restaurants
        }
        // If both Nearby and Favorite are selected, filter from favoriteRestaurant
        else {
          const nearbyFavorites = favoriteRestaurant.filter((restaurant) => {
            const distance = haversine(
              userLocation.latitude,
              userLocation.longitude,
              roundToPrecision(restaurant.latitude, 5),
              roundToPrecision(restaurant.longitude, 5)
            );
            return distance <= radius; // Only include favorites within the radius
          }).map((restaurant) => ({
            ...restaurant,
            latitude: roundToPrecision(restaurant.latitude, 5),
            longitude: roundToPrecision(restaurant.longitude, 5),
          })); // Round lat/lon in the resulting nearby list

          setNearbyRestaurant(nearbyFavorites); // Update the state with nearby favorites
        }
      }
      // Clear the nearbyRestaurant state if Nearby is not selected
      else {
        setNearbyRestaurant([]);
      }
    };

    // Fetch nearby restaurants whenever buttonSelectedMethod or userLocationRadius changes
    fetchNearbyRestaurant(INITIAL_RADIUS);
  }, [buttonSelectedMethod]);

  React.useEffect(() => {
    mapboxgl.accessToken = apikey;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12",
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
      const geojsonData = {
        type: "FeatureCollection",
        features: dataset.map(
          (restaurant: {
            longitude: any;
            latitude: any;
            title: any;
            price: any;
            categoryName: any;
            address: any;
            neighborhood: any;
            street: any;
            city: any;
            state: any;
            countryCode: any;
            phone: any;
            phoneUnformatted: any;
            totalScore: any;
            imageUrl: any;
          }) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [roundToPrecision(restaurant.longitude, 5), roundToPrecision(restaurant.latitude, 5)], // [longitude, latitude]
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
            },
          })
        ),
      };

      const geojsonFavoriteData = {
        type: "FeatureCollection",
        features: favoriteRestaurant.map(
          (restaurant: {
            longitude: any;
            latitude: any;
            title: any;
            price: any;
            categoryName: any;
            address: any;
            neighborhood: any;
            street: any;
            city: any;
            state: any;
            countryCode: any;
            phone: any;
            phoneUnformatted: any;
            totalScore: any;
            imageUrl: any;
          }) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [roundToPrecision(restaurant.longitude, 5), roundToPrecision(restaurant.latitude, 5)], // [longitude, latitude]
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
            },
          })
        ),
      };

      let geojsonNearbyData;
      if (nearbyRestaurant)
        geojsonNearbyData = {
          type: "FeatureCollection",
          features: nearbyRestaurant.map(
            (restaurant: {
              longitude: any;
              latitude: any;
              title: any;
              price: any;
              categoryName: any;
              address: any;
              neighborhood: any;
              street: any;
              city: any;
              state: any;
              countryCode: any;
              phone: any;
              phoneUnformatted: any;
              totalScore: any;
              imageUrl: any;
            }) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [roundToPrecision(restaurant.longitude, 5), roundToPrecision(restaurant.latitude, 5)], // [longitude, latitude]
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
              },
            })
          ),
        };

      /* ---- Search Bar ---- */
      // Add MapboxGeocoder with localGeocoder
      geocoderRef.current = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        zoom: 14,
        placeholder: "Search restaurant",
        localGeocoder: (query: string) => {
          const matchingFeatures = geojsonData.features.filter((feature) =>
            feature.properties.title.toLowerCase().includes(query.toLowerCase())
          );

          return matchingFeatures.map((feature) => ({
            center: feature.geometry.coordinates,
            geometry: feature.geometry,
            place_name: `${feature.properties.title} - ${feature.properties.address || "Address not available"
              }`,
            text: feature.properties.title,
            properties: feature.properties,
            type: "Feature",
          }));
        },
        mapboxgl: mapboxgl,
      });

      // Geocoder to return a restaurant search result
      mapRef.current.addControl(geocoderRef.current, "top-left");

      geocoderRef.current.on("result", (e) => {
        const selectedFeature = e.result;

        if (selectedFeature && selectedFeature.geometry) {
          const { coordinates } = selectedFeature.geometry;
          setSelectedRestaurant({
            title:
              selectedFeature.properties?.title ||
              `Unknown location. Lat:${coordinates[1]} Long:${coordinates[0]}`,
            price: selectedFeature.properties?.price || null,
            categoryName:
              selectedFeature.properties?.categoryName || "Not available",
            address: selectedFeature.properties?.address || "Not available",
            neighborhood:
              selectedFeature.properties?.neighborhood || "Not available",
            street: selectedFeature.properties?.street || "Not available",
            city: selectedFeature.properties?.city || "Not available",
            state: selectedFeature.properties?.state || "Not available",
            countryCode:
              selectedFeature.properties?.countryCode || "Not available",
            phone: selectedFeature.properties?.phone || "Not available",
            phoneUnformatted:
              selectedFeature.properties?.phoneUnformatted || null,
            latitude: coordinates[1],
            longitude: coordinates[0],
            plusCode: selectedFeature.properties?.plusCode || "",
            totalScore: selectedFeature.properties?.totalScore || null,
            imageUrl: selectedFeature.properties?.imageUrl || "",
          });
          setIsSelectedRestaurant(true);

          mapRef.current.flyTo({
            center: coordinates,
            zoom: 14,
          });

          // Reset the color of all features in the layer to red
          mapRef.current.setPaintProperty(
            "restaurant-layer",
            "circle-color",
            "red"
          );

          // Change the color of the selected restaurant
          const selectedRestaurantId = selectedFeature.properties?.title;

          if (selectedRestaurantId) {
            // Check if the selected restaurant exists in the geojson data
            const selectedFeatureExists = geojsonData.features.some(
              (feature) => feature.properties.title === selectedRestaurantId
            );

            if (selectedFeatureExists) {
              // Apply the color logic if the selected restaurant exists in the dataset
              mapRef.current.setPaintProperty(
                "restaurant-layer",
                "circle-color",
                [
                  "case",
                  ["==", ["get", "title"], selectedRestaurantId],
                  "blue", // Selected restaurant color
                  "red", // Default color for unselected restaurants
                ]
              );
            } else {
              // If the selected restaurant doesn't exist in the dataset, reset the color to red
              mapRef.current.setPaintProperty(
                "restaurant-layer",
                "circle-color",
                "red"
              );
              // Optionally, you could clear the selected restaurant info if needed:
              setSelectedRestaurant(null);
              setIsSelectedRestaurant(false);
            }
          }
        }
      });

      // Event listener for the 'clear' event (when the search is cleared)
      geocoderRef.current.on("clear", () => {
        // Reset the color of all restaurants back to red
        mapRef.current.setPaintProperty(
          "restaurant-layer",
          "circle-color",
          "red"
        );

        // Optionally, clear the selected restaurant state
        setSelectedRestaurant(null);
      });
      /* ---- End Search Bar ---- */

      /* ---- Add Dataset and Create Layer ---- */
      // Depend on the selection layer, we need to swap the layer
      if (buttonSelectedMethod.isSelectedAllLocation &&
        !buttonSelectedMethod.isSelectedFavoriteRestaurant &&
        !buttonSelectedMethod.isSelectedNearbyRestaurant) {
        mapRef.current.addSource("restaurant", {
          type: "geojson",
          data: geojsonData,
        });
        mapRef.current.addLayer({
          id: "restaurant-layer",
          type: "circle",
          source: "restaurant",
          paint: {
            "circle-radius": 6,
            "circle-stroke-width": 3,
            "circle-color": "red",
            "circle-stroke-color": "white",
          },
        });
      }
      else {
        if (buttonSelectedMethod.isSelectedFavoriteRestaurant &&
          !buttonSelectedMethod.isSelectedNearbyRestaurant
        ) {
          mapRef.current.addSource("restaurant", {
            type: "geojson",
            data: geojsonFavoriteData,
          });
          mapRef.current.addLayer({
            id: "restaurant-layer",
            type: "circle",
            source: "restaurant",
            paint: {
              "circle-radius": 6,
              "circle-stroke-width": 3,
              "circle-color": "red",
              "circle-stroke-color": "white",
            },
          });
        }
        else {
          mapRef.current.addSource("restaurant", {
            type: "geojson",
            data: geojsonNearbyData,
          });
          mapRef.current.addLayer({
            id: "restaurant-layer",
            type: "circle",
            source: "restaurant",
            paint: {
              "circle-radius": 6,
              "circle-stroke-width": 3,
              "circle-color": "red",
              "circle-stroke-color": "white",
            },
          });
        }
      }
    });

    mapRef.current.on("click", "restaurant-layer", (e: any) => {
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ["restaurant-layer"],
      });

      if (features.length) {
        const feature = features[0].properties as Restaurant;
        setSelectedRestaurant(feature);
      }
    });
    /* ---- End Dataset and Create Layer ---- */

    // Mouse event for hovering
    mapRef.current.on("mouseenter", "restaurant-layer", () => {
      mapRef.current.getCanvas().style.cursor = "pointer";
    });

    mapRef.current.on("mouseleave", "restaurant-layer", () => {
      mapRef.current.getCanvas().style.cursor = "";
    });

    // Displaying restaurant data when clicking
    mapRef.current.on(
      "click",
      "restaurant-layer",
      (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["restaurant-layer"],
        });

        if (features.length) {
          const feature = features[0];

          const restaurant: Restaurant = {
            title: feature.properties?.title || "Unknown",
            price: feature.properties?.price || null,
            categoryName: feature.properties?.categoryName || "Not available",
            address: feature.properties?.address || "Not available",
            neighborhood: feature.properties?.neighborhood || "Not available",
            street: feature.properties?.street || "Not available",
            city: feature.properties?.city || "Not available",
            state: feature.properties?.state || "Not available",
            countryCode: feature.properties?.countryCode || "Not available",
            phone: feature.properties?.phone || "Not available",
            phoneUnformatted: feature.properties?.phoneUnformatted || null,
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            totalScore: feature.properties?.totalScore || null,
            imageUrl: feature.properties?.imageUrl || "",
            plusCode: "",
          };

          setSelectedRestaurant(restaurant);
          setIsSelectedRestaurant(true);

          mapRef.current.flyTo({
            center: [restaurant.longitude, restaurant.latitude],
          });

          // Change the color of the selected restaurant
          const selectedRestaurantId = feature.properties?.title;

          // Change the paint property of the layer to apply a different color to the selected restaurant
          mapRef.current.setPaintProperty("restaurant-layer", "circle-color", [
            "case",
            ["==", ["get", "title"], selectedRestaurantId],
            "blue", // Selected restaurant
            "red", // Default color for unselected restaurants
          ]);
        }
      }
    );

    // Add geolocate control to the map. (Current user location)
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    mapRef.current.addControl(geolocateControl, "top-left");
    geolocateControlRef.current = geolocateControl;

    return () => {
      mapRef.current.remove();
    };
  }, [dataset, favoriteRestaurant, nearbyRestaurant, buttonSelectedMethod]);

  // Gets the first letter from the username and capitalizes it
  const getFirstLetterUsername = () => {
    const str = localStorage.getItem("username");
    return str ? str.charAt(0).toUpperCase() : "";
  };

  // Fetch direction
  const getDirections = async () => {
    const geolocateControl = geolocateControlRef.current;
    if (!geolocateControl) {
      console.error("GeolocateControl not initialized");
      return;
    }

    if (selectedRestaurant === null) return;

    // Filter only the selected restaurant
    mapRef.current.setFilter("restaurant-layer", [
      "==",
      ["get", "title"],
      selectedRestaurant.title,
    ]);
    isDirectionActive.current = true;

    const userLocation = await new Promise<[number, number]>(
      (resolve, reject) => {
        geolocateControl.once("geolocate", (e) => {
          if (!isDirectionActive.current) {
            reject(new Error("Direction process canceled"));
            return;
          }
          resolve([e.coords.longitude, e.coords.latitude]);
          setUserLocation({ latitude: e.coords.latitude, longitude: e.coords.longitude });
        });
        geolocateControl.trigger(); // Trigger geolocation
        setIsShownDirection(true);
      }
    );

    if (!userLocation || !isDirectionActive.current) return;

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${selectedRestaurant.longitude},${selectedRestaurant.latitude}?geometries=geojson&access_token=${apikey}`
    );
    const data = await response.json();

    if (data.routes && data.routes.length) {
      const route = data.routes[0].geometry;
      const distanceInMeters = data.routes[0].distance;

      setDirectionDistance({
        unit: "meters",
        distance: distanceInMeters,
      });

      // Add or update the route source
      if (mapRef.current?.getSource("route")) {
        mapRef.current.getSource("route").setData({
          type: "Feature",
          geometry: route,
        });
      } else {
        mapRef.current?.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route,
            simlify: false,
          },
        });

        mapRef.current?.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#4264fb",
            "line-width": 5,
          },
        });
      }

      // Fit map bounds to route
      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach(([lng, lat]: [number, number]) =>
        bounds.extend([lng, lat])
      );
      mapRef.current?.fitBounds(bounds, { padding: 20 });
    } else {
      console.error("No route found");
    }
  };

  // Cancel direction
  const cancelDirections = () => {
    isDirectionActive.current = false;
    if (mapRef.current) {
      // Check if the 'route' layer exists before trying to remove it
      if (mapRef.current.getLayer("route")) {
        mapRef.current.removeLayer("route");
      }
      // Check if the 'route' source exists before trying to remove it
      if (mapRef.current.getSource("route")) {
        mapRef.current.removeSource("route");
      }
      setIsShownDirection(false);
      setDirectionDistance({ distance: 0, unit: "" });
      if (!isSelectedRestaurant && selectedRestaurant) {
        mapRef.current.setPaintProperty("restaurant-layer", "circle-color", [
          "case",
          ["==", ["get", "title"], selectedRestaurant.title],
          "red", // Selected restaurant
          "red", // Default color for unselected restaurants
        ]);
        setSelectedRestaurant(null);
      }
      mapRef.current.setFilter("restaurant-layer", null);
    }
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
            <div className={styles.topRightNav}>
              <button
                onClick={() => {
                  const newFavoriteState = !buttonSelectedMethod.isSelectedFavoriteRestaurant;
                  if (!newFavoriteState && !buttonSelectedMethod.isSelectedNearbyRestaurant) {
                    setButtonSelectedMethod((prev) => ({
                      ...prev,
                      isSelectedAllLocation: true,
                      isSelectedFavoriteRestaurant: !prev.isSelectedFavoriteRestaurant
                    }))
                    if (selectedRestaurant)
                      setSelectedRestaurant(null);
                  }
                  else {
                    setButtonSelectedMethod((prev) => ({
                      ...prev,
                      isSelectedAllLocation: false,
                      isSelectedFavoriteRestaurant: !prev.isSelectedFavoriteRestaurant
                    }))
                    if (selectedRestaurant)
                      setSelectedRestaurant(null);
                  }
                }}
                className={styles.buttonCustomLocation}
                style={{
                  color: buttonSelectedMethod.isSelectedFavoriteRestaurant ? 'black' : 'white',
                  backgroundColor: buttonSelectedMethod.isSelectedFavoriteRestaurant ? 'white' : 'black',
                  border: buttonSelectedMethod.isSelectedFavoriteRestaurant ? '2px solid black' : '',
                  fontWeight: buttonSelectedMethod.isSelectedFavoriteRestaurant ? 'bold' : 'normal'
                }}
              >
                <MdOutlineRestaurant style={{ fontSize: 16 }} /> Favorite Restaurant
              </button>
              <button
                onClick={async () => {
                  const newNearbyState = !buttonSelectedMethod.isSelectedNearbyRestaurant;

                  if (newNearbyState) {
                    // If enabling Nearby Location, check and get the user's location
                    const hasAccess = await checkLocationPermission();
                    if (!hasAccess) {
                      console.error("Unable to access user location. Cannot enable Nearby Location.");
                      return; // Exit early if location access is not granted
                    }
                  }

                  // Update buttonSelectedMethod state
                  if (!newNearbyState && !buttonSelectedMethod.isSelectedFavoriteRestaurant) {
                    setButtonSelectedMethod((prev) => ({
                      ...prev,
                      isSelectedAllLocation: true,
                      isSelectedNearbyRestaurant: false,
                    }));
                    if (selectedRestaurant) setSelectedRestaurant(null);
                  } else {
                    setButtonSelectedMethod((prev) => ({
                      ...prev,
                      isSelectedAllLocation: false,
                      isSelectedNearbyRestaurant: newNearbyState,
                    }));
                    if (selectedRestaurant) setSelectedRestaurant(null);
                  }
                }}
                className={styles.buttonCustomLocation}
                style={{
                  color: buttonSelectedMethod.isSelectedNearbyRestaurant ? 'black' : 'white',
                  backgroundColor: buttonSelectedMethod.isSelectedNearbyRestaurant ? 'white' : 'black',
                  border: buttonSelectedMethod.isSelectedNearbyRestaurant ? '2px solid black' : '',
                  fontWeight: buttonSelectedMethod.isSelectedNearbyRestaurant ? 'bold' : 'normal',
                }}
              >
                <FaLocationCrosshairs style={{ fontSize: 16 }} /> Nearby Location
              </button>
              <img src={logo} className={styles.logoMap} />
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
                  <p className={styles.userSettingOption1}
                    onClick={() => navigate('/account')}
                  >
                    Manage your account
                  </p>
                  <p
                    className={styles.userSettingOption2}
                    onClick={() => {
                      localStorage.removeItem("username");
                      localStorage.removeItem("isLoggedIn");
                      localStorage.removeItem('email');
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
        {selectedRestaurant && isSelectedRestaurant && (
          <div className={styles.sidebarContainer} id="sidebar">
            <button
              className={styles.closeButton}
              onClick={() => {
                if (!isShownDirection) {
                  if (mapRef.current) {
                    mapRef.current.setPaintProperty(
                      "restaurant-layer",
                      "circle-color",
                      [
                        "case",
                        ["==", ["get", "title"], selectedRestaurant.title],
                        "red",
                        "red",
                      ]
                    );
                  }
                  if (geocoderRef.current) {
                    geocoderRef.current.clear();
                  }
                  setSelectedRestaurant(null);
                }
                setIsSelectedRestaurant(false);
              }}
            >
              <IoIosClose size={40} />
            </button>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center' }}>
              <h2 className={styles.restaurantName}>
                {selectedRestaurant.title}
              </h2>
              <p>
                {"Lat: " + selectedRestaurant.latitude}
                {"\nLong: " + selectedRestaurant.longitude}
              </p>
              <div>
                <p className={styles.restaurantCategory}>
                  <strong>Category:</strong>{" "}
                  {selectedRestaurant.categoryName || "Not available"}
                </p>
                <p className={styles.restaurantAdress}>
                  <strong>Address:</strong>{" "}
                  {selectedRestaurant.address || "Not available"}
                </p>
                <p className={styles.restaurantPhone}>
                  <strong>Phone:</strong>{" "}
                  {selectedRestaurant.phone || "Not available"}
                </p>
                <p className={styles.restaurantRating}>
                  <strong>Rating:</strong>{" "}
                  {selectedRestaurant.totalScore || "Not available"}
                  <IoIosStar size={16} style={{ verticalAlign: "top" }} />
                </p>
              </div>
              {isShownDirection ? (
                <button
                  className={styles.cancelDirectionButton}
                  onClick={cancelDirections}
                >
                  <FaBan style={{ fontSize: 24 }} />
                  <span>Cancel Directions</span>
                </button>
              ) : (
                <button
                  className={styles.directionButton}
                  onClick={() => {
                    getDirections();
                  }}
                >
                  <FaDirections style={{ fontSize: 24 }} />
                  <span>Directions</span>
                </button>
              )}
              <button
                className={styles.favoriteButton}
                onClick={() => {
                  if (!selectedRestaurant) return;

                  const isFavorite = favoriteRestaurant.some(
                    (fav) =>
                      roundToPrecision(fav.latitude, 5) === roundToPrecision(selectedRestaurant.latitude, 5) &&
                      roundToPrecision(fav.longitude, 5) === roundToPrecision(selectedRestaurant.longitude, 5)
                  );

                  if (isFavorite) {
                    // Remove from favorites
                    removeFromFavorite(selectedRestaurant);
                  } else {
                    // Add to favorites
                    addToFavorite(selectedRestaurant);
                  }
                }}
              >
                {favoriteRestaurant.some(
                  (fav) =>
                    roundToPrecision(fav.latitude, 5) === roundToPrecision(selectedRestaurant.latitude, 5) &&
                    roundToPrecision(fav.longitude, 5) === roundToPrecision(selectedRestaurant.longitude, 5)
                ) ? (
                  <>
                    <FaRegHeart style={{ fontSize: 24 }} /> Remove From Favorite
                  </>
                ) : (
                  <>
                    <FaRegHeart style={{ fontSize: 24 }} /> Add To Favorite
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {isShownDirection && (
          <div className={styles.bottomDirectionBox}>
            <span className={styles.bottomDirectionInfo}>
              From:{" "}
              <span className={styles.bottomDirectionLocation}>
                Your current location
              </span>
            </span>
            <span className={styles.bottomDirectionInfo}>
              To:{" "}
              <span className={styles.bottomDirectionLocation}>
                {selectedRestaurant?.title || selectedRestaurant?.address}
              </span>
            </span>
            <span className={styles.bottomDirectionInfo}>
              Distance:{" "}
              <span
                className={styles.bottomDirectionLocation}
              >{`${directionDistance.distance} ${directionDistance.unit}`}</span>
            </span>
            <button
              className={styles.bottomDirectionCancelButton}
              onClick={cancelDirections}
            >
              <FaBan style={{ fontSize: 24 }} />
              <span>Cancel Direction</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
