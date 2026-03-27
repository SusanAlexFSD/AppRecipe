import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import SearchHelpModal from "./SearchHelpModal.jsx";
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
        {/* Logo */}
        <Link to="/" className="nav-logo-card">
          <div className="nav-logo-icon-wrap">
            <span className="nav-logo-icon">🔎</span>
          </div>
          <span className="nav-logo-text">DishLab</span>
        </Link>

        {/* Search Bar */}
        <div className="nav-search">
          <span className="nav-search-icon">⌕</span>

          <input
            type="text"
            className="nav-search-input"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
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

        {/* Right-side Actions */}
        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/favorites" className="nav-pill-btn favorites-btn">
                <span className="nav-pill-icon">♥</span>
                <span className="nav-pill-text">Favorites</span>
              </Link>

              <Link
                to="/shoppingList"
                className="nav-icon-btn shopping-btn"
                aria-label="Shopping List"
                title="Shopping List"
              >
                🛒
              </Link>

              <div className="nav-user-chip" title={displayName}>
                👋 {displayName}
              </div>

              <div className="nav-logout-wrap">
                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="nav-auth-links">
              <Link to="/login" className="nav-text-link">
                Login
              </Link>
              <Link to="/register" className="nav-text-link">
                Register
              </Link>
              <Link to="/guest" className="nav-guest-btn">
                Guest
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Search Help Modal */}
      <SearchHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
