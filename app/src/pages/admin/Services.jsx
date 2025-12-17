import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Edit2, Plus, Pencil } from 'lucide-react';
import { getServices, addService, deleteService, updateService } from '../../services/db';

export default function Services() {
    const [services, setServices] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', commission: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadServices();
    }, []);

    const DEFAULT_SERVICES = [
        { name: 'Corte de Cabelo', price: 30, commission: 40 },
        { name: 'Barba', price: 20, commission: 40 },
        { name: 'Pezinho', price: 10, commission: 40 },
        { name: 'Sobrancelha', price: 15, commission: 40 },
    ];

    async function loadServices() {
        try {
            let data = await getServices();

            if (data.length === 0) {
                // Auto-seed defaults
                await Promise.all(DEFAULT_SERVICES.map(s => addService(s)));
                data = await getServices(); // Fetch again
            }

            setServices(data);
        } catch (error) {
            console.error("Error loading services:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Tem certeza?')) {
            try {
                await deleteService(id);
                setServices(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                console.error("Error deleting service:", error);
                alert("Erro ao remover serviço.");
            }
        }
    };

    const handleEdit = (service) => {
        setEditingId(service.id);
        setFormData({
            name: service.name,
            price: service.price,
            commission: service.commission
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ name: '', price: '', commission: '' });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.commission) return;

        try {
            const serviceData = {
                name: formData.name,
                price: Number(formData.price),
                commission: Number(formData.commission)
            };

            if (editingId) {
                // Update existing
                await updateService(editingId, serviceData);
                setServices(prev => prev.map(s => 
                    s.id === editingId ? { ...s, ...serviceData } : s
                ));
            } else {
                // Create new
                const id = await addService(serviceData);
                setServices([...services, { id, ...serviceData }]);
            }

            handleCancel();
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Erro ao salvar serviço.");
        }
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <Layout role="admin">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-[var(--color-primary)]">Serviços</h1>
                <Button
                    className="w-auto p-2"
                    onClick={() => { handleCancel(); setIsEditing(true); }}
                >
                    <Plus size={20} />
                </Button>
            </div>

            {isEditing && (
                <Card className="mb-6 border-[var(--color-primary)]">
                    <h2 className="font-bold mb-4">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Nome"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <div className="flex gap-4">
                            <Input
                                label="Preço (R$)"
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                            <Input
                                label="Comissão (%)"
                                type="number"
                                value={formData.commission}
                                onChange={e => setFormData({ ...formData, commission: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button onClick={handleSave}>Salvar</Button>
                            <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.length === 0 && <div className="col-span-full text-sm text-gray-500">Nenhum serviço cadastrado.</div>}
                {services.map(service => (
                    <Card key={service.id} className="flex justify-between items-center">
                        <div>
                            <div className="font-bold">{service.name}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                                R$ {service.price.toFixed(2)} • {service.commission}% Com.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="p-2 text-[var(--color-text-secondary)] hover:text-white"
                                onClick={() => handleEdit(service)}
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                className="p-2 text-[var(--color-error)] hover:opacity-80"
                                onClick={() => handleDelete(service.id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </Layout>
    );
}
