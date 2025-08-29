
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Transaction, TransactionType, Category, Currency } from '../types';
import { Card } from './ui';
import { ICONS } from '../constants';
import { PaymentMethod } from '../types';

interface SummaryCardProps {
    title: string;
    amount: string;
    icon: React.ReactNode;
    color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, color }) => (
    <Card className="flex items-center p-4">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-on-surface-variant">{title}</p>
            <p className="text-2xl font-bold text-on-surface">{amount}</p>
        </div>
    </Card>
);

const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
    }).format(amount);
};


const RecentTransactions: React.FC<{ transactions: Transaction[], categories: Category[], currency: Currency }> = ({ transactions, categories, currency }) => (
    <Card className="col-span-1 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4 text-on-surface">Recent Transactions</h3>
        <div className="space-y-3">
            {transactions.slice(0, 5).map(t => {
                const isExpense = t.type === TransactionType.EXPENSE;
                const category = isExpense ? categories.find(c => c.id === t.categoryId) : null;
                return (
                    <div key={t.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isExpense ? 'bg-red-100' : 'bg-green-100'}`}>
                                {category && ICONS[category.icon] ? React.cloneElement(ICONS[category.icon], {className: `h-5 w-5 ${isExpense ? 'text-red-500' : 'text-green-500'}`}) : <div />}
                            </div>
                            <div>
                                <p className="font-medium text-on-surface">{t.description}</p>
                                <p className="text-sm text-on-surface-variant">{new Date(t.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className={`font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                            {isExpense ? '-' : '+'} {formatCurrency(t.amount, currency)}
                        </p>
                    </div>
                );
            })}
        </div>
    </Card>
);

const CategoryPieChart: React.FC<{ transactions: Transaction[], categories: Category[], currency: Currency }> = ({ transactions, categories, currency }) => {
    const expenseData = useMemo(() => {
        const categoryTotals: { [key: string]: number } = {};
        transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                if(t.categoryId) {
                    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
                }
            });

        return Object.entries(categoryTotals).map(([categoryId, total]) => ({
            name: categories.find(c => c.id === categoryId)?.name || 'Uncategorized',
            value: total,
        }));
    }, [transactions, categories]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-on-surface">Expense by Category</h3>
            {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={expenseData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-on-surface-variant h-[300px] flex items-center justify-center">No expense data to display.</p>}
        </Card>
    );
};

const IncomeVsExpenseChart: React.FC<{ transactions: Transaction[], currency: Currency }> = ({ transactions, currency }) => {
    const chartData = useMemo(() => {
        const dataByMonth: { [key: string]: { month: string, income: number, expense: number } } = {};
        
        transactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!dataByMonth[month]) {
                dataByMonth[month] = { month, income: 0, expense: 0 };
            }
            if (t.type === TransactionType.INCOME) {
                dataByMonth[month].income += t.amount;
            } else {
                dataByMonth[month].expense += t.amount;
            }
        });

        return Object.values(dataByMonth).sort((a,b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
    }, [transactions]);

    return (
         <Card className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-on-surface">Income vs. Expense</h3>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => currency.symbol + value}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                        <Legend />
                        <Bar dataKey="income" fill="#10b981" />
                        <Bar dataKey="expense" fill="#ef4444" />
                    </BarChart>
                </ResponsiveContainer>
             ) : <p className="text-center text-on-surface-variant h-[300px] flex items-center justify-center">No transaction data for chart.</p>}
        </Card>
    );
};


const Dashboard: React.FC<{ transactions: Transaction[], categories: Category[], currency: Currency }> = ({ transactions, categories, currency }) => {
    const { totalIncome, totalExpense, balance } = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === TransactionType.INCOME) {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });
        return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
    }, [transactions]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SummaryCard title="Total Income" amount={formatCurrency(totalIncome, currency)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} color="bg-green-200"/>
            <SummaryCard title="Total Expense" amount={formatCurrency(totalExpense, currency)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} color="bg-red-200"/>
            <SummaryCard title="Balance" amount={formatCurrency(balance, currency)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} color="bg-indigo-200"/>
            
            <IncomeVsExpenseChart transactions={transactions} currency={currency} />
            <CategoryPieChart transactions={transactions} categories={categories} currency={currency} />
            <RecentTransactions transactions={transactions} categories={categories} currency={currency} />
        </div>
    );
};

export default Dashboard;
