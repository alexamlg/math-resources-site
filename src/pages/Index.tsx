import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  type: string;
  sample_pdf_url?: string;
  full_pdf_with_answers_url?: string;
  full_pdf_without_answers_url?: string;
  trainer1_url?: string;
  trainer2_url?: string;
  trainer3_url?: string;
  is_free?: boolean;
  is_new?: boolean;
  is_popular?: boolean;
  preview_image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const API_URL = 'https://functions.poehali.dev/4350c782-6bfa-4c53-b148-e1f621446eaa';

const categories = ['Все', '5 класс', '6 класс', '7 класс', '8 класс', '9 класс', '10 класс', '11 класс', 'ОГЭ', 'ЕГЭ'];

interface IndexProps {
  initialCategory?: string;
}

const Index = ({ initialCategory = 'Все' }: IndexProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [purchasedProductIds, setPurchasedProductIds] = useState<number[]>([]);
  const [stats, setStats] = useState<{ total_products: number; total_files: number } | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastOrderTime, setLastOrderTime] = useState<number>(0);

  useEffect(() => {
    const initData = async () => {
      // Add Yandex verification meta tag
      const meta = document.createElement('meta');
      meta.name = 'yandex-verification';
      meta.content = 'bc4ced2e8c5210d7';
      document.head.appendChild(meta);

      // Загружаем корзину из localStorage при загрузке страницы
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          setCart(cartItems);
        } catch (error) {
          console.error('Ошибка загрузки корзины:', error);
        }
      }
      
      const token = localStorage.getItem('user_token');
      const email = localStorage.getItem('user_email');
      if (token && email) {
        setIsLoggedIn(true);
        setCurrentUserEmail(email);
      }

      // Загружаем продукты и статистику параллельно
      await Promise.all([
        loadProducts(),
        loadStats(),
        token && email ? loadPurchasedProducts(email) : Promise.resolve()
      ]);
    };

    initData();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      // Cleanup meta tag on unmount
      const existingMeta = document.querySelector('meta[name="yandex-verification"]');
      if (existingMeta) existingMeta.remove();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Проверяем флаг для автоматического открытия окна оплаты
  useEffect(() => {
    const openCheckoutFlag = localStorage.getItem('openCheckout');
    
    if (openCheckoutFlag === 'true') {
      const savedCart = localStorage.getItem('cart');
      
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          setCart(cartItems);
          
          setTimeout(() => {
            setIsCheckoutOpen(true);
          }, 300);
        } catch (error) {
          console.error('Ошибка загрузки корзины:', error);
        }
      }
      
      localStorage.removeItem('openCheckout');
    }
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log('Index page - loaded product with id=1:', data.find((p: any) => p.id === 1)?.description);
      setProducts(data);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}?stats=true`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики', error);
    }
  };

  const loadPurchasedProducts = async (email: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/3a1ed603-9a84-4270-a759-a900fcc8d5b3?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data.purchases) {
        const productIds = data.purchases.map((p: any) => p.product_id);
        setPurchasedProductIds(productIds);
      }
    } catch (error) {
      console.error('Ошибка загрузки покупок');
    }
  };

  const filteredProducts = products
    .filter(p => selectedCategory === 'Все' || p.category === selectedCategory)
    .filter(p => searchQuery === '' || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // В категории "Все" популярные и новые файлы показываем первыми
      if (selectedCategory === 'Все') {
        if (a.is_popular && !b.is_popular) return -1;
        if (!a.is_popular && b.is_popular) return 1;
        if (a.is_new && !b.is_new) return -1;
        if (!a.is_new && b.is_new) return 1;
      }
      return 0;
    });

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      toast.info('Товар уже в корзине');
      return;
    }
    const newCart = [...cart, { ...product, quantity: 1 }];
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success(`${product.title} добавлен в корзину`);
  };

  const removeFromCart = (id: number) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.info('Товар удалён из корзины');
  };

  const totalItems = cart.length;
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const hasDiscount = totalItems >= 10;
  const discountPercent = 15;
  const discountAmount = hasDiscount ? Math.round(subtotal * discountPercent / 100) : 0;
  const totalPrice = subtotal - discountAmount;

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleGuestCheckout = async () => {
    if (!guestEmail || cart.length === 0) return;
    
    // Защита от повторных отправок в течение 5 секунд
    const now = Date.now();
    if (now - lastOrderTime < 5000) {
      toast.error('Подождите немного перед следующим заказом');
      return;
    }
    
    if (isProcessingPayment) {
      toast.error('Заказ уже обрабатывается...');
      return;
    }
    
    setIsProcessingPayment(true);
    setLastOrderTime(now);
    setCheckoutLoading(true);
    try {
      const returnUrl = window.location.origin + '/';
      const productIds = cart.map(item => item.id);
      
      const response = await fetch('https://functions.poehali.dev/05fb0013-0d79-4a67-a86f-a215f7c89e1c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: productIds,
          customer_email: guestEmail,
          return_url: returnUrl
        })
      });
      
      const data = await response.json();
      console.error('Payment API response:', { status: response.status, data });
      
      if (!response.ok) {
        const errorMsg = data.error || 'Ошибка создания платежа';
        const details = data.details ? ` | ${JSON.stringify(data.details)}` : '';
        toast.error(errorMsg + details, { duration: 10000 });
        alert(`Ошибка оплаты:\n\nСтатус: ${response.status}\nОшибка: ${errorMsg}${details}\n\nПопробуйте снова или свяжитесь с поддержкой`);
        console.error('Payment failed:', data);
        return;
      }
      
      if (data.payment_url) {
        localStorage.setItem('pending_order', JSON.stringify({ cart, email: guestEmail }));
        window.location.href = data.payment_url;
      } else {
        toast.error('Ошибка создания платежа');
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      toast.error('Ошибка при оплате: ' + errorMsg, { duration: 10000 });
      alert(`Ошибка при оплате:\n\n${errorMsg}\n\nПопробуйте снова или свяжитесь с поддержкой`);
    } finally {
      setCheckoutLoading(false);
      setTimeout(() => setIsProcessingPayment(false), 1000);
    }
  };

  const handleRegisterCheckout = async () => {
    if (!registerEmail || !registerPassword || cart.length === 0) return;
    
    // Защита от повторных отправок в течение 5 секунд
    const now = Date.now();
    if (now - lastOrderTime < 5000) {
      toast.error('Подождите немного перед следующим заказом');
      return;
    }
    
    if (isProcessingPayment) {
      toast.error('Заказ уже обрабатывается...');
      return;
    }
    
    setIsProcessingPayment(true);
    setLastOrderTime(now);
    setCheckoutLoading(true);
    try {
      const authResponse = await fetch('https://functions.poehali.dev/952cea32-e71e-48d7-8465-264417100e39', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: registerEmail,
          password: registerPassword,
          full_name: registerName
        })
      });
      
      const authData = await authResponse.json();
      
      if (authResponse.ok && authData.token) {
        localStorage.setItem('user_token', authData.token);
        localStorage.setItem('user_email', authData.email);
        
        const returnUrl = window.location.origin + '/my-purchases';
        const productIds = cart.map(item => item.id);
        
        const response = await fetch('https://functions.poehali.dev/05fb0013-0d79-4a67-a86f-a215f7c89e1c', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_ids: productIds,
            customer_email: registerEmail,
            return_url: returnUrl
          })
        });
        
        const data = await response.json();
        console.error('Payment API response:', { status: response.status, data });
        
        if (!response.ok) {
          toast.error(data.error || 'Ошибка создания платежа');
          console.error('Payment failed:', data);
          return;
        }
        
        if (data.payment_url) {
          localStorage.setItem('pending_order', JSON.stringify({ cart, user_id: authData.user_id }));
          window.location.href = data.payment_url;
        } else {
          toast.error('Ошибка создания платежа');
        }
      } else {
        toast.error(authData.error || 'Ошибка регистрации');
      }
    } catch (error) {
      toast.error('Ошибка при оформлении');
    } finally {
      setCheckoutLoading(false);
      setTimeout(() => setIsProcessingPayment(false), 1000);
    }
  };

  const handleLoggedInCheckout = async () => {
    if (!currentUserEmail || cart.length === 0) return;
    
    // Защита от повторных отправок в течение 5 секунд
    const now = Date.now();
    if (now - lastOrderTime < 5000) {
      toast.error('Подождите немного перед следующим заказом');
      return;
    }
    
    if (isProcessingPayment) {
      toast.error('Заказ уже обрабатывается...');
      return;
    }
    
    setIsProcessingPayment(true);
    setLastOrderTime(now);
    setCheckoutLoading(true);
    try {
      const returnUrl = window.location.origin + '/my-purchases';
      const productIds = cart.map(item => item.id);
      
      const response = await fetch('https://functions.poehali.dev/05fb0013-0d79-4a67-a86f-a215f7c89e1c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: productIds,
          customer_email: currentUserEmail,
          return_url: returnUrl
        })
      });
      
      const data = await response.json();
      console.error('Payment API response:', { status: response.status, data });
      
      if (!response.ok) {
        const errorMsg = data.error || 'Ошибка создания платежа';
        const details = data.details ? ` | ${JSON.stringify(data.details)}` : '';
        toast.error(errorMsg + details, { duration: 10000 });
        alert(`Ошибка оплаты:\n\nСтатус: ${response.status}\nОшибка: ${errorMsg}${details}\n\nПопробуйте снова или свяжитесь с поддержкой`);
        console.error('Payment failed:', data);
        return;
      }
      
      if (data.payment_url) {
        localStorage.setItem('pending_order', JSON.stringify({ cart, email: currentUserEmail }));
        window.location.href = data.payment_url;
      } else {
        toast.error('Ошибка создания платежа');
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      toast.error('Ошибка при оплате: ' + errorMsg, { duration: 10000 });
      alert(`Ошибка при оплате:\n\n${errorMsg}\n\nПопробуйте снова или свяжитесь с поддержкой`);
    } finally {
      setCheckoutLoading(false);
      setTimeout(() => setIsProcessingPayment(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Тренажёры и методички по математике"
        description="Качественные методички, рабочие листы и тренажёры по математике для 5–11 классов. Эффективная подготовка к ОГЭ и ЕГЭ с ответами и без."
        keywords="математика, ОГЭ, ЕГЭ, тренажёры по математике, методички, рабочие листы, подготовка к экзаменам"
      />
      <div className="bg-primary text-primary-foreground py-2 text-center text-sm font-medium">
        <span>🎉 Скидка 15% при покупке от 10 материалов!</span>
      </div>
      
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Icon name="GraduationCap" size={28} className="text-primary" />
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Математическая кухня</h1>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-purchases')} className="hidden sm:flex">
                <Icon name="User" size={18} className="mr-2" />
                Личный кабинет
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/forgot-password')} className="hidden md:flex">
                  <Icon name="KeyRound" size={18} className="mr-2" />
                  Восстановить пароль
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate('/auth-9x2k7p')} className="hidden sm:flex">
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </Button>
              </>
            )}
            
            {/* Мобильная версия кнопок входа */}
            {!isLoggedIn && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/auth-9x2k7p')} className="sm:hidden">
                <Icon name="LogIn" size={20} />
              </Button>
            )}
            {isLoggedIn && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/my-purchases')} className="sm:hidden">
                <Icon name="User" size={20} />
              </Button>
            )}
          
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative ml-1">
                <Icon name="ShoppingCart" size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Корзина</SheetTitle>
                <SheetDescription>
                  {totalItems > 0 ? `Товаров в корзине: ${totalItems}` : 'Корзина пуста'}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-8 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Icon name="ShoppingBag" size={48} className="mb-4 opacity-50" />
                    <p>Добавьте товары в корзину</p>
                  </div>
                ) : (
                  <>
                    {!hasDiscount && totalItems > 0 && totalItems < 10 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="Tag" size={16} />
                          <span className="font-semibold">Добавьте ещё {10 - totalItems} {(10 - totalItems) === 1 ? 'товар' : 'товара'} для скидки 15%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(totalItems / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {hasDiscount && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="PartyPopper" size={20} />
                          <span className="font-bold text-base">Скидка 15% активирована!</span>
                        </div>
                        <p className="text-sm">Ваша выгода: <span className="font-bold text-lg">{discountAmount} ₽</span></p>
                      </div>
                    )}
                    
                    <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Сумма:</span>
                        <span>{subtotal} ₽</span>
                      </div>
                      {hasDiscount && (
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                          <span>Скидка 15%:</span>
                          <span>-{discountAmount} ₽</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Итого:</span>
                        <span>{totalPrice} ₽</span>
                      </div>
                    </div>
                    
                    <Button className="w-full" size="lg" onClick={openCheckout}>
                      <Icon name="CreditCard" size={20} className="mr-2" />
                      Оформить заказ
                    </Button>
                    
                    <Separator />
                    
                    {cart.map(item => (
                      <Card key={item.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">1 шт.</Badge>
                            <p className="font-bold">{item.price} ₽</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Учебные материалы по математике</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Методички, рабочие листы и тренажёры для 5–11 классов, подготовка к ОГЭ и ЕГЭ
          </p>
          {stats && (
            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-xl border border-primary/20">
                <Icon name="PackageOpen" size={24} className="text-primary" />
                <div className="text-left">
                  <div className="text-3xl font-bold text-primary">{stats.total_products}</div>
                  <div className="text-sm text-muted-foreground">товаров в каталоге</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-xl border border-primary/20">
                <Icon name="FileText" size={24} className="text-primary" />
                <div className="text-left">
                  <div className="text-3xl font-bold text-primary">{stats.total_files}</div>
                  <div className="text-sm text-muted-foreground">учебных файлов</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mb-6 flex justify-center">
          <div className="relative max-w-md w-full">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск по названию материала..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <Icon name="X" size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {categories.map(category => {
            const getCategoryUrl = (cat: string) => {
              const urlMap: Record<string, string> = {
                '5 класс': '/5-klass',
                '6 класс': '/6-klass',
                '7 класс': '/7-klass',
                '8 класс': '/8-klass',
                '9 класс': '/9-klass',
                '10 класс': '/10-klass',
                '11 класс': '/11-klass',
                'ОГЭ': '/oge',
                'ЕГЭ': '/ege',
                'Все': '/'
              };
              return urlMap[cat] || '/';
            };

            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => navigate(getCategoryUrl(category))}
                className="transition-all"
              >
                {category}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Icon name="Loader2" size={48} className="mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow flex flex-col relative">
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {product.is_new && (
                  <Badge className="bg-[#FF6B6B] text-white border-0">Новый файл</Badge>
                )}
                {product.is_popular && (
                  <Badge className="bg-[#10B981] text-white border-0">Популярный файл</Badge>
                )}
              </div>
              {product.preview_image_url && (
                <div className="w-full aspect-[3/4] overflow-hidden rounded-t-lg cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  <img 
                    src={product.preview_image_url} 
                    alt={product.title} 
                    className="w-full h-full object-contain bg-white hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <CardHeader className="cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge variant="outline">{product.type}</Badge>
                </div>
                <CardTitle className="text-lg hover:text-primary transition-colors">{product.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {product.description.split('\n').map((line, i) => (
                    <div key={i} className={line.trim() ? "mb-1" : "mb-2"}>{line || '\u00A0'}</div>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 flex-grow">
                {product.sample_pdf_url && product.sample_pdf_url.trim() !== '' && (
                  <a
                    href={product.sample_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Icon name="FileText" size={16} />
                    Скачать бесплатный образец (PDF)
                  </a>
                )}
                {(product.trainer1_url || product.trainer2_url || product.trainer3_url) && (
                  <div className="space-y-1.5 pt-2">
                    {product.trainer1_url && product.trainer1_url.trim() !== '' && (
                      <a
                        href={product.trainer1_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Icon name="Download" size={14} />
                        Тренажёр №1
                      </a>
                    )}
                    {product.trainer2_url && product.trainer2_url.trim() !== '' && (
                      <a
                        href={product.trainer2_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Icon name="Download" size={14} />
                        Тренажёр №2
                      </a>
                    )}
                    {product.trainer3_url && product.trainer3_url.trim() !== '' && (
                      <a
                        href={product.trainer3_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Icon name="Download" size={14} />
                        Тренажёр №3
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center mt-auto">
                {product.is_free ? (
                  <p className="text-2xl font-bold text-gray-600">Бесплатно</p>
                ) : (
                  <p className="text-2xl font-bold">{product.price} ₽</p>
                )}
                {!product.is_free && (() => {
                  const isPurchased = purchasedProductIds.includes(product.id);
                  const isInCart = cart.find(item => item.id === product.id);
                  
                  if (isPurchased) {
                    return (
                      <Button
                        className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 cursor-default"
                        disabled
                      >
                        <Icon name="CheckCircle2" size={18} className="mr-2" />
                        Оплачен
                      </Button>
                    );
                  }
                  
                  if (isInCart) {
                    return (
                      <Button
                        className="bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-100 cursor-default"
                        disabled
                      >
                        <Icon name="ShoppingCart" size={18} className="mr-2" />
                        В корзине
                      </Button>
                    );
                  }
                  
                  return (
                    <Button onClick={() => addToCart(product)}>
                      <Icon name="ShoppingCart" size={18} className="mr-2" />
                      В корзину
                    </Button>
                  );
                })()}
                {product.is_free && <div />}
              </CardFooter>
            </Card>
          ))}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t bg-white py-8">
        <div className="container text-center text-sm text-muted-foreground space-y-4">
          <div className="flex justify-center gap-4 items-center flex-wrap">
            <div className="px-3 py-2 bg-white border rounded flex items-center gap-2">
              <svg className="h-6" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="24" rx="4" fill="#4B57A5"/>
                <text x="30" y="15" fontFamily="Arial" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">СБП</text>
              </svg>
              <span className="text-xs font-medium text-foreground">СБП</span>
            </div>
            <div className="px-3 py-2 bg-white border rounded flex items-center gap-2">
              <svg className="h-5" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" fill="white"/>
                <path d="M18 11L20 21H23L21 11H18Z" fill="#1434CB"/>
                <path d="M30 11L28 21H31L33 11H30Z" fill="#FAA61A"/>
              </svg>
              <span className="text-xs font-medium text-foreground">Visa</span>
            </div>
            <div className="px-3 py-2 bg-white border rounded flex items-center gap-2">
              <svg className="h-5" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
              </svg>
              <span className="text-xs font-medium text-foreground">Mastercard</span>
            </div>
            <div className="px-3 py-2 bg-white border rounded flex items-center gap-2">
              <svg className="h-5" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" fill="white"/>
                <circle cx="16" cy="16" r="8" fill="#4DB45E"/>
                <circle cx="32" cy="16" r="8" fill="#0F754E"/>
              </svg>
              <span className="text-xs font-medium text-foreground">МИР</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <a 
              href="https://vk.com/mk_room" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Icon name="MessageCircle" size={18} />
              Обратная связь ВКонтакте
            </a>
          </div>
          <div className="space-y-1">
            <p>© 2024 Математическая кухня | Тренажёры по математике</p>
            <p>ИП Александрова Людмила Геннадьевна</p>
            <p>ИНН: 820100655703</p>
            <div className="flex justify-center gap-4 mt-2">
              <a href="/privacy" className="text-primary hover:underline">Политика конфиденциальности</a>
              <span>•</span>
              <a href="/terms" className="text-primary hover:underline">Пользовательское соглашение</a>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Войти или зарегистрироваться</DialogTitle>
            <DialogDescription>
              Получите доступ к своим покупкам в любое время
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Введите пароль"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                className="w-full" 
                onClick={async () => {
                  if (!loginEmail || !loginPassword) return;
                  try {
                    const response = await fetch('https://functions.poehali.dev/952cea32-e71e-48d7-8465-264417100e39', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'login',
                        email: loginEmail,
                        password: loginPassword
                      })
                    });
                    const data = await response.json();
                    if (response.ok && data.token) {
                      localStorage.setItem('user_token', data.token);
                      localStorage.setItem('user_email', data.email);
                      setIsLoggedIn(true);
                      setCurrentUserEmail(data.email);
                      setIsAuthDialogOpen(false);
                      loadPurchasedProducts(data.email);
                      toast.success('Вход выполнен успешно!');
                    } else {
                      toast.error(data.error || 'Ошибка входа');
                    }
                  } catch (error) {
                    toast.error('Ошибка при входе');
                  }
                }}
                disabled={!loginEmail || !loginPassword}
              >
                Войти
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => navigate('/forgot-password')}
              >
                Забыли пароль?
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-register-name">Имя (необязательно)</Label>
                <Input
                  id="auth-register-name"
                  placeholder="Ваше имя"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-register-email">Email</Label>
                <Input
                  id="auth-register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-register-password">Пароль</Label>
                <Input
                  id="auth-register-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Все покупки сохранятся в вашем личном кабинете
              </p>

              <Button 
                className="w-full" 
                onClick={async () => {
                  if (!registerEmail || !registerPassword) return;
                  try {
                    const response = await fetch('https://functions.poehali.dev/952cea32-e71e-48d7-8465-264417100e39', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'register',
                        email: registerEmail,
                        password: registerPassword,
                        full_name: registerName
                      })
                    });
                    const data = await response.json();
                    if (response.ok && data.token) {
                      localStorage.setItem('user_token', data.token);
                      localStorage.setItem('user_email', data.email);
                      setIsLoggedIn(true);
                      setCurrentUserEmail(data.email);
                      setIsAuthDialogOpen(false);
                      toast.success('Регистрация выполнена успешно!');
                    } else {
                      toast.error(data.error || 'Ошибка регистрации');
                    }
                  } catch (error) {
                    toast.error('Ошибка при регистрации');
                  }
                }}
                disabled={!registerEmail || !registerPassword}
              >
                Зарегистрироваться
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Оформление заказа</DialogTitle>
            <DialogDescription>
              Сумма к оплате: {totalPrice} ₽
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={isLoggedIn ? "logged-in" : "guest"} className="w-full">
            <TabsList className={`grid w-full ${isLoggedIn ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {isLoggedIn ? (
                <TabsTrigger value="logged-in">Оплата</TabsTrigger>
              ) : (
                <>
                  <TabsTrigger value="guest">Без регистрации</TabsTrigger>
                  <TabsTrigger value="register">С аккаунтом</TabsTrigger>
                </>
              )}
            </TabsList>

            {isLoggedIn && (
              <TabsContent value="logged-in" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="User" size={20} />
                    <span className="font-semibold">Вы вошли как</span>
                  </div>
                  <p className="text-sm">{currentUserEmail}</p>
                </div>

                <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Товаров:</span>
                    <span>{totalItems} шт.</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сумма:</span>
                    <span>{subtotal} ₽</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Скидка 15%:</span>
                      <span>-{discountAmount} ₽</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Итого:</span>
                    <span>{totalPrice} ₽</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleLoggedInCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Обработка...' : 'Перейти к оплате'}
                </Button>
              </TabsContent>
            )}

            <TabsContent value="guest" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-name">ФИО (необязательно)</Label>
                <Input
                  id="guest-name"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-email">Email для получения материалов</Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="your@email.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-phone">Телефон (необязательно)</Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="+7 (900) 123-45-67"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  required
                />
                <Label htmlFor="privacy-consent" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  Я согласен с{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Пользовательским соглашением
                  </a>
                  {' '}и{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Политикой конфиденциальности
                  </a>
                  , даю согласие на обработку персональных данных
                </Label>
              </div>

              <Button 
                className="w-full" 
                onClick={handleGuestCheckout}
                disabled={checkoutLoading || !guestEmail || !privacyConsent}
              >
                {checkoutLoading ? 'Обработка...' : 'Перейти к оплате'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Имя (необязательно)</Label>
                <Input
                  id="register-name"
                  placeholder="Ваше имя"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="privacy-consent-register"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  required
                />
                <Label htmlFor="privacy-consent-register" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  Я согласен с{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Пользовательским соглашением
                  </a>
                  {' '}и{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Политикой конфиденциальности
                  </a>
                  , даю согласие на обработку персональных данных
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                Создайте аккаунт — все покупки сохранятся в разделе "Мои покупки"
              </p>

              <Button 
                className="w-full" 
                onClick={handleRegisterCheckout}
                disabled={checkoutLoading || !registerEmail || !registerPassword || !privacyConsent}
              >
                {checkoutLoading ? 'Обработка...' : 'Создать аккаунт и оплатить'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showScrollTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 rounded-full h-14 w-14 shadow-lg z-50"
          size="icon"
        >
          <Icon name="ArrowUp" size={24} />
        </Button>
      )}
    </div>
  );
};

export default Index;