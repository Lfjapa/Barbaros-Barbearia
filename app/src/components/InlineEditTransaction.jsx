import { useState, useEffect } from 'react';
import { X, Save, Scissors, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { getServices, getBarbers, updateTransaction, deleteTransaction } from '../services/db';
import { toast } from 'sonner';

export default function InlineEditTransaction({ transaction, onCancel, onUpdate, services, barbers }) {
    const [loading, setLoading] = useState(false);
    const [servicesList, setServicesList] = useState([]);
    const [barbersList, setBarbersList] = useState([]);
    
    // Form State
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [currentTotal, setCurrentTotal] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

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
        loadData();
    }, [services, barbers]);

    // Initialize state from transaction
    useEffect(() => {
        if (transaction) {
            setSelectedBarber(transaction.barberId);
            setSelectedServices(transaction.serviceIds || []);
            setPaymentMethod(transaction.method);
            setCurrentTotal(transaction.total);
        }
    }, [transaction]);

    // Recalculate Total when services change
    useEffect(() => {
        if (servicesList.length > 0 && selectedServices.length > 0) {
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
                let rate = 40; // Default
                if (service.commission !== undefined && service.commission !== null && service.commission !== '') {
                    const commString = String(service.commission).replace(',', '.');
                    const parsed = parseFloat(commString);
                    if (!isNaN(parsed)) {
                        rate = parsed;
                    }
                }
                return acc + (service.price * (rate / 100));
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
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar venda");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteTransaction(transaction.id);
            toast.success("Venda excluída com sucesso!");
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir venda");
        } finally {
            setLoading(false);
            setIsDeleting(false);
        }
    };

    return (
        <div className="mt-2 bg-[var(--color-surface)] border border-[var(--color-primary)] rounded-xl overflow-hidden animate-in slide-in-from-top-2 shadow-2xl">
            {/* Header */}
            <div className="p-3 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-dark-surface)]">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scissors size={16} className="text-[var(--color-primary)]" />
                    Editar Venda
                </h2>
                <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <div className="p-4 space-y-5">
                {/* Barber Selection */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Profissional</label>
                    <div className="grid grid-cols-2 gap-2">
                        {barbersList.map(barber => (
                            <button
                                key={barber.id}
                                onClick={() => setSelectedBarber(barber.id)}
                                className={`p-2 rounded-lg border text-xs font-bold transition-all text-left truncate
                                    ${selectedBarber === barber.id
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black'
                                        : 'bg-white border-white text-zinc-800 hover:bg-gray-100'
                                    }`}
                            >
                                {barber.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Services Selection */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Serviços</label>
                    <div className="space-y-2">
                        {servicesList.map(service => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                                <button
                                    key={service.id}
                                    onClick={() => toggleService(service.id)}
                                    className={`w-full p-2.5 rounded-lg border transition-all flex justify-between items-center group text-xs
                                        ${isSelected
                                            ? 'bg-zinc-800 border-[var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)]'
                                            : 'bg-zinc-900 border-white/10 hover:border-gray-500'
                                        }`}
                                >
                                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-100'}`}>{service.name}</span>
                                    <span className={`font-bold ${isSelected ? 'text-[var(--color-primary)]' : 'text-gray-300'}`}>
                                        {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['dinheiro', 'pix', 'debito', 'credito'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all
                                    ${paymentMethod === method
                                        ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)]'
                                        : 'bg-white text-zinc-800 border-white hover:bg-gray-100'
                                    }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-dark-surface)]">
                {isDeleting ? (
                    <div className="flex flex-col gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2 text-[var(--color-error)] bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertTriangle size={18} />
                            <span className="text-xs font-bold">Tem certeza que deseja excluir?</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                variant="outline"
                                onClick={() => setIsDeleting(false)}
                                className="h-10 text-xs font-bold uppercase tracking-wider border-[var(--color-border)] text-white hover:bg-[var(--color-dark-bg)]"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleDelete} 
                                disabled={loading}
                                className="h-10 text-xs font-bold uppercase tracking-wider bg-[var(--color-error)] hover:bg-red-600 text-white border-none"
                            >
                                {loading ? '...' : 'Confirmar Exclusão'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total</span>
                            <span className="text-2xl font-black text-emerald-400">
                                {currentTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>

                        <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleting(true)}
                                className="h-10 px-3 text-[var(--color-error)] border-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors"
                                title="Excluir Venda"
                            >
                                <Trash2 size={16} />
                            </Button>
                            
                            <Button 
                                variant="outline"
                                onClick={onCancel}
                                className="h-10 text-xs font-bold uppercase tracking-wider border-[var(--color-border)] text-zinc-300 hover:bg-white hover:text-black"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={loading}
                                className="h-10 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white"
                            >
                                {loading ? '...' : 'Salvar'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}