import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getSystemSettings, saveSystemSettings } from '../../services/db';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Percent } from 'lucide-react';

export default function Settings() {
    const [commissionRate, setCommissionRate] = useState(40); // Display as percentage (0-100)
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const settings = await getSystemSettings();
            if (settings && settings.commissionRate) {
                setCommissionRate(settings.commissionRate * 100);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("Erro ao carregar configurações.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const rateDecimal = commissionRate / 100;
            if (rateDecimal < 0 || rateDecimal > 1) {
                toast.error("A taxa deve estar entre 0% e 100%");
                return;
            }

            await saveSystemSettings({
                commissionRate: rateDecimal
            });
            toast.success("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Layout role="admin">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-[var(--color-dark-surface)] rounded-xl border border-[var(--color-primary)]">
                        <SettingsIcon size={24} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Configurações
                        </h1>
                        <p className="text-[var(--color-text-secondary)] text-sm">
                            Gerencie os parâmetros globais do sistema
                        </p>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Percent size={20} className="text-[var(--color-primary)]" />
                            Comissões
                        </h2>
                        <div className="bg-[var(--color-dark-bg)] p-4 rounded-xl border border-[var(--color-border)]">
                            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
                                Taxa de Comissão Padrão (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={commissionRate}
                                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                                    className="bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-lg font-bold rounded-lg px-4 py-3 w-32 focus:outline-none focus:border-[var(--color-primary)] text-center"
                                    min="0"
                                    max="100"
                                />
                                <div className="text-sm text-[var(--color-text-secondary)]">
                                    <p>Define a porcentagem que será repassada aos barbeiros.</p>
                                    <p className="text-xs opacity-60 mt-1">Ex: 40% significa que o barbeiro recebe R$ 40,00 a cada R$ 100,00.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
                        <Button 
                            onClick={handleSave} 
                            disabled={loading || saving}
                            className="bg-[var(--color-primary)] text-black hover:brightness-110 min-w-[150px]"
                        >
                            {saving ? (
                                <span className="animate-pulse">Salvando...</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    Salvar Alterações
                                </div>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
