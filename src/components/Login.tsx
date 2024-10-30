import styles from '../styles/Login.module.css';
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../assets/logo.png";
import supabase from "../data/supabaseClient";
import { LoginState } from '../data/context';

interface loginField {
    email: string,
    password: string,
}

// Update for saving authentication into localStorage later
export default function Login() {
    const navigate = useNavigate();
    const { isLoggedIn, setIsLoggedIn } = React.useContext(LoginState);
    const [seenPassword, setSeenPassword] = React.useState(false);
    const [raiseError, setRaiseError] = React.useState(false);
    const [fieldInput, setFieldInput] = React.useState<loginField>({
        email: "",
        password: "",
    });

    // Handles the field input from the user
    const handleFieldInput = (keyInput: keyof loginField, value: string) => {
        if (raiseError) setRaiseError(false);
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
            .from('authentication')
            .select('email, password')
            .eq('email', fieldInput.email)
            .eq('password', fieldInput.password);

        // Returns an error if the client can't fetch the database
        if (error) {
            console.log("ERROR! Cannot fetch the data from the server!");
            return;
        }
        // Gets the data and check whether the data exists or not
        // Sets the global state for isLoggedIn to 1 if data is not empty
        if (data.length) {
            setIsLoggedIn(true);
            navigate("/");
        }
        else {
            setRaiseError(true);
        }
    };


    return (
        <div className={styles.container}>
            <div className={styles.loginContainer}>
                <h1 className={styles.textHeader}>Login</h1>
                <form className={styles.loginForm} onSubmit={handleLogin}>
                    <img src={logo} className={styles.loginIconImg} />
                    <div className={styles.inputSection}>
                        <div className={styles.inputText}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                onChange={(event) => handleFieldInput('email', event.target.value)}
                            />
                        </div>
                        <div className={styles.inputText} style={{ position: "relative" }}>
                            <label htmlFor="password">Password</label>
                            <input
                                type={seenPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                onChange={(event) => handleFieldInput('password', event.target.value)}
                            />
                            <span
                                onClick={() => {
                                    setSeenPassword((currState) => !(currState));
                                }}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    bottom: "10px",
                                    cursor: "pointer",
                                }}>
                                {seenPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </span>
                        </div>
                        <div className={styles.inputOption}>
                            <div className={styles.inputCheckBoxRemember}>
                                <input type="checkbox" name="rememberMe" />
                                <label htmlFor="rememberMe">Remember Me</label>
                            </div>
                            <Link to="/recoveraccount">Forgot Password?</Link>
                        </div>
                    </div>
                    {raiseError && <p className={styles.textError}>Incorrect username or password! Please try again.</p>}
                    <button>Sign In</button>
                    <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                </form>
            </div>
        </div>
    )
}
