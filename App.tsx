import React, { useState, useMemo, useEffect } from 'react';
import useAppData from './hooks/useAppData';
import { User, Profile, Currency, TransactionType, PaymentMethod, Role } from './types';
import { Input, Button, Card, Modal } from './components/ui';
import { ICONS, DEFAULT_CURRENCIES } from './constants';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import Reporting from './components/Reporting';

// Mock simple hashing for demonstration. DO NOT use in production.
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return hash.toString();
};

const ForgotPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onReset: (email: string) => boolean;
}> = ({ isOpen, onClose, onReset }) => {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    const success = onReset(email);
    if (success) {
      alert(`Password for ${email} has been reset to 'password123'. Please log in with the new password.`);
    } else {
      alert(`No account found for email: ${email}.`);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">Enter your email address to reset your password.</p>
        <Input 
          id="reset-email" 
          label="Email address" 
          type="email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>
    </Modal>
  );
};


const AuthPage: React.FC<{ onAuth: (user: User) => void, appDataHook: ReturnType<typeof useAppData> }> = ({ onAuth, appDataHook }) => {
    const { data: appData, addUser, addProfile, getProfileData, setData, resetPassword } = appDataHook;
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const user = appData.users.find((u: User) => u.email === email);
            if (user && user.passwordHash === simpleHash(password)) {
                onAuth(user);
            } else {
                setError('Invalid email or password.');
            }
        } else {
            if (appData.users.some((u: User) => u.email === email)) {
                setError('User with this email already exists.');
                return;
            }
            const newUser = addUser({ email, passwordHash: simpleHash(password) });
            addProfile(newUser.id, { name: 'Personal', currencyCode: 'USD' });
            onAuth(newUser);
        }
    };
    
    const handleDemoLogin = () => {
        setError('');
        const DEMO_EMAIL = 'demo@example.com';

        // 1. Find or create the demo user
        let demoUser = appData.users.find(u => u.email === DEMO_EMAIL);
        if (!demoUser) {
            demoUser = addUser({ email: DEMO_EMAIL, passwordHash: simpleHash('demo') });
        }

        // 2. Find or create the demo profile
        let demoProfile = appData.profiles.find(p => p.name === 'Demo Profile' && p.userId === demoUser!.id);
        if (!demoProfile) {
            // The addProfile function will also create default categories and income sources for this profile
            demoProfile = addProfile(demoUser.id, { name: 'Demo Profile', currencyCode: 'USD' });
        }
        
        // 3. Get the categories and sources for this specific profile to link transactions
        const { categories: demoCategories, incomeSources: demoIncomeSources } = getProfileData(demoProfile.id);

        const getCatId = (name: string) => demoCategories.find(c => c.name === name)?.id;
        const getSourceId = (name: string) => demoIncomeSources.find(s => s.name === name)?.id;

        // 4. Create a fresh set of sample transactions for the current month
        const now = new Date();
        const sampleTransactions = [
            { profileId: demoProfile.id, type: TransactionType.INCOME, amount: 2500, description: 'Monthly Salary', date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), sourceId: getSourceId('Salary'), paymentMethod: PaymentMethod.BANK },
            { profileId: demoProfile.id, type: TransactionType.INCOME, amount: 300, description: 'Website Design Project', date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(), sourceId: getSourceId('Freelance'), paymentMethod: PaymentMethod.BANK },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 1200, description: 'Rent Payment', date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(), categoryId: getCatId('Housing'), paymentMethod: PaymentMethod.BANK },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 150.75, description: 'Weekly Groceries', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), categoryId: getCatId('Food'), paymentMethod: PaymentMethod.CREDIT },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 5.25, description: 'Morning Coffee', date: new Date(now.getFullYear(), now.getMonth(), 6).toISOString(), categoryId: getCatId('Food'), paymentMethod: PaymentMethod.CASH },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 45.50, description: 'Gas fill-up', date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(), categoryId: getCatId('Transport'), paymentMethod: PaymentMethod.CREDIT },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 85.20, description: 'Electricity Bill', date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(), categoryId: getCatId('Utilities'), paymentMethod: PaymentMethod.BANK },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 78.99, description: 'New Shoes', date: new Date(now.getFullYear(), now.getMonth(), 18).toISOString(), categoryId: getCatId('Shopping'), paymentMethod: PaymentMethod.CREDIT },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 25.00, description: 'Movie Night', date: new Date(now.getFullYear(), now.getMonth(), 21).toISOString(), categoryId: getCatId('Entertainment'), paymentMethod: PaymentMethod.CASH },
            { profileId: demoProfile.id, type: TransactionType.EXPENSE, amount: 30.00, description: 'Pharmacy', date: new Date(now.getFullYear(), now.getMonth(), 22).toISOString(), categoryId: getCatId('Health'), paymentMethod: PaymentMethod.CASH },
        ];
        
        // 5. Replace any old demo data with the new set
        const allOtherTransactions = appData.transactions.filter(t => t.profileId !== demoProfile!.id);
        const newDemoTransactionsWithIds = sampleTransactions.map(t => ({...t, id: crypto.randomUUID()}));
        
        setData(prev => ({
            ...prev,
            transactions: [...allOtherTransactions, ...newDemoTransactionsWithIds],
        }));

        // 6. Log the user in
        onAuth(demoUser);
    };

    return (
        <>
            <ForgotPasswordModal 
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                onReset={resetPassword}
            />
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                     <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <Card className="px-4 py-8 sm:px-10">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <Input id="email" label="Email address" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                            <div>
                                <Input id="password" label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                                {isLogin && (
                                    <div className="text-right text-sm mt-1">
                                        <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="font-medium text-primary hover:text-primary-hover">
                                            Forgot password?
                                        </button>
                                    </div>
                                )}
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" className="w-full">{isLogin ? 'Sign In' : 'Sign Up'}</Button>
                        </form>
                         <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-surface text-gray-500">Or</span>
                            </div>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleDemoLogin} className="w-full">Try a Demo</Button>
                        <p className="mt-6 text-center text-sm text-gray-600">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:text-primary-hover">
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </Card>
                </div>
            </div>
        </>
    );
};

const Sidebar: React.FC<{ activePage: string, setActivePage: (page: string) => void }> = ({ activePage, setActivePage }) => {
    const navItems = ['Dashboard', 'Transactions', 'Reporting', 'Settings'];

    const baseClasses = "flex items-center px-4 py-3 text-gray-600 rounded-lg";
    const activeClasses = "bg-primary-light text-primary font-bold";
    const inactiveClasses = "hover:bg-gray-100";
    
    return (
        <aside className="w-64 bg-surface p-4 border-r border-gray-200 flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary px-4 mb-8">Zenith</h1>
            <nav>
                <ul>
                    {navItems.map(item => (
                        <li key={item}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setActivePage(item); }} className={`${baseClasses} ${activePage === item ? activeClasses : inactiveClasses}`}>
                                <span className="mr-3">{ICONS[item]}</span>
                                {item}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

const Header: React.FC<{ 
    user: User, 
    profiles: Profile[],
    activeProfileId: string,
    setActiveProfileId: (id: string) => void,
    onLogout: () => void 
}> = ({ user, profiles, activeProfileId, setActiveProfileId, onLogout }) => (
    <header className="p-4 bg-surface border-b border-gray-200 flex justify-between items-center">
        <div>
            {/* Can add page title here later */}
        </div>
        <div className="flex items-center space-x-4">
            <div>
                <label htmlFor="profile-select" className="sr-only">Select Profile</label>
                <select 
                    id="profile-select" 
                    value={activeProfileId} 
                    onChange={e => setActiveProfileId(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <span className="text-on-surface-variant">{user.email}</span>
            <button onClick={onLogout} title="Logout" className="text-gray-500 hover:text-primary">{ICONS.Logout}</button>
        </div>
    </header>
);

const App: React.FC = () => {
    const appDataHook = useAppData();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [activePage, setActivePage] = useState('Dashboard');

    const userProfiles = useMemo(() => {
        if (!currentUser) return [];
        return appDataHook.getProfilesForUser(currentUser);
    }, [currentUser, appDataHook.data.profiles]);
    
    useEffect(() => {
        if (currentUser && userProfiles.length > 0 && (!activeProfileId || !userProfiles.some(p => p.id === activeProfileId))) {
            const demoProfile = userProfiles.find(p => p.name === 'Demo Profile');
            setActiveProfileId(demoProfile ? demoProfile.id : userProfiles[0].id);
        }
    }, [currentUser, userProfiles, activeProfileId]);

    const handleAuth = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveProfileId(null);
    };

    const handleProfileDelete = (id: string) => {
        if(id === activeProfileId) {
            const remainingProfiles = userProfiles.filter(p => p.id !== id);
            if(remainingProfiles.length > 0) {
                setActiveProfileId(remainingProfiles[0].id);
            } else {
                // In a real app, you might force profile creation or handle this state more gracefully
                console.log("Last profile deleted!");
            }
        }
        appDataHook.deleteProfile(id);
    }

    if (!currentUser) {
        return <AuthPage onAuth={handleAuth} appDataHook={appDataHook} />;
    }

    if (!activeProfileId) {
        return <div className="flex items-center justify-center h-screen">Loading profile...</div>;
    }
    
    const { transactions, categories, incomeSources, profile } = appDataHook.getProfileData(activeProfileId);
    const currency = appDataHook.data.currencies.find(c => c.code === profile?.currencyCode) || DEFAULT_CURRENCIES[0];

    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <Dashboard transactions={transactions} categories={categories} currency={currency} />;
            case 'Transactions':
                return <Transactions 
                    transactions={transactions} 
                    categories={categories} 
                    incomeSources={incomeSources}
                    profileId={activeProfileId}
                    currency={currency}
                    addTransaction={(t) => appDataHook.addTransaction({...t, profileId: activeProfileId})}
                    updateTransaction={appDataHook.updateTransaction}
                    deleteTransaction={appDataHook.deleteTransaction}
                />;
            case 'Reporting':
                return <Reporting
                    transactions={transactions}
                    categories={categories}
                    incomeSources={incomeSources}
                    currency={currency}
                />;
            case 'Settings':
                return <Settings 
                    appData={appDataHook.data}
                    currentUser={currentUser}
                    profileId={activeProfileId}
                    addCategory={appDataHook.addCategory}
                    deleteCategory={appDataHook.deleteCategory}
                    addIncomeSource={appDataHook.addIncomeSource}
                    deleteIncomeSource={appDataHook.deleteIncomeSource}
                    addCurrency={appDataHook.addCurrency}
                    deleteCurrency={appDataHook.deleteCurrency}
                    addProfile={(p) => appDataHook.addProfile(currentUser.id, p)}
                    updateProfile={appDataHook.updateProfile}
                    deleteProfile={handleProfileDelete}
                    addMultipleTransactions={appDataHook.addMultipleTransactions}
                    addUser={appDataHook.addUser}
                    deleteUser={appDataHook.deleteUser}
                    updateUserRole={appDataHook.updateUserRole}
                />;
            default:
                return <div>Page not found</div>;
        }
    };
    
    return (
        <div className="flex h-screen bg-background">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    user={currentUser} 
                    profiles={userProfiles}
                    activeProfileId={activeProfileId}
                    setActiveProfileId={setActiveProfileId}
                    onLogout={handleLogout} 
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

export default App;