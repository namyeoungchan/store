import React, { useState, useEffect } from 'react';
import { InventoryForm } from '../components/InventoryForm';
import { InventoryHistory } from '../components/InventoryHistory';
import { InventoryService } from '../services/inventoryService';
import { IngredientService } from '../services/ingredientService';
import { InventoryWithDetails, InventoryHistoryWithDetails, Ingredient } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import '../styles/components/InventoryPage.css';

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
      const data = await InventoryService.getAllInventoryWithDetails();
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
      const data = await IngredientService.getAllIngredients();
      setIngredients(data);
    } catch (err) {
      showToast('재료 정보를 불러오는데 실패했습니다.', 'error');
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await InventoryService.getInventoryHistoryWithDetails();
      setHistory(data);
    } catch (err) {
      showToast('재고 이력을 불러오는데 실패했습니다.', 'error');
      console.error(err);
    }
  };

  const handleUpdateStock = async (ingredientId: string, quantity: number, type: 'IN' | 'OUT', notes?: string) => {
    setLoading(true);
    try {
      await InventoryService.adjustStock(ingredientId, quantity, type, notes);
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

  const handleUpdateMinStock = async (ingredientId: string, minStock: number) => {
    setLoading(true);
    try {
      await InventoryService.updateMinStock(ingredientId, minStock);
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

    </div>
  );
};

export default InventoryPage;