import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { getHistory, getServices } from '../../services/db';

export default function History() {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [servicesMap, setServicesMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!currentUser) return;
            try {
                const [historyData, servicesData] = await Promise.all([
                    getHistory(currentUser.uid),
                    getServices()
                ]);

                // Create a map for quick service name lookup
                const sMap = {};
                servicesData.forEach(s => sMap[s.id] = s.name);
                setServicesMap(sMap);
                setHistory(historyData);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [currentUser]);

    // Calculate totals
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayStr = today.toLocaleDateString('pt-BR');

    const todayTotal = history
        .filter(item => {
            const itemDate = item.createdAt || new Date(); // Fallback if missing
            return itemDate >= new Date(today.setHours(0, 0, 0, 0)) && itemDate < new Date(today.setHours(23, 59, 59, 999));
        })
        .reduce((acc, curr) => acc + curr.total, 0);

    const weekTotal = history
        .filter(item => {
            const itemDate = item.createdAt || new Date();
            return itemDate >= startOfWeek;
        })
        .reduce((acc, curr) => acc + curr.total, 0);

    const monthTotal = history
        .filter(item => {
            const itemDate = item.createdAt || new Date();
            return itemDate >= startOfMonth;
        })
        .reduce((acc, curr) => acc + curr.total, 0);

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <Layout role="barber">
            <h1 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Histórico</h1>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="bg-[var(--color-primary)] border-none text-[var(--color-dark-bg)] col-span-2">
                    <div className="text-sm font-bold opacity-80">Hoje</div>
                    <div className="text-4xl font-extrabold">R$ {todayTotal.toFixed(2)}</div>
                </Card>
                <Card className="bg-[var(--color-surface)]">
                    <div className="text-xs text-[var(--color-text-secondary)]">Semana</div>
                    <div className="text-xl font-bold text-white">R$ {weekTotal.toFixed(2)}</div>
                </Card>
                <Card className="bg-[var(--color-surface)]">
                    <div className="text-xs text-[var(--color-text-secondary)]">Mês</div>
                    <div className="text-xl font-bold text-white">R$ {monthTotal.toFixed(2)}</div>
                </Card>
            </div>

            <h2 className="text-lg font-semibold mb-3">Últimas Vendas</h2>
            <div className="flex flex-col gap-3">
                {history.length === 0 && <div className="text-sm text-gray-500">Nenhuma venda registrada.</div>}
                {history.map(item => (
                    <Card key={item.id} className="flex justify-between items-center">
                        <div>
                            <div className="font-bold text-white">
                                {item.serviceIds.map(id => servicesMap[id] || 'Serviço').join(', ')}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{item.date} • {item.method.toUpperCase()}</div>
                        </div>
                        <div className="text-lg font-bold text-[var(--color-primary)]">
                            R$ {item.total.toFixed(2)}
                        </div>
                    </Card>
                ))}
            </div>
        </Layout>
    );
}
