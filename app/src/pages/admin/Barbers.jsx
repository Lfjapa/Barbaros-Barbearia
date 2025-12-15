import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Plus, User, Pencil, Check } from 'lucide-react';
import { getBarbers, addBarber, updateBarber, deleteBarber } from '../../services/db';

export default function Barbers() {
    const [barbers, setBarbers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', isActive: true });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBarbers();
    }, []);

    async function loadBarbers() {
        try {
            const data = await getBarbers();
            // Sort: Active first, then by name
            data.sort((a, b) => {
                if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
                return b.isActive ? 1 : -1; // Active first (if b is active and a is not, b comes first? Wait. true > false = 1. So inactive (false) - active (true) = -1. )
                // Actually: true (1) > false (0). b.isActive - a.isActive sorts desc (Active first). 
                // Let's keep it simple:
                // if a is active and b is not, a comes first (-1).
            });
            setBarbers(data);
        } catch (error) {
            console.error("Error loading barbers:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = (barber) => {
        setEditingId(barber.id);
        setFormData({
            name: barber.name || '',
            email: barber.email || '',
            isActive: barber.isActive !== false // Default true if undefined
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({ name: '', email: '', isActive: true });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email) return;

        try {
            if (editingId) {
                // Update existing
                await updateBarber(editingId, {
                    name: formData.name,
                    isActive: formData.isActive
                    // Email usually isn't editable for auth reasons, but we can update the display if needed. 
                    // Let's update it here since auth is loose.
                });

                setBarbers(prev => prev.map(b =>
                    b.id === editingId ? { ...b, ...formData } : b
                ));
            } else {
                // Create new
                const id = await addBarber({
                    name: formData.name,
                    email: formData.email,
                    isActive: formData.isActive
                });
                setBarbers([...barbers, { id, ...formData, role: 'barber' }]);
            }

            handleCancel();
            loadBarbers(); // Reload to re-sort
        } catch (error) {
            console.error("Error saving barber:", error);
            alert("Erro ao salvar dados.");
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza? Isso removerá o acesso deste usuário.')) {
            try {
                await deleteBarber(id);
                setBarbers(prev => prev.filter(b => b.id !== id));
            } catch (error) {
                console.error("Error deleting barber:", error);
                alert("Erro ao remover barbeiro.");
            }
        }
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <Layout role="admin">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-[var(--color-primary)]">Equipe</h1>
                <Button className="w-auto p-2" onClick={() => { handleCancel(); setIsEditing(true); }}>
                    <Plus size={20} />
                </Button>
            </div>

            {isEditing && (
                <Card className="mb-6 border-[var(--color-primary)]">
                    <h2 className="font-bold mb-4">{editingId ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h2>
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Nome"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            disabled={!!editingId} // Disable email edit for simplicity on update to avoid auth mismatch issues
                        />

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-400">Status:</label>
                            <button
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`
                                    px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border
                                    ${formData.isActive
                                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                        : 'bg-red-500/20 text-red-400 border-red-500/50'
                                    }
                                `}
                            >
                                {formData.isActive ? 'Ativo' : 'Inativo'}
                            </button>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleSave}>Salvar</Button>
                            <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex flex-col gap-3">
                {barbers.length === 0 && <div className="text-sm text-gray-500">Nenhum barbeiro cadastrado.</div>}
                {barbers.map(barber => {
                    const isActive = barber.isActive !== false;
                    return (
                        <Card key={barber.id} className={`flex items-center gap-3 ${!isActive ? 'opacity-50 grayscale' : ''}`}>
                            <div className="bg-[var(--color-dark-bg)] p-3 rounded-full relative">
                                <User size={20} className="text-[var(--color-primary)]" />
                                {!isActive && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold flex items-center gap-2">
                                    {barber.name}
                                    {!isActive && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">INATIVO</span>}
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)]">{barber.email}</div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    className="p-2 text-[var(--color-text-secondary)] hover:text-white transition-colors"
                                    onClick={() => handleEdit(barber)}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    className="p-2 text-[var(--color-error)] hover:opacity-80 transition-colors"
                                    onClick={() => handleDelete(barber.id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </Layout>
    );
}
