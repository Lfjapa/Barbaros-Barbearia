import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { getTransactionsByRange, getBarbers } from '../../services/db';
import { ChevronLeft, ChevronRight, Calendar, User, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [metrics, setMetrics] = useState({
        monthTotal: 0,
        monthCommission: 0,
        monthHouse: 0,
        barbersData: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    async function fetchData() {
        setLoading(true);
        try {
            // Define Month Range
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

            const [monthlyTransactionsResult, barbersList] = await Promise.all([
                getTransactionsByRange(startOfMonth, endOfMonth),
                getBarbers()
            ]);

            const monthlyTransactions = monthlyTransactionsResult.data;

            // Calculate Totals (Use stored values)
            const totalRevenue = monthlyTransactions.reduce((sum, t) => sum + t.total, 0);
            const totalCommission = monthlyTransactions.reduce((sum, t) => sum + (t.commissionAmount || (t.total * 0.40)), 0);
            const totalHouse = monthlyTransactions.reduce((sum, t) => sum + (t.revenueAmount || (t.total * 0.60)), 0);

            // Process per Barber
            const barbersData = barbersList.map(barber => {
                const barberTxs = monthlyTransactions.filter(t => t.barberId === barber.id);
                const barberTotal = barberTxs.reduce((sum, t) => sum + t.total, 0);
                const barberCommission = barberTxs.reduce((sum, t) => sum + (t.commissionAmount || (t.total * 0.40)), 0);

                // Group by Week
                const weeklyBreakdown = [0, 0, 0, 0, 0]; // Up to 5 weeks
                barberTxs.forEach(t => {
                    const date = t.date.toDate();
                    const day = date.getDate();
                    // Simple week calc: (day - 1) / 7
                    // Week 1: 1-7, Week 2: 8-14, etc.
                    const weekIndex = Math.floor((day - 1) / 7);
                    if (weekIndex < 5) {
                        weeklyBreakdown[weekIndex] += (t.commissionAmount || (t.total * 0.40));
                    }
                });

                return {
                    id: barber.id,
                    name: barber.name,
                    totalGenerated: barberTotal,
                    commissionToPay: barberCommission,
                    weekly: weeklyBreakdown
                };
            }).sort((a, b) => b.totalGenerated - a.totalGenerated);

            setMetrics({
                monthTotal: totalRevenue,
                monthCommission: totalCommission,
                monthHouse: totalHouse,
                barbersData
            });

        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    const changeMonth = (offset) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) return (
        <Layout role="admin">
            <div className="flex justify-center items-center h-[50vh] text-[var(--color-primary)] font-bold">Carregando...</div>
        </Layout>
    );

    return (
        <Layout role="admin">
            {/* Header / Month Selector */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-xl font-bold text-[var(--color-primary)] uppercase tracking-widest hidden md:block">
                    Financeiro
                </h1>

                <div className="flex items-center gap-4 bg-[var(--color-dark-surface)] p-2 rounded-full border border-[var(--color-border)] shadow-md mx-auto md:mx-0">
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

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                {/* 1. Total Generated (Gross) */}
                <Card className="border-none bg-gradient-to-br from-[var(--color-dark-surface)] to-[var(--color-dark-bg)] border-[var(--color-border)]">
                    <div className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-widest mb-2">Faturamento Total</div>
                    <div className="text-3xl font-black text-white">{formatMoney(metrics.monthTotal)}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase">Soma de todos os serviços</div>
                </Card>

                {/* 2. House Share (60%) */}
                <Card className="border-none bg-[var(--color-dark-surface)] border-l-4 border-[var(--color-success)]">
                    <div className="text-xs text-[var(--color-success)] font-bold uppercase tracking-widest mb-2">Caixa da Barbearia (60%)</div>
                    <div className="text-3xl font-black text-white">{formatMoney(metrics.monthHouse)}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase">Para reinvestimento e custos</div>
                </Card>

                {/* 3. Commission (40%) */}
                <Card className="border-none bg-[var(--color-dark-surface)] border-l-4 border-[var(--color-primary)]">
                    <div className="text-xs text-[var(--color-primary)] font-bold uppercase tracking-widest mb-2">Comissões a Pagar (40%)</div>
                    <div className="text-3xl font-black text-white">{formatMoney(metrics.monthCommission)}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase">Total a repassar aos barbeiros</div>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="mb-8 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp size={24} className="text-[var(--color-primary)]" />
                        Evolução Diária
                    </h2>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                                dataKey="day" 
                                stroke="#888" 
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis 
                                stroke="#888" 
                                fontSize={12}
                                tickFormatter={(value) => `R$${value}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [formatMoney(value), 'Faturamento']}
                                labelFormatter={(label) => `Dia ${label}`}
                            />
                            <Bar 
                                dataKey="total" 
                                fill="var(--color-primary)" 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Barber Breakdown */}
            <h2 className="text-lg font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                <User size={18} /> Pagamentos por Barbeiro
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {metrics.barbersData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">Nenhum dado financeiro para este mês.</div>
                )}

                {metrics.barbersData.map((barber) => (
                    <Card key={barber.id} className="bg-[var(--color-dark-surface)] overflow-hidden">
                        {/* Barber Header */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-[var(--color-border)] gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-black flex items-center justify-center font-bold text-lg">
                                    {barber.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg uppercase">{barber.name}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)]">Gerou: {formatMoney(barber.totalGenerated)}</div>
                                </div>
                            </div>
                            <div className="text-center md:text-right bg-[var(--color-dark-bg)] p-3 rounded-xl border border-[var(--color-primary)]/30">
                                <div className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">A Pagar (40%)</div>
                                <div className="text-2xl font-black text-white">{formatMoney(barber.commissionToPay)}</div>
                            </div>
                        </div>

                        {/* Weekly Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {barber.weekly.map((val, idx) => (
                                <div key={idx} className={`p-2 rounded-lg text-center border ${val > 0 ? 'border-gray-700 bg-black/20' : 'border-transparent opacity-50'}`}>
                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Semana {idx + 1}</div>
                                    <div className={`font-bold ${val > 0 ? 'text-white' : 'text-gray-600'}`}>
                                        {formatMoney(val)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </Layout>
    );
}
