import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const AUTH_URL = 'https://functions.poehali.dev/8992932f-caba-4f72-8b04-4f01cbda4427';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [emailHint, setEmailHint] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = step === 'credentials' 
        ? { username, password }
        : { username, password, code };

      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.step === 'code_sent') {
          setStep('code');
          setEmailHint(data.email_hint || '');
          toast.success('Код отправлен на email');
        } else if (data.token) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('username', data.username);
          toast.success('Вход выполнен');
          navigate('/mng-7k4x2p9w');
        }
      } else {
        toast.error(data.error || 'Ошибка авторизации');
      }
    } catch (error) {
      toast.error('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setCode('');
    setEmailHint('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SEO 
        title="Вход"
        description="Вход в админ-панель Математической кухни"
      />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === 'credentials' ? (
              <Icon name="Lock" size={48} className="text-primary" />
            ) : (
              <Icon name="Mail" size={48} className="text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {step === 'credentials' ? 'Вход в админ-панель' : 'Введите код'}
          </CardTitle>
          <CardDescription>
            {step === 'credentials' 
              ? 'Математическая кухня' 
              : `Код отправлен на ${emailHint}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'credentials' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Логин</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="code">Код из письма</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Код действителен 5 минут
                </p>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Загрузка...' : step === 'credentials' ? 'Продолжить' : 'Войти'}
            </Button>
            
            {step === 'code' && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBackToCredentials}
              >
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Назад
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Вернуться на сайт
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
