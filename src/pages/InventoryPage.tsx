import React, { useState, useEffect } from 'react';
import { InventoryForm } from '../components/InventoryForm';
import { InventoryList } from '../components/InventoryList';
import { InventoryHistory } from '../components/InventoryHistory';
import { InventoryService } from '../services/inventoryService';
import { IngredientService } from '../services/ingredientService';
import { InventoryWithDetails, InventoryHistoryWithDetails, Ingredient } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import LowStockAlert from '../components/LowStockAlert';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryWithDetails | null>(null);
  const [history, setHistory] = useState<InventoryHistoryWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'ingredients' | 'register' | 'history'>('inventory');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadInventory();
    loadIngredients();
    loadHistory();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = InventoryService.getAllInventoryWithDetails();
      setInventory(data);

      // 선택된 아이템이 있다면 업데이트
      if (selectedItem) {
        const updatedItem = data.find((item: InventoryWithDetails) => item.id === selectedItem.id);
        if (updatedItem) {
          setSelectedItem(updatedItem);
        }
      }
    } catch (err) {
      showToast('재고 정보를 불러오는데 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = IngredientService.getAllIngredients();
      setIngredients(data);
    } catch (err) {
      showToast('재료 정보를 불러오는데 실패했습니다.', 'error');
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = InventoryService.getInventoryHistoryWithDetails();
      setHistory(data);
    } catch (err) {
      showToast('재고 이력을 불러오는데 실패했습니다.', 'error');
      console.error(err);
    }
  };

  const handleUpdateStock = async (ingredientId: number, quantity: number, type: 'IN' | 'OUT', notes?: string) => {
    setLoading(true);
    try {
      InventoryService.adjustStock(ingredientId, quantity, type, notes);
      await loadInventory();
      await loadHistory();
      const typeText = type === 'IN' ? '입고' : '출고';
      showToast(`재고가 성공적으로 ${typeText} 처리되었습니다.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '재고 업데이트에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMinStock = async (ingredientId: number, minStock: number) => {
    setLoading(true);
    try {
      InventoryService.updateMinStock(ingredientId, minStock);
      await loadInventory();
      showToast('최소 재고량이 성공적으로 설정되었습니다.', 'success');
    } catch (err) {
      showToast('최소 재고량 설정에 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: InventoryWithDetails) => {
    setSelectedItem(item);
  };

  // 필터링 로직
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'low' && item.current_stock <= item.min_stock) ||
      (filterStatus === 'out' && item.current_stock === 0);
    return matchesSearch && matchesFilter;
  });

  const lowStockItems = inventory.filter(item => item.current_stock <= item.min_stock);
  const outOfStockItems = inventory.filter(item => item.current_stock === 0);

  // 재고 상태별 통계
  const getStockStatus = (item: InventoryWithDetails) => {
    if (item.current_stock === 0) return 'out';
    if (item.current_stock <= item.min_stock) return 'low';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out': return '#ef4444';
      case 'low': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'out': return '품절';
      case 'low': return '부족';
      default: return '충분';
    }
  };

  if (loading && inventory.length === 0) {
    return <LoadingSpinner size="large" message="재고 정보를 불러오는 중..." overlay />;
  }

  return (
    <div className="modern-inventory-page">
      {/* Header with glassmorphism effect */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">🏢</div>
            <div>
              <h1>Smart Inventory</h1>
              <p>지능형 재고 관리 시스템</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={() => { loadInventory(); loadIngredients(); }}>
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
              <div className="stat-number">{inventory.length}</div>
              <div className="stat-label">총 재고품목</div>
            </div>
          </div>
          <div className="stat-card low">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-number">{lowStockItems.length}</div>
              <div className="stat-label">부족 재고</div>
            </div>
          </div>
          <div className="stat-card out">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-number">{outOfStockItems.length}</div>
              <div className="stat-label">품절</div>
            </div>
          </div>
          <div className="stat-card ingredients">
            <div className="stat-icon">🥬</div>
            <div className="stat-content">
              <div className="stat-number">{ingredients.length}</div>
              <div className="stat-label">등록 재료</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-container">
        <div className="nav-tabs">
          {[
            { id: 'inventory', label: '재고현황', icon: '📋', count: inventory.length },
            { id: 'ingredients', label: '재료목록', icon: '🥬', count: ingredients.length },
            { id: 'register', label: '재고등록', icon: '➕', count: null },
            { id: 'history', label: '변동이력', icon: '📈', count: history.length }
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.count !== null && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {/* 재고 현황 탭 */}
        {activeTab === 'inventory' && (
          <div className="inventory-section">
            {/* Search and Filter Bar */}
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
                <div className="filter-group">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="filter-select"
                  >
                    <option value="all">전체 상태</option>
                    <option value="good">충분</option>
                    <option value="low">부족</option>
                    <option value="out">품절</option>
                  </select>
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

            {/* Inventory Grid/List */}
            <div className={`inventory-display ${viewMode}`}>
              {filteredInventory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>검색 결과가 없습니다</h3>
                  <p>다른 검색어나 필터를 시도해보세요</p>
                </div>
              ) : (
                filteredInventory.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <div
                      key={item.id}
                      className={`inventory-card ${status} ${selectedItem?.id === item.id ? 'selected' : ''}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="card-header">
                        <div className="ingredient-name">{item.ingredient_name}</div>
                        <div className={`status-badge ${status}`}>
                          {getStatusText(status)}
                        </div>
                      </div>

                      <div className="stock-info">
                        <div className="current-stock">
                          <span className="stock-number">{item.current_stock}</span>
                          <span className="stock-unit">{item.ingredient_unit}</span>
                        </div>
                        <div className="min-stock">
                          최소: {item.min_stock}{item.ingredient_unit}
                        </div>
                      </div>

                      <div className="stock-bar">
                        <div
                          className="stock-progress"
                          style={{
                            width: `${Math.min((item.current_stock / (item.min_stock * 2)) * 100, 100)}%`,
                            backgroundColor: getStatusColor(status)
                          }}
                        />
                      </div>

                      <div className="card-footer">
                        <span className="last-updated">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Item Management Panel */}
            {selectedItem && (
              <div className="management-panel">
                <div className="panel-header">
                  <h3>재고 관리</h3>
                  <div className="selected-info">
                    {selectedItem.ingredient_name} ({selectedItem.ingredient_unit})
                  </div>
                </div>
                <InventoryForm
                  inventory={selectedItem}
                  onUpdateStock={handleUpdateStock}
                  onUpdateMinStock={handleUpdateMinStock}
                />
              </div>
            )}
          </div>
        )}

        {/* 재료 목록 탭 */}
        {activeTab === 'ingredients' && (
          <div className="ingredients-section">
            <div className="section-header">
              <h2>등록된 재료 목록</h2>
              <p>시스템에 등록된 모든 재료를 확인할 수 있습니다</p>
            </div>

            <div className="ingredients-grid">
              {ingredients.map(ingredient => {
                const inventoryItem = inventory.find(inv => inv.ingredient_id === ingredient.id);
                return (
                  <div key={ingredient.id} className="ingredient-card">
                    <div className="ingredient-header">
                      <h4>{ingredient.name}</h4>
                      <span className="unit-badge">{ingredient.unit}</span>
                    </div>

                    {inventoryItem ? (
                      <div className="inventory-status">
                        <div className="stock-display">
                          <span className="current">{inventoryItem.current_stock}</span>
                          <span className="separator">/</span>
                          <span className="min">{inventoryItem.min_stock}</span>
                          <span className="unit">{ingredient.unit}</span>
                        </div>
                        <div className={`status ${getStockStatus(inventoryItem)}`}>
                          {getStatusText(getStockStatus(inventoryItem))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-inventory">
                        <span>재고 정보 없음</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 재고 등록 탭 */}
        {activeTab === 'register' && (
          <div className="register-section">
            {/* Quick Stats */}
            <div className="register-stats">
              <div className="quick-stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <div className="stat-number">{inventory.length}</div>
                  <div className="stat-label">관리 중인 재료</div>
                </div>
              </div>
              <div className="quick-stat-card warning">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <div className="stat-number">{lowStockItems.length}</div>
                  <div className="stat-label">부족 재고</div>
                </div>
              </div>
              <div className="quick-stat-card danger">
                <div className="stat-icon">🚨</div>
                <div className="stat-info">
                  <div className="stat-number">{outOfStockItems.length}</div>
                  <div className="stat-label">품절</div>
                </div>
              </div>
            </div>

            {/* Main Registration Area */}
            <div className="register-main">
              {/* Material Selection */}
              <div className="material-selection">
                <div className="selection-header">
                  <h3>🎯 재료 선택</h3>
                  <p>재고를 관리할 재료를 선택하세요</p>
                </div>

                <div className="material-grid">
                  {inventory.map(item => {
                    const status = getStockStatus(item);
                    return (
                      <div
                        key={item.id}
                        className={`material-item ${status} ${selectedItem?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <div className="material-header">
                          <span className="material-name">{item.ingredient_name}</span>
                          <span className={`status-dot ${status}`}></span>
                        </div>
                        <div className="material-stock">
                          <span className="current">{item.current_stock}</span>
                          <span className="unit">{item.ingredient_unit}</span>
                          <span className="min-info">최소: {item.min_stock}</span>
                        </div>
                        <div className="material-status">
                          <span className={`status-text ${status}`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Registration Form */}
              {selectedItem && (
                <div className="register-form-area">
                  <div className="form-header">
                    <div className="selected-material">
                      <div className="material-info">
                        <h3>📝 재고 관리</h3>
                        <div className="material-detail">
                          <span className="name">{selectedItem.ingredient_name}</span>
                          <span className="unit">({selectedItem.ingredient_unit})</span>
                          <span className={`status ${getStockStatus(selectedItem)}`}>
                            {getStatusText(getStockStatus(selectedItem))}
                          </span>
                        </div>
                      </div>
                      <div className="current-info">
                        <div className="info-item">
                          <span className="label">현재 재고</span>
                          <span className="value">{selectedItem.current_stock} {selectedItem.ingredient_unit}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">최소 재고</span>
                          <span className="value">{selectedItem.min_stock} {selectedItem.ingredient_unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-content">
                    <InventoryForm
                      inventory={selectedItem}
                      onUpdateStock={handleUpdateStock}
                      onUpdateMinStock={handleUpdateMinStock}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="quick-actions">
                    <h4>⚡ 빠른 작업</h4>
                    <div className="action-buttons">
                      <button
                        className="quick-btn in"
                        onClick={() => handleUpdateStock(selectedItem.ingredient_id, 10, 'IN', '빠른 입고')}
                      >
                        <span>📥</span>
                        +10 입고
                      </button>
                      <button
                        className="quick-btn out"
                        onClick={() => handleUpdateStock(selectedItem.ingredient_id, 5, 'OUT', '빠른 출고')}
                      >
                        <span>📤</span>
                        -5 출고
                      </button>
                      <button
                        className="quick-btn reset"
                        onClick={() => handleUpdateMinStock(selectedItem.ingredient_id, selectedItem.current_stock)}
                      >
                        <span>🔄</span>
                        최소재고 현재값으로
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!selectedItem && (
                <div className="register-empty">
                  <div className="empty-content">
                    <div className="empty-icon">🎯</div>
                    <h3>재료를 선택해주세요</h3>
                    <p>위에서 재고를 관리할 재료를 선택하면<br />상세한 재고 관리 도구가 나타납니다</p>
                    <div className="selection-hint">
                      <span className="hint-item">💡 팁: 부족한 재고부터 관리해보세요</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 변동 이력 탭 */}
        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <h2>재고 변동 이력</h2>
              <p>모든 재고 변동 내역을 시간순으로 확인할 수 있습니다</p>
            </div>
            <InventoryHistory history={history} limit={100} />
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <style>{`
        .modern-inventory-page {
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

        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        /* Statistics Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
          font-size: 2.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .stat-content {
          color: white;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-label {
          font-size: 0.9rem;
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
          position: relative;
          overflow: hidden;
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

        .filter-select {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
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

        /* Inventory Display */
        .inventory-display {
          padding: 1.5rem;
        }

        .inventory-display.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .inventory-display.list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .inventory-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .inventory-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #e2e8f0;
          transition: all 0.3s ease;
        }

        .inventory-card.good::before { background: #10b981; }
        .inventory-card.low::before { background: #f59e0b; }
        .inventory-card.out::before { background: #ef4444; }

        .inventory-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .inventory-card.selected {
          border-color: #3b82f6;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .ingredient-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.good {
          background: #dcfce7;
          color: #15803d;
        }

        .status-badge.low {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.out {
          background: #fee2e2;
          color: #dc2626;
        }

        .stock-info {
          margin-bottom: 1rem;
        }

        .current-stock {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .stock-number {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
        }

        .stock-unit {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        .min-stock {
          font-size: 0.875rem;
          color: #64748b;
        }

        .stock-bar {
          background: #f1f5f9;
          border-radius: 8px;
          height: 6px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .stock-progress {
          height: 100%;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .last-updated {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        /* Management Panel */
        .management-panel {
          margin-top: 2rem;
          background: #f8fafc;
          border-radius: 20px;
          padding: 1.5rem;
          border: 2px solid #e2e8f0;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .selected-info {
          background: #3b82f6;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Ingredients Section */
        .ingredients-section,
        .register-section,
        .history-section {
          padding: 2rem;
        }

        .section-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .section-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .section-header p {
          margin: 0;
          color: #64748b;
          font-size: 1.1rem;
        }

        .ingredients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .ingredient-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.3s ease;
        }

        .ingredient-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .ingredient-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .ingredient-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .unit-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .inventory-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stock-display {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .stock-display .current {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stock-display .separator {
          color: #94a3b8;
        }

        .stock-display .min,
        .stock-display .unit {
          color: #64748b;
          font-size: 0.875rem;
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status.good {
          background: #dcfce7;
          color: #15803d;
        }

        .status.low {
          background: #fef3c7;
          color: #d97706;
        }

        .status.out {
          background: #fee2e2;
          color: #dc2626;
        }

        .no-inventory {
          color: #94a3b8;
          font-style: italic;
          font-size: 0.875rem;
        }

        /* Register Section */
        .register-section {
          padding: 1.5rem;
        }

        .register-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .quick-stat-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .quick-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .quick-stat-card.warning {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fef3c7, #fff);
        }

        .quick-stat-card.danger {
          border-color: #ef4444;
          background: linear-gradient(135deg, #fee2e2, #fff);
        }

        .quick-stat-card .stat-icon {
          font-size: 2rem;
        }

        .quick-stat-card .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .quick-stat-card .stat-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .register-main {
          background: white;
          border-radius: 20px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
        }

        /* Material Selection */
        .material-selection {
          padding: 2rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .selection-header {
          margin-bottom: 1.5rem;
        }

        .selection-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .selection-header p {
          margin: 0;
          color: #64748b;
        }

        .material-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .material-item {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .material-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 16px 16px 0 0;
          background: #e2e8f0;
          transition: all 0.3s ease;
        }

        .material-item.good::before { background: #10b981; }
        .material-item.low::before { background: #f59e0b; }
        .material-item.out::before { background: #ef4444; }

        .material-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .material-item.selected {
          background: linear-gradient(135deg, #dbeafe, #f0f9ff);
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        .material-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .material-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot.good { background: #10b981; }
        .status-dot.low { background: #f59e0b; }
        .status-dot.out { background: #ef4444; }

        .material-stock {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .material-stock .current {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .material-stock .unit {
          color: #64748b;
          font-size: 0.875rem;
        }

        .material-stock .min-info {
          color: #94a3b8;
          font-size: 0.75rem;
          margin-left: auto;
        }

        .material-status {
          text-align: right;
        }

        .status-text {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-text.good {
          background: #dcfce7;
          color: #15803d;
        }

        .status-text.low {
          background: #fef3c7;
          color: #d97706;
        }

        .status-text.out {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Registration Form Area */
        .register-form-area {
          padding: 2rem;
        }

        .form-header {
          margin-bottom: 2rem;
        }

        .selected-material {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .material-info h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .material-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .material-detail .name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
        }

        .material-detail .unit {
          color: #64748b;
        }

        .material-detail .status {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .current-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: right;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .info-item .label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .info-item .value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .form-content {
          margin: 2rem 0;
        }

        /* Quick Actions */
        .quick-actions {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 2rem;
        }

        .quick-actions h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .quick-btn {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .quick-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .quick-btn.in:hover {
          background: #dcfce7;
          border-color: #10b981;
          color: #15803d;
        }

        .quick-btn.out:hover {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #d97706;
        }

        .quick-btn.reset:hover {
          background: #e0e7ff;
          border-color: #3b82f6;
          color: #1d4ed8;
        }

        /* Empty State */
        .register-empty {
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-content {
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .register-empty h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #475569;
        }

        .register-empty p {
          margin: 0 0 1.5rem 0;
          color: #64748b;
          line-height: 1.6;
        }

        .selection-hint {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 1rem;
          color: #0369a1;
        }

        .hint-item {
          font-size: 0.875rem;
          font-weight: 500;
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
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .modern-inventory-page {
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
            flex-wrap: wrap;
          }

          .toolbar {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .search-section {
            flex-direction: column;
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

          .nav-tabs {
            flex-direction: column;
          }

          .nav-tab {
            justify-content: center;
          }

          .inventory-display.grid {
            grid-template-columns: 1fr;
          }

          .ingredients-grid {
            grid-template-columns: 1fr;
          }

          .register-stats {
            grid-template-columns: 1fr;
          }

          .material-grid {
            grid-template-columns: 1fr;
          }

          .selected-material {
            flex-direction: column;
            gap: 1rem;
            text-align: left;
          }

          .current-info {
            text-align: left;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryPage;