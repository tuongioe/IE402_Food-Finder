import React from 'react';
import styles from '../styles/SignUp.module.css';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import logo from "../assets/logo.png"

export default function SignUp() {
    const [seenPassword, setSeenPassword] = React.useState(false);
    const [seenConfirmPassword, setSeenConfirmPassword] = React.useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.signUpContainer}>
                <h1 className={styles.textHeader}>Sign Up</h1>
                <form className={styles.signUpForm}>
                    <img src={logo} className={styles.signUpImgIcon} />
                    <div className={styles.inputSection}>
                        <div className={styles.inputText}>
                            <label htmlFor="username">Username</label>
                            <input type="text" name="username" placeholder="Username" />
                        </div>
                        <div className={styles.inputText}>
                            <label htmlFor="email">Email</label>
                            <input type="email" name="email" placeholder="Email" />
                        </div>
                        <div className={styles.inputText} style={{ position: "relative" }}>
                            <label htmlFor="password">Password</label>
                            <input type={seenPassword ? "text" : "password"} name="password" placeholder="Password" />
                            <span
                                onClick={() => {
                                    setSeenPassword((currState) => !(currState));
                                }}
                                style={{
                                    position: "absolute",
                                    bottom: "10px",
                                    right: "10px",
                                    cursor: "pointer",
                                }}
                            >
                                {seenPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </span>
                        </div>
                        <div className={styles.inputText} style={{ position: "relative" }}>
                            <label htmlFor="passwordConfirm">Confirm Password</label>
                            <input type={seenConfirmPassword ? "text" : "password"} name="passwordConfirm" placeholder="Confirm Password" />
                            <span
                                onClick={() => {
                                    setSeenConfirmPassword((currState) => !(currState));
                                }}
                                style={{
                                    position: "absolute",
                                    bottom: "10px",
                                    right: "10px",
                                    cursor: "pointer",
                                }}
                            >
                                {seenConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </span>
                        </div>
                    </div>
                    <button>Sign Up</button>
                    <p>Already have an account? <Link to="/login">Log In</Link></p>
                </form>
            </div>
        </div>
    )
}
