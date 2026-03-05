import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Building2,
    Users,
    Timer,
    Tags,
} from 'lucide-react';

import ClientesPanel from '../components/admin/ClientesPanel';
import UsuariosPanel from '../components/admin/UsuariosPanel';
import CategoriasPanel from '../components/admin/CategoriasPanel';

type AdminTab = 'clientes' | 'usuarios' | 'categorias' | 'sla';

export default function Admin() {
    const { clientes, usuarios, categoriasChamado, configSLA, atualizarConfigSLA } = useApp();
    const [activeTab, setActiveTab] = useState<AdminTab>('clientes');
    const [slaUrgente, setSlaUrgente] = useState(configSLA.urgente);
    const [slaNormal, setSlaNormal] = useState(configSLA.normal);
    const [saved, setSaved] = useState(false);

    const handleSaveSLA = () => {
        atualizarConfigSLA({ urgente: slaUrgente, normal: slaNormal });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'clientes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clientes')}
                >
                    <Building2 size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Clientes / Contatos ({clientes.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                    onClick={() => setActiveTab('usuarios')}
                >
                    <Users size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Usuários / Técnicos ({usuarios.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'categorias' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categorias')}
                >
                    <Tags size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Categorias ({categoriasChamado.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'sla' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sla')}
                >
                    <Timer size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    SLA
                </button>
            </div>

            {/* CLIENTES */}
            {activeTab === 'clientes' && <ClientesPanel />}

            {/* USUÁRIOS */}
            {activeTab === 'usuarios' && <UsuariosPanel />}

            {/* CATEGORIAS */}
            {activeTab === 'categorias' && <CategoriasPanel />}

            {/* SLA */}
            {activeTab === 'sla' && (
                <div className="sla-config">
                    <h3>
                        <Timer size={18} style={{ marginRight: 8, verticalAlign: -4 }} />
                        Configuração de SLA
                    </h3>
                    <div className="form-group">
                        <label>🔥 SLA Urgente (horas)</label>
                        <input
                            type="number"
                            min={1}
                            max={48}
                            value={slaUrgente}
                            onChange={(e) => setSlaUrgente(Number(e.target.value))}
                        />
                    </div>
                    <div className="form-group">
                        <label>📋 SLA Normal (horas)</label>
                        <input
                            type="number"
                            min={1}
                            max={120}
                            value={slaNormal}
                            onChange={(e) => setSlaNormal(Number(e.target.value))}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveSLA}>
                        Salvar Configuração
                    </button>
                    {saved && (
                        <p style={{ marginTop: 12, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                            ✅ Configuração salva com sucesso!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
