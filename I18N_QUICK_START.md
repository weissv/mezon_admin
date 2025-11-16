# Quick Start: Adding i18n to a New Page

## Step 1: Create Translation Files

Create a JSON file for each language in the `frontend/src/locales/` directory:

```bash
# Create files for your new page
touch frontend/src/locales/en/mypage.json
touch frontend/src/locales/ru/mypage.json
touch frontend/src/locales/uz/mypage.json
touch frontend/src/locales/kz/mypage.json
```

## Step 2: Add Translations

**frontend/src/locales/en/mypage.json:**
```json
{
  "title": "My Page Title",
  "description": "This is my page description",
  "buttons": {
    "submit": "Submit",
    "reset": "Reset"
  }
}
```

**frontend/src/locales/ru/mypage.json:**
```json
{
  "title": "Заголовок моей страницы",
  "description": "Это описание моей страницы",
  "buttons": {
    "submit": "Отправить",
    "reset": "Сбросить"
  }
}
```

Repeat for `uz` and `kz` languages.

## Step 3: Register Translations

Update `frontend/src/lib/i18n.ts`:

```typescript
// Add imports at the top
import enMypage from '../locales/en/mypage.json';
import ruMypage from '../locales/ru/mypage.json';
import uzMypage from '../locales/uz/mypage.json';
import kzMypage from '../locales/kz/mypage.json';

// Add to resources object
const resources = {
  en: {
    common: enCommon,
    mypage: enMypage,  // Add this
    // ...
  },
  ru: {
    common: ruCommon,
    mypage: ruMypage,  // Add this
    // ...
  },
  uz: {
    common: uzCommon,
    mypage: uzMypage,  // Add this
    // ...
  },
  kz: {
    common: kzCommon,
    mypage: kzMypage,  // Add this
    // ...
  },
};
```

## Step 4: Use in Component

```tsx
import { useTranslation } from 'react-i18next';

export default function MyPage() {
  // Load both your page namespace and common
  const { t } = useTranslation(['mypage', 'common']);
  
  return (
    <div>
      {/* Use translations from your namespace */}
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      
      {/* Use common translations */}
      <button>{t('common:actions.save')}</button>
      
      {/* Use your own button translations */}
      <button>{t('buttons.submit')}</button>
    </div>
  );
}
```

## Common Patterns

### String Interpolation
```tsx
// Translation: "welcome": "Welcome, {{name}}!"
<p>{t('welcome', { name: 'John' })}</p>
```

### Pluralization
```tsx
// Translation: "items": "{{count}} item", "items_plural": "{{count}} items"
<p>{t('items', { count: 5 })}</p>
```

### Using Multiple Namespaces
```tsx
const { t } = useTranslation(['mypage', 'common']);

// From mypage namespace
<h1>{t('title')}</h1>

// From common namespace (with prefix)
<button>{t('common:actions.save')}</button>
```

### Dynamic Namespace
```tsx
const { t } = useTranslation();

<h1>{t('mypage:title')}</h1>
<button>{t('common:actions.save')}</button>
```

## Checklist

- [ ] Created translation files for all 4 languages (en, ru, uz, kz)
- [ ] Added all necessary translation keys
- [ ] Registered translations in `i18n.ts`
- [ ] Imported `useTranslation` in component
- [ ] Replaced all hardcoded strings with `t()` calls
- [ ] Tested language switching works correctly
- [ ] Verified no translation keys are missing

## Tips

1. **Always translate to all languages** - Missing translations will show the key instead
2. **Keep keys consistent** - Use similar structure across pages
3. **Use common.json** - For shared elements like buttons, form labels
4. **Test with long text** - Some languages (like German) can be 30% longer
5. **Use descriptive keys** - `userProfileTitle` is better than `title1`

## Need Help?

See the full documentation in `frontend/src/locales/README.md`
