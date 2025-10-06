import React from 'react';
import { RecipeWithDetails } from '../types';

interface RecipeListProps {
  recipes: RecipeWithDetails[];
  onEdit: (recipe: RecipeWithDetails) => void;
  onDelete: (id: number) => void;
  groupByMenu?: boolean;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  onEdit,
  onDelete,
  groupByMenu = false
}) => {
  const handleDelete = (recipe: RecipeWithDetails) => {
    if (window.confirm(`'${recipe.menu_name}'에서 '${recipe.ingredient_name}' 재료를 삭제하시겠습니까?`)) {
      onDelete(recipe.id!);
    }
  };

  if (groupByMenu) {
    const groupedRecipes = recipes.reduce((acc, recipe) => {
      const menuName = recipe.menu_name;
      if (!acc[menuName]) {
        acc[menuName] = [];
      }
      acc[menuName].push(recipe);
      return acc;
    }, {} as Record<string, RecipeWithDetails[]>);

    return (
      <div className="recipe-list grouped">
        {Object.entries(groupedRecipes).map(([menuName, menuRecipes]) => (
          <div key={menuName} className="menu-group">
            <h4 className="menu-group-title">{menuName}</h4>
            <div className="recipe-items">
              {menuRecipes.map(recipe => (
                <div key={recipe.id} className="recipe-item">
                  <span className="ingredient-name">{recipe.ingredient_name}</span>
                  <span className="quantity">{recipe.quantity} {recipe.ingredient_unit}</span>
                  <div className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onEdit(recipe)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(recipe)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedRecipes).length === 0 && (
          <div className="no-data">등록된 레시피가 없습니다.</div>
        )}
      </div>
    );
  }

  return (
    <div className="recipe-list">
      <div className="table-container">
        <table className="recipe-table">
          <thead>
            <tr>
              <th>메뉴</th>
              <th>재료</th>
              <th>수량</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={4} className="no-data">
                  등록된 레시피가 없습니다.
                </td>
              </tr>
            ) : (
              recipes.map(recipe => (
                <tr key={recipe.id}>
                  <td>{recipe.menu_name}</td>
                  <td>{recipe.ingredient_name}</td>
                  <td>{recipe.quantity} {recipe.ingredient_unit}</td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onEdit(recipe)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(recipe)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};