import { useState} from 'react';
import { Shield, Users, Lock} from 'lucide-react';
import { UsersDirectoryView} from './users/UsersDirectoryView';
import { RolesPermissionsView} from './users/RolesPermissionsView';

type ViewTab = 'users' | 'roles';

export default function UsersPage() {
 const [activeTab, setActiveTab] = useState<ViewTab>('users');

 return (
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[rgba(10,132,255,0.12)] text-[var(--mezon-accent)] shadow-[0_10px_24px_rgba(10,132,255,0.12)]">
 <Shield className="h-5 w-5"/>
 </div>
 <div>
 <h1 className="mezon-section-title mb-0">Управление пользователями</h1>
 <p className="mezon-subtitle">Каталог сотрудников, роли и права доступа в одном рабочем пространстве.</p>
 </div>
 </div>

 <div className="inline-flex w-fit gap-1 rounded-[16px] border border-[var(--glass-border)] bg-[var(--mezon-panel-muted)] p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-[24px]">
 <button
 onClick={() => setActiveTab('users')}
 className={`flex items-center gap-2 rounded-[12px] px-4 py-2 macos-text-caption macos-transition ${
 activeTab === 'users'
 ? 'bg-[rgba(255,255,255,0.9)] text-[var(--mezon-dark)] shadow-[0_8px_20px_rgba(15,23,42,0.08)]'
 : 'text-[var(--mezon-text-secondary)] hover:bg-[rgba(255,255,255,0.58)] hover:text-[var(--mezon-dark)]'
}`}
 >
 <Users className="h-4 w-4"/>
 Пользователи
 </button>
 <button
 onClick={() => setActiveTab('roles')}
 className={`flex items-center gap-2 rounded-[12px] px-4 py-2 macos-text-caption macos-transition ${
 activeTab === 'roles'
 ? 'bg-[rgba(255,255,255,0.9)] text-[var(--mezon-dark)] shadow-[0_8px_20px_rgba(15,23,42,0.08)]'
 : 'text-[var(--mezon-text-secondary)] hover:bg-[rgba(255,255,255,0.58)] hover:text-[var(--mezon-dark)]'
}`}
 >
 <Lock className="h-4 w-4"/>
 Роли и права
 </button>
 </div>

 {/* Active View */}
 {activeTab === 'users' ? <UsersDirectoryView /> : <RolesPermissionsView />}
 </div>
 );
}
