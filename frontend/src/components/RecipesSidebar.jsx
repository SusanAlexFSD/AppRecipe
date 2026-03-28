import React from "react";
import { Link } from "react-router-dom";
import "./RecipesSidebar.css";

function formatCategoryLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function FilterSection({ title, items = [], selectedItems = [], onToggle }) {
  return (
    <div className="rs-filterSection">
      <div className="rs-filterHeader">
        <span>{title}</span>
      </div>

      <div className="rs-checkboxList">
        {items.length === 0 ? (
          <p className="rs-empty">No options</p>
        ) : (
          items.map((item) => (
            <label key={item} className="rs-checkboxRow">
              <input
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => onToggle(item)}
              />
              <span>{formatCategoryLabel(item)}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export default function RecipesSidebar({
  categories = [],
  selectedCategories = [],
  onToggleCategory,
  onClearFilters,
  onShowAllRecipes,
}) {
  return (
    <aside className="rs">
      <div className="rs-brand">Filters</div>

      <FilterSection
        title="Category"
        items={categories}
        selectedItems={selectedCategories}
        onToggle={onToggleCategory}
      />

      <button type="button" className="rs-clearBtn" onClick={onClearFilters}>
        Clear Filters
      </button>

      <div className="rs-quickAccessBlock">
        <div className="rs-quickAccessTitle">Quick Access</div>

        <div className="rs-quickAccessButtons">
          <button
            type="button"
            className="rs-actionBtn rs-actionBtn--all"
            onClick={onShowAllRecipes}
          >
            📖 All Recipes
          </button>

          <Link className="rs-actionBtn rs-actionBtn--shopping" to="/shoppingList">
            🛒 Shopping List
          </Link>

          <Link className="rs-actionBtn rs-actionBtn--favorites" to="/favorites">
            ♥ Favorites
          </Link>
        </div>
      </div>
    </aside>
  );
}