import React, { useState } from 'react';
import { Ingredient } from '../types';

interface IngredientListProps {
  ingredients: Ingredient[];
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  onEdit,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (ingredient: Ingredient) => {
    onDelete(ingredient);
  };

  return (
    <div className="ingredient-list">
      <div className="search-bar">
        <input
          type="text"
          placeholder="재료 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table className="ingredient-table">
          <thead>
            <tr>
              <th>재료명</th>
              <th>단위</th>
              <th>등록일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 ? (
              <tr>
                <td colSpan={4} className="no-data">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 재료가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredIngredients.map(ingredient => (
                <tr key={ingredient.id}>
                  <td>{ingredient.name}</td>
                  <td>{ingredient.unit}</td>
                  <td>
                    {ingredient.created_at
                      ? new Date(ingredient.created_at).toLocaleDateString('ko-KR')
                      : '-'
                    }
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onEdit(ingredient)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(ingredient)}
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