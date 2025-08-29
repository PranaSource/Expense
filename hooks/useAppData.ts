import { useState, useEffect } from 'react';
import { AppData, User, Profile, Transaction, Category, IncomeSource, Currency, TransactionType, Role } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_SOURCES, DEFAULT_CURRENCIES } from '../constants';

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return hash.toString();
};

const useAppData = () => {
  const [data, setData] = useState<AppData>(() => {
    try {
      const savedData = localStorage.getItem('zenithFinanceData');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Could not parse localStorage data:', error);
    }
    return {
      users: [],
      profiles: [],
      transactions: [],
      categories: [],
      incomeSources: [],
      currencies: DEFAULT_CURRENCIES,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('zenithFinanceData', JSON.stringify(data));
    } catch (error) {
      console.error('Could not save data to localStorage:', error);
    }
  }, [data]);

  const addUser = (user: Omit<User, 'id' | 'role'>) => {
    const role = data.users.length === 0 ? Role.ADMIN : Role.USER;
    const newUser = { ...user, id: crypto.randomUUID(), role };
    setData(prev => ({ ...prev, users: [...prev.users, newUser] }));
    return newUser;
  };
  
  const addProfile = (userId: string, profile: Omit<Profile, 'id' | 'userId'>) => {
      const newProfile: Profile = { ...profile, id: crypto.randomUUID(), userId };
      
      const userCategories = DEFAULT_CATEGORIES.map(cat => ({...cat, id: `${newProfile.id}-${crypto.randomUUID()}`}));
      const userIncomeSources = DEFAULT_INCOME_SOURCES.map(src => ({...src, id: `${newProfile.id}-${crypto.randomUUID()}`}));

      setData(prev => ({
        ...prev,
        profiles: [...prev.profiles, newProfile],
        categories: [...prev.categories, ...userCategories.map(c => ({...c, profileId: newProfile.id}))],
        incomeSources: [...prev.incomeSources, ...userIncomeSources.map(s => ({...s, profileId: newProfile.id}))],
      }));
      return newProfile;
  };

  const getProfilesForUser = (user: User) => {
    return data.profiles.filter(p => p.userId === user.id);
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
  };
  
  const addMultipleTransactions = (transactions: Omit<Transaction, 'id'>[]) => {
    const newTransactions = transactions.map(t => ({...t, id: crypto.randomUUID()}));
    setData(prev => ({...prev, transactions: [...prev.transactions, ...newTransactions]}));
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t),
    }));
  };
  
  const deleteTransaction = (transactionId: string) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== transactionId) }));
  };
  
  const addCategory = (profileId: string, category: Omit<Category, 'id'|'isDefault'|'profileId'>) => {
      const newCategory: Category = { ...category, id: crypto.randomUUID(), profileId };
      setData(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  };
  
  const deleteCategory = (categoryId: string) => {
      setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== categoryId) }));
  };

  const addIncomeSource = (profileId: string, source: Omit<IncomeSource, 'id'|'isDefault'|'profileId'>) => {
      const newSource: IncomeSource = { ...source, id: crypto.randomUUID(), profileId };
      setData(prev => ({...prev, incomeSources: [...prev.incomeSources, newSource]}));
  };
  
  const deleteIncomeSource = (sourceId: string) => {
      setData(prev => ({ ...prev, incomeSources: prev.incomeSources.filter(s => s.id !== sourceId) }));
  };
  
  const addCurrency = (currency: Currency) => {
      setData(prev => ({...prev, currencies: [...prev.currencies, currency]}));
  };

  const deleteCurrency = (currencyCode: string) => {
      setData(prev => ({...prev, currencies: prev.currencies.filter(c => c.code !== currencyCode)}));
  };
  
  const updateProfile = (updatedProfile: Profile) => {
    setData(prev => ({
        ...prev,
        profiles: prev.profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p),
    }));
  };

  const deleteProfile = (profileId: string) => {
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== profileId),
      transactions: prev.transactions.filter(t => t.profileId !== profileId),
      categories: prev.categories.filter(c => c.profileId !== profileId),
      incomeSources: prev.incomeSources.filter(s => s.profileId !== profileId),
    }));
  };
  
  const deleteUser = (userId: string) => {
    setData(prev => {
      const profilesToDelete = prev.profiles.filter(p => p.userId === userId);
      const profileIdsToDelete = new Set(profilesToDelete.map(p => p.id));
      
      return {
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        profiles: prev.profiles.filter(p => p.userId !== userId),
        transactions: prev.transactions.filter(t => !profileIdsToDelete.has(t.profileId)),
        categories: prev.categories.filter(c => !profileIdsToDelete.has(c.profileId)),
        incomeSources: prev.incomeSources.filter(s => !profileIdsToDelete.has(s.profileId)),
      };
    });
  };

  const resetPassword = (email: string): boolean => {
    const userIndex = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) {
      return false;
    }
    
    const updatedUsers = [...data.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      passwordHash: simpleHash('password123'),
    };
    
    setData(prev => ({ ...prev, users: updatedUsers }));
    return true;
  };

  const updateUserRole = (userId: string, role: Role): boolean => {
    const userIndex = data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    const currentUser = data.users[userIndex];
    if (currentUser.role === Role.ADMIN && role === Role.USER) {
      const adminCount = data.users.filter(u => u.role === Role.ADMIN).length;
      if (adminCount <= 1) {
        console.warn("Cannot demote the last admin.");
        alert("Cannot demote the last admin.");
        return false;
      }
    }

    const updatedUsers = [...data.users];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], role };
    setData(prev => ({ ...prev, users: updatedUsers }));
    return true;
  };

  const getProfileData = (profileId: string) => {
    return {
      transactions: data.transactions.filter(t => t.profileId === profileId),
      categories: data.categories.filter(c => c.profileId === profileId),
      incomeSources: data.incomeSources.filter(s => s.profileId === profileId),
      profile: data.profiles.find(p => p.id === profileId),
    };
  };

  return { data, setData, addUser, deleteUser, addProfile, getProfilesForUser, addTransaction, addMultipleTransactions, updateTransaction, deleteTransaction, addCategory, deleteCategory, addIncomeSource, deleteIncomeSource, addCurrency, deleteCurrency, updateProfile, deleteProfile, getProfileData, resetPassword, updateUserRole };
};

export default useAppData;