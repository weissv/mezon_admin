import { useState} from 'react';
import { toast} from 'sonner';
import { useApi} from '../hooks/useApi';
import { DataTable, Column} from '../components/DataTable/DataTable';
import { Button} from '../components/ui/button';
import { Modal, ModalActions, ModalNotice, ModalSection, ModalStat, ModalGrid} from '../components/Modal';
import { PlusCircle, ChefHat, Apple, AlertTriangle} from 'lucide-react';
import { Ingredient, Dish, DishNutrition} from '../types/recipe';
import { IngredientForm} from '../components/forms/IngredientForm';
import { DishForm} from '../components/forms/DishForm';
import { api} from '../lib/api';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';

export default function RecipesPage() {
  const [viewMode, setViewMode] = useState<'ingredients' | 'dishes'>('dishes');

  return (
  <PageStack>
  <PageHeader
  eyebrow="Kitchen · справочник"
  title="Рецепты и ингредиенты"
  description="Единый реестр блюд и ингредиентов для кухни: переключение между сущностями, быстрый CRUD и просмотр КБЖУ."
  icon={viewMode === 'dishes' ? <ChefHat className="h-5 w-5"/> : <Apple className="h-5 w-5"/>}
  meta={<span className="mezon-badge macos-badge-neutral">{viewMode === 'dishes' ? 'Блюда' : 'Ингредиенты'}</span>}
  />
  <PageToolbar>
  <div className="mezon-toolbar-group">
  <Button
  variant={viewMode === 'dishes' ? 'default' : 'outline'}
  onClick={() => setViewMode('dishes')}
 >
 <ChefHat className="mr-2 h-4 w-4"/> Блюда
 </Button>
 <Button
 variant={viewMode === 'ingredients' ? 'default' : 'outline'}
 onClick={() => setViewMode('ingredients')}
  >
  <Apple className="mr-2 h-4 w-4"/> Ингредиенты
  </Button>
  </div>
  </PageToolbar>

  {viewMode === 'dishes' ? <DishesView /> : <IngredientsView />}
  </PageStack>
  );
}

function DishesView() {
 const { data, total, page, setPage, fetchData} = useApi<Dish>({
 url: '/api/recipes/dishes',
});
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingDish, setEditingDish] = useState<Dish | null>(null);
 const [nutritionData, setNutritionData] = useState<DishNutrition | null>(null);
 
 // Delete confirmation modal
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [deletingDish, setDeletingDish] = useState<Dish | null>(null);
 const [deleting, setDeleting] = useState(false);

 const handleCreate = () => {
 setEditingDish(null);
 setIsModalOpen(true);
};

 const handleEdit = (dish: Dish) => {
 setEditingDish(dish);
 setIsModalOpen(true);
};

 const openDeleteModal = (dish: Dish) => {
 setDeletingDish(dish);
 setDeleteModalOpen(true);
};

 const handleDelete = async () => {
 if (!deletingDish) return;
 setDeleting(true);
 try {
 await api.delete(`/api/recipes/dishes/${deletingDish.id}`);
 toast.success('Блюдо удалено');
 setDeleteModalOpen(false);
 setDeletingDish(null);
 fetchData();
} catch (error: any) {
 toast.error('Ошибка удаления', { description: error?.message});
} finally {
 setDeleting(false);
}
};

 const handleViewNutrition = async (dish: Dish) => {
 try {
 const nutrition = await api.get(`/api/recipes/dishes/${dish.id}/nutrition`);
 setNutritionData(nutrition);
} catch (error) {
 toast.error('Ошибка загрузки КБЖУ');
}
};

 const handleFormSuccess = () => {
 setIsModalOpen(false);
 fetchData();
 toast.success(editingDish ? 'Блюдо обновлено' : 'Блюдо создано');
};

 const columns: Column<Dish>[] = [
 { key: 'id', header: 'ID'},
 { key: 'name', header: 'Название'},
 { key: 'category', header: 'Категория'},
 {
 key: 'preparationTime',
 header: 'Время приготовления',
 render: (row) => `${row.preparationTime} мин`
},
 {
 key: 'ingredients',
 header: 'Ингредиентов',
 render: (row) => row.ingredients?.length || 0
},
 {
 key: 'actions',
 header: 'Действия',
 render: (row) => (
 <div className="flex gap-2">
 <Button variant="outline"size="sm"onClick={() => handleEdit(row)}>
 Редактировать
 </Button>
 <Button variant="ghost"size="sm"onClick={() => handleViewNutrition(row)}>
 КБЖУ
 </Button>
 <Button variant="destructive"size="sm"onClick={() => openDeleteModal(row)}>
 Удалить
 </Button>
 </div>
 ),
},
 ];

  return (
  <PageSection className="space-y-4">
  <div className="flex justify-end">
  <Button onClick={handleCreate}>
  <PlusCircle className="mr-2 h-4 w-4"/> Добавить блюдо
  </Button>
 </div>

 <DataTable
 columns={columns}
 data={data}
 page={page}
 pageSize={10}
 total={total}
 onPageChange={setPage}
 />

 <Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title={editingDish ? 'Редактировать блюдо' : 'Новое блюдо'}
  eyebrow="Каталог блюд"
  description="Соберите карточку блюда так, чтобы кухня и администратор быстро проверили категорию, время приготовления и состав."
  icon={<ChefHat className="h-5 w-5" />}
  footer={
  <ModalActions>
  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
  </ModalActions>
  }
  >
  <DishForm
  initialData={editingDish}
 onSuccess={handleFormSuccess}
 onCancel={() => setIsModalOpen(false)}
 />
 </Modal>

 <Modal
  isOpen={!!nutritionData}
  onClose={() => setNutritionData(null)}
  title="Пищевая ценность"
  eyebrow="КБЖУ"
  description="Сводка по калорийности и нутриентам для выбранного блюда."
  icon={<ChefHat className="h-5 w-5" />}
  >
  {nutritionData && (
  <div className="mezon-modal-form">
  <ModalNotice title="Блюдо" tone="info">{nutritionData.dishName}</ModalNotice>
  <ModalGrid>
  <ModalStat label="Калорийность" value={`${nutritionData.calories.toFixed(1)} ккал`} tone="warning" />
  <ModalStat label="Белки" value={`${nutritionData.protein.toFixed(1)} г`} tone="info" />
  <ModalStat label="Жиры" value={`${nutritionData.fat.toFixed(1)} г`} tone="warning" />
  <ModalStat label="Углеводы" value={`${nutritionData.carbs.toFixed(1)} г`} tone="success" />
  </ModalGrid>
  </div>
  )}
  </Modal>

  <Modal
  isOpen={deleteModalOpen}
  onClose={() => setDeleteModalOpen(false)}
  title="Удаление блюда"
  eyebrow="Опасное действие"
  description="Блюдо исчезнет из справочника и связанных сценариев меню."
  icon={<AlertTriangle className="h-5 w-5" />}
  tone="danger"
  footer={
  <ModalActions>
  <Button variant="outline"onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Отмена</Button>
  <Button variant="destructive"onClick={handleDelete} disabled={deleting}>{deleting ? 'Удаление...' : 'Удалить'}</Button>
  </ModalActions>
  }
  >
  <ModalNotice title="Удаление необратимо" tone="danger">
  Проверьте карточку блюда перед подтверждением.
  </ModalNotice>
  {deletingDish ? (
  <ModalSection title="Карточка блюда">
  <div className="mezon-modal-facts">
  <div className="mezon-modal-fact"><span className="mezon-modal-fact__label">Название</span><span className="mezon-modal-fact__value">{deletingDish.name}</span></div>
  <div className="mezon-modal-fact"><span className="mezon-modal-fact__label">Категория</span><span className="mezon-modal-fact__value">{deletingDish.category || '—'}</span></div>
  <div className="mezon-modal-fact"><span className="mezon-modal-fact__label">Ингредиентов</span><span className="mezon-modal-fact__value">{deletingDish.ingredients?.length || 0}</span></div>
  </div>
  </ModalSection>
  ) : null}
  </Modal>
  </PageSection>
  );
}

function IngredientsView() {
 const { data, total, page, setPage, fetchData} = useApi<Ingredient>({
 url: '/api/recipes/ingredients',
});
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
 
 // Delete confirmation modal
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);
 const [deleting, setDeleting] = useState(false);

 const handleCreate = () => {
 setEditingIngredient(null);
 setIsModalOpen(true);
};

 const handleEdit = (ingredient: Ingredient) => {
 setEditingIngredient(ingredient);
 setIsModalOpen(true);
};

 const openDeleteModal = (ingredient: Ingredient) => {
 setDeletingIngredient(ingredient);
 setDeleteModalOpen(true);
};

 const handleDelete = async () => {
 if (!deletingIngredient) return;
 setDeleting(true);
 try {
 await api.delete(`/api/recipes/ingredients/${deletingIngredient.id}`);
 toast.success('Ингредиент удален');
 setDeleteModalOpen(false);
 setDeletingIngredient(null);
 fetchData();
} catch (error: any) {
 toast.error('Ошибка удаления', { description: error?.message});
} finally {
 setDeleting(false);
}
};

 const handleFormSuccess = () => {
 setIsModalOpen(false);
 fetchData();
 toast.success(editingIngredient ? 'Ингредиент обновлен' : 'Ингредиент добавлен');
};

 const columns: Column<Ingredient>[] = [
 { key: 'id', header: 'ID'},
 { key: 'name', header: 'Название'},
 { key: 'unit', header: 'Единица'},
 {
 key: 'calories',
 header: 'Калории',
 render: (row) => `${row.calories} ккал`
},
 {
 key: 'protein',
 header: 'Белки',
 render: (row) => `${row.protein} г`
},
 {
 key: 'fat',
 header: 'Жиры',
 render: (row) => `${row.fat} г`
},
 {
 key: 'carbs',
 header: 'Углеводы',
 render: (row) => `${row.carbs} г`
},
 {
 key: 'actions',
 header: 'Действия',
 render: (row) => (
 <div className="flex gap-2">
 <Button variant="outline"size="sm"onClick={() => handleEdit(row)}>
 Редактировать
 </Button>
 <Button variant="destructive"size="sm"onClick={() => openDeleteModal(row)}>
 Удалить
 </Button>
 </div>
 ),
},
 ];

  return (
  <PageSection className="space-y-4">
  <div className="flex justify-end">
  <Button onClick={handleCreate}>
  <PlusCircle className="mr-2 h-4 w-4"/> Добавить ингредиент
  </Button>
 </div>

 <DataTable
 columns={columns}
 data={data}
 page={page}
 pageSize={10}
 total={total}
 onPageChange={setPage}
 />

 <Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title={editingIngredient ? 'Редактировать ингредиент' : 'Новый ингредиент'}
  eyebrow="Каталог ингредиентов"
  description="Поддерживайте справочник ингредиентов в одном формате для кухни и отчётности."
  icon={<Apple className="h-5 w-5" />}
  footer={<ModalActions><Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button></ModalActions>}
  >
  <IngredientForm
  initialData={editingIngredient}
 onSuccess={handleFormSuccess}
 onCancel={() => setIsModalOpen(false)}
 />
 </Modal>

  <Modal
  isOpen={deleteModalOpen}
  onClose={() => setDeleteModalOpen(false)}
  title="Удаление ингредиента"
  eyebrow="Опасное действие"
  description="Если ингредиент уже используется в блюдах, удаление может быть заблокировано."
  icon={<AlertTriangle className="h-5 w-5" />}
  tone="danger"
  footer={<ModalActions><Button variant="outline"onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Отмена</Button><Button variant="destructive"onClick={handleDelete} disabled={deleting}>{deleting ? 'Удаление...' : 'Удалить'}</Button></ModalActions>}
  >
  <ModalNotice title="Удаление необратимо" tone="danger">
  Проверьте название, единицу измерения и калорийность ингредиента.
  </ModalNotice>
  {deletingIngredient ? (
  <ModalSection title="Карточка ингредиента">
  <div className="mezon-modal-facts">
  <div className="mezon-modal-fact"><span className="mezon-modal-fact__label">Название</span><span className="mezon-modal-fact__value">{deletingIngredient.name}</span></div>
  <div className="mezon-modal-fact"><span className="mezon-modal-fact__label">Единица</span><span className="mezon-modal-fact__value">{deletingIngredient.unit}</span></div>
  <div className="mezon-modal-fact"><span className="mezon-modal-fact__label">Калории</span><span className="mezon-modal-fact__value">{deletingIngredient.calories} ккал</span></div>
  </div>
  </ModalSection>
  ) : null}
  </Modal>
  </PageSection>
  );
}
