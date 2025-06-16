import React, { useState, useEffect } from 'react';

const ExportModal = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState('excel');
  const [filters, setFilters] = useState({
    module: '',
    statut: 'all',
    priorite: 'all',
    dateDebut: '',
    dateFin: ''
  });
  const [modules, setModules] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');

  // Récupérer la liste des modules
  useEffect(() => {
    if (isOpen) {
      fetchModules();
    }
  }, [isOpen]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/modules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Erreur récupération modules:', error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      
      // Construction des paramètres de requête
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== 'all')
        )
      });

      const response = await fetch(`http://localhost:5000/api/tasks/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Récupérer le nom du fichier depuis les headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `export_${format}_${new Date().toISOString().split('T')[0]}.${getFileExtension(format)}`;

        // Télécharger le fichier
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setMessage('Export réussi ! Le fichier a été téléchargé.');
        setTimeout(() => {
          onClose();
          setMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.msg || 'Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      setMessage('Erreur de connexion lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const getFileExtension = (format) => {
    const extensions = {
      csv: 'csv',
      excel: 'xlsx',
      pdf: 'pdf',
      json: 'json'
    };
    return extensions[format] || format;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      module: '',
      statut: 'all',
      priorite: 'all',
      dateDebut: '',
      dateFin: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Exporter mes tâches</h2>
              <p className="text-slate-400 text-sm">Téléchargez vos données dans différents formats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format de fichier */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Format d'export
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  value: 'excel', 
                  label: 'Excel (.xlsx)', 
                  desc: 'Tableau avec mise en forme',
                  icon: '📊',
                  color: 'green'
                },
                { 
                  value: 'csv', 
                  label: 'CSV (.csv)', 
                  desc: 'Compatible avec tous les tableurs',
                  icon: '📋',
                  color: 'blue'
                },
                { 
                  value: 'pdf', 
                  label: 'PDF (.pdf)', 
                  desc: 'Document imprimable',
                  icon: '📄',
                  color: 'red'
                },
                { 
                  value: 'json', 
                  label: 'JSON (.json)', 
                  desc: 'Format de données structurées',
                  icon: '⚙️',
                  color: 'purple'
                }
              ].map((formatOption) => (
                <button
                  key={formatOption.value}
                  onClick={() => setFormat(formatOption.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    format === formatOption.value
                      ? `border-${formatOption.color}-500 bg-${formatOption.color}-500/10`
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{formatOption.icon}</span>
                    <div>
                      <div className={`font-semibold ${
                        format === formatOption.value ? `text-${formatOption.color}-300` : 'text-white'
                      }`}>
                        {formatOption.label}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {formatOption.desc}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filtres */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-slate-300">
                Filtres d'export
              </label>
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-slate-300 underline"
              >
                Réinitialiser
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Module */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Module</label>
                <select
                  value={filters.module}
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tous les modules</option>
                  {modules.map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Statut</label>
                <select
                  value={filters.statut}
                  onChange={(e) => handleFilterChange('statut', e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="à faire">À faire</option>
                  <option value="en cours">En cours</option>
                  <option value="terminée">Terminée</option>
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Priorité</label>
                <select
                  value={filters.priorite}
                  onChange={(e) => handleFilterChange('priorite', e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="faible">Faible</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {/* Date de début */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Créées depuis</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Date de fin */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Créées jusqu'au</label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Aperçu de l'export</h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Format:</span>
                <div className="font-medium text-white">{format.toUpperCase()}</div>
              </div>
              <div>
                <span className="text-slate-400">Colonnes:</span>
                <div className="font-medium text-white">
                  {format === 'pdf' ? '8 champs' : '11 colonnes'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Filtres:</span>
                <div className="font-medium text-white">
                  {Object.values(filters).filter(v => v && v !== 'all').length || 'Aucun'}
                </div>
              </div>
            </div>
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('réussi') 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium rounded-lg transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-800 disabled:to-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
          >
            {isExporting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Export en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
                Exporter
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;