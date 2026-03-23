import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from './components/NavBar.jsx';  // import Navbar here
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import GuestLogin from './components/GuestLogin.jsx';
import Recipes from './components/Recipes.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import ShoppingList from './components/ShoppingList.jsx';
import Favorites from './components/Favorites.jsx';
import Recipe from './pages/Recipe.jsx';
import AppShell from "./layouts/AppShell";



function App() {
  return (
    <BrowserRouter basename="/AppRecipe">
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Recipes />} />
          <Route path="/recipe/:id" element={<Recipe />} />
          <Route path="/shoppingList" element={<ShoppingList />} />
          <Route path="/favorites" element={<Favorites />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<GuestLogin />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;