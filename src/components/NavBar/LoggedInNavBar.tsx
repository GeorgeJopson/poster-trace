import React from "react";
import NavBar from "./NavBar";
import { routeNames } from "@/routeNames";

export default function LoggedInNavBar() {
  return (
    <NavBar
      logoTarget={routeNames.dashboard}
      targets={[
        {
          targetUrl: routeNames.dashboard,
          name: "Dashboard",
          buttonStyle: "filled",
        },
      ]}
    />
  );
}
