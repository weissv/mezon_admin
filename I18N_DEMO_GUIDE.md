# 🌍 i18n Feature Demonstration Guide

## How to Test the Internationalization Feature

### 1. Access the Application

Start the development server:
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173` (or your configured port)

### 2. Login Page Language Switching

**What you'll see:**
- Top right corner: Language selector (globe icon 🌐)
- Login form in Russian by default
- Landing page content

**Try this:**
1. Click the globe icon
2. Select "English" 🇬🇧
3. Watch the entire page translate instantly:
   - "Вход в ERP" → "ERP Login"
   - "Логин" → "Username"
   - "Пароль" → "Password"
   - "Войти" → "Sign In"
   - Feature list translates

4. Switch to Uzbek 🇺🇿
   - "ERP tizimiga kirish"
   - "Login"
   - "Parol"
   - "Kirish"

5. Refresh the page - language stays the same! ✨

### 3. Main Application Navigation

**After logging in:**

1. **Top Navigation Bar**
   - Globe icon 🌐 with current language flag
   - Click to switch languages

2. **Side Navigation**
   - All menu items update:
     - Russian: "Дашборд", "Дети", "Сотрудники"
     - English: "Dashboard", "Children", "Employees"
     - Uzbek: "Boshqaruv paneli", "Bolalar", "Xodimlar"
   
   - Footer text changes:
     - Russian: "Есть вопрос? Свяжитесь с нами:"
     - English: "Have a question? Contact us:"
     - Uzbek: "Savolingiz bormi? Biz bilan bog'laning:"

### 4. Branches Page Demo

Navigate to **Branches** (Филиалы / Branches / Filiallar)

**Russian (ru):**
- Title: "Филиалы"
- Button: "Добавить филиал"
- Empty state: "Нет филиалов. Добавить первый филиал."
- Form fields: "Название", "Адрес", "Телефон"

**English (en):**
- Title: "Branches"
- Button: "Add Branch"
- Empty state: "No branches. Click 'Add Branch' to create your first branch"
- Form fields: "Name", "Address", "Phone"

**Uzbek (uz):**
- Title: "Filiallar"
- Button: "Filial qo'shish"
- Empty state: "Filiallar yo'q. Birinchi filialni yaratish uchun 'Filial qo'shish' tugmasini bosing"
- Form fields: "Nomi", "Manzil", "Telefon"

### 5. Clubs Page Demo

Navigate to **Clubs** (Кружки / Clubs / To'garaklar)

**What translates:**
- Page title
- "Add Club" button
- Table headers: ID, Name, Teacher, Price, Max Children, Actions
- Action buttons: Edit, Delete
- Modal form: all labels and placeholders
- Toast notifications on save/delete

**Try this workflow:**
1. Click "Add Club" in Russian
2. See modal: "Добавить кружок"
3. Switch to English mid-form
4. Modal updates: "Add Club"
5. Fill form and save
6. Success toast appears in selected language

### 6. 404 Page Demo

Navigate to a non-existent page: `/does-not-exist`

**Russian:**
- "Страница не найдена"
- "Запрашиваемая страница не существует или была перемещена"
- "Вернуться на главную"

**English:**
- "Page Not Found"
- "The page you requested does not exist or has been moved"
- "Go to Home"

**Uzbek:**
- "Sahifa topilmadi"
- "So'ralgan sahifa mavjud emas yoki ko'chirilgan"
- "Bosh sahifaga qaytish"

### 7. Cookie Persistence Test

**Verify cookie storage:**

1. Open browser DevTools (F12)
2. Go to Application/Storage → Cookies
3. Look for: `mezon_language`
4. Value should be: `ru`, `en`, or `uz`
5. Expiration: 1 year from now

**Test persistence:**
1. Select Uzbek language
2. Navigate to different pages
3. Close browser completely
4. Reopen and visit the site
5. Should still be in Uzbek! ✅

### 8. Language Detection Priority

The system checks in this order:
1. **Cookie** (if previously selected)
2. **localStorage** (fallback)
3. **Browser language** (auto-detect)
4. **Default** (Russian)

**Test:**
1. Clear all cookies
2. Clear localStorage
3. Refresh page
4. Should default to Russian

## Visual Indicators

### Language Selector States

**Closed state:**
```
🌐 🇷🇺 Русский
```

**Open state (dropdown):**
```
┌─────────────────┐
│ 🇷🇺 Русский    │ ← Selected
│ 🇬🇧 English     │
│ 🇺🇿 O'zbekcha   │
└─────────────────┘
```

## Common UI Elements Across All Languages

| Element | Russian | English | Uzbek |
|---------|---------|---------|-------|
| Save | Сохранить | Save | Saqlash |
| Cancel | Отмена | Cancel | Bekor qilish |
| Delete | Удалить | Delete | O'chirish |
| Edit | Редактировать | Edit | Tahrirlash |
| Add | Добавить | Add | Qo'shish |
| Loading | Загрузка... | Loading... | Yuklanmoqda... |

## Toast Notifications Test

Perform actions and watch toast messages:

**Creating a branch:**
- 🇷🇺 "Филиал добавлен"
- 🇬🇧 "Add Branch"
- 🇺🇿 "Filial qo'shish"

**Deleting a club:**
- 🇷🇺 "Кружок удален"
- 🇬🇧 "Delete Club"
- 🇺🇿 "To'garakni o'chirish"

**Error messages:**
- 🇷🇺 "Произошла ошибка"
- 🇬🇧 "An error occurred"
- 🇺🇿 "Xatolik yuz berdi"

## Keyboard Shortcuts (Future Enhancement)

Consider adding:
- `Ctrl+Shift+L` - Open language selector
- `Ctrl+Shift+1` - Russian
- `Ctrl+Shift+2` - English
- `Ctrl+Shift+3` - Uzbek

## Mobile Experience

On mobile devices:
- Language selector shows flag emoji only (space-saving)
- Dropdown works on touch
- Cookie persists across sessions

## Known Edge Cases

1. **Mixed Content**: Some dynamic content from backend may not be translated
2. **Numbers**: Currently using locale-specific formatting (UZS currency)
3. **Dates**: Not yet localized (uses default browser formatting)

## Troubleshooting

### Language not switching?
1. Check browser console for errors
2. Verify cookie is being set
3. Clear browser cache
4. Try incognito/private window

### Text showing as keys (e.g., "nav.dashboard")?
1. Translation key is missing or misspelled
2. Check browser console for warnings
3. Verify translation exists in all 3 JSON files

### Cookie not saving?
1. Check if cookies are enabled
2. Verify not in private/incognito mode
3. Check cookie-blocking extensions

## Performance Notes

- **First load**: ~513KB bundle (includes all translations)
- **Language switch**: Instant (no page reload)
- **Cookie read**: Negligible overhead
- **Memory**: All 3 languages loaded simultaneously

## Accessibility

- Language selector has proper ARIA labels
- Keyboard navigable
- Screen reader friendly
- Focus management on dropdown

## Screenshots to Capture

For documentation:
1. Login page in each language
2. Language selector dropdown
3. Browser cookies showing `mezon_language`
4. Side navigation in each language
5. Forms in each language
6. Toast notifications in each language

---

**Test Duration**: ~10-15 minutes for full demonstration  
**Complexity**: Easy - no setup required  
**Browser**: Works in all modern browsers  
**Mobile**: Fully responsive
