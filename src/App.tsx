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
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const loginValue = { isLoggedIn, setIsLoggedIn };
  return (
    <LoginState.Provider value={loginValue}>
      <div style={{ fontFamily: "sans-serif" }}>
        <Routes>
          {isLoggedIn ?
            <>
              <Route path="/" element={<MapDisplay />} />
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

// function App() {
//   const [fetchError, setFetchError] = React.useState<string | null>(null);
//   const [Authentication, setAuthentication] = React.useState<any[] | null>(null);

//   React.useEffect(() => {
//     const fetchAuthentication = async () => {
//       const { data, error } = await supabase
//         .from('authentication')
//         .select('*');

//       if (error) {
//         setFetchError('Could not fetch the authentication data');
//         setAuthentication(null);
//         console.log(error);
//       }
//       if (data) {
//         setAuthentication(data);
//         setFetchError(null);
//       }
//     };

//     fetchAuthentication();
//   }, []);

//   return (
//     <div>
//       Hello
//       {fetchError && (<p>{fetchError}</p>)}
//       {Authentication && (
//         <div>
//           {Authentication.map((user, index) => (
//             <div key={index}>
//               <p>Email: {user.email}</p>
//               <p>Username: {user.username}</p>
//               <p>Password: {user.password}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

export default App;
