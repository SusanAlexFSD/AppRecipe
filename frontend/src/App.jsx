import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';  // import Navbar here
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import GuestLogin from './components/GuestLogin.jsx';
import Recipes from './components/Recipes.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import ShoppingList from './components/ShoppingList.jsx';
import Favorites from './components/Favorites.jsx';
import Recipe from './pages/Recipe.jsx';


function App() {
  return (
    <Router>
      <NavBar />  {/* Add Navbar here so it's always visible */}
      <Routes>
        <Route path="/" element={<Recipes />} />
        <Route path="/recipe/:id" element={<Recipe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<GuestLogin />} />
        <Route path="/shoppingList" element={<ShoppingList />} />
        <Route path="/favorites" element={<Favorites />} />

        
      </Routes>
    </Router>
  );
}

export default App;