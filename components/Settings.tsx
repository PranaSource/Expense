import React, { useState } from 'react';
import { Category, IncomeSource, Currency, Profile, AppData, Transaction, TransactionType, PaymentMethod, User, Role } from '../types';
import { Card, Button, Input, Select, ConfirmationModal } from './ui';
import { ICONS } from '../constants';

// Copied from App.tsx. A utility file would be better in a larger project.
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return hash.toString();
};

// A generic manager component for categories and income sources
const ItemManager: React.FC<{
  title: string;
  items: (Category | IncomeSource)[];
  onAdd: (item: { name: string, icon: string }) => void;
  onDelete: (id: string) => void;
}> = ({ title, items, onAdd, onDelete }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState(Object.keys(ICONS)[4]);

  const handleAdd = () => {
    if (newItemName.trim()) {
      onAdd({ name: newItemName, icon: newItemIcon });
      setNewItemName('');
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 text-on-surface">{title}</h3>
      <div className="space-y-2 mb-4">
        {items.filter(item => !item.isDefault).map(item => (
          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="flex items-center">
                <span className="mr-2">{ICONS[item.icon]}</span>
                <span>{item.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>{ICONS.Trash}</Button>
          </div>
        ))}
        {items.filter(item => item.isDefault).map(item => (
           <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div className="flex items-center opacity-70">
                <span className="mr-2">{ICONS[item.icon]}</span>
                <span>{item.name} (default)</span>
            </div>
           </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <Input placeholder="New item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
        <Select value={newItemIcon} onChange={e => setNewItemIcon(e.target.value)}>
          {Object.keys(ICONS).slice(4, 18).map(iconKey => <option key={iconKey} value={iconKey}>{iconKey}</option>)}
        </Select>
        <Button onClick={handleAdd}>Add</Button>
      </div>
    </Card>
  );
};


const ProfileManager: React.FC<{
    profiles: Profile[];
    currencies: Currency[];
    onAdd: (profile: Omit<Profile, 'id' | 'userId'>) => void;
    onUpdate: (profile: Profile) => void;
    onDelete: (id: string) => void;
    activeProfileId: string;
}> = ({ profiles, currencies, onAdd, onDelete, activeProfileId }) => {
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfileCurrency, setNewProfileCurrency] = useState(currencies[0]?.code || 'USD');

    const handleAdd = () => {
        if(newProfileName.trim()) {
            onAdd({ name: newProfileName, currencyCode: newProfileCurrency });
            setNewProfileName('');
        }
    }
    
    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-on-surface">User Profiles</h3>
            <div className="space-y-2 mb-4">
                {profiles.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{p.name} ({p.currencyCode})</span>
                         <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} disabled={p.id === activeProfileId || profiles.length <= 1}>{ICONS.Trash}</Button>
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <Input placeholder="New profile name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
                <Select value={newProfileCurrency} onChange={e => setNewProfileCurrency(e.target.value)}>
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                </Select>
                <Button onClick={handleAdd}>Add Profile</Button>
            </div>
        </Card>
    )
}

const CurrencyManager: React.FC<{
    currencies: Currency[];
    profiles: Profile[];
    onAdd: (currency: Currency) => void;
    onDelete: (code: string) => void;
}> = ({ currencies, profiles, onAdd, onDelete }) => {
    const [newCode, setNewCode] = useState('');
    const [newSymbol, setNewSymbol] = useState('');
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        if(newCode.trim() && newSymbol.trim() && newName.trim()){
            onAdd({code: newCode.toUpperCase(), symbol: newSymbol, name: newName});
            setNewCode(''); setNewSymbol(''); setNewName('');
        }
    }
    
    const usedCurrencies = new Set(profiles.map(p => p.currencyCode));

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-on-surface">Currencies</h3>
            <div className="space-y-2 mb-4">
                {currencies.map(c => (
                    <div key={c.code} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{c.name} ({c.code} - {c.symbol})</span>
                         <Button variant="ghost" size="sm" onClick={() => onDelete(c.code)} disabled={usedCurrencies.has(c.code)}>{ICONS.Trash}</Button>
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <Input placeholder="Code (e.g. AUD)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                <Input placeholder="Symbol (e.g. $)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} />
                <Input placeholder="Name (e.g. Australian Dollar)" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Button onClick={handleAdd}>Add</Button>
            </div>
        </Card>
    )
}

const UserManager: React.FC<{
  users: User[];
  currentUser: User;
  onAdd: (user: Omit<User, 'id' | 'role'>) => void;
  onDelete: (id: string) => void;
  onUpdateRole: (userId: string, role: Role) => void;
}> = ({ users, currentUser, onAdd, onDelete, onUpdateRole }) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [addError, setAddError] = useState('');

  const isAdmin = currentUser.role === Role.ADMIN;

  const handleAdd = () => {
    setAddError('');
    if (newEmail.trim() && newPassword.trim()) {
      if (users.some(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
        setAddError('User with this email already exists.');
        return;
      }
      onAdd({ email: newEmail, passwordHash: simpleHash(newPassword) });
      setNewEmail('');
      setNewPassword('');
    }
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      onDelete(userToDelete.id);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Confirmation"
        message={
          <>
            Are you sure you want to delete the user <strong>{userToDelete?.email}</strong>?
            This will permanently remove all their associated profiles and data. This action cannot be undone.
          </>
        }
      />
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-on-surface">User Accounts</h3>
        <div className="space-y-2 mb-4">
          {users.map(user => (
            <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{user.email}</span>
                <span className="text-xs text-on-surface-variant ml-2 capitalize bg-gray-200 px-2 py-0.5 rounded-full">{user.role}</span>
                {user.id === currentUser.id && <span className="text-xs text-primary ml-2 font-semibold">(You)</span>}
              </div>
              <div className="flex items-center space-x-2">
                <Select
                    value={user.role}
                    onChange={(e) => onUpdateRole(user.id, e.target.value as Role)}
                    disabled={!isAdmin || user.id === currentUser.id}
                    className="text-xs py-1"
                >
                    <option value={Role.ADMIN}>Admin</option>
                    <option value={Role.USER}>User</option>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserToDelete(user)}
                  disabled={!isAdmin || user.id === currentUser.id}
                >
                  {ICONS.Trash}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
            <div className="flex flex-col space-y-2">
              <Input placeholder="New user email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={!isAdmin} />
              <Input placeholder="New user password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={!isAdmin} />
              {addError && <p className="text-sm text-red-600">{addError}</p>}
               {!isAdmin && <p className="text-xs text-on-surface-variant text-right mt-1">Only admins can add new users.</p>}
              <Button onClick={handleAdd} className="self-end" disabled={!isAdmin}>Add User</Button>
            </div>
        </div>
      </Card>
    </>
  );
};


const DataManagement: React.FC<{ 
    appData: AppData; 
    profileId: string;
    addMultipleTransactions: (transactions: Omit<Transaction, 'id'|'profileId'>[]) => void;
}> = ({ appData, profileId, addMultipleTransactions }) => {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const { transactions, categories, incomeSources } = appData;
    const profileTransactions = transactions.filter(t => t.profileId === profileId);
    const profileCategories = categories.filter(c => c.profileId === profileId);
    const profileIncomeSources = incomeSources.filter(s => s.profileId === profileId);

    const handleBackup = () => {
        const profileData = {
            profile: appData.profiles.find(p => p.id === profileId),
            transactions: profileTransactions,
            categories: profileCategories,
            incomeSources: profileIncomeSources,
        };

        const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith_finance_backup_${profileId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const headers = ['date', 'description', 'amount', 'type', 'paymentMethod', 'category', 'source'];
        const rows = profileTransactions.map(t => {
            const category = t.type === 'expense' ? profileCategories.find(c => c.id === t.categoryId)?.name || '' : '';
            const source = t.type === 'income' ? profileIncomeSources.find(s => s.id === t.sourceId)?.name || '' : '';
            // Wrap description in quotes to handle potential commas
            const description = `"${t.description.replace(/"/g, '""')}"`;
            return [t.date.split('T')[0], description, t.amount, t.type, t.paymentMethod, category, source].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith_finance_export_${profileId}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportCSV = () => {
        if (!csvFile) return;
        setFeedback(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if(lines.length < 2) {
                setFeedback({ type: 'error', message: 'CSV file is empty or contains only a header.'});
                return;
            }

            const header = lines[0].split(',').map(h => h.trim());
            const requiredHeaders = ['date', 'description', 'amount', 'type', 'paymentMethod'];
            if(!requiredHeaders.every(h => header.includes(h))) {
                setFeedback({ type: 'error', message: `CSV header is missing required columns. Required: ${requiredHeaders.join(', ')}`});
                return;
            }

            const newTransactions: Omit<Transaction, 'id' | 'profileId'>[] = [];
            for(let i = 1; i < lines.length; i++) {
                const data = lines[i].split(',');
                const row = header.reduce((obj, h, index) => ({...obj, [h]: data[index]}), {} as any);

                // Basic validation
                if(!row.date || !row.description || isNaN(parseFloat(row.amount)) || !row.type) continue;
                
                const type = row.type.toLowerCase() as TransactionType;
                const category = profileCategories.find(c => c.name.toLowerCase() === row.category?.toLowerCase());
                const source = profileIncomeSources.find(s => s.name.toLowerCase() === row.source?.toLowerCase());

                if (type === TransactionType.EXPENSE && !category) continue; // Skip if category not found for expense
                if (type === TransactionType.INCOME && !source) continue; // Skip if source not found for income

                newTransactions.push({
                    type,
                    amount: parseFloat(row.amount),
                    description: row.description.replace(/^"|"$/g, '').replace(/""/g, '"'),
                    date: new Date(row.date).toISOString(),
                    paymentMethod: row.paymentMethod.toLowerCase() as PaymentMethod,
                    ...(type === TransactionType.EXPENSE && { categoryId: category!.id }),
                    ...(type === TransactionType.INCOME && { sourceId: source!.id }),
                });
            }

            if(newTransactions.length > 0) {
                addMultipleTransactions(newTransactions);
                setFeedback({ type: 'success', message: `Successfully imported ${newTransactions.length} transactions.`});
            } else {
                setFeedback({ type: 'error', message: 'No valid transactions found to import. Check file format and ensure categories/sources exist.'});
            }
            setCsvFile(null);
            const fileInput = document.getElementById('csv-importer') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

        };
        reader.readAsText(csvFile);
    };

    return (
        <Card>
             <h3 className="text-lg font-semibold mb-4 text-on-surface">Data Management</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Export</h4>
                    <div className="flex space-x-2">
                        <Button onClick={handleBackup}>
                            <span className="ml-2">Backup Profile (JSON)</span>
                        </Button>
                        <Button onClick={handleExportCSV} variant="secondary">
                            <span className="ml-2">Export as CSV</span>
                        </Button>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Import from CSV</h4>
                    <div className="text-xs text-on-surface-variant p-2 bg-gray-50 rounded mb-2">
                        <b>Required columns:</b> date, description, amount, type, paymentMethod. <br/>
                        <b>Optional:</b> category, source. <br/>
                        `date` must be YYYY-MM-DD. `type` must be `income` or `expense`. `paymentMethod` must be `cash`, `credit`, or `bank`. Category/Source names must match existing entries.
                    </div>
                     <div className="flex items-center space-x-2">
                        <Input id="csv-importer" type="file" accept=".csv" onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)} className="flex-1"/>
                        <Button onClick={handleImportCSV} disabled={!csvFile}>Import</Button>
                    </div>
                    {feedback && <p className={`mt-2 text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.message}</p>}
                </div>
             </div>
        </Card>
    );
}

const Settings: React.FC<{
    appData: AppData;
    currentUser: User;
    profileId: string;
    addCategory: (profileId: string, item: {name: string, icon: string}) => void;
    deleteCategory: (id: string) => void;
    addIncomeSource: (profileId: string, item: {name: string, icon: string}) => void;
    deleteIncomeSource: (id: string) => void;
    addCurrency: (currency: Currency) => void;
    deleteCurrency: (code: string) => void;
    addProfile: (profile: Omit<Profile, 'id' | 'userId'>) => void;
    updateProfile: (profile: Profile) => void;
    deleteProfile: (id: string) => void;
    addMultipleTransactions: (transactions: Omit<Transaction, 'id' | 'profileId'>[]) => void;
    addUser: (user: Omit<User, 'id' | 'role'>) => void;
    deleteUser: (id: string) => void;
    updateUserRole: (userId: string, role: Role) => void;
}> = (props) => {
    const profileCategories = props.appData.categories.filter((c) => c.profileId === props.profileId);
    const profileIncomeSources = props.appData.incomeSources.filter((s) => s.profileId === props.profileId);
    const userProfiles = props.appData.profiles.filter(p => p.userId === props.currentUser.id);

    return (
        <div>
            <h1 className="text-3xl font-bold text-on-surface mb-6">Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ItemManager 
                    title="Expense Categories" 
                    items={profileCategories} 
                    onAdd={(item) => props.addCategory(props.profileId, item)} 
                    onDelete={props.deleteCategory} 
                />
                <ItemManager 
                    title="Income Sources" 
                    items={profileIncomeSources} 
                    onAdd={(item) => props.addIncomeSource(props.profileId, item)}
                    onDelete={props.deleteIncomeSource} 
                />
                <ProfileManager
                    profiles={userProfiles}
                    currencies={props.appData.currencies}
                    onAdd={props.addProfile}
                    onUpdate={props.updateProfile}
                    onDelete={props.deleteProfile}
                    activeProfileId={props.profileId}
                />
                <CurrencyManager
                    currencies={props.appData.currencies}
                    profiles={props.appData.profiles}
                    onAdd={props.addCurrency}
                    onDelete={props.deleteCurrency}
                />
                <UserManager
                  users={props.appData.users}
                  currentUser={props.currentUser}
                  onAdd={props.addUser}
                  onDelete={props.deleteUser}
                  onUpdateRole={props.updateUserRole}
                />
                <DataManagement 
                    appData={props.appData} 
                    profileId={props.profileId} 
                    addMultipleTransactions={(ts) => props.addMultipleTransactions(ts.map(t => ({...t, profileId: props.profileId})))}
                />
            </div>
        </div>
    );
};

export default Settings;