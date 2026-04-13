import { useState } from 'react';
import { Lock, Shield, Users } from 'lucide-react';
import { PageHeader, PageStack, PageToolbar } from '../components/ui/page';
import { Button } from '../components/ui/button';
import { RolesPermissionsView } from './users/RolesPermissionsView';
import { UsersDirectoryView } from './users/UsersDirectoryView';

type ViewTab = 'users' | 'roles';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<ViewTab>('users');

  return (
    <PageStack>
      <PageHeader
        eyebrow="Доступ и безопасность"
        title="Пользователи"
        icon={<Shield className="h-5 w-5" />}
        meta={
          <span className="mezon-badge macos-badge-neutral">
            {activeTab === 'users' ? 'Каталог учётных записей' : 'Матрица ролей'}
          </span>
        }
        description="Учётные записи, роли и права доступа теперь собраны в одном плотном контуре. Переключайтесь между каталогом пользователей и матрицей ролей без визуального разрыва."
      />

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-4 w-4" />
            Пользователи
          </Button>
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roles')}
          >
            <Lock className="h-4 w-4" />
            Роли и права
          </Button>
        </div>
      </PageToolbar>

      {activeTab === 'users' ? <UsersDirectoryView /> : <RolesPermissionsView />}
    </PageStack>
  );
}
