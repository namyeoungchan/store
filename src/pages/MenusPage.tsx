import React, { useState, useEffect } from 'react';
import { MenuService } from '../services/menuService';
import { Menu } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

export const MenusPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; menu: Menu | null }>({
    show: false,
    menu: null
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      const data = MenuService.getAllMenus();
      setMenus(data);
    } catch (err) {
      showToast('메뉴 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '' });
    setEditingMenu(null);
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
            <div className="stat-number">{menus.length}</div>
            <div className="stat-label">등록된 메뉴</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              ₩{menus.reduce((sum, menu) => sum + menu.price, 0).toLocaleString()}
            </div>
            <div className="stat-label">총 메뉴 가격</div>
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
                  총 {menus.length}개의 메뉴가 등록되어 있습니다
                </div>
              </div>

              {loading && menus.length > 0 && (
                <div className="loading-overlay">
                  <LoadingSpinner size="small" />
                </div>
              )}

              {menus.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🍽️</div>
                  <h4>등록된 메뉴가 없습니다</h4>
                  <p>첫 번째 메뉴를 등록해보세요!</p>
                </div>
              ) : (
                <div className="menu-grid">
                  {menus.map(menu => (
                    <div key={menu.id} className="menu-card">
                      <div className="menu-info">
                        <h4 className="menu-name">{menu.name}</h4>
                        {menu.description && (
                          <p className="menu-description">{menu.description}</p>
                        )}
                        <div className="menu-price">₩{menu.price.toLocaleString()}</div>
                      </div>
                      <div className="menu-actions">
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
              )}
            </div>
          </div>
        </div>
      </div>

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
        }
      `}</style>
    </div>
  );
};