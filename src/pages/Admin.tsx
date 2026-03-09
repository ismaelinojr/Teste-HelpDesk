import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    Building2,
    Users,
    Timer,
    Tags,
    ListChecks,
    Contact
} from 'lucide-react';

import ClientesPanel from '../components/admin/ClientesPanel';
import UsuariosPanel from '../components/admin/UsuariosPanel';
import ColaboradoresPanel from '../components/admin/ColaboradoresPanel';
import CategoriasPanel from '../components/admin/CategoriasPanel';
import StatusPanel from '../components/admin/StatusPanel';
import SLAPanel from '../components/admin/SLAPanel';

type AdminTab = 'clientes' | 'usuarios' | 'colaboradores' | 'categorias' | 'status' | 'sla';

export default function Admin() {
    const { clientes, usuarios, categoriasChamado, statusConfigs, slaConfigs, contatosClientes } = useApp();
    const [activeTab, setActiveTab] = useState<AdminTab>('clientes');

    return (
        <div>
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'clientes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clientes')}
                >
                    <Building2 size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Laboratórios ({clientes.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'colaboradores' ? 'active' : ''}`}
                    onClick={() => setActiveTab('colaboradores')}
                >
                    <Contact size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Colaboradores ({contatosClientes?.length || 0})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                    onClick={() => setActiveTab('usuarios')}
                >
                    <Users size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Usuários Sist. ({usuarios.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'categorias' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categorias')}
                >
                    <Tags size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Categorias ({categoriasChamado.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                >
                    <ListChecks size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Status ({statusConfigs.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'sla' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sla')}
                >
                    <Timer size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    SLA ({slaConfigs.length})
                </button>
            </div>

            {activeTab === 'clientes' && <ClientesPanel />}
            {activeTab === 'colaboradores' && <ColaboradoresPanel />}
            {activeTab === 'usuarios' && <UsuariosPanel />}
            {activeTab === 'categorias' && <CategoriasPanel />}
            {activeTab === 'status' && <StatusPanel />}
            {activeTab === 'sla' && <SLAPanel />}
        </div>
    );
}
