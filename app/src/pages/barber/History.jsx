import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactionsByRange, getServices, getBarbers } from '../../services/db';
import { X, User, Calendar, CreditCard, Scissors, ChevronLeft, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function History() {
    const { currentUser, userRole } = useAuth();
    const [history, setHistory] = useState([]);
    const [servicesMap, setServicesMap] = useState({});
    const [barbersMap, setBarbersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filterIds, setFilterIds] = useState(null);
    const [exporting, setExporting] = useState(false);

    // Reset pagination when date changes
    useEffect(() => {
        setHistory([]);
        setLastDoc(null);
        setHasMore(true);
        fetchData(true); // true = reset
    }, [selectedDate, currentUser]);

    async function fetchData(isReset = false) {
        if (!currentUser) return;
        
        if (isReset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            let idsToUse = isReset ? null : filterIds;

            // 1. Logic to resolve filter IDs (only runs on reset/initial load)
            if (isReset) {
                // Fetch metadata if needed
                let currentServices = servicesMap;
                let currentBarbers = barbersMap;

                // Always fetch metadata on reset to ensure fresh data for filters
                const [servicesData, barbersData] = await Promise.all([
                    getServices(),
                    getBarbers()
                ]);

                const sMap = {};
                servicesData.forEach(s => sMap[s.id] = s.name);
                setServicesMap(sMap);
                currentServices = sMap;

                const bMap = {};
                barbersData.forEach(b => bMap[b.id] = b.name);
                setBarbersMap(bMap);
                currentBarbers = bMap;

                // Determine Filter IDs
                if (userRole === 'barber') {
                    const myIds = new Set([currentUser.uid]);
                    const normalize = (str) => str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
                    const myEmail = normalize(currentUser.email);
                    const myNameRaw = normalize(currentUser.displayName);
                    const myNameParts = myNameRaw.split(/\s+/).filter(part => part.length > 2);

                    barbersData.forEach(b => {
                        const bEmail = normalize(b.email);
                        if (bEmail && bEmail === myEmail) myIds.add(b.id);

                        const bName = normalize(b.name);
                        const bNameParts = bName.split(/\s+/).filter(part => part.length > 2);
                        if (myNameParts.length > 0 && bNameParts.length > 0) {
                            const matches = myNameParts.filter(part => bNameParts.includes(part));
                            if (matches.length >= 2) myIds.add(b.id);
                            else if (bName === myNameRaw && bName.length > 3) myIds.add(b.id);
                        }
                    });
                    idsToUse = Array.from(myIds);
                    setFilterIds(idsToUse);
                } else {
                    idsToUse = null; // Admin sees all
                    setFilterIds(null);
                }
            }

            // 2. Fetch Transactions
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

            const result = await getTransactionsByRange(
                startOfMonth, 
                endOfMonth, 
                idsToUse, 
                isReset ? null : lastDoc, 
                20 // Limit per page
            );

            // 3. Format
            const formattedNewItems = result.data.map(item => {
                const d = item.date.seconds ? new Date(item.date.seconds * 1000) : new Date(item.date);
                return {
                    ...item,
                    displayDate: d.toLocaleDateString('pt-BR'),
                    displayTime: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    rawDate: d
                };
            });

            if (isReset) {
                setHistory(formattedNewItems);
            } else {
                setHistory(prev => [...prev, ...formattedNewItems]);
            }

            setLastDoc(result.lastVisible);
            setHasMore(!!result.lastVisible); // If lastVisible is null/undefined, no more pages

        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const changeMonth = (offset) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
            
            const result = await getTransactionsByRange(startOfMonth, endOfMonth, filterIds);
            const data = result.data;
            
            const headers = ["Data", "Hora", "Barbeiro", "Serviços", "Valor Total", "Método", "Comissão %", "Comissão R$", "Lucro Casa"];
            const csvRows = [headers.join(";")];
            
            for (const row of data) {
                const dateObj = row.date.seconds ? new Date(row.date.seconds * 1000) : new Date(row.date);
                const dateStr = dateObj.toLocaleDateString('pt-BR');
                const timeStr = dateObj.toLocaleTimeString('pt-BR');
                const barberName = barbersMap[row.barberId] || "Desconhecido";
                
                const serviceNames = (row.serviceIds || []).map(id => servicesMap[id] || id).join(", ");
                
                const commissionRate = row.commissionRate || 0.40;
                const commissionAmount = row.commissionAmount || (row.total * commissionRate);
                const houseAmount = row.revenueAmount || (row.total - commissionAmount);
                
                const values = [
                    dateStr,
                    timeStr,
                    barberName,
                    serviceNames,
                    row.total.toFixed(2).replace('.', ','),
                    row.method,
                    (commissionRate * 100).toFixed(0) + '%',
                    commissionAmount.toFixed(2).replace('.', ','),
                    houseAmount.toFixed(2).replace('.', ',')
                ];
                csvRows.push(values.join(";"));
            }
            
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `faturamento_${selectedDate.getMonth()+1}_${selectedDate.getFullYear()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setExporting(false);
        }
    };

    // Calculate totals for the VIEWED list
    const monthTotal = history.reduce((acc, curr) => acc + curr.total, 0);
    // Use stored commissionRate if available, otherwise fallback to 0.40
    const commissionTotal = history.reduce((acc, curr) => {
        const rate = curr.commissionRate !== undefined ? curr.commissionRate : 0.40;
        return acc + (curr.total * rate);
    }, 0);

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

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleExport}
                        disabled={exporting}
                        className="h-10 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-dark-bg)] text-white text-xs uppercase font-bold tracking-wider flex items-center gap-2"
                    >
                        {exporting ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            <>
                                <Download size={16} />
                                <span className="hidden sm:inline">Exportar</span>
                            </>
                        )}
                    </Button>

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
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="p-4 flex flex-col items-center justify-center border-t-4 border-t-emerald-500">
                    <span className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">Total Exibido</span>
                    <span className="text-2xl font-black text-emerald-400">
                        {monthTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </Card>
                {userRole === 'barber' && (
                    <Card className="p-4 flex flex-col items-center justify-center border-t-4 border-t-blue-500">
                        <span className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-1">Comissão Exibida</span>
                        <span className="text-2xl font-black text-blue-400">
                            {commissionTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </Card>
                )}
            </div>

            {/* List */}
            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Nenhum registro encontrado neste período.</div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer">
                            <Card className="p-4 hover:border-[var(--color-primary)] transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex gap-3">
                                        <div className="bg-[var(--color-dark-bg)] p-2 rounded-lg h-fit group-hover:bg-[var(--color-primary)] group-hover:text-black transition-colors">
                                            <Scissors size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white flex items-center gap-2">
                                                {item.serviceIds.map(id => servicesMap[id]).join(', ')}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                                                <span className="flex items-center gap-1"><User size={12}/> {barbersMap[item.barberId] || 'Desconhecido'}</span>
                                                <span className="flex items-center gap-1"><CreditCard size={12}/> {item.method.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-400 text-lg">
                                            {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 font-mono">
                                            {item.displayDate} - {item.displayTime}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="mt-6 flex justify-center">
                    <Button 
                        onClick={() => fetchData(false)} 
                        disabled={loadingMore}
                        className="bg-[var(--color-dark-surface)] hover:bg-[var(--color-dark-bg)] text-white border border-[var(--color-border)] w-full md:w-auto min-w-[200px]"
                    >
                        {loadingMore ? (
                            <span className="animate-pulse">Carregando...</span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <ChevronDown size={16} />
                                Carregar Mais
                            </div>
                        )}
                    </Button>
                </div>
            )}

            {/* Modal Detail */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Detalhes da Venda</h2>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Data</span>
                                <span className="font-mono text-white">{selectedItem.displayDate} às {selectedItem.displayTime}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Serviços</span>
                                <span className="text-white text-right max-w-[60%]">{selectedItem.serviceIds.map(id => servicesMap[id]).join(', ')}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Profissional</span>
                                <span className="text-white">{barbersMap[selectedItem.barberId]}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Pagamento</span>
                                <span className="text-white uppercase font-bold text-xs bg-white/10 px-2 py-1 rounded">{selectedItem.method}</span>
                            </div>
                            
                            <div className="mt-8 pt-4 border-t border-dashed border-white/20">
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-400">Valor Total</span>
                                    <span className="text-3xl font-black text-emerald-400">
                                        {selectedItem.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}