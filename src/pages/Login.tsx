import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import SEO from '@/components/SEO';

const API_URL = 'https://functions.poehali.dev/4350c782-6bfa-4c53-b148-e1f621446eaa/user-auth';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_email', data.email);
        if (data.full_name) {
          localStorage.setItem('user_full_name', data.full_name);
        }
        toast.success(isLogin ? 'Добро пожаловать!' : 'Регистрация успешна!');
        navigate('/my-purchases');
      } else {
        toast.error(data.error || 'Ошибка авторизации');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <SEO 
        title={isLogin ? "Вход" : "Регистрация"}
        description="Авторизация для доступа к личному кабинету"
      />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Icon name="User" size={32} className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{isLogin ? 'Вход' : 'Регистрация'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Войдите для доступа к покупкам' : 'Создайте аккаунт для покупок'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="full_name">Полное имя</Label>
                <Input
                  id="full_name"
                  placeholder="Иван Иванов"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.ru"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm p-0 h-auto"
                  onClick={() => navigate('/forgot-password')}
                >
                  Забыли пароль?
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Загрузка...
                </div>
              ) : (
                isLogin ? 'Войти' : 'Зарегистрироваться'
              )}
            </Button>

            <div className="text-center pt-4">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ email: '', password: '', full_name: '' });
                }}
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
              </Button>
            </div>

            <div className="text-center pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <Icon name="ArrowLeft" size={16} />
                На главную
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
