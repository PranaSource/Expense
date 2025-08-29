import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, PaymentMethod, Category, IncomeSource, Currency, Attachment } from '../types';
import { Button, Input, Select, Modal, Card, ConfirmationModal } from './ui';
import { ICONS } from '../constants';
import { suggestCategory } from '../services/geminiService';

type TransactionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'profileId'> | Transaction) => void;
  categories: Category[];
  incomeSources: IncomeSource[];
  profileId: string;
  initialData?: Transaction;
};

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, categories, incomeSources, profileId, initialData }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setType(initialData?.type || TransactionType.EXPENSE);
      setAmount(initialData?.amount.toString() || '');
      setDescription(initialData?.description || '');
      setDate(initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setCategoryId(initialData?.categoryId || '');
      setSourceId(initialData?.sourceId || '');
      setPaymentMethod(initialData?.paymentMethod || PaymentMethod.BANK);
      setAttachments(initialData?.attachments || []);
    }
  }, [isOpen, initialData]);

  const handleSuggestCategory = async () => {
    if(!description) return;
    setIsSuggesting(true);
    try {
        const suggestedId = await suggestCategory(description, categories);
        if(suggestedId) {
            setCategoryId(suggestedId);
        }
    } catch (e) {
        console.error(e);
        // Optionally show an error to the user
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: Attachment = {
            id: crypto.randomUUID(),
            name: file.name,
            dataUrl: dataUrl,
            type: file.type,
        };
        setAttachments(prev => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Allow selecting the same file again
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      profileId,
      type,
      amount: parseFloat(amount),
      description,
      date,
      paymentMethod,
      attachments,
      ...(type === TransactionType.EXPENSE && { categoryId }),
      ...(type === TransactionType.INCOME && { sourceId }),
    };
    
    if (initialData) {
        onSubmit({ ...initialData, ...transactionData });
    } else {
        onSubmit(transactionData as Omit<Transaction, 'id' | 'profileId'>);
    }
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Transaction" : "Add Transaction"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <Button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`w-full ${type === TransactionType.EXPENSE ? 'bg-red-600' : 'bg-gray-200 text-gray-800'}`}>Expense</Button>
          <Button type="button" onClick={() => setType(TransactionType.INCOME)} className={`w-full ${type === TransactionType.INCOME ? 'bg-green-600' : 'bg-gray-200 text-gray-800'}`}>Income</Button>
        </div>
        <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
        <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} required />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        
        {type === TransactionType.EXPENSE ? (
          <div className="flex items-end space-x-2">
            <Select label="Category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Button type="button" onClick={handleSuggestCategory} disabled={isSuggesting || !description} className="h-10 w-12 flex-shrink-0" variant="ghost">
              {isSuggesting ? ICONS.Spinner : ICONS.Magic}
            </Button>
          </div>
        ) : (
          <Select label="Source" value={sourceId} onChange={e => setSourceId(e.target.value)} required>
            <option value="">Select a source</option>
            {incomeSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        )}
        
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} required>
          <option value={PaymentMethod.BANK}>Bank</option>
          <option value={PaymentMethod.CREDIT}>Credit Card</option>
          <option value={PaymentMethod.CASH}>Cash</option>
        </Select>

        <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Attachments</label>
            <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-md border">
                {attachments.map(att => (
                    <div key={att.id} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                        <span className="truncate pr-2" title={att.name}>{att.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)}>{ICONS.Trash}</Button>
                    </div>
                ))}
                {attachments.length === 0 && <p className="text-xs text-center text-gray-400 py-2">No files attached.</p>}
            </div>
            <div className="mt-2 flex space-x-2">
                <input ref={fileInputRef} type="file" onChange={handleAddAttachment} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleAddAttachment} className="hidden" />
                <Button type="button" variant="ghost" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    {ICONS.Upload} <span className="ml-2">Upload File</span>
                </Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
                    {ICONS.Camera} <span className="ml-2">Take Photo</span>
                </Button>
            </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? 'Update' : 'Add'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const TransactionDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    currency: Currency;
    categories: Category[];
    incomeSources: IncomeSource[];
    onUpdateTransaction: (transaction: Transaction) => void;
}> = ({ isOpen, onClose, transaction, currency, categories, incomeSources, onUpdateTransaction }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    if (!transaction) return null;

    const isExpense = transaction.type === TransactionType.EXPENSE;
    const categoryOrSource = isExpense
        ? categories.find(c => c.id === transaction.categoryId)?.name
        : incomeSources.find(s => s.id === transaction.sourceId)?.name;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.code,
        }).format(amount);
    };

    const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const newAttachment: Attachment = {
                id: crypto.randomUUID(),
                name: file.name,
                dataUrl: dataUrl,
                type: file.type,
            };

            const updatedTransaction = {
                ...transaction,
                attachments: [...(transaction.attachments || []), newAttachment],
            };
            onUpdateTransaction(updatedTransaction);
        };
        reader.readAsDataURL(file);
        
        e.target.value = '';
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        const updatedTransaction = {
            ...transaction,
            attachments: transaction.attachments?.filter(att => att.id !== attachmentId),
        };
        onUpdateTransaction(updatedTransaction);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details" size="lg">
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-on-surface-variant">Description</p>
                    <p className="text-lg font-semibold text-on-surface">{transaction.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-on-surface-variant">Amount</p>
                        <p className={`text-lg font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                            {isExpense ? '-' : '+'} {formatCurrency(transaction.amount)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant">Date</p>
                        <p className="text-lg font-semibold text-on-surface">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant">Category/Source</p>
                        <p className="text-lg font-semibold text-on-surface">{categoryOrSource || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant">Payment Method</p>
                        <p className="text-lg font-semibold text-on-surface capitalize">{transaction.paymentMethod}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-on-surface mb-2 border-t pt-4 mt-4">Attachments</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {transaction.attachments?.map(att => (
                            <div key={att.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <a href={att.dataUrl} target="_blank" rel="noopener noreferrer" download={att.name} className="text-primary hover:underline truncate pr-2">
                                    {att.name}
                                </a>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att.id)}>{ICONS.Trash}</Button>
                            </div>
                        ))}
                         {(!transaction.attachments || transaction.attachments.length === 0) && <p className="text-xs text-center text-gray-400 py-2">No files attached.</p>}
                    </div>
                    <div className="mt-4">
                        <h5 className="text-sm font-medium text-on-surface-variant mb-2">Add attachment</h5>
                        <input ref={fileInputRef} type="file" onChange={handleAddAttachment} className="hidden" />
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleAddAttachment} className="hidden" />
                        <div className="flex space-x-2">
                            <Button type="button" variant="ghost" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                                {ICONS.Upload} <span className="ml-2">Upload File</span>
                            </Button>
                             <Button type="button" variant="ghost" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
                                {ICONS.Camera} <span className="ml-2">Take Photo</span>
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} variant="ghost">Close</Button>
                </div>
            </div>
        </Modal>
    );
};

const TransactionList: React.FC<{ 
    transactions: Transaction[], 
    categories: Category[], 
    incomeSources: IncomeSource[], 
    currency: Currency,
    onEdit: (transaction: Transaction) => void,
    onDelete: (id: string) => void,
    onRowClick: (transaction: Transaction) => void;
}> = ({ transactions, categories, incomeSources, currency, onEdit, onDelete, onRowClick }) => {
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const handleDeleteConfirm = () => {
        if (transactionToDelete) {
            onDelete(transactionToDelete.id);
            setTransactionToDelete(null);
        }
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.code,
        }).format(amount);
    };

    return (
        <>
            <ConfirmationModal
                isOpen={!!transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Transaction"
                message={
                  <>
                    <p>Are you sure you want to delete the following transaction?</p>
                    <div className="my-4 p-3 bg-gray-100 rounded-md border border-gray-200 text-sm">
                      <p><strong>Description:</strong> {transactionToDelete?.description}</p>
                      <p>
                          <strong>Amount:</strong>{' '}
                          <span className={transactionToDelete?.type === TransactionType.EXPENSE ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                            {transactionToDelete?.type === TransactionType.EXPENSE ? '-' : '+'} {formatCurrency(transactionToDelete?.amount || 0)}
                          </span>
                      </p>
                      <p><strong>Date:</strong> {transactionToDelete ? new Date(transactionToDelete.date).toLocaleDateString() : ''}</p>
                    </div>
                    <p>This action cannot be undone.</p>
                  </>
                }
            />
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category/Source</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map(t => {
                                const isExpense = t.type === TransactionType.EXPENSE;
                                const categoryOrSource = isExpense 
                                    ? categories.find(c => c.id === t.categoryId)?.name 
                                    : incomeSources.find(s => s.id === t.sourceId)?.name;
                                return (
                                    <tr key={t.id} onClick={() => onRowClick(t)} className="cursor-pointer hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryOrSource || 'N/A'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                                            {isExpense ? '-' : '+'} {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => onEdit(t)} className="text-primary hover:text-primary-hover mr-2">{ICONS.Edit}</button>
                                            <button onClick={() => setTransactionToDelete(t)} className="text-red-600 hover:text-red-800">{ICONS.Trash}</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
};

const Transactions: React.FC<{
    transactions: Transaction[];
    categories: Category[];
    incomeSources: IncomeSource[];
    profileId: string;
    currency: Currency;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'profileId'>) => void;
    updateTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
}> = ({ transactions, categories, incomeSources, profileId, currency, addTransaction, updateTransaction, deleteTransaction }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState('');

    const filteredAndSortedTransactions = useMemo(() => {
        return [...transactions]
            .filter(t => {
                const transactionDate = new Date(t.date);
                // Adjust for timezone differences by comparing dates only
                const startOfDay = (dateStr: string) => {
                    const date = new Date(dateStr);
                    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
                }
                if (filterDateFrom && startOfDay(filterDateFrom) > transactionDate) {
                    return false;
                }
                if (filterDateTo && startOfDay(filterDateTo) < transactionDate) {
                    return false;
                }
                if (filterCategory && t.categoryId !== filterCategory) {
                    return false;
                }
                if (filterPaymentMethod && t.paymentMethod !== filterPaymentMethod) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filterDateFrom, filterDateTo, filterCategory, filterPaymentMethod]);

    const handleOpenForm = (transaction?: Transaction) => {
        setEditingTransaction(transaction);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingTransaction(undefined);
        setIsFormOpen(false);
    };

    const handleSubmit = (transactionData: Omit<Transaction, 'id'|'profileId'> | Transaction) => {
        if('id' in transactionData) {
            updateTransaction(transactionData as Transaction);
        } else {
            addTransaction(transactionData);
        }
    };
    
    const handleResetFilters = () => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterCategory('');
        setFilterPaymentMethod('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">Transactions</h1>
                <Button onClick={() => handleOpenForm()}>
                    {ICONS.Plus}
                    <span className="ml-2">Add Transaction</span>
                </Button>
            </div>

            <Card className="mb-6 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-on-surface">Filter Transactions</h3>
                    <Button onClick={handleResetFilters} variant="ghost">Reset Filters</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                        label="Start Date"
                        type="date"
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                    />
                    <Select
                        label="Category"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select
                        label="Payment Method"
                        value={filterPaymentMethod}
                        onChange={e => setFilterPaymentMethod(e.target.value)}
                    >
                        <option value="">All Methods</option>
                        <option value={PaymentMethod.BANK}>Bank</option>
                        <option value={PaymentMethod.CREDIT}>Credit Card</option>
                        <option value={PaymentMethod.CASH}>Cash</option>
                    </Select>
                </div>
            </Card>

            <TransactionList 
                transactions={filteredAndSortedTransactions} 
                categories={categories}
                incomeSources={incomeSources}
                currency={currency}
                onEdit={handleOpenForm}
                onDelete={deleteTransaction}
                onRowClick={setViewingTransaction}
            />

            {isFormOpen && (
                <TransactionForm
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    onSubmit={handleSubmit}
                    categories={categories}
                    incomeSources={incomeSources}
                    profileId={profileId}
                    initialData={editingTransaction}
                />
            )}

            {viewingTransaction && (
                <TransactionDetailModal 
                    isOpen={!!viewingTransaction}
                    onClose={() => setViewingTransaction(null)}
                    transaction={viewingTransaction}
                    currency={currency}
                    categories={categories}
                    incomeSources={incomeSources}
                    onUpdateTransaction={updateTransaction}
                />
            )}
        </div>
    );
};

export default Transactions;