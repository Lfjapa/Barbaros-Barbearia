import { useState, useEffect } from 'react';
import { X, Save, Check, Scissors, User, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';
import { getServices, getBarbers, updateTransaction } from '../services/db';
import { toast } from 'sonner';

export default function EditTransactionModal({ transaction, isOpen, onClose, onUpdate, services, barbers }) {
    const [loading, setLoading] = useState(false);
    const [servicesList, setServicesList] = useState([]);
    const [barbersList, setBarbersList] = useState([]);
    
    // Form State
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [currentTotal, setCurrentTotal] = useState(0);

    // Load Data
    useEffect(() => {
        async function loadData() {
            try {
                let s = services;
                let b = barbers;

                // If not provided via props, fetch them
                if (!s || !b) {
                     [s, b] = await Promise.all([getServices(), getBarbers()]);
                }
                
                // Ensure prices are numbers
                setServicesList(s.map(i => ({...i, price: Number(i.price)})));
                setBarbersList(b.filter(barber => barber.isActive !== false));
            } catch (e) {
                console.error(e);
                toast.error("Erro ao carregar dados");
            }
        }
        if (isOpen) loadData();
    }, [isOpen, services, barbers]);

    // Initialize state from transaction
    useEffect(() => {
        if (transaction) {
            setSelectedBarber(transaction.barberId);
            setSelectedServices(transaction.serviceIds || []);
            setPaymentMethod(transaction.method);
            setCurrentTotal(transaction.total);
        }
    }, [transaction]);

    // Recalculate Total when services change (only if we have services list loaded)
    useEffect(() => {
        if (servicesList.length > 0 && selectedServices.length > 0) {
            // Check if selected services match original to avoid price jump if prices changed?
            // Actually, if we are editing, we probably want current prices.
            // But if user didn't touch services, maybe we shouldn't touch total?
            // The issue is determining "did user touch services?".
            // For simplicity and consistency: Total always equals sum of services prices.
            
            const newTotal = servicesList
                .filter(s => selectedServices.includes(s.id))
                .reduce((acc, curr) => acc + curr.price, 0);
            
            setCurrentTotal(newTotal);
        }
    }, [selectedServices, servicesList]);

    const toggleService = (id) => {
        setSelectedServices(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!selectedBarber || selectedServices.length === 0) {
            toast.warning("Selecione barbeiro e serviços");
            return;
        }

        setLoading(true);
        try {
            // Calculate commission based on selected services
            const selectedServicesData = servicesList.filter(s => selectedServices.includes(s.id));
            
            const commissionAmount = selectedServicesData.reduce((acc, service) => {
                const rate = (service.commission !== undefined ? Number(service.commission) : 40) / 100;
                return acc + (service.price * rate);
            }, 0);
            
            const revenueAmount = currentTotal - commissionAmount;

            await updateTransaction(transaction.id, {
                barberId: selectedBarber,
                serviceIds: selectedServices,
                method: paymentMethod,
                total: currentTotal,
                commissionAmount,
                revenueAmount
            });
            
            toast.success("Venda atualizada com sucesso!");
            onUpdate(); // Trigger refresh in parent
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar venda");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={onClose}>
            <div 
                className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                
                {/* Header */}
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-dark-surface)] shrink-0 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Scissors className="text-[var(--color-primary)]" />
                        Editar Venda
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-4 overflow-y-auto custom-scrollbar">
                    <div className="space-y-5">
                        
                        {/* Barber Selection */}
                        <div>
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Profissional</label>
                            <div className="grid grid-cols-2 gap-2">
                                {barbersList.map(barber => (
                                    <button
                                        key={barber.id}
                                        onClick={() => setSelectedBarber(barber.id)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left truncate
                                            ${selectedBarber === barber.id
                                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black font-bold'
                                                : 'bg-[var(--color-dark-bg)] border-[var(--color-border)] text-gray-300 hover:border-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {barber.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Services Selection */}
                        <div>
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Serviços</label>
                            <div className="space-y-2">
                                {servicesList.map(service => {
                                    const isSelected = selectedServices.includes(service.id);
                                    return (
                                        <button
                                            key={service.id}
                                            onClick={() => toggleService(service.id)}
                                            className={`w-full p-3 rounded-xl border transition-all flex justify-between items-center group
                                                ${isSelected
                                                    ? 'bg-zinc-800 border-[var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)]'
                                                    : 'bg-[var(--color-dark-bg)] border-[var(--color-border)] hover:border-gray-500'
                                                }`}
                                        >
                                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{service.name}</span>
                                            <span className={`font-bold ${isSelected ? 'text-[var(--color-primary)]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Pagamento</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['dinheiro', 'pix', 'cartao'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all
                                            ${paymentMethod === method
                                                ? 'bg-white text-black border-white'
                                                : 'bg-[var(--color-dark-bg)] border-[var(--color-border)] text-gray-300 hover:border-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom of modal */}
                <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-dark-surface)] shrink-0 rounded-b-2xl">
                    <div className="flex flex-col items-start">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Atualizado</span>
                        <span className="text-3xl font-black text-emerald-400">
                            {currentTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="w-full sm:w-auto h-12 px-8 text-base font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
