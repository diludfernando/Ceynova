import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API = 'http://localhost:5000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    _id: '', title: '', desc: '', cat: ['web'], yr: '', tags: '', problem: '', features: []
  });
  const [imageItems, setImageItems] = useState([]); 
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  /* ── fetch ── */
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/api/projects`);
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error('Failed to fetch projects', err); }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) { navigate('/'); return; }
      try {
        const authRes = await fetch(`${API}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!authRes.ok) { localStorage.removeItem('adminToken'); navigate('/'); return; }
      } catch { navigate('/'); return; }
      fetchProjects();
    };
    checkAuthAndLoad();
  }, [navigate]);

  /* ── file picker ── */
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const promises = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve({ type: 'new', file, preview: ev.target.result, id: Math.random().toString(36).substr(2, 9) });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then(newItems => {
      setImageItems(prev => [...prev, ...newItems]);
    });
    e.target.value = '';
  };

  const removeImage = (id) => {
    setImageItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragEnter = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setImageItems(prev => {
      const items = [...prev];
      const draggedItem = items[draggedIndex];
      items.splice(draggedIndex, 1);
      items.splice(index, 0, draggedItem);
      return items;
    });
    setDraggedIndex(index);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const resetForm = () => {
    setFormData({ _id: '', title: '', desc: '', cat: ['web'], yr: '', tags: '', problem: '', features: [] });
    setImageItems([]);
    setIsEditing(false);
    setError('');
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/'); return; }

    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('desc', formData.desc);
      if (Array.isArray(formData.cat)) {
        formData.cat.forEach(c => fd.append('cat', c));
      } else {
        fd.append('cat', formData.cat);
      }
      fd.append('yr', formData.yr);
      fd.append('tags', formData.tags);
      fd.append('problem', formData.problem || '');
      fd.append('features', JSON.stringify(formData.features || []));

      // Attach file uploads and build imageOrder
      let newFileCount = 0;
      imageItems.forEach((item) => {
        if (item.type === 'existing') {
          fd.append('keepImages', item.url);
          fd.append('imageOrder', item.url);
        } else {
          fd.append('images', item.file);
          fd.append('imageOrder', `NEW_${newFileCount}`);
          newFileCount++;
        }
      });

      const url = isEditing
        ? `${API}/api/projects/${formData._id}`
        : `${API}/api/projects`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await response.json();
      if (response.ok) {
        resetForm();
        fetchProjects();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEdit = (proj) => {
    setFormData({
      _id: proj._id,
      title: proj.title,
      desc: proj.desc,
      cat: Array.isArray(proj.cat) ? proj.cat : [proj.cat],
      yr: proj.yr,
      tags: proj.tags.join(', '),
      problem: proj.problem || '',
      features: proj.features || []
    });
    const existing = (proj.images || []).map(url => ({ type: 'existing', url, id: url }));
    setImageItems(existing);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/'); return; }
    try {
      const res = await fetch(`${API}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProjects();
      else { const d = await res.json(); alert(d.message || 'Failed to delete'); }
    } catch { alert('Connection to backend failed'); }
  };

  /* ── render ── */

  return (
    <>
      <div className="aurora">
        <div className="blob a" /><div className="blob b" /><div className="blob c" />
      </div>
      <div className="grid-overlay" />

      <header className="nav">
        <div className="wrap nav-in">
          <div className="brand">
            <img src="/mark-white.png" alt="Ceynova logo" />
            <span><b>CEYNOVA</b><span>Admin Dashboard</span></span>
          </div>
          <nav className="nav-links">
            <button className="btn btn-ghost" onClick={() => { localStorage.removeItem('adminToken'); navigate('/'); }}>Log Out</button>
          </nav>
        </div>
      </header>

      <main className="admin-main wrap" style={{ position: 'relative', zIndex: 1, paddingTop: '100px', display: 'flex', gap: '3rem', flexDirection: 'column', alignItems: 'stretch' }}>
        <div className="admin-panel card tilt" style={{ width: '100%', padding: '2rem' }}>
          <h3>{isEditing ? 'Edit Project' : 'Add New Project'}</h3>
          {error && <div className="admin-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="admin-form grid-form">
            {/* Title */}
            <div className="form-group">
              <label>Project Title</label>
              <input name="title" value={formData.title} onChange={handleChange} required className="admin-input" />
            </div>

            {/* Year */}
            <div className="form-group">
              <label>Year</label>
              <input name="yr" value={formData.yr} onChange={handleChange} required className="admin-input" placeholder="e.g. 2026" />
            </div>

            {/* Category */}
            <div className="form-group full-width">
              <label style={{ marginBottom: '0.75rem', display: 'block' }}>Category (Select multiple)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {[
                  { value: 'web', label: 'Web' },
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'uiux', label: 'UI/UX' },
                  { value: 'ecommerce', label: 'E-commerce' },
                  { value: 'ai', label: 'AI & Automation' },
                  { value: 'branding', label: 'Branding' },
                  { value: 'marketing', label: 'Marketing' },
                ].map((item) => {
                  const isSelected = Array.isArray(formData.cat)
                    ? formData.cat.includes(item.value)
                    : formData.cat === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        let currentCats = Array.isArray(formData.cat)
                          ? [...formData.cat]
                          : [formData.cat];
                        if (currentCats.includes(item.value)) {
                          currentCats = currentCats.filter((c) => c !== item.value);
                        } else {
                          currentCats.push(item.value);
                        }
                        setFormData({ ...formData, cat: currentCats });
                      }}
                      className="btn"
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        border: isSelected ? '1px solid var(--cyan)' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(54,211,255,0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? 'var(--cyan)' : 'var(--muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image upload — full width */}
            <div className="form-group full-width">
              <label>Project Images</label>

              {/* Drop zone / picker button */}
              <div
                className="img-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const fakeEvt = { target: { files: e.dataTransfer.files, value: '' } };
                  handleFilesChange(fakeEvt);
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.6"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                <span>Click or drag &amp; drop to add images</span>
                <small style={{ color: 'var(--muted)' }}>PNG, JPG, WEBP — multiple allowed</small>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFilesChange}
              />

              {/* Preview grid */}
              {imageItems.length > 0 && (
                <div className="img-preview-grid">
                  {imageItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`img-preview-wrap ${draggedIndex === index ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleDragEnd}
                      style={{ cursor: 'grab', opacity: draggedIndex === index ? 0.5 : 1 }}
                    >
                      <img 
                        src={item.type === 'existing' ? (item.url.startsWith('data:') ? item.url : `${API}${item.url}`) : item.preview} 
                        alt="" 
                        className="img-preview-thumb" 
                        draggable={false} 
                      />
                      <button
                        type="button"
                        className="img-remove-btn"
                        onClick={() => removeImage(item.id)}
                        title="Remove"
                      >✕</button>
                      {item.type === 'existing' && <span className="img-saved-badge">Saved</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label>Description</label>
              <textarea name="desc" value={formData.desc} onChange={handleChange} required className="admin-input" rows="3" />
            </div>

            {/* Tags */}
            <div className="form-group full-width">
              <label>Tags (comma separated)</label>
              <input name="tags" value={formData.tags} onChange={handleChange} required className="admin-input" placeholder="React, Node, UI/UX" />
            </div>

            {/* Problem Statement */}
            <div className="form-group full-width">
              <label>Problem Statement</label>
              <textarea name="problem" value={formData.problem} onChange={handleChange} className="admin-input" rows="3" placeholder="Describe the client's challenge before the solution..." />
            </div>

            {/* Key Features */}
            <div className="form-group full-width">
              <label style={{ marginBottom: '0.75rem', display: 'block' }}>Key Features</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                {(formData.features || []).map((feat, index) => (
                  <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="Feature Title (e.g. Scalable Architecture)" 
                        value={feat.title} 
                        onChange={(e) => {
                          const newFeats = [...formData.features];
                          newFeats[index].title = e.target.value;
                          setFormData({ ...formData, features: newFeats });
                        }}
                        className="admin-input"
                        required
                      />
                      <textarea 
                        placeholder="Feature Description..." 
                        value={feat.desc} 
                        onChange={(e) => {
                          const newFeats = [...formData.features];
                          newFeats[index].desc = e.target.value;
                          setFormData({ ...formData, features: newFeats });
                        }}
                        className="admin-input"
                        rows="2"
                        required
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newFeats = formData.features.filter((_, i) => i !== index);
                        setFormData({ ...formData, features: newFeats });
                      }}
                      className="btn"
                      style={{ padding: '0.5rem 0.75rem', color: '#ff5a6e', borderColor: 'rgba(255,90,110,0.2)', background: 'rgba(255,90,110,0.05)' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={() => {
                  const newFeats = [...(formData.features || []), { title: '', desc: '' }];
                  setFormData({ ...formData, features: newFeats });
                }}
                className="btn btn-ghost"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                + Add Feature
              </button>
            </div>

            <div className="form-actions full-width">
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? 'Saving…' : (isEditing ? 'Update Project' : 'Add Project')}
              </button>
              {isEditing && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* Projects list */}
        <div className="admin-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3>Current Projects</h3>
          <div className="admin-list">
            {projects.length === 0 ? (
              <div className="empty-state">No projects added yet.</div>
            ) : (
              projects.map(p => (
                <div key={p._id} className="admin-list-item card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
                  <div className="admin-item-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={p.images && p.images.length > 0 ? (p.images[0].startsWith('data:') ? p.images[0] : `${API}${p.images[0]}`) : '/placeholder.jpg'} alt={p.title} className="admin-item-img" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {p.title}
                        {Array.isArray(p.cat) ? (
                          p.cat.map(c => <span key={c} className="cat-badge">{c}</span>)
                        ) : (
                          <span className="cat-badge">{p.cat}</span>
                        )}
                        {p.images && p.images.length > 1 && <span className="cat-badge" style={{ background: 'rgba(54,211,255,.15)', color: 'var(--cyan)' }}>{p.images.length} photos</span>}
                      </h4>
                      <p className="admin-item-desc" style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{p.desc}</p>
                    </div>
                  </div>
                  <div className="admin-item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(p)} className="btn btn-ghost btn-sm">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="btn btn-ghost btn-sm text-red">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
