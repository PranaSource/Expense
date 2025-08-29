import React, { useState, useMemo } from 'react';
import { Transaction, Category, IncomeSource, Currency, TransactionType } from '../types';
import { Card, Input } from './ui';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ReportingProps {
  transactions: Transaction[];
  categories: Category[];
  incomeSources: IncomeSource[];
  currency: Currency;
}

const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
    }).format(amount);
};

const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
    };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ReportDetailCard: React.FC<{
    title: string;
    data: { name: string; value: number }[];
    total: number;
    currency: Currency;
}> = ({ title, data, total, currency }) => {
    return (
        <Card className="flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-on-surface">{title}</h3>
            <p className="text-2xl font-bold mb-4">{formatCurrency(total, currency)}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                <div className="h-64">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-on-surface-variant">No data</div>
                    )}
                </div>
                <div className="overflow-y-auto max-h-64 pr-2">
                    <ul className="space-y-2">
                        {data.map((item, index) => (
                            <li key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    <span className="truncate" title={item.name}>{item.name}</span>
                                </div>
                                <div className="font-semibold text-right flex-shrink-0 ml-2">
                                    <span className="mr-2">{formatCurrency(item.value, currency)}</span>
                                    <span className="text-on-surface-variant text-xs w-16 inline-block text-right">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    );
};


const Reporting: React.FC<ReportingProps> = ({ transactions, categories, incomeSources, currency }) => {
    const [dateRange, setDateRange] = useState(getMonthRange());

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const filteredTransactions = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) {
            return [];
        }

        const start = new Date(dateRange.startDate);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(dateRange.endDate);
        end.setUTCHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });
    }, [transactions, dateRange]);

    const { expenseData, incomeData, totalExpense, totalIncome } = useMemo(() => {
        const categoryTotals: { [key: string]: { name: string; value: number } } = {};
        const sourceTotals: { [key: string]: { name: string; value: number } } = {};
        let currentTotalExpense = 0;
        let currentTotalIncome = 0;

        filteredTransactions.forEach(t => {
            if (t.type === TransactionType.EXPENSE) {
                currentTotalExpense += t.amount;
                const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
                if (!categoryTotals[categoryName]) {
                    categoryTotals[categoryName] = { name: categoryName, value: 0 };
                }
                categoryTotals[categoryName].value += t.amount;
            } else { // INCOME
                currentTotalIncome += t.amount;
                const sourceName = incomeSources.find(s => s.id === t.sourceId)?.name || 'Uncategorized';
                if (!sourceTotals[sourceName]) {
                    sourceTotals[sourceName] = { name: sourceName, value: 0 };
                }
                sourceTotals[sourceName].value += t.amount;
            }
        });

        return {
            expenseData: Object.values(categoryTotals).sort((a, b) => b.value - a.value),
            incomeData: Object.values(sourceTotals).sort((a, b) => b.value - a.value),
            totalExpense: currentTotalExpense,
            totalIncome: currentTotalIncome,
        };
    }, [filteredTransactions, categories, incomeSources]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-on-surface">Reporting</h1>
            
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input label="Start Date" type="date" name="startDate" value={dateRange.startDate} onChange={handleDateChange} />
                    <Input label="End Date" type="date" name="endDate" value={dateRange.endDate} onChange={handleDateChange} />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center p-6">
                    <p className="text-sm text-green-600 font-semibold">TOTAL INCOME</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome, currency)}</p>
                </Card>
                <Card className="text-center p-6">
                    <p className="text-sm text-red-600 font-semibold">TOTAL EXPENSE</p>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpense, currency)}</p>
                </Card>
                 <Card className="text-center p-6">
                    <p className="text-sm text-on-surface-variant font-semibold">NET BALANCE</p>
                    <p className={`text-3xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-primary' : 'text-gray-600'}`}>
                        {formatCurrency(totalIncome - totalExpense, currency)}
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportDetailCard title="Expense Breakdown" data={expenseData} total={totalExpense} currency={currency} />
                <ReportDetailCard title="Income Breakdown" data={incomeData} total={totalIncome} currency={currency} />
            </div>
        </div>
    );
};

export default Reporting;