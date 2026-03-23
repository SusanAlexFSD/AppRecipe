import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import "./AppShell.css";

export default function AppShell() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}
