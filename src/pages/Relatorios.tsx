import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileBarChart, Presentation } from 'lucide-react';
import IndicadoresInternos from '../components/reports/IndicadoresInternos';
import GeradorPDFCliente from '../components/reports/GeradorPDFCliente';

type DashboardTab = 'interna' | 'pdf';

export default function Relatorios() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<DashboardTab>('interna');

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="container" style={{ padding: 40, textAlign: 'center' }}>
                <h2>Acesso Negado</h2>
                <p>Apenas administradores podem visualizar os relatórios gerenciais.</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h2>Relatórios de Gestão</h2>
            </div>

            <div className="admin-tabs" style={{ marginBottom: 24 }}>
                <button
                    className={`admin-tab ${activeTab === 'interna' ? 'active' : ''}`}
                    onClick={() => setActiveTab('interna')}
                >
                    <Presentation size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Métricas da Operação
                </button>
                <button
                    className={`admin-tab ${activeTab === 'pdf' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pdf')}
                >
                    <FileBarChart size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                    Emissão de Relatório (Cliente)
                </button>
            </div>

            {activeTab === 'interna' && <IndicadoresInternos />}
            {activeTab === 'pdf' && <GeradorPDFCliente />}

        </div>
    );
}
