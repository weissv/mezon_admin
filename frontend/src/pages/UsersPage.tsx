import { useState } from 'react';
import { Shield, Users, Lock } from 'lucide-react';
import { UsersDirectoryView } from './users/UsersDirectoryView';
import { RolesPermissionsView } from './users/RolesPermissionsView';

type ViewTab = 'users' | 'roles';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<ViewTab>('users');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'roles'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lock className="h-4 w-4" />
          Роли и права
        </button>
      </div>

      {/* Active View */}
      {activeTab === 'users' ? <UsersDirectoryView /> : <RolesPermissionsView />}
    </div>
  );
}
