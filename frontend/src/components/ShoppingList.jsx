import React, { useEffect, useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./ShoppingList.css";

export default function ShoppingList() {
  const { user } = useContext(AuthContext);

  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    recipeName: "",
  });

  useEffect(() => {
    if (!user?._id) return;
    fetchList();
  }, [user]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/shoppingList/${user._id}`);
      setShoppingList(res.data.list || []);
    } catch (err) {
      console.error("Error fetching shopping list:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalIngredients = useMemo(() => {
    return shoppingList.reduce((count, recipe) => {
      const uniqueIngredients = [...new Set(recipe.ingredients || [])];
      return count + uniqueIngredients.length;
    }, 0);
  }, [shoppingList]);

  const openClearAllModal = () => {
    setConfirmModal({
      open: true,
      type: "clearAll",
      recipeName: "",
    });
  };

  const openRemoveRecipeModal = (recipeName) => {
    setConfirmModal({
      open: true,
      type: "removeRecipe",
      recipeName,
    });
  };

  const closeModal = () => {
    setConfirmModal({
      open: false,
      type: null,
      recipeName: "",
    });
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmModal.type === "clearAll") {
        await axios.delete(`/shoppingList/${user._id}`);
        setShoppingList([]);
      }

      if (confirmModal.type === "removeRecipe") {
        const recipeName = confirmModal.recipeName;
        const res = await axios.delete(
          `/shoppingList/${user._id}/${encodeURIComponent(recipeName)}`
        );
        setShoppingList(res.data.list || []);
      }
    } catch (err) {
      console.error("Error updating shopping list:", err);
    } finally {
      closeModal();
    }
  };

  if (!user) {
    return (
      <div className="shoppingList-page">
        <p className="shoppingList-message">Loading user...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shoppingList-page">
        <nav className="shoppingList-nav">
          <Link to="/" className="shoppingList-backLink">
            <span>←</span>
            <span>Back to Recipes</span>
          </Link>
        </nav>

        <p className="shoppingList-message">Loading shopping list...</p>
      </div>
    );
  }

  return (
    <>
      <div className="shoppingList-page">
        {/* BACK LINK */}
        <nav className="shoppingList-nav">
          <Link to="/" className="shoppingList-backLink">
            <span>←</span>
            <span>Back to Recipes</span>
          </Link>
        </nav>

        {/* HEADER */}
        <section className="shoppingList-header">
          <div className="shoppingList-heroLeft">
            <div className="shoppingList-titleRow">
              <span className="shoppingList-titleIcon">🛒</span>
              <h1 className="shoppingList-title">Shopping List</h1>
            </div>

            <p className="shoppingList-message">
              {shoppingList.length} recipe{shoppingList.length === 1 ? "" : "s"} •{" "}
              {totalIngredients} ingredient{totalIngredients === 1 ? "" : "s"}
            </p>
          </div>

          {shoppingList.length > 0 && (
            <div className="shoppingList-heroActions">
              <div className="shoppingList-summaryChip">
             </div>

              <button
                className="shoppingList-clearBtn"
                onClick={openClearAllModal}
              >
                Clear All
              </button>
            </div>
          )}
        </section>

        {/* EMPTY STATE */}
        {shoppingList.length === 0 ? (
          <div className="shoppingList-empty">
            <p>No ingredients in your shopping list.</p>
          </div>
        ) : (
          <div className="shoppingList-items">
            {shoppingList.map((recipe, idx) => {
              const uniqueIngredients = [...new Set(recipe.ingredients || [])];

              return (
                <article key={idx} className="shoppingList-card">
                  <div className="shoppingList-cardHeader">
                    <div className="shoppingList-recipeMeta">
                      <h2 className="shoppingList-recipeTitle">
                        {recipe.recipeName}
                      </h2>

                      <span className="shoppingList-count">
                        <span>🧾</span>
                        <span>
                          {uniqueIngredients.length} ingredient
                          {uniqueIngredients.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>

                    <button
                      className="shoppingList-removeBtn"
                      onClick={() => openRemoveRecipeModal(recipe.recipeName)}
                    >
                      Remove
                    </button>
                  </div>

                  <ul className="shoppingList-ingredients">
                    {uniqueIngredients.map((ingredient, i) => (
                      <li key={i} className="shoppingList-ingredient">
                        <span className="shoppingList-ingredientIcon">✓</span>
                        <span className="shoppingList-ingredientText">
                          {ingredient}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal.open && (
        <div className="confirmModal-overlay" onClick={closeModal}>
          <div className="confirmModal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirmModal-title">
              {confirmModal.type === "clearAll"
                ? "Clear shopping list?"
                : "Remove recipe?"}
            </h3>

            <p className="confirmModal-text">
              {confirmModal.type === "clearAll"
                ? "This will remove every recipe and ingredient from your shopping list."
                : `Remove "${confirmModal.recipeName}" from your shopping list?`}
            </p>

            <div className="confirmModal-actions">
              <button
                className="confirmModal-btn confirmModal-btn-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="confirmModal-btn confirmModal-btn-danger"
                onClick={handleConfirmAction}
              >
                {confirmModal.type === "clearAll" ? "Clear All" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
