import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import SearchHelpModal from "./SearchHelpModal.jsx";
import { FiShoppingCart } from "react-icons/fi";
import logoImage from "../assets/recipesoup1.png";
import "./NavBar.css";

export default function NavBar({
  searchTerm = "",
  onSearchChange = () => {},
}) {
  const { user } = useContext(AuthContext);
  const [showHelp, setShowHelp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.isGuest
    ? "Guest"
    : user?.displayName || user?.username || user?.email || "User";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        {/* LOGO */}
        <Link to="/" className="nav-logo-card">
          <img src={logoImage} alt="DishLab logo" className="nav-logo-image" />
          <span className="nav-logo-text">DishLab</span>
        </Link>

        {/* SEARCH */}
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
            className="nav-search-help"
            onClick={() => setShowHelp(true)}
          >
            ?
          </button>
        </div>

        {/* ACTIONS */}
        <div className="nav-actions" ref={menuRef}>
          {user ? (
            <>
              {/* ❤️ FAVORITES */}
              <Link
                to="/favorites"
                className="nav-icon-circle nav-favorites-circle"
                title="Favorites"
              >
                ♥
              </Link>

              {/* 🛒 CART */}
              <Link to="/shoppingList" className="nav-cart-btn">
                <FiShoppingCart />
              </Link>

              {/* ☰ MENU */}
              <button
                className="nav-menu-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                ☰
              </button>

              {menuOpen && (
                <div className="nav-mobile-menu nav-desktop-menu">
                  <div className="nav-mobile-user">
                    👋 {displayName}
                  </div>

                  <Link
                    to="/favorites"
                    className="nav-mobile-link"
                    onClick={closeMenu}
                  >
                    ♥ Favorites
                  </Link>

                  <Link
                    to="/shoppingList"
                    className="nav-mobile-link"
                    onClick={closeMenu}
                  >
                    🛒 Shopping List
                  </Link>

                  <div className="nav-mobile-logout" onClick={closeMenu}>
                    <LogoutButton />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* LOGIN BUTTON (NOW DROPDOWN TRIGGER) */}
              <button
                className="nav-login-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                Login
              </button>

              {menuOpen && (
                <div className="nav-mobile-menu nav-desktop-menu">
                  <Link
                    to="/login"
                    className="nav-mobile-link"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="nav-mobile-link"
                    onClick={closeMenu}
                  >
                    Register
                  </Link>

                  <Link
                    to="/guest"
                    className="nav-mobile-link"
                    onClick={closeMenu}
                  >
                    👋 Continue as Guest
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      <SearchHelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}