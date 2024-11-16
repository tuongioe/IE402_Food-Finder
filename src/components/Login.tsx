import styles from "../styles/Login.module.css";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../data/supabaseClient";
import { LoginState } from "../data/context";

interface loginField {
    email: string;
    password: string;
}

// Update for saving authentication into localStorage later: DONE
export default function Login() {
    const navigate = useNavigate();
    const { setIsLoggedIn } = React.useContext(LoginState);
    const [seenPassword, setSeenPassword] = React.useState(false);
    const [raiseError, setRaiseError] = React.useState("");
    const [fieldInput, setFieldInput] = React.useState<loginField>({
        email: "",
        password: "",
    });

    // Handles the field input from the user
    const handleFieldInput = (keyInput: keyof loginField, value: string) => {
        if (raiseError) setRaiseError("");
        setFieldInput((prev) => ({
            ...prev,
            [keyInput]: value,
        }));
    };

    // Sets state for login when the button is clicked
    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        // Gets data from the database and check if the authentication is valid
        event.preventDefault();
        const { data, error } = await supabase
            .from("authentication")
            .select("email, username, password")
            .eq("email", fieldInput.email)
            .eq("password", fieldInput.password);

        // Returns an error if the client can't fetch the database
        if (error) {
            console.log("ERROR! Cannot fetch the data from the server!");
            setRaiseError("A problem occurred. Please try again later!");
            return;
        }
        // Gets the data and check whether the data exists or not
        // Sets the global state for isLoggedIn to 1 if data is not empty
        if (data.length) {
            const usernameField = data[0].username;
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", usernameField);
            setIsLoggedIn(true);
            // Save the info into the localStorage
            navigate("/maps");
        } else {
            setRaiseError("Invalid username or password!");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginContainer}>
                <h1 className={styles.textHeader}>Login</h1>
                <form className={styles.loginForm} onSubmit={handleLogin}>
                    <div className={styles.inputSection}>
                        <div className={styles.inputText}>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="Email"
                                onChange={(event) =>
                                    handleFieldInput("email", event.target.value)
                                }
                            />
                        </div>
                        <div className={styles.inputText} style={{ position: "relative" }}>
                            <input
                                required
                                type={seenPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                onChange={(event) =>
                                    handleFieldInput("password", event.target.value)
                                }
                            />
                            <span
                                onClick={() => {
                                    setSeenPassword((currState) => !currState);
                                }}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    bottom: "10px",
                                    cursor: "pointer",
                                }}
                            >
                                {seenPassword ? (
                                    <FaRegEye size={24} />
                                ) : (
                                    <FaRegEyeSlash size={24} />
                                )}
                            </span>
                        </div>
                        <div className={styles.inputOption}>
                            <Link to="/recoveraccount" style={{ textDecoration: "none" }}>
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                    {raiseError && <p className={styles.textError}>{raiseError}</p>}
                    <button>Sign In</button>
                    <p>
                        Don't have an account?{" "}
                        <Link to="/signup" style={{ textDecoration: "none" }}>
                            Sign Up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
