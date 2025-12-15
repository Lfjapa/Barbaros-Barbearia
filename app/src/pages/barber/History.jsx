import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactionsByRange, getServices, getBarbers } from '../../services/db';
import { X, User, Calendar, CreditCard, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';

export default function History() {
    const { currentUser, userRole } = useAuth();
    const [history, setHistory] = useState([]);
    const [servicesMap, setServicesMap] = useState({});
    const [barbersMap, setBarbersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        async function fetchData() {
            if (!currentUser) return;
            setLoading(true);
            try {
                // 1. Fetch metadata first to identify the user correctly
                const [servicesData, barbersData] = await Promise.all([
                    getServices(),
                    getBarbers()
                ]);

                // Create Maps
                const sMap = {};
                servicesData.forEach(s => sMap[s.id] = s.name);
                setServicesMap(sMap);

                const bMap = {};
                barbersData.forEach(b => bMap[b.id] = b.name);
                setBarbersMap(bMap);

                // 2. Determine Barber IDs to filter
                let barberIdToFilter = null;

                if (userRole === 'barber') {
                    // Find all IDs that belong to this user
                    const myIds = new Set([currentUser.uid]);

                    // Normalize helper
                    const normalize = (str) => str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

                    const myEmail = normalize(currentUser.email);
                    const myNameRaw = normalize(currentUser.displayName);
                    const myNameParts = myNameRaw.split(/\s+/).filter(part => part.length > 2); // Split into words, ignore small words like "de", "da"

                    barbersData.forEach(b => {
                        // 1. Email Match (Trimmed & Normalized)
                        const bEmail = normalize(b.email);
                        if (bEmail && bEmail === myEmail) {
                            myIds.add(b.id);
                        }

                        // 2. Name Token Match (Fuzzy)
                        // If the ADMIN typed "Luiz Felipe Marçal Kosse" and GOOGLE says "Luiz Kosse"
                        // or GOOGLE says "Luiz Felipe"
                        // We check how many "significant words" overlap.
                        const bName = normalize(b.name);
                        const bNameParts = bName.split(/\s+/).filter(part => part.length > 2);

                        if (myNameParts.length > 0 && bNameParts.length > 0) {
                            // Count matches
                            const matches = myNameParts.filter(part => bNameParts.includes(part));

                            // If we have at least 2 matching words (First + Last, or First + Middle), consider it a match.
                            // Or if both only have 1 word and it matches (unlikely but possible).
                            if (matches.length >= 2) {
                                myIds.add(b.id);
                            }
                            // Special case: If one of them only has 1 word and it matches? Too risky for common names like "Lucas". 
                            // Require at least 2 words match unless full string matches.
                            else if (bName === myNameRaw && bName.length > 3) {
                                myIds.add(b.id);
                            }
                        }
                    });

                    barberIdToFilter = Array.from(myIds);
                }

                // 3. Fetch Transactions
                // Define Month Range
                const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

                const historyData = await getTransactionsByRange(startOfMonth, endOfMonth, barberIdToFilter);

                // Sort
                const sortedHistory = historyData.sort((a, b) => {
                    const dateA = a.date.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
                    const dateB = b.date.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
                    return dateB - dateA;
                });

                // Format dates for display
                const formattedHistory = sortedHistory.map(item => {
                    const d = item.date.seconds ? new Date(item.date.seconds * 1000) : new Date(item.date);
                    return {
                        ...item,
                        displayDate: d.toLocaleDateString('pt-BR'),
                        displayTime: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        rawDate: d
                    };
                });

                setHistory(formattedHistory);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [currentUser, selectedDate, userRole]);

    const changeMonth = (offset) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    // Calculate totals for the VIEWED month
    const monthTotal = history.reduce((acc, curr) => acc + curr.total, 0);

    // Commission Estimate (Only for Barbers) - crude 40% calc 
    // Ideally stored in DB, but calc is fine for now
    const commissionTotal = monthTotal * 0.40;

    if (loading) return (
        <Layout role={userRole}>
            <div className="flex justify-center items-center h-[50vh] text-[var(--color-primary)] font-bold">Carregando...</div>
        </Layout>
    );

    return (
        <Layout role={userRole}>
            {/* Header with Month Selector */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-xl font-bold text-[var(--color-primary)] uppercase tracking-widest border-l-4 border-[var(--color-primary)] pl-3">
                    Histórico
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

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-[var(--color-primary)] to-[#b8952b] border-none text-black col-span-2 md:col-span-1 shadow-lg">
                    <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Total (Mês)</div>
                    <div className="text-5xl font-black tracking-tighter">
                        <span className="text-2xl font-bold align-top mt-1 inline-block mr-1">R$</span>
                        {monthTotal.toFixed(2)}
                    </div>
                </Card>

                {/* Show Est. Commission only for Barbers */}
                {userRole === 'barber' && (
                    <Card className="bg-[var(--color-dark-surface)] border-[var(--color-border)] col-span-2 md:col-span-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Sua Comissão (Estimada 40%)</div>
                        <div className="text-3xl font-bold text-white">R$ {commissionTotal.toFixed(2)}</div>
                    </Card>
                )}
                {/* For Admin, maybe show Count */}
                {userRole === 'admin' && (
                    <Card className="bg-[var(--color-dark-surface)] border-[var(--color-border)] col-span-2 md:col-span-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Atendimentos</div>
                        <div className="text-3xl font-bold text-white">{history.length}</div>
                    </Card>
                )}
            </div>

            {/* List */}
            <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
                Serviços do Mês
            </h2>

            <div className="flex flex-col gap-3 pb-safe">
                {history.length === 0 && (
                    <div className="text-center py-10 opacity-50 border-2 border-dashed border-[var(--color-border)] rounded-xl">
                        <p className="text-sm font-medium">Nenhum serviço neste mês.</p>
                    </div>
                )}

                {history.map(item => (
                    <Card
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="flex justify-between items-center group hover:border-[var(--color-primary)] transition-colors cursor-pointer active:scale-[0.98]"
                    >
                        <div>
                            <div className="font-bold text-white text-lg">
                                {/* Show first service name + count if more than 1 */}
                                {servicesMap[item.serviceIds[0]] || 'Serviço'}
                                {item.serviceIds.length > 1 && <span className="text-xs text-[var(--color-text-secondary)] ml-2">+{item.serviceIds.length - 1}</span>}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wide mt-1">
                                {item.displayDate} • {item.displayTime}
                            </div>
                            <div className="text-[10px] text-[var(--color-primary)] font-bold uppercase mt-1">
                                {barbersMap[item.barberId] || 'Barbeiro'}
                            </div>
                        </div>
                        <div className="text-xl font-black text-white">
                            <span className="text-xs text-gray-500 mr-1 font-normal">R$</span>
                            {item.total.toFixed(2)}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div
                        className="bg-[var(--color-dark-surface)] w-full max-w-sm rounded-3xl border border-[var(--color-primary)] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative animation-fade-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-[var(--color-primary)] p-4 text-center relative">
                            <h3 className="text-black font-black uppercase tracking-widest text-sm pr-10">Detalhes do Atendimento</h3>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-1/2 -translate-y-1/2 right-4 p-1 bg-black/10 rounded-full hover:bg-black/20 text-black"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Value */}
                            <div className="text-center">
                                <span className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">Valor Total</span>
                                <span className="text-4xl font-black text-[var(--color-primary)]">R$ {selectedItem.total.toFixed(2)}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-[var(--color-dark-bg)] rounded-xl border border-[var(--color-border)]">
                                    <User className="text-[var(--color-primary)]" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-[var(--color-text-secondary)] font-bold">Barbeiro</div>
                                        <div className="font-bold text-white uppercase">{barbersMap[selectedItem.barberId] || 'Desconhecido'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-[var(--color-dark-bg)] rounded-xl border border-[var(--color-border)]">
                                    <Calendar className="text-[var(--color-primary)]" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-[var(--color-text-secondary)] font-bold">Data & Hora</div>
                                        <div className="font-bold text-white uppercase">{selectedItem.displayDate} - {selectedItem.displayTime}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-[var(--color-dark-bg)] rounded-xl border border-[var(--color-border)]">
                                    <CreditCard className="text-[var(--color-primary)]" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-[var(--color-text-secondary)] font-bold">Pagamento</div>
                                        <div className="font-bold text-white uppercase">{selectedItem.method}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Services List */}
                            <div>
                                <h4 className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                                    <Scissors size={14} /> Serviços Realizados
                                </h4>
                                <ul className="space-y-2">
                                    {selectedItem.serviceIds.map((id, index) => (
                                        <li key={index} className="flex items-center justify-between p-2 border-b border-[var(--color-border)] last:border-0">
                                            <span className="text-white font-medium">{servicesMap[id] || 'Serviço Removido'}</span>
                                            <Check size={16} className="text-[var(--color-primary)]" />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
// Helper for check icon in modal
function Check({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
}
