import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Card } from '../components/Card';

type Club = { id: number; name: string; description: string; teacher: { firstName: string; lastName: string } };

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/clubs')
      .then(setClubs)
      .catch(err => toast.error('Ошибка загрузки кружков', { description: err?.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Кружки</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map(club => (
          <Card key={club.id}>
            <h2 className="font-bold">{club.name}</h2>
            <p className="text-sm text-gray-600">Педагог: {club.teacher.firstName} {club.teacher.lastName}</p>
            <p className="text-sm mt-2">{club.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}