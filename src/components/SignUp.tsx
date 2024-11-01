import React from 'react';
import styles from '../styles/SignUp.module.css';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import logo from "../assets/logo.png"

import supabase from '../data/supabaseClient';
import PopupModal from './PopupModal';

interface signUpProp {
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
}

export default function SignUp() {
    const [seenPassword, setSeenPassword] = React.useState(false);
    const [seenConfirmPassword, setSeenConfirmPassword] = React.useState(false);
    const [fieldInput, setFieldInput] = React.useState<signUpProp>({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [raiseError, setRaiseError] = React.useState('');
    const [signUpSuccess, setSignUpSuccess] = React.useState(true);

    const handleFieldInput = (keyValue: keyof signUpProp, value: string) => {
        if (raiseError) setRaiseError('');
        setFieldInput((prev) => ({
            ...prev,
            [keyValue]: value,
        }));
    }

    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const insertSelection = async () => {
            const { error } = await supabase
                .from('authentication')
                .insert({
                    email: fieldInput.email,
                    username: fieldInput.username,
                    password: fieldInput.password,
                });
            return error;
        }

        // Handles the logic for creating a new account
        // Opens the database to check if the email already exists or not
        const { data, error } = await supabase
            .from('authentication')
            .select('email')
            .eq('email', fieldInput.email)

        // Returns an error if database cannot be connected
        if (error) {
            setRaiseError('A problem occurred! Please try again later.');
            return;
        }
        // An email already exists, abort the sign up operation
        if (data.length) {
            setRaiseError('Email existed! Please try with another email');
            return;
        }
        // If an email does not exist on database, checking for password logic before creating account
        if (fieldInput.password !== fieldInput.confirmPassword) {
            setRaiseError('Password does not match!');
            return;
        }
        // If password matches, start inserting the data into the database
        const errorInsert = await insertSelection();
        if (errorInsert === null || !errorInsert) {
            console.log('Created account successfully!');
        }

    };

    return (
        <div className={styles.container}>
            <PopupModal
                title="SIGN UP SUCCESSFULLY"
                desc="You have created account successfully. Redirecting back to login page..." />
            <div className={styles.signUpContainer}>
                <h1 className={styles.textHeader}>Sign Up</h1>
                <form className={styles.signUpForm} onSubmit={handleSignUp}>
                    <img src={logo} className={styles.signUpImgIcon} />
                    <div className={styles.inputSection}>
                        <div className={styles.inputText}>
                            <label htmlFor="username">Username</label>
                            <input
                                required
                                type="text"
                                name="username"
                                placeholder="Username"
                                onChange={(event) => handleFieldInput('username', event.target.value)}
                            />
                        </div>
                        <div className={styles.inputText}>
                            <label htmlFor="email">Email</label>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="Email"
                                onChange={(event) => handleFieldInput('email', event.target.value)}
                            />
                        </div>
                        <div className={styles.inputText} style={{ position: "relative" }}>
                            <label htmlFor="password">Password</label>
                            <input
                                required
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
                            <input
                                required
                                type={seenConfirmPassword ? "text" : "password"}
                                name="passwordConfirm"
                                placeholder="Confirm Password"
                                onChange={(event) => handleFieldInput('confirmPassword', event.target.value)}
                            />
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
                    {raiseError && <p className={styles.textError}>{raiseError}</p>}
                    <button>Sign Up</button>
                    <p>Already have an account? <Link to="/login">Log In</Link></p>
                </form>
            </div>
        </div>
    )
}
