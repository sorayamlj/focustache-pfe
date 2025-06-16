import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Trash2, 
  Save, 
  X,
  FileText,
  Calendar,
  Filter,
  Download,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  ArrowLeft,
  FileDown,
  Eye,
  EyeOff,
  Highlighter,
  Palette,
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      // Simulation des données pour le moment
      const mockNotes = [
        {
          _id: '1',
          title: 'Cours de Mathématiques - Chapitre 1',
          content: '<h1>Introduction aux équations</h1><p>Les équations sont des expressions mathématiques...</p><ul><li>Équations linéaires</li><li>Équations quadratiques</li></ul>',
          updatedAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Projet de fin d\'études',
          content: '<h2>Plan du projet</h2><p>Voici les étapes importantes pour mon projet...</p>',
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setNotes(mockNotes);
    } catch (err) {
      console.error('Erreur fetchNotes:', err);
      setError('Impossible de charger les notes');
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim()) {
      showNotification('Le titre est requis', 'error');
      return;
    }

    try {
      const createdNote = {
        _id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content || '<p>Commencez à écrire...</p>',
        updatedAt: new Date().toISOString()
      };
      
      setNotes(prev => [createdNote, ...prev]);
      setNewNote({ title: '', content: '' });
      setShowCreateModal(false);
      showNotification('Note créée avec succès !', 'success');
      // Ouvrir automatiquement la nouvelle note
      setOpenNote(createdNote);
    } catch (error) {
      console.error('Erreur création note:', error);
      showNotification(error.message, 'error');
    }
  };

  const updateNote = async (noteId, updatedData) => {
    try {
      const updatedNote = { ...updatedData, updatedAt: new Date().toISOString() };
      setNotes(prev => prev.map(note => 
        note._id === noteId ? { ...note, ...updatedNote } : note
      ));
      
      if (openNote && openNote._id === noteId) {
        setOpenNote({ ...openNote, ...updatedNote });
      }
      
      showNotification('Note sauvegardée automatiquement', 'success');
    } catch (error) {
      console.error('Erreur mise à jour note:', error);
      showNotification(error.message, 'error');
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    try {
      setNotes(prev => prev.filter(note => note._id !== noteId));
      if (openNote && openNote._id === noteId) {
        setOpenNote(null);
      }
      showNotification('Note supprimée', 'info');
    } catch (error) {
      console.error('Erreur suppression note:', error);
      showNotification(error.message, 'error');
    }
  };

  const showNotification = (message, type = 'info', duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-medium max-w-sm backdrop-blur-sm border transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-600/90 border-green-500/50' : 
      type === 'error' ? 'bg-red-600/90 border-red-500/50' : 
      'bg-blue-600/90 border-blue-500/50'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-xl">
          ${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}
        </div>
        <div class="flex-1">${message}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  };

  const exportNote = async (note, format) => {
    try {
      const element = document.createElement('a');
      let content = '';
      let filename = '';
      
      if (format === 'txt') {
        // Convertir HTML en texte
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        content = tempDiv.textContent || tempDiv.innerText || '';
        filename = `${note.title}.txt`;
        element.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      } else if (format === 'html') {
        content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${note.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 20px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    <p><small>Dernière modification: ${formatDate(note.updatedAt)}</small></p>
    <hr>
    ${note.content}
</body>
</html>`;
        filename = `${note.title}.html`;
        element.href = `data:text/html;charset=utf-8,${encodeURIComponent(content)}`;
      } else if (format === 'md') {
        // Conversion basique HTML vers Markdown
        content = note.content
          .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
          .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
          .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
          .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
          .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
          .replace(/<em>(.*?)<\/em>/g, '*$1*')
          .replace(/<ul>/g, '').replace(/<\/ul>/g, '')
          .replace(/<li>(.*?)<\/li>/g, '- $1\n')
          .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n')
          .replace(/<code>(.*?)<\/code>/g, '`$1`');
        filename = `${note.title}.md`;
        element.href = `data:text/markdown;charset=utf-8,${encodeURIComponent(content)}`;
      }
      
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      showNotification(`Note exportée en ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showNotification('Erreur lors de l\'exportation', 'error');
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      updateNote(openNote._id, { content });
    }
  };

  const insertHeading = (level) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);
      heading.textContent = selection.toString() || `Titre ${level}`;
      range.deleteContents();
      range.insertNode(heading);
      selection.removeAllRanges();
      
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        updateNote(openNote._id, { content });
      }
    }
  };

  const highlightText = (color) => {
    formatText('hiliteColor', color);
  };

  const changeTextColor = (color) => {
    formatText('foreColor', color);
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement('code');
      code.style.backgroundColor = '#f1f5f9';
      code.style.color = '#1e293b';
      code.style.padding = '2px 6px';
      code.style.borderRadius = '4px';
      code.style.fontFamily = 'Monaco, Consolas, monospace';
      code.textContent = selection.toString() || 'code';
      range.deleteContents();
      range.insertNode(code);
      selection.removeAllRanges();
      
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        updateNote(openNote._id, { content });
      }
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current && openNote) {
      const content = editorRef.current.innerHTML;
      // Sauvegarde automatique avec délai
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        updateNote(openNote._id, { content });
      }, 1000);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (htmlContent, maxLength = 150) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    if (textContent.length <= maxLength) return textContent;
    return textContent.substr(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement des notes...</p>
        </div>
      </div>
    );
  }

  // Vue d'édition plein écran
  if (openNote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900">
        {/* Header d'édition */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOpenNote(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={openNote.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setOpenNote(prev => ({ ...prev, title: newTitle }));
                    updateNote(openNote._id, { title: newTitle });
                  }}
                  className="text-2xl font-bold text-white bg-transparent border-none outline-none flex-1"
                  placeholder="Titre de la note..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title={isPreviewMode ? "Mode édition" : "Mode aperçu"}
                >
                  {isPreviewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                
                <div className="relative group">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={() => exportNote(openNote, 'txt')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 rounded-t-xl transition-colors"
                    >
                      Exporter en TXT
                    </button>
                    <button
                      onClick={() => exportNote(openNote, 'html')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
                    >
                      Exporter en HTML
                    </button>
                    <button
                      onClick={() => exportNote(openNote, 'md')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 rounded-b-xl transition-colors"
                    >
                      Exporter en Markdown
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteNote(openNote._id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Barre d'outils */}
            {!isPreviewMode && (
              <div className="flex items-center gap-2 pb-4 border-b border-white/10 flex-wrap">
                {/* Formatage de base */}
                <button
                  onClick={() => formatText('bold')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Gras"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Italique"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Souligné"
                >
                  <Underline className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                
                {/* Titres */}
                <button
                  onClick={() => insertHeading(1)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Titre 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertHeading(2)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Titre 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertHeading(3)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Titre 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                
                {/* Listes */}
                <button
                  onClick={() => formatText('insertUnorderedList')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Liste à puces"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('insertOrderedList')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Liste numérotée"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                
                {/* Alignement */}
                <button
                  onClick={() => formatText('justifyLeft')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Aligner à gauche"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('justifyCenter')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Centrer"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('justifyRight')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Aligner à droite"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                
                {/* Couleurs et surlignage */}
                <div className="relative group">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Surligner">
                    <Highlighter className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 flex gap-2">
                      <button onClick={() => highlightText('#fef08a')} className="w-6 h-6 bg-yellow-200 rounded border-2 border-white hover:scale-110 transition-transform" title="Jaune"></button>
                      <button onClick={() => highlightText('#bbf7d0')} className="w-6 h-6 bg-green-200 rounded border-2 border-white hover:scale-110 transition-transform" title="Vert"></button>
                      <button onClick={() => highlightText('#fecaca')} className="w-6 h-6 bg-red-200 rounded border-2 border-white hover:scale-110 transition-transform" title="Rouge"></button>
                      <button onClick={() => highlightText('#bfdbfe')} className="w-6 h-6 bg-blue-200 rounded border-2 border-white hover:scale-110 transition-transform" title="Bleu"></button>
                      <button onClick={() => highlightText('#e9d5ff')} className="w-6 h-6 bg-purple-200 rounded border-2 border-white hover:scale-110 transition-transform" title="Violet"></button>
                    </div>
                  </div>
                </div>
                
                <div className="relative group">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Couleur du texte">
                    <Palette className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 flex gap-2">
                      <button onClick={() => changeTextColor('#000000')} className="w-6 h-6 bg-black rounded border-2 border-white hover:scale-110 transition-transform" title="Noir"></button>
                      <button onClick={() => changeTextColor('#ef4444')} className="w-6 h-6 bg-red-500 rounded border-2 border-white hover:scale-110 transition-transform" title="Rouge"></button>
                      <button onClick={() => changeTextColor('#3b82f6')} className="w-6 h-6 bg-blue-500 rounded border-2 border-white hover:scale-110 transition-transform" title="Bleu"></button>
                      <button onClick={() => changeTextColor('#10b981')} className="w-6 h-6 bg-green-500 rounded border-2 border-white hover:scale-110 transition-transform" title="Vert"></button>
                      <button onClick={() => changeTextColor('#f59e0b')} className="w-6 h-6 bg-yellow-500 rounded border-2 border-white hover:scale-110 transition-transform" title="Jaune"></button>
                      <button onClick={() => changeTextColor('#8b5cf6')} className="w-6 h-6 bg-purple-500 rounded border-2 border-white hover:scale-110 transition-transform" title="Violet"></button>
                    </div>
                  </div>
                </div>
                
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                
                {/* Outils spéciaux */}
                <button
                  onClick={insertLink}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Insérer un lien"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  onClick={formatCode}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Format code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('formatBlock', 'blockquote')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Citation"
                >
                  <Quote className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zone d'édition */}
        <div className="container mx-auto px-4 py-8">
          {isPreviewMode ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 min-h-[600px]">
              <div 
                className="text-white prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: openNote.content }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl p-8 min-h-[600px] border border-gray-200">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorChange}
                dangerouslySetInnerHTML={{ __html: openNote.content }}
                className="text-gray-800 outline-none min-h-[500px] prose prose-gray max-w-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-20 rounded p-4"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.7',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
                placeholder="Commencez à écrire votre note..."
              />
            </div>
          )}
          
          <div className="mt-4 text-center text-slate-400 text-sm">
            Dernière modification: {formatDate(openNote.updatedAt)}
          </div>
        </div>
      </div>
    );
  }

  // Vue principale (liste des notes)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Mes Notes
                </h1>
                <p className="text-slate-400 text-lg">
                  {notes.length} note{notes.length > 1 ? 's' : ''} • Organisez vos idées
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Note
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans vos notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 text-red-300">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Liste des notes */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 p-5 bg-slate-700 rounded-full">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchTerm ? 'Aucune note trouvée' : 'Aucune note créée'}
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'Essayez de modifier votre recherche ou créez une nouvelle note'
                : 'Commencez par créer votre première note pour organiser vos idées et pensées'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Créer ma première note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note, index) => (
              <div
                key={note._id}
                onClick={() => setOpenNote(note)}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group cursor-pointer flex flex-col justify-between min-h-[140px]"
                style={{ 
                  animation: `fadeInUp 0.6s ease-out forwards`,
                  animationDelay: `${index * 100}ms`,
                  opacity: 0
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-white group-hover:text-yellow-400 transition-colors line-clamp-3 flex-1">
                    {note.title}
                  </h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note._id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-auto">
                  <Calendar className="w-4 h-4" />
                  <span>Modifiée le {formatDate(note.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Nouvelle Note</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Donnez un titre à votre note..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewNote({ title: '', content: '' });
                  }}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={createNote}
                  disabled={!newNote.title.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Créer la Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
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
          
          .line-clamp-4 {
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          [contenteditable="true"]:focus {
            outline: none;
          }
          
          [contenteditable="true"]:empty:before {
            content: "Commencez à écrire votre note...";
            color: #9ca3af;
            font-style: italic;
          }
          
          /* Styles pour l'éditeur avec fond blanc */
          .prose h1 { font-size: 2em; margin-bottom: 0.5em; color: #1f2937; font-weight: bold; }
          .prose h2 { font-size: 1.5em; margin-bottom: 0.5em; color: #374151; font-weight: bold; }
          .prose h3 { font-size: 1.25em; margin-bottom: 0.5em; color: #4b5563; font-weight: bold; }
          .prose p { margin-bottom: 1em; color: #1f2937; }
          .prose ul, .prose ol { margin-bottom: 1em; padding-left: 1.5em; color: #1f2937; }
          .prose li { margin-bottom: 0.25em; }
          .prose blockquote { 
            border-left: 4px solid #f59e0b; 
            padding-left: 1em; 
            margin: 1em 0; 
            font-style: italic; 
            color: #6b7280; 
            background: #f9fafb;
            padding: 1em;
            border-radius: 0.5em;
          }
          .prose pre { 
            background: #f1f5f9; 
            color: #1e293b;
            padding: 1em; 
            border-radius: 0.5em; 
            overflow-x: auto; 
            margin: 1em 0;
            border: 1px solid #e2e8f0;
          }
          .prose code { 
            background: #f1f5f9; 
            color: #1e293b;
            padding: 0.2em 0.4em; 
            border-radius: 0.25em; 
            font-size: 0.9em;
            font-family: Monaco, Consolas, monospace;
          }
          .prose strong { color: #1f2937; font-weight: 700; }
          .prose em { color: #1f2937; }
          .prose a { color: #3b82f6; text-decoration: underline; }
          .prose a:hover { color: #1d4ed8; }
          
          /* Styles pour mode aperçu */
          .prose-invert h1 { color: #f59e0b; }
          .prose-invert h2 { color: #f59e0b; }
          .prose-invert h3 { color: #f59e0b; }
          .prose-invert blockquote { 
            border-left: 4px solid #f59e0b; 
            color: #cbd5e1; 
            background: rgba(0,0,0,0.3);
          }
          .prose-invert pre { 
            background: rgba(0,0,0,0.3); 
            color: #e2e8f0;
          }
          .prose-invert code { 
            background: rgba(0,0,0,0.3); 
            color: #e2e8f0;
          }
        `
      }} />
    </div>
  );
};

export default Notes;