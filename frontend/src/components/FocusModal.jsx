import React from 'react';
import { X, Zap, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useSession } from '@/services/SessionContext';

export const FocusModal = () => {
  const {
    showFocusModal,
    setShowFocusModal,
    focusSettings,
    setFocusSettings,
    activateFocusMode,
    activeSession
  } = useSession();

  if (!showFocusModal || !activeSession) return null;

  const handleActivateFocus = async () => {
    if (!focusSettings.activerFocus) {
      setFocusSettings(prev => ({ ...prev, activerFocus: true }));
    }
    await activateFocusMode();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Mode Focus</h2>
          </div>
          <button
            onClick={() => setShowFocusModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Activer le Mode Focus
            </h3>
            <p className="text-gray-400 text-sm">
              Minimisez les distractions pour une concentration optimale
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={focusSettings.activerFocus}
                onChange={(e) => setFocusSettings(prev => ({
                  ...prev,
                  activerFocus: e.target.checked,
                  activerNotifications: e.target.checked ? prev.activerNotifications : false,
                  activerPomodoro: e.target.checked ? prev.activerPomodoro : false
                }))}
                className="w-4 h-4"
              />
              <Zap size={16} className="text-purple-400" />
              <span className="text-white">Activer le Mode Focus</span>
            </label>

            {focusSettings.activerFocus && (
              <div className="ml-6 space-y-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusSettings.activerNotifications}
                    onChange={(e) => setFocusSettings(prev => ({
                      ...prev,
                      activerNotifications: e.target.checked
                    }))}
                    className="w-4 h-4 mt-0.5"
                  />
                  <AlertCircle size={16} className="text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-white text-sm">Bloquer les notifications</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Bloque les alertes JavaScript, popups et nouvelles fenêtres
                    </p>
                    <div className="mt-2 text-xs text-orange-200 bg-orange-500/10 border border-orange-500/20 rounded p-2">
                      <strong>💡 Pour un blocage complet :</strong><br />
                      • Activez le mode "Ne pas déranger" sur votre système<br />
                      • Fermez les onglets de réseaux sociaux<br />
                      • Mettez votre téléphone en mode silencieux
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusSettings.activerPomodoro}
                    onChange={(e) => setFocusSettings(prev => ({
                      ...prev,
                      activerPomodoro: e.target.checked
                    }))}
                    className="w-4 h-4"
                  />
                  <Clock size={16} className="text-orange-400" />
                  <span className="text-white text-sm">Technique Pomodoro</span>
                </label>

                {focusSettings.activerPomodoro && (
                  <div className="ml-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-orange-200 text-sm mb-1">Durée travail</label>
                        <select
                          value={focusSettings.tempsTravail}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            tempsTravail: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={25}>25 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={50}>50 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-1">Nombre de cycles</label>
                        <select
                          value={focusSettings.nombreCycles}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            nombreCycles: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value={2}>2 cycles</option>
                          <option value={4}>4 cycles</option>
                          <option value={6}>6 cycles</option>
                          <option value={8}>8 cycles</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-orange-200 text-xs">
                      <strong>Cycle :</strong> {focusSettings.tempsTravail}min travail → {focusSettings.tempsPauseCourte}min pause<br />
                      <strong>Pause longue :</strong> {focusSettings.tempsPauseLongue}min après {focusSettings.nombreCycles} cycles
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {focusSettings.activerFocus && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <CheckCircle size={16} />
                <span className="font-medium">Mode Focus activé</span>
              </div>
              <ul className="text-xs text-green-200 space-y-1">
                <li>• Timer de concentration actif</li>
                {focusSettings.activerNotifications && <li>• Notifications bloquées</li>}
                {focusSettings.activerPomodoro && <li>• Cycles Pomodoro configurés</li>}
                <li>• Interface optimisée pour la concentration</li>
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={() => setShowFocusModal(false)}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleActivateFocus}
            disabled={!focusSettings.activerFocus}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Activer Focus
          </button>
        </div>
      </div>
    </div>
  );
};