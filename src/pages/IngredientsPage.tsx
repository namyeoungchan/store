import React, { useState, useEffect } from 'react';
import { IngredientForm } from '../components/IngredientForm';
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
      const data = await IngredientService.getAllIngredients();
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

        {/* Statistics Cards and Deposit Schedule */}
        <div className="header-content-grid">
          <div className="stats-section">
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

          {/*<div className="deposit-section">*/}
          {/*  <DepositScheduleWidget className="header-deposit-widget" />*/}
          {/*</div>*/}
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
          <div className="trendy-form-section">
            {/* Progress Steps */}
            <div className="form-progress">
              <div className="progress-steps">
                <div className="step completed">
                  <div className="step-circle">
                    <span className="step-icon">📝</span>
                  </div>
                  <div className="step-label">정보 입력</div>
                </div>
                <div className="step-line"></div>
                <div className="step">
                  <div className="step-circle">
                    <span className="step-icon">✅</span>
                  </div>
                  <div className="step-label">완료</div>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="form-hero">
              <div className="hero-content">
                <div className="hero-icon">
                  {editingIngredient ? '✏️' : '🌟'}
                </div>
                <h1 className="hero-title">
                  {editingIngredient ? '재료 정보 수정' : '새로운 재료 등록'}
                </h1>
                <p className="hero-subtitle">
                  {editingIngredient
                    ? `'${editingIngredient.name}' 재료의 정보를 수정하고 저장하세요`
                    : '시스템에 새로운 재료를 추가하여 재고 관리를 시작하세요'
                  }
                </p>
                {editingIngredient && (
                  <div className="editing-badge">
                    <span className="badge-icon">🔄</span>
                    <span className="badge-text">수정 모드</span>
                  </div>
                )}
              </div>

              {editingIngredient && (
                <button
                  className="hero-cancel-btn"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  <span className="cancel-icon">✕</span>
                  <span className="cancel-text">취소</span>
                </button>
              )}
            </div>

            {/* Form Container */}
            <div className="modern-form-container">
              <div className="form-wrapper">
                {/* Form Stats */}
                <div className="form-stats">
                  <div className="stat-item">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-number">{ingredients.length}</div>
                      <div className="stat-label">등록된 재료</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">📏</div>
                    <div className="stat-content">
                      <div className="stat-number">{Object.keys(unitStats).length}</div>
                      <div className="stat-label">사용 중인 단위</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <div className="stat-number">{editingIngredient ? '수정' : '신규'}</div>
                      <div className="stat-label">작업 유형</div>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="enhanced-form-content">
                  <div className="form-intro">
                    <div className="intro-card">
                      <div className="intro-header">
                        <span className="intro-icon">💡</span>
                        <span className="intro-title">재료 등록 가이드</span>
                      </div>
                      <div className="intro-tips">
                        <div className="tip-item">
                          <span className="tip-bullet">•</span>
                          <span className="tip-text">재료명은 고유해야 합니다</span>
                        </div>
                        <div className="tip-item">
                          <span className="tip-bullet">•</span>
                          <span className="tip-text">적절한 단위를 선택하세요 (kg, L, 개 등)</span>
                        </div>
                        <div className="tip-item">
                          <span className="tip-bullet">•</span>
                          <span className="tip-text">등록 후 재고 관리가 가능합니다</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Card */}
                  <div className="premium-form-card">
                    <div className="form-card-header">
                      <div className="header-left">
                        <div className="form-icon">{editingIngredient ? '📝' : '➕'}</div>
                        <div className="header-text">
                          <h3>{editingIngredient ? '재료 수정' : '재료 등록'}</h3>
                          <p>필수 정보를 입력해주세요</p>
                        </div>
                      </div>
                      <div className="header-right">
                        <div className="form-status">
                          <div className={`status-dot ${editingIngredient ? 'editing' : 'creating'}`}></div>
                          <span className="status-text">
                            {editingIngredient ? '수정 중' : '등록 중'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-card-content">
                      <IngredientForm
                        onSubmit={editingIngredient ? handleEditIngredientWithTabSwitch : handleAddIngredientWithTabSwitch}
                        initialData={editingIngredient || undefined}
                        isEditing={!!editingIngredient}
                        onCancel={cancelEdit}
                      />
                    </div>
                  </div>

                  {/* Success Expectations */}
                  <div className="success-preview">
                    <div className="preview-header">
                      <span className="preview-icon">🎉</span>
                      <span className="preview-title">등록 완료 후</span>
                    </div>
                    <div className="preview-benefits">
                      <div className="benefit-item">
                        <span className="benefit-icon">📦</span>
                        <span className="benefit-text">재고 관리 시스템에 자동 추가</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">📊</span>
                        <span className="benefit-text">통계 및 분석 데이터에 반영</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">🔔</span>
                        <span className="benefit-text">재고 부족 알림 설정 가능</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading Overlay */}
              {loading && (
                <div className="premium-loading-overlay">
                  <div className="loading-content">
                    <div className="loading-spinner-premium">
                      <div className="spinner-ring"></div>
                      <div className="spinner-ring"></div>
                      <div className="spinner-ring"></div>
                    </div>
                    <h3 className="loading-title">
                      {editingIngredient ? '수정 중...' : '등록 중...'}
                    </h3>
                    <p className="loading-message">잠시만 기다려주세요</p>
                  </div>
                </div>
              )}
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

        /* Header Content Grid */
        .header-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .stats-section {
          min-width: 0;
        }

        .deposit-section {
          min-width: 0;
        }

        /* Statistics Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
        }

        .header-deposit-widget {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-deposit-widget .title-text {
          color: white;
        }

        .header-deposit-widget .amount-value {
          color: white;
          -webkit-text-fill-color: white;
        }

        .header-deposit-widget .schedule-item {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .header-deposit-widget .date-text,
        .header-deposit-widget .schedule-amount {
          color: white;
        }

        .header-deposit-widget .date-full,
        .header-deposit-widget .schedule-count {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
        }

        .header-deposit-widget .expand-icon {
          color: rgba(255, 255, 255, 0.8);
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

        /* Trendy Form Section */
        .trendy-form-section {
          padding: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Progress Steps */
        .form-progress {
          margin-bottom: 2rem;
        }

        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          max-width: 300px;
          margin: 0 auto;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .step-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .step.completed .step-circle {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .step-icon {
          font-size: 1.25rem;
        }

        .step.completed .step-icon {
          filter: brightness(0) invert(1);
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
        }

        .step.completed .step-label {
          color: #3b82f6;
          font-weight: 600;
        }

        .step-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #e2e8f0);
          border-radius: 1px;
        }

        /* Hero Section */
        .form-hero {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border-radius: 24px;
          padding: 3rem 2rem;
          margin-bottom: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .form-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(-10px, -10px) rotate(0deg); }
          50% { transform: translate(10px, 10px) rotate(5deg); }
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #1e293b, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          margin: 0 0 1.5rem 0;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .editing-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .hero-cancel-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          color: #ef4444;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 3;
        }

        .hero-cancel-btn:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #ef4444;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
        }

        .hero-cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Modern Form Container */
        .modern-form-container {
          position: relative;
        }

        .form-wrapper {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }

        /* Form Stats */
        .form-stats {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 1.5rem 2rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-2px);
          background: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .stat-icon {
          font-size: 1.5rem;
        }

        .stat-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        /* Enhanced Form Content */
        .enhanced-form-content {
          padding: 2rem;
        }

        /* Form Intro */
        .form-intro {
          margin-bottom: 2rem;
        }

        .intro-card {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 1px solid #bae6fd;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .intro-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .intro-title {
          font-weight: 600;
          color: #0369a1;
          font-size: 1rem;
        }

        .intro-tips {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tip-bullet {
          color: #0369a1;
          font-weight: 700;
        }

        .tip-text {
          color: #0c4a6e;
          font-size: 0.875rem;
        }

        /* Premium Form Card */
        .premium-form-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .premium-form-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
        }

        .form-card-header {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .form-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          filter: brightness(0) invert(1);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .header-text h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .header-text p {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .form-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.editing {
          background: #f59e0b;
        }

        .status-dot.creating {
          background: #10b981;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }

        .form-card-content {
          padding: 2rem;
        }

        /* Success Preview */
        .success-preview {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 1.5rem;
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .preview-title {
          font-weight: 600;
          color: #15803d;
          font-size: 1rem;
        }

        .preview-benefits {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .benefit-icon {
          font-size: 1.1rem;
        }

        .benefit-text {
          color: #166534;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Premium Loading Overlay */
        .premium-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          z-index: 100;
        }

        .loading-content {
          text-align: center;
          max-width: 300px;
        }

        .loading-spinner-premium {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem auto;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-radius: 50%;
          animation: spin-ring 1.5s linear infinite;
        }

        .spinner-ring:nth-child(1) {
          border-top-color: #3b82f6;
          animation-delay: 0s;
        }

        .spinner-ring:nth-child(2) {
          border-right-color: #10b981;
          animation-delay: 0.3s;
        }

        .spinner-ring:nth-child(3) {
          border-bottom-color: #f59e0b;
          animation-delay: 0.6s;
        }

        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .loading-message {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
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

          .header-content-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
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

          /* Trendy Form Responsive */
          .trendy-form-section {
            padding: 1rem;
          }

          .form-hero {
            padding: 2rem 1rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-cancel-btn {
            position: static;
            margin-top: 1rem;
            align-self: center;
          }

          .form-stats {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .stat-item {
            padding: 0.75rem;
          }

          .enhanced-form-content {
            padding: 1rem;
          }

          .form-card-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
            padding: 1rem;
          }

          .header-left {
            flex-direction: column;
            text-align: center;
          }

          .form-card-content {
            padding: 1rem;
          }

          .progress-steps {
            flex-direction: column;
            gap: 0.5rem;
          }

          .step-line {
            width: 2px;
            height: 30px;
            background: linear-gradient(180deg, #3b82f6, #e2e8f0);
          }
        }
      `}</style>
    </div>
  );
};