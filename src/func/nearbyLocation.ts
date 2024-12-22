// Haversine formula to calculate the distance between two points (in kilometers)
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  // Convert latitude and longitude from degrees to radians
  const toRadians = (degree: number) => degree * (Math.PI / 180);

  lat1 = toRadians(lat1);
  lon1 = toRadians(lon1);
  lat2 = toRadians(lat2);
  lon2 = toRadians(lon2);

  // Haversine formula
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Radius of Earth in kilometers
  const R = 6371; // Radius in kilometers

  // Distance in kilometers
  const distance = R * c;
  return distance;
}

// Function to get points within a certain distance (in kilometers)
export function getPointsWithinRange(
  initialLat: number,
  initialLon: number,
  points: [number, number][],
  radius: number
) {
  let nearbyPoints: [number, number][] = [];

  // Loop through the list of points and check distance
  points.forEach((point: [number, number]) => {
    const [lat, lon] = point;
    const distance = haversine(initialLat, initialLon, lat, lon);

    // If the point is within the specified radius, add it to the result
    if (distance <= radius) {
      nearbyPoints.push(point);
    }
  });

  return nearbyPoints;
}
