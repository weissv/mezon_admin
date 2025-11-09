// src/pages/NotificationsPage.tsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { BellRing, FileText } from 'lucide-react';

type Notification = {
  type: 'CONTRACT_EXPIRING' | 'MEDICAL_CHECKUP_DUE';
  message: string;
  employeeId: number;
  date: string;
};

const iconMap = {
  CONTRACT_EXPIRING: <FileText className="h-6 w-6 text-red-500" />,
  MEDICAL_CHECKUP_DUE: <BellRing className="h-6 w-6 text-yellow-500" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        alert('Не удалось загрузить уведомления.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Уведомления</h1>
      <Card>
        {loading ? (
          <div className="p-4 text-center">Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Нет предстоящих событий.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification, index) => (
              <li key={index} className="p-4 flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {iconMap[notification.type]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{notification.message}</p>
                  <p className="text-sm text-gray-500">
                    Событие произойдет: {new Date(notification.date).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
