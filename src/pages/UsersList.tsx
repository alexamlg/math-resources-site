import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string | null;
}

const API_URL = 'https://functions.poehali.dev/cba7f384-00f8-4a87-89b6-9f94a75af6d5';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.status === 401) {
        navigate('/admin-login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Ошибка загрузки пользователей');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    searchQuery === '' || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Список пользователей"
        description="Зарегистрированные пользователи"
      />
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Icon name="Users" size={24} className="text-primary" />
              <h1 className="text-xl font-bold">Пользователи</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg">
              <Icon name="Users" size={18} className="text-primary" />
              <span className="text-xl font-bold text-primary">{users.length}</span>
              <span className="text-sm text-muted-foreground">всего</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по email или имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Зарегистрированные пользователи</CardTitle>
              <CardDescription>
                {filteredUsers.length === users.length 
                  ? `Всего ${users.length} ${users.length === 1 ? 'пользователь' : users.length < 5 ? 'пользователя' : 'пользователей'}`
                  : `Показано ${filteredUsers.length} из ${users.length}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Имя</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Дата регистрации</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? 'Пользователи не найдены' : 'Нет зарегистрированных пользователей'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-accent/50 transition-colors">
                          <td className="py-3 px-4 text-sm">{user.id}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Icon name="Mail" size={16} className="text-muted-foreground" />
                              <span className="font-medium">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {user.full_name || <span className="text-muted-foreground italic">не указано</span>}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(user.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UsersList;
