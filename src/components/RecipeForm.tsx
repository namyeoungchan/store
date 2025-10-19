import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, Menu } from '../types';
import { IngredientService } from '../services/ingredientService';
import { MenuService } from '../services/menuService';

interface RecipeFormProps {
  onSubmit: (recipe: Omit<Recipe, 'id'>) => void;
  selectedMenuId?: number;
  initialData?: Recipe;
  isEditing?: boolean;
  onCancel?: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  onSubmit,
  selectedMenuId,
  initialData,
  isEditing = false,
  onCancel
}) => {
  const [menuId, setMenuId] = useState(selectedMenuId || initialData?.menu_id || 0);
  const [ingredientId, setIngredientId] = useState(initialData?.ingredient_id || 0);
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const menusData = await MenuService.getAllMenus();
      const ingredientsData = await IngredientService.getAllIngredients();
      setMenus(menusData);
      setIngredients(ingredientsData);
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (menuId && ingredientId && quantity.trim()) {
      const quantityValue = parseFloat(quantity);
      if (isNaN(quantityValue) || quantityValue <= 0) {
        alert('올바른 수량을 입력하세요.');
        return;
      }

      onSubmit({
        menu_id: String(menuId),
        ingredient_id: String(ingredientId),
        quantity: quantityValue
      });

      if (!isEditing) {
        setIngredientId(0);
        setQuantity('');
      }
    }
  };

  const selectedIngredient = ingredients.find(ing => ing.id === ingredientId);

  return (
    <form onSubmit={handleSubmit} className="recipe-form">
      <div className="form-group">
        <label htmlFor="menuId">메뉴:</label>
        <select
          id="menuId"
          value={menuId}
          onChange={(e) => setMenuId(parseInt(e.target.value))}
          required
          disabled={!!selectedMenuId}
        >
          <option value={0}>메뉴를 선택하세요</option>
          {menus.map(menu => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="ingredientId">재료:</label>
        <select
          id="ingredientId"
          value={ingredientId}
          onChange={(e) => setIngredientId(parseInt(e.target.value))}
          required
        >
          <option value={0}>재료를 선택하세요</option>
          {ingredients.map(ingredient => (
            <option key={ingredient.id} value={ingredient.id}>
              {ingredient.name} ({ingredient.unit})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="quantity">
          수량{selectedIngredient && ` (${selectedIngredient.unit})`}:
        </label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          min="0"
          step="0.1"
          placeholder={selectedIngredient ? selectedIngredient.unit : '수량'}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? '수정' : '추가'}
        </button>
        {isEditing && onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
};