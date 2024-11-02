import React from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Home from "./components/Home";
import { Route, Routes } from "react-router-dom";
import { LoginState } from "./data/context";
import NotFound404 from "./components/NotFound404";
import MapDisplay from "./components/MapDisplay";

// import supabase from "./data/supabaseClient";

function App() {
  // Gets the login state from the local storage, if not exist, return false
  const [isLoggedIn, setIsLoggedIn] = React.useState(() => {
    if (localStorage.getItem('isLoggedIn') === null)
      return false;
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [isRememberedMe, setIsRememberedMe] = React.useState(false);

  // Pass the loginValue to the login provider (for authentication)
  const loginValue = { isLoggedIn, setIsLoggedIn, isRememberedMe, setIsRememberedMe };
  return (
    <LoginState.Provider value={loginValue}>
      <div style={{ fontFamily: "sans-serif" }}>
        <Routes>
          {isLoggedIn ?
            <>
              <Route path="/maps" element={<MapDisplay />} />
              <Route path="*" element={<NotFound404 />} />

            </>
            :
            <>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="*" element={<NotFound404 />} />
            </>
          }

        </Routes>
      </div>
    </LoginState.Provider>
  );
}

export default App;
