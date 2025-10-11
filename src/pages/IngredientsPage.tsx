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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
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
    setActiveTab('list');
  };

  // 필터링 로직
  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 성공적인 추가/수정 후 탭 전환
  const handleAddIngredientWithTabSwitch = async (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => {
    await handleAddIngredient(ingredient);
    setActiveTab('list');
  };

  const handleEditIngredientWithTabSwitch = async (ingredient: Omit<Ingredient, 'id' | 'created_at'>) => {
    await handleEditIngredient(ingredient);
    setActiveTab('list');
  };

  const startEditWithTabSwitch = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setActiveTab('add');
  };

  // 단위별 통계
  const unitStats = ingredients.reduce((acc, ingredient) => {
    acc[ingredient.unit] = (acc[ingredient.unit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topUnits = Object.entries(unitStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const getUnitIcon = (unit: string) => {
    const unitIcons: Record<string, string> = {
      'kg': '⚖️',
      'g': '📏',
      'L': '🥤',
      'ml': '💧',
      '개': '📦',
      '장': '📃',
      '병': '🍾',
      '포': '📦',
      '통': '🥫'
    };
    return unitIcons[unit] || '📦';
  };

  if (loading && ingredients.length === 0) {
    return <LoadingSpinner size="large" message="재료 목록을 불러오는 중..." overlay />;
  }

  return (
    <div className="modern-ingredients-page">
      {/* Header with glassmorphism effect */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">🥬</div>
            <div>
              <h1>Smart Ingredients</h1>
              <p>지능형 재료 관리 시스템</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={loadIngredients}
              disabled={loading}
            >
              <span>🔄</span>
              새로고침
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{ingredients.length}</div>
              <div className="stat-label">총 재료</div>
            </div>
          </div>
          <div className="stat-card units">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <div className="stat-number">{Object.keys(unitStats).length}</div>
              <div className="stat-label">단위 종류</div>
            </div>
          </div>
          {topUnits.slice(0, 2).map(([unit, count], index) => (
            <div key={unit} className={`stat-card unit-${index + 1}`}>
              <div className="stat-icon">{getUnitIcon(unit)}</div>
              <div className="stat-content">
                <div className="stat-number">{count}</div>
                <div className="stat-label">{unit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-container">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">재료 목록</span>
            <span className="tab-count">{ingredients.length}</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              if (editingIngredient) setEditingIngredient(null);
            }}
          >
            <span className="tab-icon">{editingIngredient ? '📝' : '➕'}</span>
            <span className="tab-label">{editingIngredient ? '재료 수정' : '재료 등록'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* 재료 목록 탭 */}
        {activeTab === 'list' && (
          <div className="ingredients-section">
            {/* Search and View Controls */}
            <div className="toolbar">
              <div className="search-section">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="재료명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="view-controls">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  ⊞
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  ☰
                </button>
              </div>
            </div>

            {/* Ingredients Grid/List */}
            <div className={`ingredients-display ${viewMode}`}>
              {filteredIngredients.length === 0 ? (
                <div className="empty-state">
                  {ingredients.length === 0 ? (
                    <>
                      <div className="empty-icon">🥬</div>
                      <h3>아직 등록된 재료가 없습니다</h3>
                      <p>새로운 재료를 등록해보세요</p>
                      <button
                        className="add-first-btn"
                        onClick={() => setActiveTab('add')}
                      >
                        첫 재료 등록하기
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="empty-icon">🔍</div>
                      <h3>검색 결과가 없습니다</h3>
                      <p>다른 검색어를 시도해보세요</p>
                    </>
                  )}
                </div>
              ) : (
                filteredIngredients.map(ingredient => (
                  <div
                    key={ingredient.id}
                    className="ingredient-card"
                  >
                    <div className="card-header">
                      <div className="ingredient-name">{ingredient.name}</div>
                      <div className="unit-badge">
                        <span className="unit-icon">{getUnitIcon(ingredient.unit)}</span>
                        <span className="unit-text">{ingredient.unit}</span>
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="ingredient-info">
                        <div className="info-item">
                          <span className="label">등록일</span>
                          <span className="value">
                            {ingredient.created_at
                              ? new Date(ingredient.created_at).toLocaleDateString('ko-KR')
                              : '날짜 없음'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => startEditWithTabSwitch(ingredient)}
                        disabled={loading}
                      >
                        <span>✏️</span>
                        수정
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => confirmDelete(ingredient)}
                        disabled={loading}
                      >
                        <span>🗑️</span>
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {loading && ingredients.length > 0 && (
              <div className="loading-overlay">
                <LoadingSpinner size="small" />
              </div>
            )}
          </div>
        )}

        {/* 재료 등록/수정 탭 */}
        {activeTab === 'add' && (
          <div className="form-section">
            <div className="form-card">
              <div className="form-header">
                <h2>{editingIngredient ? '재료 정보 수정' : '새 재료 등록'}</h2>
                <p>{editingIngredient ? '재료 정보를 수정하고 저장하세요' : '새로운 재료를 시스템에 등록하세요'}</p>
                {editingIngredient && (
                  <button
                    className="cancel-btn"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    <span>✕</span>
                    취소
                  </button>
                )}
              </div>

              <div className="form-content">
                <IngredientForm
                  onSubmit={editingIngredient ? handleEditIngredientWithTabSwitch : handleAddIngredientWithTabSwitch}
                  initialData={editingIngredient || undefined}
                  isEditing={!!editingIngredient}
                  onCancel={cancelEdit}
                />
              </div>
            </div>
          </div>
        )}
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

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <style>{`
        .modern-ingredients-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        /* Header */
        .page-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          margin: 1.5rem;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
        }

        .title-icon {
          font-size: 3rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .header-title h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #e0e7ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-title p {
          margin: 0.5rem 0 0 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          color: white;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Statistics Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }

        .stat-icon {
          font-size: 2rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .stat-content {
          color: white;
        }

        .stat-number {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-label {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        /* Navigation */
        .nav-container {
          margin: 0 1.5rem 1.5rem 1.5rem;
        }

        .nav-tabs {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-tab {
          background: transparent;
          border: none;
          border-radius: 16px;
          padding: 1rem 1.5rem;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          flex: 1;
          justify-content: center;
        }

        .nav-tab:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-tab.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .tab-count {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Content Area */
        .content-area {
          margin: 0 1.5rem 1.5rem 1.5rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          min-height: 600px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: rgba(248, 250, 252, 0.8);
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        }

        .search-section {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.2rem;
          color: #94a3b8;
        }

        .search-box input {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 0.75rem 1rem 0.75rem 3rem;
          font-size: 1rem;
          width: 300px;
          transition: all 0.3s ease;
        }

        .search-box input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
          background: white;
          border-radius: 12px;
          padding: 0.25rem;
          border: 2px solid #e2e8f0;
        }

        .view-btn {
          background: transparent;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
        }

        .view-btn.active {
          background: #3b82f6;
          color: white;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        /* Ingredients Display */
        .ingredients-display {
          padding: 1.5rem;
        }

        .ingredients-display.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .ingredients-display.list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ingredient-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .ingredient-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }

        .ingredient-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .ingredient-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .unit-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          color: #475569;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 600;
        }

        .unit-icon {
          font-size: 1.2rem;
        }

        .card-content {
          margin-bottom: 1.5rem;
        }

        .ingredient-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .value {
          font-size: 0.875rem;
          color: #1e293b;
          font-weight: 600;
        }

        .card-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .action-btn {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .edit-btn:hover:not(:disabled) {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1d4ed8;
        }

        .delete-btn:hover:not(:disabled) {
          background: #fef2f2;
          border-color: #ef4444;
          color: #dc2626;
        }

        /* Form Section */
        .form-section {
          padding: 2rem;
        }

        .form-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          border: 2px solid #e2e8f0;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .form-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
        }

        .form-header p {
          margin: 0;
          color: #64748b;
          font-size: 1rem;
        }

        .cancel-btn {
          position: absolute;
          top: 0;
          right: 0;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.5rem;
          cursor: pointer;
          color: #64748b;
          font-size: 1.2rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }

        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #475569;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
        }

        .add-first-btn {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 16px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .add-first-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        /* Loading Overlay */
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
          border-radius: 24px;
          z-index: 10;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .modern-ingredients-page {
            padding: 0;
          }

          .page-header,
          .nav-container,
          .content-area {
            margin: 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .nav-tabs {
            flex-direction: column;
          }

          .toolbar {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .search-box input {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .page-header,
          .nav-container,
          .content-area {
            margin: 0.5rem;
          }

          .header-title {
            flex-direction: column;
            text-align: center;
          }

          .title-icon {
            font-size: 2rem;
          }

          .header-title h1 {
            font-size: 1.75rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .ingredients-display.grid {
            grid-template-columns: 1fr;
          }

          .form-header {
            text-align: left;
          }

          .cancel-btn {
            position: static;
            margin-top: 1rem;
            align-self: flex-start;
          }

          .card-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};