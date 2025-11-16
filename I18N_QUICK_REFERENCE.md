# Quick Reference: Adding i18n to Remaining Pages

## Step-by-Step Guide

### 1. Import useTranslation
```tsx
import { useTranslation } from 'react-i18next';
```

### 2. Use the Hook
```tsx
export default function MyPage() {
  const { t } = useTranslation();
  // ... rest of component
}
```

### 3. Replace Hardcoded Text

**Before:**
```tsx
<h1>Дашборд</h1>
<Button>Добавить</Button>
```

**After:**
```tsx
<h1>{t('dashboard.title')}</h1>
<Button>{t('common.add')}</Button>
```

### 4. Common Patterns

#### Page Titles
```tsx
<h1>{t('pageName.title')}</h1>
```

#### Buttons
```tsx
<Button>{t('common.save')}</Button>
<Button>{t('pageName.addItem')}</Button>
```

#### Form Labels
```tsx
<label>{t('pageName.fieldName')}</label>
```

#### Toast Messages
```tsx
toast.success(t('pageName.successMessage'));
toast.error(t('errors.genericError'));
```

#### Confirmation Dialogs
```tsx
if (!confirm(t('pageName.confirmDelete'))) return;
```

#### Table Columns
```tsx
const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: t('common.name') },
  { key: 'status', header: t('common.status') },
];
```

## Examples for Remaining Pages

### DashboardPage Example
```tsx
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.overview')}</p>
    </div>
  );
}
```

### ChildrenPage Example
```tsx
const { t } = useTranslation();

// In render:
<h1>{t('children.title')}</h1>
<Button onClick={handleAdd}>
  {t('children.addChild')}
</Button>

// In columns:
{ key: 'firstName', header: t('children.firstName') }

// In form:
<label>{t('children.dateOfBirth')}</label>

// In toast:
toast.success(t('children.addChild'));
```

### EmployeesPage Example
```tsx
const { t } = useTranslation();

// Header
<h1>{t('employees.title')}</h1>

// Delete confirmation
if (!confirm(t('employees.confirmDelete'))) return;

// Toast
toast.success(t('employees.deleteEmployee'));
```

## Available Common Keys

### Buttons & Actions
- `common.save`
- `common.cancel`
- `common.delete`
- `common.edit`
- `common.add`
- `common.create`
- `common.submit`
- `common.close`

### Status & States
- `common.loading`
- `common.status`
- `common.actions`

### Form Elements
- `common.search`
- `common.filter`

### Errors
- `errors.genericError`
- `errors.tryAgain`

## Translation File Template

When adding a new section, add to all three files:

### ru.json
```json
"mySection": {
  "title": "Заголовок",
  "addItem": "Добавить элемент",
  "editItem": "Редактировать элемент",
  "deleteItem": "Удалить элемент",
  "confirmDelete": "Вы уверены?",
  "fieldName": "Название поля"
}
```

### en.json
```json
"mySection": {
  "title": "Title",
  "addItem": "Add Item",
  "editItem": "Edit Item",
  "deleteItem": "Delete Item",
  "confirmDelete": "Are you sure?",
  "fieldName": "Field Name"
}
```

### uz.json
```json
"mySection": {
  "title": "Sarlavha",
  "addItem": "Element qo'shish",
  "editItem": "Elementni tahrirlash",
  "deleteItem": "Elementni o'chirish",
  "confirmDelete": "Ishonchingiz komilmi?",
  "fieldName": "Maydon nomi"
}
```

## Testing Checklist

After translating a page:
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] All text changes with language selector
- [ ] Buttons work correctly
- [ ] Forms submit successfully
- [ ] Toast messages appear in correct language
- [ ] Modal dialogs show correct text
- [ ] Table headers are translated

## Tips

1. **Reuse Common Keys**: Use `common.*` keys for frequently used words
2. **Consistent Naming**: Follow pattern `section.action` (e.g., `children.addChild`)
3. **Test Each Language**: Switch languages and verify all text
4. **Check Placeholders**: Don't forget to translate input placeholders
5. **Dynamic Content**: For content with variables, use interpolation:
   ```tsx
   t('message.welcome', { name: user.name })
   ```

## Need Help?

- Check `LoginPage.tsx` for auth-related translations
- Check `BranchesPage.tsx` for CRUD page example
- Check `ClubsPage.tsx` for data table example
- Check `SideNav.tsx` for navigation translations
- Review full documentation in `I18N_IMPLEMENTATION.md`
