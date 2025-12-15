import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { getTransactionsByRange, getBarbers } from '../../services/db';

export default function Dashboard() {
    const [metrics, setMetrics] = useState({
        today: { revenue: 0, count: 0 },
        week: { revenue: 0, commission: 0, house: 0, count: 0 },
        month: { revenue: 0, commission: 0, house: 0, count: 0 },
        topBarbers: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const now = new Date();

                // Ranges
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
                startOfWeek.setHours(0, 0, 0, 0);

                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const [dailyData, weeklyData, monthlyData, barbers] = await Promise.all([
                    getTransactionsByRange(startOfToday, endOfToday),
                    getTransactionsByRange(startOfWeek, endOfToday),
                    getTransactionsByRange(startOfMonth, endOfToday),
                    getBarbers()
                ]);

                // Helper to sum fields
                const sum = (data, field) => data.reduce((acc, curr) => acc + (curr[field] || 0), 0);

                // If commissionAmount is missing (old data), fallback to 0 or calc on fly? 
                // For safety, let's assume if missing it's 0 or handle migration later.
                // We'll trust new data has it.

                const todayMetrics = {
                    revenue: sum(dailyData, 'total'),
                    count: dailyData.length
                };

                const weekMetrics = {
                    revenue: sum(weeklyData, 'total'),
                    commission: sum(weeklyData, 'commissionAmount'),
                    house: sum(weeklyData, 'revenueAmount'),
                    count: weeklyData.length
                };

                const monthMetrics = {
                    revenue: sum(monthlyData, 'total'),
                    commission: sum(monthlyData, 'commissionAmount'),
                    house: sum(monthlyData, 'revenueAmount'),
                    count: monthlyData.length
                };

                // Calculate revenue per barber (using Monthly data for "Employee of the Month" feel, or Today?)
                // Let's keep "Today" as per original or switch to Month? Original was Today.
                // Let's use MONTHLY for Top Barbers to be more meaningful.
                const barberRevenueMap = {};
                monthlyData.forEach(t => {
                    barberRevenueMap[t.barberId] = (barberRevenueMap[t.barberId] || 0) + t.total;
                });

                const topBarbers = barbers.map(b => ({
                    name: b.name || b.email,
                    value: barberRevenueMap[b.id] || 0,
                    percent: monthMetrics.revenue > 0 ? ((barberRevenueMap[b.id] || 0) / monthMetrics.revenue) * 100 : 0
                }))
                    .sort((a, b) => b.value - a.value)
                    .filter(b => b.value > 0);

                setMetrics({
                    today: todayMetrics,
                    week: weekMetrics,
                    month: monthMetrics,
                    topBarbers
                });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    const KPICard = ({ title, revenue, subtext, highlight }) => (
        <Card className={`flex flex-col ${highlight ? 'border-[var(--color-primary)]' : ''}`}>
            <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">{title}</div>
            <div className={`text-2xl font-bold ${highlight ? 'text-[var(--color-primary)]' : 'text-white'}`}>
                R$ {revenue.toFixed(2)}
            </div>
            {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
        </Card>
    );

    return (
        <Layout role="admin">
            <h1 className="text-xl font-bold mb-6 text-[var(--color-primary)]">Dashboard</h1>

            {/* Today */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold mb-2 text-gray-400">Hoje</h2>
                <div className="grid grid-cols-2 gap-4">
                    <KPICard title="Faturamento" revenue={metrics.today.revenue} subtext={`${metrics.today.count} atendimentos`} highlight />
                    {/* Placeholder or other metric */}
                </div>
            </div>

            {/* Weekly */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold mb-2 text-gray-400">Esta Semana</h2>
                <div className="grid grid-cols-2 gap-4">
                    <KPICard title="Total" revenue={metrics.week.revenue} />
                    <Card className="bg-[var(--color-surface)]">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase">Divisão</div>
                        <div className="mt-2 text-sm text-[var(--color-success)] flex justify-between">
                            <span>Casa (60%)</span>
                            <span>R$ {metrics.week.house.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-[var(--color-primary)] flex justify-between">
                            <span>Barbeiros (40%)</span>
                            <span>R$ {metrics.week.commission.toFixed(2)}</span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Monthly */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold mb-2 text-gray-400">Este Mês</h2>
                <div className="grid grid-cols-2 gap-4">
                    <KPICard title="Total" revenue={metrics.month.revenue} />
                    <Card className="bg-[var(--color-surface)]">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase">Divisão</div>
                        <div className="mt-2 text-sm text-[var(--color-success)] flex justify-between">
                            <span>Casa (60%)</span>
                            <span>R$ {metrics.month.house.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-[var(--color-primary)] flex justify-between">
                            <span>Barbeiros (40%)</span>
                            <span>R$ {metrics.month.commission.toFixed(2)}</span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Top Barbers (Monthly) */}
            <h2 className="text-lg font-semibold mb-3">Top Barbeiros (Mês)</h2>
            <Card className="mb-6">
                {metrics.topBarbers.length === 0 && <div className="text-sm text-gray-500">Nenhum atendimento este mês.</div>}
                {metrics.topBarbers.map((barber, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                        <div className="flex justify-between text-sm mb-1">
                            <span>{barber.name}</span>
                            <span className="font-bold">R$ {barber.value.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-[var(--color-primary)] h-full rounded-full"
                                style={{ width: `${barber.percent}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </Card>
        </Layout>
    );
}
