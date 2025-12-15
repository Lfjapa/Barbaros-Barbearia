import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { getServices, getBarbers, addTransaction } from '../../services/db';
import { Check, Scissors, User } from 'lucide-react';

// Updated defaults with prices for the auto-calc feature
const DEFAULT_SERVICES = [
    { id: 'default_1', name: 'Corte de Cabelo', price: 30 },
    { id: 'default_2', name: 'Barba', price: 20 },
    { id: 'default_3', name: 'Pezinho', price: 10 },
    { id: 'default_4', name: 'Sobrancelha', price: 15 },
];


export default function NewSale() {
    const { currentUser } = useAuth();
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedServices, setSelectedServices] = useState([]); // Array of IDs
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [servicesData, barbersData] = await Promise.all([
                    getServices(),
                    getBarbers()
                ]);

                if (servicesData.length === 0) {
                    setServices(DEFAULT_SERVICES);
                } else {
                    // Ensure prices are numbers
                    setServices(servicesData.map(s => ({ ...s, price: Number(s.price) || 0 })));
                }

                setBarbers(barbersData.filter(b => b.isActive !== false));

            } catch (error) {
                console.error("Error fetching data:", error);
                setServices(DEFAULT_SERVICES);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleService = (serviceId) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    // Calculate Dynamic Total
    const totalValue = services
        .filter(s => selectedServices.includes(s.id))
        .reduce((acc, curr) => acc + curr.price, 0);

    const handleSubmit = async () => {
        if (!selectedBarber || selectedServices.length === 0) return;

        try {
            await addTransaction({
                barberId: selectedBarber,
                serviceIds: selectedServices,
                total: totalValue,
                method: paymentMethod,
                registeredBy: currentUser ? currentUser.uid : 'unknown'
            });
            alert("Venda Registrada com Sucesso!");
            setSelectedServices([]);
            setSelectedBarber('');
            setPaymentMethod('pix');
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Erro ao registrar venda.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] text-[var(--color-primary)]">
            <div className="animate-pulse text-xl font-bold">Carregando...</div>
        </div>
    );

    return (
        <Layout role="barber">
            <div className="max-w-lg mx-auto pb-20"> {/* Extra padding for scroll */}
                <div className="space-y-8">

                    {/* 1. SEÇÃO: PROFISSIONAL */}
                    <section>
                        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4 border-l-4 border-[var(--color-primary)] pl-3">
                            1. Profissional
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {barbers.length === 0 && (
                                <div className="col-span-2 text-gray-500 text-sm text-center py-4">Nenhum barbeiro encontrado.</div>
                            )}
                            {barbers.map((barber) => {
                                const isSelected = selectedBarber === barber.id;
                                const initial = barber.name ? barber.name.charAt(0).toUpperCase() : '?';
                                return (
                                    <button
                                        key={barber.id}
                                        onClick={() => setSelectedBarber(barber.id)}
                                        className={`
                                            relative h-28 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 group
                                            ${isSelected
                                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.02]'
                                                : 'bg-[var(--color-dark-surface)] border-[var(--color-border)] text-gray-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-2 transition-colors
                                            ${isSelected ? 'border-black text-black' : 'border-[var(--color-primary)] text-[var(--color-primary)]'}
                                        `}>
                                            {initial}
                                        </div>
                                        <span className="text-lg font-bold uppercase tracking-wide">{barber.name}</span>

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-3 right-3">
                                                <Check size={16} strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* 2. SEÇÃO: SERVIÇOS */}
                    <section>
                        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4 border-l-4 border-[var(--color-primary)] pl-3">
                            2. Serviços
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {services.map(service => {
                                const isSelected = selectedServices.includes(service.id);
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => toggleService(service.id)}
                                        className={`
                                            relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                            ${isSelected
                                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black shadow-md'
                                                : 'bg-[var(--color-dark-surface)] border-[var(--color-border)] text-gray-300 hover:border-gray-500'
                                            }
                                        `}
                                    >
                                        <span className={`text-sm font-bold uppercase ${isSelected ? 'text-black' : 'text-gray-200'}`}>
                                            {service.name}
                                        </span>

                                        {/* Visual Checkbox */}
                                        <div className={`
                                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                            ${isSelected ? 'border-black bg-black text-[var(--color-primary)]' : 'border-gray-600'}
                                        `}>
                                            {isSelected && <Check size={14} strokeWidth={4} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* 3. SEÇÃO: PAGAMENTO */}
                    <section>
                        <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4 border-l-4 border-[var(--color-primary)] pl-3">
                            3. Pagamento
                        </h2>
                        <div className="grid grid-cols-4 gap-2">
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
                                        py-3 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide border-2 transition-all duration-200
                                        ${paymentMethod === opt.id
                                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black shadow-lg'
                                            : 'bg-[var(--color-dark-surface)] border-[var(--color-border)] text-gray-300 hover:border-gray-500'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 4. SEÇÃO: TOTAL & CONFIRMAR */}
                    <section className="bg-[var(--color-dark-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-2xl">
                        <label className="block text-xs font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mb-4 text-center">
                            Valor Total do Serviço
                        </label>

                        <div className="flex justify-center items-baseline gap-2 mb-8">
                            <span className="text-xl text-[var(--color-primary)] font-bold opacity-80">R$</span>
                            <span className="text-6xl font-black text-[var(--color-primary)] tracking-tighter">
                                {totalValue.toFixed(2)}
                            </span>
                        </div>

                        <Button
                            className={`
                                w-full h-16 text-lg font-black uppercase tracking-widest rounded-xl transition-all duration-300
                                ${(!selectedBarber || selectedServices.length === 0)
                                    ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500 border border-gray-700'
                                    : 'bg-[var(--color-primary)] text-black hover:brightness-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transform hover:-translate-y-1'
                                }
                            `}
                            onClick={handleSubmit}
                            disabled={!selectedBarber || selectedServices.length === 0}
                        >
                            Confirmar Venda
                        </Button>
                    </section>
                </div>
            </div>
        </Layout>
    );
}
