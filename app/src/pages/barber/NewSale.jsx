import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { getServices, getBarbers, addTransaction } from '../../services/db';

const DEFAULT_SERVICES = [
    { id: 'default_1', name: 'Corte de Cabelo', price: 0 },
    { id: 'default_2', name: 'Barba', price: 0 },
    { id: 'default_3', name: 'Pezinho', price: 0 },
    { id: 'default_4', name: 'Sobrancelha', price: 0 },
];

export default function NewSale() {
    const { currentUser } = useAuth();
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [loading, setLoading] = useState(true);
    const [customTotal, setCustomTotal] = useState(''); // Start empty

    useEffect(() => {
        async function fetchData() {
            try {
                const [barbersData, servicesData] = await Promise.all([
                    getBarbers(),
                    getServices()
                ]);
                setBarbers(barbersData);

                // Always add the default static services if they don't exist, 
                // but user asked for these specific ones. 
                // Let's merge or just ensure defaults are available.
                // For now, if DB services have price, use them, otherwise defaults.
                if (servicesData.length === 0) {
                    setServices(DEFAULT_SERVICES);
                } else {
                    setServices(servicesData);
                }

                // Auto-select current user if they are a barber
                if (currentUser && barbersData.find(b => b.id === currentUser.uid)) {
                    setSelectedBarber(currentUser.uid);
                } else if (barbersData.length > 0) {
                    setSelectedBarber(barbersData[0].id);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [currentUser]);

    // Removed auto-calculation effect to respect "nao quero valores pre definidos"
    // The user MUST type the value manually.


    const toggleService = (serviceId) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSubmit = async () => {
        if (!selectedBarber || selectedServices.length === 0) return;

        const finalTotal = parseFloat(customTotal.replace(',', '.'));

        try {
            await addTransaction({
                barberId: selectedBarber,
                serviceIds: selectedServices,
                total: finalTotal,
                method: paymentMethod,
                registeredBy: currentUser ? currentUser.uid : 'unknown'
            });
            alert("Venda Registrada com Sucesso!");
            setSelectedServices([]);
            setCustomTotal('');
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Erro ao registrar venda.");
        }
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <Layout role="barber">
            <h1 className="text-xl font-bold mb-6 text-[var(--color-primary)]">Novo Serviço</h1>

            {/* 1. Quem Atendeu? */}
            <Card className="mb-6 border-l-4 border-l-[var(--color-primary)]">
                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Quem Atendeu?</label>
                {barbers.length === 0 ? (
                    <div className="p-3 bg-[var(--color-background)] rounded text-sm text-[var(--color-error)] border border-[var(--color-error)]">
                        ⚠ Nenhum barbeiro encontrado.
                        {currentUser?.email === 'admin@barbaros.com' && ' Cadastre no Painel Admin.'}
                    </div>
                ) : (
                    <select
                        className="w-full bg-[var(--color-background)] text-white p-4 rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-lg appearance-none"
                        value={selectedBarber}
                        onChange={(e) => setSelectedBarber(e.target.value)}
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="" disabled>Selecione um barbeiro...</option>
                        {barbers.map(b => <option key={b.id} value={b.id}>{b.name || b.email}</option>)}
                    </select>
                )}
            </Card>

            {/* 2. O que foi feito? */}
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary)] rounded-full"></span>
                Serviços Realizados
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
                {services.map(service => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                        <div
                            key={service.id}
                            onClick={() => toggleService(service.id)}
                            className={`
                                cursor-pointer relative p-4 rounded-xl border-2 text-center transition-all duration-200 select-none
                                ${isSelected
                                    ? 'bg-[var(--color-primary)] text-[var(--color-dark-bg)] border-[var(--color-primary)] shadow-lg shadow-yellow-500/20 transform scale-105 font-bold'
                                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-gray-300 hover:border-[var(--color-text-secondary)] hover:bg-[var(--color-dark-surface)]'
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                            )}
                            <div className="text-lg mb-1">{service.name}</div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Forma de Pagamento */}
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-[var(--color-primary)] rounded-full"></span>
                Pagamento
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                    { id: 'pix', label: 'Pix' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                    { id: 'credito', label: 'Crédito' },
                    { id: 'debito', label: 'Débito' }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`
                            py-3 uppercase tracking-wider font-bold rounded-xl border-2 transition-all duration-200
                            ${paymentMethod === opt.id
                                ? 'bg-white text-black border-white shadow-lg transform -translate-y-1'
                                : 'bg-transparent text-gray-400 border-[var(--color-border)] hover:border-gray-500'
                            }
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* 4. Total e Confirmar */}
            <div className="fixed bottom-16 left-0 w-full bg-[var(--color-dark-surface)] p-4 border-t border-[var(--color-border)]">
                <div className="max-w-[480px] mx-auto flex gap-4 items-center">
                    <div className="flex-1">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase font-bold mb-1">Valor Total (R$)</div>
                        <input
                            type="number"
                            step="0.01"
                            value={customTotal}
                            onChange={(e) => setCustomTotal(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold text-[var(--color-primary)] border-b border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none placeholder-gray-700"
                            placeholder="0.00"
                        />
                    </div>
                    <Button
                        className="w-auto px-8"
                        onClick={handleSubmit}
                        disabled={!customTotal || selectedServices.length === 0 || !selectedBarber}
                    >
                        CONFIRMAR
                    </Button>
                </div>
            </div>

        </Layout>
    );
}

