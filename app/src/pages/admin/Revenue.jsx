import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { getTransactionsByRange } from '../../services/db';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, CreditCard, Wallet, Banknote, TrendingUp } from 'lucide-react';

export default function Revenue() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [paymentStats, setPaymentStats] = useState({});
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    async function fetchData() {
        setLoading(true);
        try {
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

            const result = await getTransactionsByRange(startOfMonth, endOfMonth);
            const data = result.data;
            setTransactions(data);
            processRevenueData(data, startOfMonth, endOfMonth);
        } catch (error) {
            console.error("Error fetching revenue:", error);
        } finally {
            setLoading(false);
        }
    }

    const processRevenueData = (data, startOfMonth, endOfMonth) => {
        // 1. Payment Methods Totals
        const methods = {
            dinheiro: 0,
            pix: 0,
            debito: 0,
            credito: 0,
            outros: 0 // Fallback
        };

        let total = 0;

        data.forEach(t => {
            const method = t.method ? t.method.toLowerCase() : 'outros';
            const value = Number(t.total);
            
            if (methods[method] !== undefined) {
                methods[method] += value;
            } else {
                methods['outros'] += value;
            }
            total += value;
        });

        setPaymentStats(methods);
        setTotalRevenue(total);

        // 2. Weekly Breakdown (Calendar Weeks)
        // Strategy: Create buckets for each week of the month
        // We will define a week as starting on Sunday.
        
        const weeks = [];
        let currentWeekStart = new Date(startOfMonth);
        currentWeekStart.setDate(1); // Ensure 1st
        
        // Adjust to the first day of the first week (could be previous month if we want full weeks, 
        // but typically "Monthly Revenue" shows days belonging to this month).
        // Let's iterate through the days of the month and assign them to weeks.
        
        const weeksMap = new Map(); // Key: Week Number (1-5), Value: Object with methods

        data.forEach(t => {
            const tDate = t.date.seconds ? new Date(t.date.seconds * 1000) : new Date(t.date);
            // Calculate week number relative to start of month
            // Simple approach: Week 1 is the first partial week, Week 2 is the next full week, etc.
            
            // Get day of month (1-31)
            const date = tDate.getDate();
            const dayOfWeek = tDate.getDay(); // 0 (Sun) - 6 (Sat)
            
            // Calculate "Week of Month" index
            // Offset by the day of week of the 1st of the month
            const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const startDay = firstDayOfMonth.getDay(); // 0-6
            
            // Formula for week index (0-based)
            const weekIndex = Math.floor((date + startDay - 1) / 7);
            
            if (!weeksMap.has(weekIndex)) {
                weeksMap.set(weekIndex, {
                    id: weekIndex,
                    total: 0,
                    methods: { dinheiro: 0, pix: 0, debito: 0, credito: 0, outros: 0 },
                    startDate: null,
                    endDate: null
                });
            }
            
            const weekData = weeksMap.get(weekIndex);
            const val = Number(t.total);
            const method = t.method ? t.method.toLowerCase() : 'outros';
            
            weekData.total += val;
            if (weekData.methods[method] !== undefined) {
                weekData.methods[method] += val;
            } else {
                weekData.methods.outros += val;
            }
        });

        // Convert map to array and fill missing weeks
        const numWeeks = Math.ceil((endOfMonth.getDate() + startOfMonth.getDay()) / 7);
        const finalWeeks = [];

        for (let i = 0; i < numWeeks; i++) {
            const weekData = weeksMap.get(i) || {
                id: i,
                total: 0,
                methods: { dinheiro: 0, pix: 0, debito: 0, credito: 0, outros: 0 }
            };

            // Calculate Date Range for display
            // Start Date of this week
            const startDayOffset = (i * 7) - startOfMonth.getDay() + 1;
            let wStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), startDayOffset);
            if (wStart < startOfMonth) wStart = startOfMonth; // Clamp to month start

            let wEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), startDayOffset + 6);
            if (wEnd > endOfMonth) wEnd = endOfMonth; // Clamp to month end

            weekData.startDate = wStart;
            weekData.endDate = wEnd;

            finalWeeks.push(weekData);
        }

        setWeeklyData(finalWeeks);
    };

    const changeMonth = (offset) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    const getMethodIcon = (method) => {
        switch (method) {
            case 'dinheiro': return <Banknote size={20} className="text-emerald-500" />;
            case 'pix': return <TrendingUp size={20} className="text-blue-400" />;
            case 'debito': return <CreditCard size={20} className="text-orange-400" />;
            case 'credito': return <CreditCard size={20} className="text-purple-400" />;
            default: return <Wallet size={20} className="text-gray-400" />;
        }
    };

    const getMethodLabel = (method) => {
        switch (method) {
            case 'dinheiro': return 'Dinheiro';
            case 'pix': return 'Pix';
            case 'debito': return 'Débito';
            case 'credito': return 'Crédito';
            default: return method;
        }
    };

    return (
        <Layout role="admin">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-xl font-bold text-[var(--color-primary)] uppercase tracking-widest border-l-4 border-[var(--color-primary)] pl-3">
                    Controle de Faturamento
                </h1>

                <div className="flex items-center gap-4 bg-[var(--color-dark-surface)] p-2 rounded-full border border-[var(--color-border)] shadow-md">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-[var(--color-dark-bg)] rounded-full transition-colors text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
                        <Calendar size={16} className="text-[var(--color-primary)]" />
                        <span className="font-bold text-white uppercase tracking-wider text-sm">
                            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-[var(--color-dark-bg)] rounded-full transition-colors text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="animate-pulse text-[var(--color-primary)] font-bold">Carregando dados...</span>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Total Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Total Card */}
                        <Card className="col-span-2 md:col-span-4 p-6 bg-gradient-to-br from-[var(--color-dark-surface)] to-zinc-900 border-[var(--color-primary)]/50">
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Faturamento Total</span>
                                <span className="text-4xl md:text-5xl font-black text-[var(--color-primary)]">
                                    {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </Card>

                        {/* Payment Methods Breakdown */}
                        {['dinheiro', 'pix', 'debito', 'credito'].map(method => (
                            <Card key={method} className="p-4 flex flex-col items-center justify-center border-t-4 border-t-zinc-700 hover:border-t-[var(--color-primary)] transition-colors">
                                <div className="mb-2 flex items-center gap-2 text-gray-400">
                                    {getMethodIcon(method)}
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{getMethodLabel(method)}</span>
                                </div>
                                <span className="text-xl font-bold text-white">
                                    {(paymentStats[method] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                                <span className="text-[10px] text-gray-500 mt-1">
                                    {totalRevenue > 0 
                                        ? `${(((paymentStats[method] || 0) / totalRevenue) * 100).toFixed(1)}%` 
                                        : '0%'}
                                </span>
                            </Card>
                        ))}
                    </div>

                    {/* Weekly Breakdown */}
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-[var(--color-primary)]" />
                            Detalhamento Semanal
                        </h3>
                        
                        <div className="grid gap-4">
                            {weeklyData.map((week, index) => (
                                <Card key={index} className="p-0 overflow-hidden">
                                    <div className="p-4 bg-[var(--color-dark-surface)] border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-1">
                                                Semana {index + 1}
                                            </h4>
                                            <p className="text-xs text-gray-400 font-mono">
                                                {week.startDate.toLocaleDateString('pt-BR')} até {week.endDate.toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white block">
                                                {week.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Weekly Payment Methods */}
                                    <div className="grid grid-cols-4 divide-x divide-white/5 bg-black/20">
                                        {['dinheiro', 'pix', 'debito', 'credito'].map(method => (
                                            <div key={method} className="p-3 text-center">
                                                <div className="flex flex-col items-center justify-center mb-2 gap-1 opacity-70">
                                                    {getMethodIcon(method)}
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{getMethodLabel(method)}</span>
                                                </div>
                                                <div className="text-sm font-bold text-gray-300">
                                                    {(week.methods[method] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
