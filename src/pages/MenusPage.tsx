import React, { useState, useEffect } from 'react';
import { MenuService } from '../services/menuService';
import { IngredientService } from '../services/ingredientService';
import { RecipeService } from '../services/recipeService';
import { Menu, Ingredient, RecipeWithDetails } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

export const MenusPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<Menu[]>([]);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(false);

  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; menu: Menu | null }>({
    show: false,
    menu: null
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Recipe management states
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<{ [menuId: string]: RecipeWithDetails[] }>({});
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    ingredient_id: '',
    quantity: ''
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    loadMenus();
    loadIngredients();
  }, []);

  // 검색 및 필터링 로직
  useEffect(() => {
    let filtered = [...menus];

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(menu =>
        menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (menu.description && menu.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 가격 필터링
    if (priceFilter.min) {
      const minPrice = parseFloat(priceFilter.min);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(menu => menu.price >= minPrice);
      }
    }
    if (priceFilter.max) {
      const maxPrice = parseFloat(priceFilter.max);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(menu => menu.price <= maxPrice);
      }
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'created_at':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredMenus(filtered);
    setCurrentPage(1); // 필터링 시 첫 페이지로 이동
  }, [menus, searchTerm, priceFilter, sortBy, sortOrder]);

  // 페이징 계산
  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMenus = filteredMenus.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceFilter({ min: '', max: '' });
    setSortBy('name');
    setSortOrder('asc');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      const data = await MenuService.getAllMenus();
      setMenus(data);
      setFilteredMenus(data);

      // Load recipes for all menus
      const newRecipes: { [menuId: string]: RecipeWithDetails[] } = {};
      for (const menu of data) {
        if (menu.id) {
          newRecipes[menu.id] = await MenuService.getRecipesByMenuId(menu.id);
        }
      }
      setRecipes(newRecipes);
    } catch (err) {
      showToast('메뉴 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await IngredientService.getAllIngredients();
      setIngredients(data);
    } catch (err) {
      showToast('재료 목록을 불러오는데 실패했습니다.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '' });
    setEditingMenu(null);
  };

  const resetRecipeForm = () => {
    setRecipeForm({ ingredient_id: '', quantity: '' });
  };

  const openRecipeModal = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowRecipeModal(true);
    resetRecipeForm();
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setSelectedMenu(null);
    resetRecipeForm();
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu || !recipeForm.ingredient_id || !recipeForm.quantity) {
      showToast('재료와 수량을 모두 입력해주세요.', 'error');
      return;
    }

    const quantity = parseFloat(recipeForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showToast('올바른 수량을 입력해주세요.', 'error');
      return;
    }

    try {
      await RecipeService.addRecipe({
        menu_id: selectedMenu.id!,
        ingredient_id: recipeForm.ingredient_id,
        quantity
      });

      // Refresh recipes for this menu
      const updatedRecipes = await MenuService.getRecipesByMenuId(selectedMenu.id!);
      setRecipes(prev => ({
        ...prev,
        [selectedMenu.id!]: updatedRecipes
      }));

      showToast('재료가 성공적으로 추가되었습니다.', 'success');
      resetRecipeForm();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '재료 추가에 실패했습니다.', 'error');
    }
  };

  const handleDeleteRecipe = async (recipeId: string, menuId: string) => {
    try {
      await RecipeService.deleteRecipe(recipeId);

      // Refresh recipes for this menu
      const updatedRecipes = await MenuService.getRecipesByMenuId(menuId);
      setRecipes(prev => ({
        ...prev,
        [menuId]: updatedRecipes
      }));

      showToast('재료가 성공적으로 삭제되었습니다.', 'success');
    } catch (err) {
      showToast('재료 삭제에 실패했습니다.', 'error');
    }
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description || '',
      price: menu.price.toString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price.trim()) {
      showToast('메뉴명과 가격을 입력해주세요.', 'error');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      showToast('올바른 가격을 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const menuData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price
      };

      if (editingMenu) {
        MenuService.updateMenu(editingMenu.id!, menuData);
        showToast(`메뉴 '${menuData.name}'이(가) 성공적으로 수정되었습니다.`, 'success');
      } else {
        MenuService.addMenu(menuData);
        showToast(`메뉴 '${menuData.name}'이(가) 성공적으로 등록되었습니다.`, 'success');
      }

      resetForm();
      await loadMenus();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '메뉴 저장에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (menu: Menu) => {
    setDeleteConfirm({ show: true, menu });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.menu) return;

    setLoading(true);
    try {
      MenuService.deleteMenu(deleteConfirm.menu.id!);
      showToast(`메뉴 '${deleteConfirm.menu.name}'이(가) 성공적으로 삭제되었습니다.`, 'success');
      await loadMenus();
    } catch (err) {
      showToast('메뉴 삭제에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
      setDeleteConfirm({ show: false, menu: null });
    }
  };

  if (loading && menus.length === 0) {
    return <LoadingSpinner size="large" message="메뉴 목록을 불러오는 중..." overlay />;
  }

  return (
    <div className="menus-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🍽️ 메뉴 관리</h1>
          <p className="page-description">매장에서 판매하는 메뉴를 등록하고 관리합니다</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{filteredMenus.length}</div>
            <div className="stat-label">표시된 메뉴</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{menus.length}</div>
            <div className="stat-label">전체 메뉴</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              ₩{filteredMenus.reduce((sum, menu) => sum + menu.price, 0).toLocaleString()}
            </div>
            <div className="stat-label">필터된 메뉴 총 가격</div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="form-section">
            <div className="section-card">
              <div className="section-header">
                <h3>
                  {editingMenu ? '📝 메뉴 수정' : '➕ 새 메뉴 등록'}
                </h3>
                {editingMenu && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    취소
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="menu-form">
                <div className="form-group">
                  <label htmlFor="name">메뉴명 *</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="메뉴명을 입력하세요"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">설명</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="메뉴 설명을 입력하세요"
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">가격 *</label>
                  <input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="가격을 입력하세요"
                    disabled={loading}
                    min="0"
                    step="100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={loading}
                >
                  {loading ? '처리중...' : editingMenu ? '수정하기' : '등록하기'}
                </button>
              </form>
            </div>
          </div>

          <div className="list-section">
            <div className="section-card">
              <div className="section-header">
                <h3>📋 메뉴 목록</h3>
                <div className="section-info">
                  총 {menus.length}개 중 {filteredMenus.length}개 표시
                </div>
              </div>

              {/* 검색 및 필터 컨트롤 */}
              <div className="filters-section">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="메뉴명 또는 설명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-controls">
                  <div className="price-filter">
                    <label>가격 범위:</label>
                    <input
                      type="number"
                      placeholder="최소 가격"
                      value={priceFilter.min}
                      onChange={(e) => setPriceFilter({...priceFilter, min: e.target.value})}
                      className="price-input"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      placeholder="최대 가격"
                      value={priceFilter.max}
                      onChange={(e) => setPriceFilter({...priceFilter, max: e.target.value})}
                      className="price-input"
                    />
                  </div>

                  <div className="sort-controls">
                    <label>정렬:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'created_at')}
                      className="sort-select"
                    >
                      <option value="name">이름순</option>
                      <option value="price">가격순</option>
                      <option value="created_at">등록일순</option>
                    </select>
                    <button
                      className={`sort-order-btn ${sortOrder === 'desc' ? 'desc' : 'asc'}`}
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      title={sortOrder === 'asc' ? '내림차순으로 정렬' : '오름차순으로 정렬'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>

                  <div className="items-per-page">
                    <label>페이지당 항목:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="items-select"
                    >
                      <option value={5}>5개</option>
                      <option value={10}>10개</option>
                      <option value={20}>20개</option>
                      <option value={50}>50개</option>
                    </select>
                  </div>

                  <button
                    className="btn btn-secondary btn-small clear-filters"
                    onClick={clearFilters}
                  >
                    필터 초기화
                  </button>
                </div>
              </div>

              {loading && menus.length > 0 && (
                <div className="loading-overlay">
                  <LoadingSpinner size="small" />
                </div>
              )}

              {filteredMenus.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🍽️</div>
                  <h4>{menus.length === 0 ? '등록된 메뉴가 없습니다' : '검색 결과가 없습니다'}</h4>
                  <p>{menus.length === 0 ? '첫 번째 메뉴를 등록해보세요!' : '다른 검색어나 필터를 시도해보세요.'}</p>
                  {menus.length > 0 && (
                    <button className="btn btn-secondary" onClick={clearFilters}>
                      필터 초기화
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="menu-grid">
                    {currentMenus.map(menu => (
                      <div key={menu.id} className="menu-card">
                      <div className="menu-info">
                        <h4 className="menu-name">{menu.name}</h4>
                        {menu.description && (
                          <p className="menu-description">{menu.description}</p>
                        )}
                        <div className="menu-price">₩{menu.price.toLocaleString()}</div>

                        {/* Recipe Information */}
                        <div className="recipe-info">
                          <h5 className="recipe-title">🧄 필요 재료</h5>
                          {recipes[menu.id!] && recipes[menu.id!].length > 0 ? (
                            <div className="recipe-list">
                              {recipes[menu.id!].map(recipe => (
                                <div key={recipe.id} className="recipe-item">
                                  <span className="recipe-ingredient">
                                    {recipe.ingredient_name}
                                  </span>
                                  <span className="recipe-quantity">
                                    {recipe.quantity}{recipe.ingredient_unit}
                                  </span>
                                  <button
                                    className="btn-delete-recipe"
                                    onClick={() => handleDeleteRecipe(recipe.id!, menu.id!)}
                                    disabled={loading}
                                    title="재료 삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-recipes">등록된 재료가 없습니다</p>
                          )}
                        </div>
                      </div>
                      <div className="menu-actions">
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => openRecipeModal(menu)}
                          disabled={loading}
                        >
                          재료 관리
                        </button>
                        <button
                          className="btn btn-secondary btn-small"
                          onClick={() => handleEdit(menu)}
                          disabled={loading}
                        >
                          수정
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => confirmDelete(menu)}
                          disabled={loading}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>

                  {/* 페이징 */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        이전
                      </button>

                      <div className="pagination-numbers">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        다음
                      </button>
                    </div>
                  )}

                  <div className="pagination-info">
                    {filteredMenus.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredMenus.length)}번째 표시
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Management Modal */}
      {showRecipeModal && selectedMenu && (
        <div className="modal-overlay">
          <div className="modal-content recipe-modal">
            <div className="modal-header">
              <h3>🧄 {selectedMenu.name} - 재료 관리</h3>
              <button className="modal-close" onClick={closeRecipeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Add New Recipe Form */}
              <div className="add-recipe-section">
                <h4>새 재료 추가</h4>
                <form onSubmit={handleAddRecipe} className="recipe-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>재료</label>
                      <select
                        value={recipeForm.ingredient_id}
                        onChange={(e) => setRecipeForm({ ...recipeForm, ingredient_id: e.target.value })}
                        required
                      >
                        <option value="">재료를 선택하세요</option>
                        {ingredients
                          .filter(ingredient =>
                            !recipes[selectedMenu.id!]?.some(recipe => recipe.ingredient_id === ingredient.id)
                          )
                          .map(ingredient => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.unit})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>수량</label>
                      <input
                        type="number"
                        value={recipeForm.quantity}
                        onChange={(e) => setRecipeForm({ ...recipeForm, quantity: e.target.value })}
                        placeholder="수량"
                        min="0"
                        step="0.1"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">추가</button>
                  </div>
                </form>
              </div>

              {/* Current Recipes List */}
              <div className="current-recipes-section">
                <h4>현재 재료 목록</h4>
                {recipes[selectedMenu.id!] && recipes[selectedMenu.id!].length > 0 ? (
                  <div className="recipes-table">
                    <div className="table-header">
                      <span>재료명</span>
                      <span>수량</span>
                      <span>단위</span>
                      <span>작업</span>
                    </div>
                    {recipes[selectedMenu.id!].map(recipe => (
                      <div key={recipe.id} className="table-row">
                        <span>{recipe.ingredient_name}</span>
                        <span>{recipe.quantity}</span>
                        <span>{recipe.ingredient_unit}</span>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteRecipe(recipe.id!, selectedMenu.id!)}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-recipes-modal">등록된 재료가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="메뉴 삭제"
        message={`'${deleteConfirm.menu?.name}' 메뉴를 삭제하시겠습니까?\n\n이 메뉴와 관련된 레시피도 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, menu: null })}
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
        .menus-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
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
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          min-width: 140px;
        }

        .stat-number {
          font-size: 1.5rem;
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

        .menu-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #ff9800;
          box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background-color: #f7fafc;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #718096;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h4 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
        }

        .empty-state p {
          margin: 0;
        }

        .menu-grid {
          display: grid;
          gap: 1rem;
        }

        .menu-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s;
          background: #fafafa;
        }

        .menu-card:hover {
          border-color: #ff9800;
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.1);
        }

        .menu-info {
          margin-bottom: 1rem;
        }

        .menu-name {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .menu-description {
          margin: 0 0 0.75rem 0;
          color: #718096;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .menu-price {
          font-size: 1.2rem;
          font-weight: bold;
          color: #ff9800;
        }

        .menu-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .recipe-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .recipe-title {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
        }

        .recipe-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .recipe-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background: #f7fafc;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .recipe-ingredient {
          font-weight: 500;
          color: #2d3748;
        }

        .recipe-quantity {
          color: #718096;
          font-weight: 500;
        }

        .btn-delete-recipe {
          background: #f44336;
          color: white;
          border: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .btn-delete-recipe:hover {
          background: #d32f2f;
        }

        .no-recipes {
          color: #a0aec0;
          font-size: 0.8rem;
          font-style: italic;
          margin: 0;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .modal-close:hover {
          background: #f7fafc;
          color: #2d3748;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .add-recipe-section,
        .current-recipes-section {
          margin-bottom: 2rem;
        }

        .add-recipe-section h4,
        .current-recipes-section h4 {
          margin: 0 0 1rem 0;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .form-row .form-group {
          flex: 1;
        }

        .recipes-table {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #f7fafc;
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-top: 1px solid #e2e8f0;
          align-items: center;
        }

        .table-row:nth-child(even) {
          background: #fafafa;
        }

        .no-recipes-modal {
          text-align: center;
          color: #a0aec0;
          font-style: italic;
          padding: 2rem;
          margin: 0;
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

        .btn-primary {
          background: #ff9800;
          color: white;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
        }

        .btn-large {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          width: 100%;
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

        /* 필터 섹션 스타일 */
        .filters-section {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .search-bar {
          margin-bottom: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #ff9800;
          box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
        }

        .filter-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .price-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .price-filter label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .price-input {
          width: 100px;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-controls label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .sort-select, .items-select {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.8rem;
          background: white;
        }

        .sort-order-btn {
          padding: 0.5rem;
          background: #e2e8f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sort-order-btn:hover {
          background: #cbd5e0;
        }

        .sort-order-btn.desc {
          background: #ff9800;
          color: white;
        }

        .items-per-page {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .items-per-page label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .clear-filters {
          margin-left: auto;
        }

        /* 페이징 스타일 */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin: 2rem 0 1rem 0;
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          background: #e2e8f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          gap: 0.25rem;
        }

        .pagination-number {
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          min-width: 40px;
          text-align: center;
        }

        .pagination-number:hover {
          background: #f7fafc;
          border-color: #ff9800;
        }

        .pagination-number.active {
          background: #ff9800;
          color: white;
          border-color: #ff9800;
        }

        .pagination-info {
          text-align: center;
          color: #718096;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .menus-page {
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

          .header-stats {
            flex-direction: column;
            align-items: center;
          }

          .menu-actions {
            flex-direction: column;
          }

          .filter-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .clear-filters {
            margin-left: 0;
            align-self: center;
          }

          .pagination {
            flex-wrap: wrap;
          }

          .pagination-numbers {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};