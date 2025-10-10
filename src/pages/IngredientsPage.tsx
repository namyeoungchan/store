import React, { useState, useEffect } from 'react';
import { IngredientForm } from '../components/IngredientForm';
import { IngredientList } from '../components/IngredientList';
import { IngredientService } from '../services/ingredientService';
import { Ingredient } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

export const IngredientsPage: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; ingredient: Ingredient | null }>({
    show: false,
    ingredient: null
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const data = IngredientService.getAllIngredients();
      setIngredients(data);
    } catch (err) {
      showToast('재료 목록을 불러오는데 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => {
    setLoading(true);
    try {
      IngredientService.addIngredient(ingredient);
      await loadIngredients();
      showToast(`재료 '${ingredient.name}'이(가) 성공적으로 등록되었습니다.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '재료 등록에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditIngredient = async (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => {
    if (!editingIngredient) return;

    setLoading(true);
    try {
      IngredientService.updateIngredient(editingIngredient.id!, ingredient);
      await loadIngredients();
      setEditingIngredient(null);
      showToast(`재료 '${ingredient.name}'이(가) 성공적으로 수정되었습니다.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '재료 수정에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (ingredient: Ingredient) => {
    setDeleteConfirm({ show: true, ingredient });
  };

  const handleDeleteIngredient = async () => {
    if (!deleteConfirm.ingredient) return;

    setLoading(true);
    try {
      IngredientService.deleteIngredient(deleteConfirm.ingredient.id!);
      await loadIngredients();
      showToast(`재료 '${deleteConfirm.ingredient.name}'이(가) 성공적으로 삭제되었습니다.`, 'success');
    } catch (err) {
      showToast('재료 삭제에 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ show: false, ingredient: null });
    }
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  const cancelEdit = () => {
    setEditingIngredient(null);
  };

  if (loading && ingredients.length === 0) {
    return <LoadingSpinner size="large" message="재료 목록을 불러오는 중..." overlay />;
  }

  return (
    <div className="ingredients-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🥬 재료 관리</h1>
          <p className="page-description">매장에서 사용하는 재료를 등록하고 관리합니다</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{ingredients.length}</div>
            <div className="stat-label">등록된 재료</div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="form-section">
            <div className="section-card">
              <div className="section-header">
                <h3>
                  {editingIngredient ? '📝 재료 수정' : '➕ 새 재료 등록'}
                </h3>
                {editingIngredient && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    취소
                  </button>
                )}
              </div>
              <IngredientForm
                onSubmit={editingIngredient ? handleEditIngredient : handleAddIngredient}
                initialData={editingIngredient || undefined}
                isEditing={!!editingIngredient}
                onCancel={cancelEdit}
              />
            </div>
          </div>

          <div className="list-section">
            <div className="section-card">
              <div className="section-header">
                <h3>📋 재료 목록</h3>
                <div className="section-info">
                  총 {ingredients.length}개의 재료가 등록되어 있습니다
                </div>
              </div>
              {loading && ingredients.length > 0 && (
                <div className="loading-overlay">
                  <LoadingSpinner size="small" />
                </div>
              )}
              <IngredientList
                ingredients={ingredients}
                onEdit={startEdit}
                onDelete={confirmDelete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="재료 삭제"
        message={`'${deleteConfirm.ingredient?.name}' 재료를 삭제하시겠습니까?\n\n이 재료를 사용하는 레시피와 재고 정보도 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleDeleteIngredient}
        onCancel={() => setDeleteConfirm({ show: false, ingredient: null })}
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <style>{`
        .ingredients-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 2rem;
        }

        .page-header {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h1 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
          font-size: 2rem;
          font-weight: 700;
        }

        .page-description {
          margin: 0;
          color: #718096;
          font-size: 1.1rem;
        }

        .header-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          min-width: 120px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .section-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f7fafc;
        }

        .section-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-info {
          color: #718096;
          font-size: 0.9rem;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          z-index: 10;
        }

        .btn {
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .ingredients-page {
            padding: 1rem;
          }

          .page-header {
            padding: 1.5rem;
          }

          .section-card {
            padding: 1.5rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};