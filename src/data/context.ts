import React, { SetStateAction } from "react";

interface LoginStateProp {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<SetStateAction<boolean>>;
}

export const LoginState = React.createContext<LoginStateProp>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
});
