import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import SearchHelpModal from "./SearchHelpModal.jsx";
import logoImage from "../assets/recipesoup.png";
import "./NavBar.css";

export default function NavBar({
  searchTerm = "",
  onSearchChange = () => {},
}) {
  const { user } = useContext(AuthContext);
  const [showHelp, setShowHelp] = useState(false);

  const displayName = user?.isGuest
    ? "Guest"
    : user?.displayName || user?.username || user?.email || "User";

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-logo-card" aria-label="DishLab home">
          <img
            src={logoImage}
            alt="DishLab logo"
            className="nav-logo-image"
          />
          <span className="nav-logo-text">DishLab</span>
        </Link>

        <div className="nav-search">
          <span className="nav-search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="text"
            className="nav-search-input"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search recipes"
          />

          <button
            type="button"
            className="nav-search-help"
            aria-label="Search help"
            title="Search help"
            onClick={() => setShowHelp(true)}
          >
            ?
          </button>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/favorites" className="nav-pill-btn" aria-label="Favorites">
                <span className="nav-pill-icon" aria-hidden="true">
                  ♥
                </span>
                <span className="nav-pill-text">Favorites</span>
              </Link>

              <Link
                to="/shoppingList"
                className="nav-cart-btn"
                aria-label="Shopping List"
                title="Shopping List"
              >
                <span aria-hidden="true">🛒</span>
              </Link>

              <div className="nav-user-chip" title={displayName}>
                <span className="nav-user-icon" aria-hidden="true">
                  👋
                </span>
                <span className="nav-user-text">{displayName}</span>
              </div>

              <div className="nav-logout-wrap">
                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="nav-auth-links">
              <Link to="/login" className="nav-pill-btn nav-text-link">
                Login
              </Link>
              <Link to="/register" className="nav-pill-btn nav-text-link">
                Register
              </Link>
              <Link to="/guest" className="nav-pill-btn nav-guest-btn">
                Guest
              </Link>
            </div>
          )}
        </div>
      </nav>

      <SearchHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}