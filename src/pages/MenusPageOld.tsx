import React, { useState, useEffect } from 'react';
import { MenuForm } from '../components/MenuForm';
import { RecipeForm } from '../components/RecipeForm';
import { RecipeList } from '../components/RecipeList';
import { MenuService } from '../services/menuService';
import { RecipeService } from '../services/recipeService';
import { Menu, Recipe, RecipeWithDetails } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

export const MenusPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<RecipeWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'menus' | 'recipes'>('menus');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'menu' | 'recipe';
    item: Menu | RecipeWithDetails | null;
  }>({
    show: false,
    type: 'menu',
    item: null
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadMenus();
    loadRecipes();
  }, []);

  const loadMenus = () => {
    try {
      const data = MenuService.getAllMenus();
      setMenus(data);
    } catch (err) {
      console.error('메뉴 목록을 불러오는데 실패했습니다.', err);
      console.error(err);
    }
  };

  const loadRecipes = () => {
    try {
      const data = RecipeService.getAllRecipesWithDetails();
      setRecipes(data);
    } catch (err) {
      console.error('레시피 목록을 불러오는데 실패했습니다.', err);
      console.error(err);
    }
  };

  const handleAddMenu = (menu: Omit<Menu, 'id' | 'created_at'>) => {
    try {
      MenuService.addMenu(menu);
      loadMenus();
    } catch (err) {
      console.error(err instanceof Error ? err.message : '메뉴 등록에 실패했습니다.');
    }
  };

  const handleEditMenu = (menu: Omit<Menu, 'id' | 'created_at'>) => {
    if (!editingMenu) return;

    try {
      MenuService.updateMenu(editingMenu.id!, menu);
      loadMenus();
      setEditingMenu(null);
    } catch (err) {
      console.error(err instanceof Error ? err.message : '메뉴 수정에 실패했습니다.');
    }
  };

  const handleDeleteMenu = (id: number) => {
    try {
      MenuService.deleteMenu(id);
      loadMenus();
      loadRecipes();
      if (selectedMenu?.id === id) {
        setSelectedMenu(null);
      }
    } catch (err) {
      console.error('메뉴 삭제에 실패했습니다.', err);
      console.error(err);
    }
  };

  const handleAddRecipe = (recipe: Omit<Recipe, 'id'>) => {
    try {
      RecipeService.addRecipe(recipe);
      loadRecipes();
    } catch (err) {
      console.error(err instanceof Error ? err.message : '레시피 등록에 실패했습니다.');
    }
  };

  const handleEditRecipe = (recipe: Omit<Recipe, 'id'>) => {
    if (!editingRecipe) return;

    try {
      RecipeService.updateRecipe(editingRecipe.id!, recipe);
      loadRecipes();
      setEditingRecipe(null);
    } catch (err) {
      console.error(err instanceof Error ? err.message : '레시피 수정에 실패했습니다.');
    }
  };

  const handleDeleteRecipe = (id: number) => {
    try {
      RecipeService.deleteRecipe(id);
      loadRecipes();
    } catch (err) {
      console.error('레시피 삭제에 실패했습니다.', err);
      console.error(err);
    }
  };

  const startEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
  };

  const cancelEditMenu = () => {
    setEditingMenu(null);
  };

  const startEditRecipe = (recipe: RecipeWithDetails) => {
    setEditingRecipe(recipe);
  };

  const cancelEditRecipe = () => {
    setEditingRecipe(null);
  };

  const selectedMenuRecipes = selectedMenu
    ? recipes.filter(recipe => recipe.menu_id === selectedMenu.id)
    : [];

  return (
    <div className="menus-page">
      <h2>메뉴 및 레시피 관리</h2>


      <div className="tabs">
        <button
          className={`tab ${activeTab === 'menus' ? 'active' : ''}`}
          onClick={() => setActiveTab('menus')}
        >
          메뉴 관리
        </button>
        <button
          className={`tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          레시피 관리
        </button>
      </div>

      {activeTab === 'menus' && (
        <div className="menu-management">
          <div className="page-content">
            <div className="form-section">
              <h3>{editingMenu ? '메뉴 수정' : '새 메뉴 등록'}</h3>
              <MenuForm
                onSubmit={editingMenu ? handleEditMenu : handleAddMenu}
                initialData={editingMenu || undefined}
                isEditing={!!editingMenu}
                onCancel={cancelEditMenu}
              />
            </div>

            <div className="list-section">
              <h3>등록된 메뉴 ({menus.length}개)</h3>
              <div className="menu-list">
                {menus.length === 0 ? (
                  <div className="no-data">등록된 메뉴가 없습니다.</div>
                ) : (
                  <div className="menu-cards">
                    {menus.map(menu => (
                      <div
                        key={menu.id}
                        className={`menu-card ${selectedMenu?.id === menu.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMenu(menu)}
                      >
                        <h4>{menu.name}</h4>
                        <p className="description">{menu.description || '설명 없음'}</p>
                        <p className="price">{menu.price.toLocaleString()}원</p>
                        <div className="actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditMenu(menu);
                            }}
                          >
                            수정
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`'${menu.name}' 메뉴를 삭제하시겠습니까?`)) {
                                handleDeleteMenu(menu.id!);
                              }
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedMenu && (
                <div className="selected-menu-recipes">
                  <h4>{selectedMenu.name} 레시피</h4>
                  <RecipeList
                    recipes={selectedMenuRecipes}
                    onEdit={startEditRecipe}
                    onDelete={handleDeleteRecipe}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="recipe-management">
          <div className="page-content">
            <div className="form-section">
              <h3>{editingRecipe ? '레시피 수정' : '새 레시피 등록'}</h3>
              <RecipeForm
                onSubmit={editingRecipe ? handleEditRecipe : handleAddRecipe}
                initialData={editingRecipe || undefined}
                isEditing={!!editingRecipe}
                onCancel={cancelEditRecipe}
              />
            </div>

            <div className="list-section">
              <h3>전체 레시피 ({recipes.length}개)</h3>
              <RecipeList
                recipes={recipes}
                onEdit={startEditRecipe}
                onDelete={handleDeleteRecipe}
                groupByMenu={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};