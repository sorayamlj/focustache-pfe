import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Trash2, ArrowLeft, X, Download } from 'lucide-react';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  // API Base URL - ajustez selon votre backend
  const API_URL = 'http://localhost:5000/api/notes';

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur fetch:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim()) {
      return; // Silencieux, pas de notification
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote)
      });
      
      if (response.ok) {
        fetchNotes();
        setNewNote({ title: '', content: '' });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  const toggleFavorite = async (noteId) => {
    const note = notes.find(n => n._id === noteId);
    if (!note) return;
    
    const updatedData = { favorite: !note.favorite };
    await updateNote(noteId, updatedData);
  };

  const exportToPDF = async (note) => {
    try {
      // Simple export - crée un HTML puis permet d'imprimer en PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${note.title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
            .content { line-height: 1.6; white-space: pre-wrap; }
            .tags { margin-top: 20px; }
            .tag { display: inline-block; background: #f0f0f0; padding: 4px 8px; border-radius: 12px; margin-right: 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${note.title}</h1>
          <div class="meta">Créé le ${formatDate(note.updatedAt)}</div>
          <div class="content">${note.content || 'Pas de contenu'}</div>
          ${note.tags && note.tags.length > 0 ? `
            <div class="tags">
              <strong>Tags:</strong> ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
      
      alert('Utilisez Ctrl+P ou Cmd+P pour sauvegarder en PDF');
    } catch (error) {
      alert('Erreur lors de l\'export');
    }
  };

  const updateNote = async (noteId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${noteId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        fetchNotes();
        if (openNote && openNote._id === noteId) {
          setOpenNote({ ...openNote, ...updatedData });
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Supprimer cette note ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchNotes();
        if (openNote && openNote._id === noteId) {
          setOpenNote(null);
        }
        alert('Note supprimée');
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredNotes = notes.filter(note => {
    return note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vue d'édition
  if (openNote) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpenNote(null)}
            className="p-2 hover:bg-gray-700 rounded text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToPDF(openNote)}
              className="p-2 hover:bg-gray-700 rounded text-white"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => deleteNote(openNote._id)}
              className="p-2 hover:bg-gray-700 rounded text-red-400"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={openNote.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setOpenNote(prev => ({ ...prev, title: newTitle }));
              clearTimeout(window.saveTimeout);
              window.saveTimeout = setTimeout(() => {
                updateNote(openNote._id, { title: newTitle });
              }, 1000);
            }}
            className="w-full text-2xl font-bold border-none outline-none mb-4 bg-white text-black p-3 rounded"
            placeholder="Titre..."
          />
          
          <textarea
            value={openNote.content || ''}
            onChange={(e) => {
              const newContent = e.target.value;
              setOpenNote(prev => ({ ...prev, content: newContent }));
              clearTimeout(window.saveTimeout);
              window.saveTimeout = setTimeout(() => {
                updateNote(openNote._id, { content: newContent });
              }, 1000);
            }}
            className="w-full h-96 border-none outline-none resize-none bg-white text-black p-3 rounded"
            placeholder="Écrire ici..."
          />
          
          <div className="mt-4 text-sm text-gray-400">
            Modifiée le {formatDate(openNote.updatedAt)}
          </div>
        </div>
      </div>
    );
  }

  // Vue principale
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mes Notes</h1>
                <p className="text-gray-400">{notes.length} notes</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Note
            </button>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Liste des notes */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'Aucune note trouvée' : 'Aucune note'}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'Essayez un autre terme' : 'Créez votre première note'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded"
            >
              Créer une note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                onClick={() => setOpenNote(note)}
                className="bg-gray-800 border border-gray-700 rounded p-4 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-white mb-2 line-clamp-2">
                  {note.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                  {note.content || 'Pas de contenu'}
                </p>
                
                <div className="text-xs text-gray-500">
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal création avec le nouveau style */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Créer une nouvelle note
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={(e) => { e.preventDefault(); createNote(); }} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-4 space-y-4">
                  
                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre de la note *
                    </label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Ex: Notes de cours, Idée de projet..."
                    />
                  </div>

                  {/* Contenu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contenu (optionnel)
                    </label>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-32 resize-none"
                      placeholder="Écrivez le contenu de votre note ici..."
                    />
                  </div>
                </div>
              </form>

              {/* Footer Buttons */}
              <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewNote({ title: '', content: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={createNote}
                    disabled={!newNote.title.trim()}
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Créer la note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
};

export default Notes;