import { useState, useEffect } from "react";
import styles from "../styles/Account.module.css";
import supabase from "../data/supabaseClient";
import { FaMapLocationDot } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
export default function Account() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    favorite_location: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showFavorite, setShowFavorite] = useState(false);
  const [error, setError] = useState("");

  const email = localStorage.getItem("email");

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) {
        setError("Email not found. Please log in again.");
        return;
      }

      const { data, error } = await supabase
        .from("authentication")
        .select("username, email, password, favorite_location")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch user data.");
      } else if (data) {
        setUserData(data);
      }
    };

    fetchUserData();
  }, [email]);

  // Handle input changes
  const handleInputChange = (key: string, value: string) => {
    setUserData((prev) => ({ ...prev, [key]: value }));
  };

  // Save updated data to database
  const handleSave = async () => {
    const { error } = await supabase
      .from("authentication")
      .update({
        username: userData.username,
        password: userData.password,
        favorite_location: userData.favorite_location,
      })
      .eq("email", userData.email);

    if (error) {
      console.error("Error updating user data:", error);
      setError("Failed to save changes.");
    } else {
      setIsEditing(false);
      setError("");
    }
  };

  return (
    <div className={styles.container}>
      <Link className={styles.mapIcon} to="/maps">
        <FaMapLocationDot size={30} style={{ color: "#21d375" }} />
      </Link>
      <h1 className={styles.header}>Account Information</h1>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.layout}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <div className={styles.avatarContainer}>
            <img
              src="https://static.vecteezy.com/system/resources/previews/011/490/381/non_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-white-background-vector.jpg" // Placeholder image path
              alt="User Avatar"
              className={styles.avatar}
            />
          </div>
          <button
            onClick={() => setShowFavorite(!showFavorite)}
            className={styles.favoriteButton}
          >
            Favorite Location
          </button>
          {showFavorite && (
            <div className={styles.favoriteLocation}>
              {userData.favorite_location || "No favorite location set"}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            value={userData.username}
            disabled={!isEditing}
            onChange={(e) => handleInputChange("username", e.target.value)}
            className={styles.inputField}
          />
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={userData.email}
            disabled
            className={styles.inputField}
          />
          <label className={styles.label}>Password</label>
          <input
            type="password"
            value={userData.password}
            disabled={!isEditing}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className={styles.inputField}
          />
        </div>
      </div>
      <div className={styles.buttonContainer}>
        {isEditing ? (
          <>
            <button onClick={handleSave} className={styles.button}>
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={styles.button}
            >
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} className={styles.button}>
            Edit
          </button>
        )}
      </div>
      <Link className={styles.mapIcon} to="/">
        <FaSignOutAlt
          size={32}
          style={{ marginTop: "10px", marginLeft: "850px", color: "#d92b04" }}
        />
      </Link>
    </div>
  );
}
