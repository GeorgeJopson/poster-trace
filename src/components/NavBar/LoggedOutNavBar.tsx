import React from "react";
import NavBar from "./NavBar";
import { routeNames } from "@/routeNames";

export default function LoggedOutNavBar() {
  return (
    <NavBar
      logoTarget={"/"}
      targets={[
        {
          targetUrl: routeNames.signIn,
          name: "Log In",
          buttonStyle: "transparent",
        },
        {
          targetUrl: routeNames.signUp,
          name: "Sign Up",
          buttonStyle: "filled",
        },
      ]}
    />
  );
}
