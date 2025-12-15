import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Plus, User } from 'lucide-react';
import { getBarbers, addBarber, deleteBarber } from '../../services/db';

export default function Barbers() {
    const [barbers, setBarbers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBarbers();
    }, []);

    async function loadBarbers() {
        try {
            const data = await getBarbers();
            setBarbers(data);
        } catch (error) {
            console.error("Error loading barbers:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        if (!formData.name || !formData.email) return;

        try {
            const id = await addBarber({
                name: formData.name,
                email: formData.email
            });
            setBarbers([...barbers, { id, ...formData, role: 'barber' }]);
            setIsEditing(false);
            setFormData({ name: '', email: '' });
        } catch (error) {
            console.error("Error adding barber:", error);
            alert("Erro ao adicionar barbeiro.");
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza?')) {
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
                <Button className="w-auto p-2" onClick={() => setIsEditing(true)}>
                    <Plus size={20} />
                </Button>
            </div>

            {isEditing && (
                <Card className="mb-6 border-[var(--color-primary)]">
                    <h2 className="font-bold mb-4">Novo Barbeiro</h2>
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
                        />
                        <div className="flex gap-2 mt-2">
                            <Button onClick={handleSave}>Salvar</Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex flex-col gap-3">
                {barbers.length === 0 && <div className="text-sm text-gray-500">Nenhum barbeiro cadastrado.</div>}
                {barbers.map(barber => (
                    <Card key={barber.id} className="flex items-center gap-3">
                        <div className="bg-[var(--color-dark-bg)] p-3 rounded-full">
                            <User size={20} className="text-[var(--color-primary)]" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold">{barber.name}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{barber.email}</div>
                        </div>
                        <button
                            className="p-2 text-[var(--color-error)] hover:opacity-80"
                            onClick={() => handleDelete(barber.id)}
                        >
                            <Trash2 size={18} />
                        </button>
                    </Card>
                ))}
            </div>
        </Layout>
    );
}
