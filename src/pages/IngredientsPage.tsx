import React, { useState, useEffect } from 'react';
import { IngredientForm } from '../components/IngredientForm';
import { IngredientList } from '../components/IngredientList';
import { IngredientService } from '../services/ingredientService';
import { Ingredient } from '../types';

export const IngredientsPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = () => {
    try {
      const data = IngredientService.getAllIngredients();
      setIngredients(data);
    } catch (err) {
      setError('재료 목록을 불러오는데 실패했습니다.');
      console.error(err);
    }
  };

  const handleAddIngredient = (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => {
    try {
      IngredientService.addIngredient(ingredient);
      loadIngredients();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '재료 등록에 실패했습니다.');
    }
  };

  const handleEditIngredient = (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => {
    if (!editingIngredient) return;

    try {
      IngredientService.updateIngredient(editingIngredient.id!, ingredient);
      loadIngredients();
      setEditingIngredient(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '재료 수정에 실패했습니다.');
    }
  };

  const handleDeleteIngredient = (id: number) => {
    try {
      IngredientService.deleteIngredient(id);
      loadIngredients();
      setError('');
    } catch (err) {
      setError('재료 삭제에 실패했습니다.');
      console.error(err);
    }
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  const cancelEdit = () => {
    setEditingIngredient(null);
  };

  return (
    <div className="ingredients-page">
      <h2>재료 관리</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="page-content">
        <div className="form-section">
          <h3>{editingIngredient ? '재료 수정' : '새 재료 등록'}</h3>
          <IngredientForm
            onSubmit={editingIngredient ? handleEditIngredient : handleAddIngredient}
            initialData={editingIngredient || undefined}
            isEditing={!!editingIngredient}
            onCancel={cancelEdit}
          />
        </div>

        <div className="list-section">
          <h3>등록된 재료 ({ingredients.length}개)</h3>
          <IngredientList
            ingredients={ingredients}
            onEdit={startEdit}
            onDelete={handleDeleteIngredient}
          />
        </div>
      </div>
    </div>
  );
};