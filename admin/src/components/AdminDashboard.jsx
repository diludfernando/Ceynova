import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API = 'http://localhost:5000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const teammatesRef = useRef([]);

  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    _id: '', title: '', desc: '', cat: ['web'], yr: '', tags: '', problem: '', features: []
  });
  const [imageItems, setImageItems] = useState([]); 
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Teammate Management State
  const [activeTab, setActiveTab] = useState('projects');
  const [teammates, setTeammates] = useState([]);
  const [isEditingTeammate, setIsEditingTeammate] = useState(false);
  const [teammateImage, setTeammateImage] = useState(null);
  const [teammateImagePreview, setTeammateImagePreview] = useState('');
  const [teammateFormData, setTeammateFormData] = useState({
    _id: '',
    name: '',
    role: '',
    bio: '',
    skills: '',
    socials: { github: '', linkedin: '', instagram: '', dribbble: '' },
    gradient: 'linear-gradient(135deg, #2b7bff, #36d3ff)',
    order: ''
  });

  const [draggedTeammateIndex, setDraggedTeammateIndex] = useState(null);

  // Cropping State
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /* ── fetch ── */
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/api/projects`);
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error('Failed to fetch projects', err); }
  };

  const fetchTeammates = async () => {
    try {
      const res = await fetch(`${API}/api/teammates`);
      if (res.ok) setTeammates(await res.json());
    } catch (err) { console.error('Failed to fetch teammates', err); }
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
      fetchTeammates();
    };
    checkAuthAndLoad();
  }, [navigate]);

  useEffect(() => {
    teammatesRef.current = teammates;
  }, [teammates]);

  /* ── teammate actions ── */
  const handleTeammateChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setTeammateFormData(prev => ({
        ...prev,
        socials: {
          ...prev.socials,
          [socialKey]: value
        }
      }));
    } else {
      setTeammateFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTeammateFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setRawImageSrc(ev.target.result);
      setShowCropper(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const applyCrop = () => {
    const img = new Image();
    img.src = rawImageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, 300, 300);

      const cropSize = 200;
      let renderWidth = cropSize;
      let renderHeight = cropSize;
      const imgAspect = img.width / img.height;

      if (imgAspect > 1) {
        renderWidth = cropSize * imgAspect;
      } else {
        renderHeight = cropSize / imgAspect;
      }

      const scaledWidth = renderWidth * zoom;
      const scaledHeight = renderHeight * zoom;
      const scaleFactor = 300 / cropSize;
      
      const destWidth = scaledWidth * scaleFactor;
      const destHeight = scaledHeight * scaleFactor;
      const destX = ((cropSize - scaledWidth) / 2 + offset.x) * scaleFactor;
      const destY = ((cropSize - scaledHeight) / 2 + offset.y) * scaleFactor;

      ctx.drawImage(img, destX, destY, destWidth, destHeight);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setTeammateImagePreview(croppedDataUrl);
      
      fetch(croppedDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const croppedFile = new File([blob], "profile.jpg", { type: "image/jpeg" });
          setTeammateImage(croppedFile);
        });

      setShowCropper(false);
    };
  };

  const resetTeammateForm = () => {
    setTeammateFormData({
      _id: '',
      name: '',
      role: '',
      bio: '',
      skills: '',
      socials: { github: '', linkedin: '', instagram: '', dribbble: '' },
      gradient: 'linear-gradient(135deg, #2b7bff, #36d3ff)',
      order: ''
    });
    setTeammateImage(null);
    setTeammateImagePreview('');
    setIsEditingTeammate(false);
    setError('');
  };

  const handleTeammateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/'); return; }

    try {
      const fd = new FormData();
      fd.append('name', teammateFormData.name);
      fd.append('role', teammateFormData.role);
      fd.append('bio', teammateFormData.bio);
      fd.append('skills', teammateFormData.skills);
      fd.append('socials', JSON.stringify(teammateFormData.socials));
      fd.append('gradient', teammateFormData.gradient);
      fd.append('order', teammateFormData.order ? Number(teammateFormData.order) : 0);

      if (teammateImage) {
        fd.append('image', teammateImage);
      } else if (!teammateImagePreview && teammateFormData._id) {
        fd.append('removeImage', 'true');
      }

      const url = isEditingTeammate
        ? `${API}/api/teammates/${teammateFormData._id}`
        : `${API}/api/teammates`;

      const response = await fetch(url, {
        method: isEditingTeammate ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });

      const data = await response.json();
      if (response.ok) {
        resetTeammateForm();
        fetchTeammates();
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

  const handleTeammateEdit = (member) => {
    setTeammateFormData({
      _id: member._id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      skills: member.skills.join(', '),
      socials: {
        github: member.socials?.github || '',
        linkedin: member.socials?.linkedin || '',
        instagram: member.socials?.instagram || '',
        dribbble: member.socials?.dribbble || ''
      },
      gradient: member.gradient || 'linear-gradient(135deg, #2b7bff, #36d3ff)',
      order: member.order !== undefined ? member.order : ''
    });
    setTeammateImage(null);
    setTeammateImagePreview(member.image || '');
    setIsEditingTeammate(true);
  };

  const handleTeammateDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teammate?')) return;
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/'); return; }
    try {
      const res = await fetch(`${API}/api/teammates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTeammates();
      else { const d = await res.json(); alert(d.message || 'Failed to delete'); }
    } catch { alert('Connection to backend failed'); }
  };

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

  const handleTeammateDragStart = (index) => setDraggedTeammateIndex(index);
  const handleTeammateDragEnter = (index) => {
    if (draggedTeammateIndex === null || draggedTeammateIndex === index) return;
    setTeammates(prev => {
      const list = [...prev];
      const draggedItem = list[draggedTeammateIndex];
      list.splice(draggedTeammateIndex, 1);
      list.splice(index, 0, draggedItem);
      return list;
    });
    setDraggedTeammateIndex(index);
  };
  const handleTeammateDragEnd = async () => {
    setDraggedTeammateIndex(null);
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    const orders = teammatesRef.current.map((m, idx) => ({ id: m._id, order: idx }));
    try {
      await fetch(`${API}/api/teammates/reorder/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orders })
      });
    } catch (err) {
      console.error('Failed to save teammate order', err);
    }
  };

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
          <nav className="nav-links" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('projects')}>Projects</button>
            <button className={`btn ${activeTab === 'teammates' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('teammates')}>Teammates</button>
            <button className="btn btn-ghost" onClick={() => { localStorage.removeItem('adminToken'); navigate('/'); }}>Log Out</button>
          </nav>
        </div>
      </header>

      <main className="admin-main wrap" style={{ position: 'relative', zIndex: 1, paddingTop: '100px', display: 'flex', gap: '3rem', flexDirection: 'column', alignItems: 'stretch' }}>
        {activeTab === 'projects' ? (
          <>
            <div className="admin-panel card tilt" style={{ width: '100%', padding: '2rem' }}>
              <h3>{isEditing ? 'Edit Project' : 'Add New Project'}</h3>
              {error && <div className="admin-error" style={{ marginBottom: '1rem', color: '#ff5a6e' }}>{error}</div>}

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
          </>
        ) : (
          <>
            <div className="admin-panel card tilt" style={{ width: '100%', padding: '2rem' }}>
              <h3>{isEditingTeammate ? 'Edit Teammate' : 'Add New Teammate'}</h3>
              {error && <div className="admin-error" style={{ marginBottom: '1rem', color: '#ff5a6e' }}>{error}</div>}

              <form onSubmit={handleTeammateSubmit} className="admin-form grid-form">
                {/* Name */}
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={teammateFormData.name} onChange={handleTeammateChange} required className="admin-input" />
                </div>

                {/* Role */}
                <div className="form-group">
                  <label>Role</label>
                  <input name="role" value={teammateFormData.role} onChange={handleTeammateChange} required className="admin-input" placeholder="e.g. Lead Designer" />
                </div>

                {/* Bio */}
                <div className="form-group full-width">
                  <label>Biography</label>
                  <textarea name="bio" value={teammateFormData.bio} onChange={handleTeammateChange} required className="admin-input" rows="3" placeholder="Brief quote or description..." />
                </div>
                <div className="form-group full-width">
                  <label>Skills (comma separated)</label>
                  <input name="skills" value={teammateFormData.skills} onChange={handleTeammateChange} className="admin-input" placeholder="React, Figma, SEO" />
                </div>

                {/* Profile Picture */}
                <div className="form-group full-width">
                  <label>Profile Picture (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--line)' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '16px', background: teammateFormData.gradient, display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {teammateImagePreview ? (
                        <img src={teammateImagePreview} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                          {teammateFormData.name ? teammateFormData.name.split(' ').map(n => n[0]).join('') : '?'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleTeammateFileChange} 
                        style={{ display: 'none' }} 
                        id="teammate-img-file"
                      />
                      <label htmlFor="teammate-img-file" className="btn btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '20px' }}>
                        Choose Image
                      </label>
                      {teammateImagePreview && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setTeammateImage(null);
                            setTeammateImagePreview('');
                          }}
                          className="btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ff5a6e', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="form-group">
                  <label>GitHub Profile URL</label>
                  <input name="social_github" value={teammateFormData.socials.github} onChange={handleTeammateChange} className="admin-input" placeholder="https://github.com/username" />
                </div>

                <div className="form-group">
                  <label>LinkedIn Profile URL</label>
                  <input name="social_linkedin" value={teammateFormData.socials.linkedin} onChange={handleTeammateChange} className="admin-input" placeholder="https://linkedin.com/in/username" />
                </div>

                <div className="form-group">
                  <label>Instagram URL</label>
                  <input name="social_instagram" value={teammateFormData.socials.instagram} onChange={handleTeammateChange} className="admin-input" placeholder="https://instagram.com/username" />
                </div>

                <div className="form-group">
                  <label>Dribbble URL</label>
                  <input name="social_dribbble" value={teammateFormData.socials.dribbble} onChange={handleTeammateChange} className="admin-input" placeholder="https://dribbble.com/username" />
                </div>

                {/* Gradient Background selection */}
                <div className="form-group">
                  <label>Avatar Gradient Preset</label>
                  <select name="gradient" value={teammateFormData.gradient} onChange={handleTeammateChange} className="admin-input" style={{ background: '#0a1426', color: '#fff' }}>
                    <option value="linear-gradient(135deg, #2b7bff, #36d3ff)">Blue / Cyan (Default)</option>
                    <option value="linear-gradient(135deg, #ff5a6e, #ff2e57)">Red / Pink</option>
                    <option value="linear-gradient(135deg, #6f8bff, #9fd2ff)">Violet / Ice</option>
                    <option value="linear-gradient(135deg, #ff9f43, #ff5252)">Orange / Red</option>
                    <option value="linear-gradient(135deg, #10ac84, #1dd1a1)">Emerald / Teal</option>
                  </select>
                </div>

                {/* Sorting Order */}
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" name="order" value={teammateFormData.order} onChange={handleTeammateChange} className="admin-input" placeholder="0" />
                </div>

                <div className="form-actions full-width">
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? 'Saving…' : (isEditingTeammate ? 'Update Teammate' : 'Add Teammate')}
                  </button>
                  {isEditingTeammate && <button type="button" className="btn btn-ghost" onClick={resetTeammateForm}>Cancel</button>}
                </div>
              </form>
            </div>

            {/* Teammates list */}
            <div className="admin-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Current Teammates</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>ℹ Drag items to change display order</span>
              </div>
              <div className="admin-list">
                {teammates.length === 0 ? (
                  <div className="empty-state">No teammates added yet.</div>
                ) : (
                  teammates.map((m, idx) => (
                    <div
                      key={m._id}
                      className={`admin-list-item card ${draggedTeammateIndex === idx ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleTeammateDragStart(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => handleTeammateDragEnter(idx)}
                      onDragEnd={handleTeammateDragEnd}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.25rem',
                        opacity: draggedTeammateIndex === idx ? 0.4 : 1,
                        cursor: 'grab'
                      }}
                    >
                      <div className="admin-item-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', cursor: 'grab' }} title="Drag to reorder">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                          </svg>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: m.gradient, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 'bold', overflow: 'hidden' }}>
                          {m.image ? (
                            <img src={m.image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            m.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {m.name}
                            <span className="cat-badge" style={{ background: 'rgba(54,211,255,.15)', color: 'var(--cyan)' }}>{m.role}</span>
                          </h4>
                          <p className="admin-item-desc" style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{m.bio}</p>
                        </div>
                      </div>
                      <div className="admin-item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleTeammateEdit(m)} className="btn btn-ghost btn-sm">Edit</button>
                        <button onClick={() => handleTeammateDelete(m._id)} className="btn btn-ghost btn-sm text-red">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Profile Picture Cropper Modal */}
      {showCropper && (
        <div className="cropper-modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 15, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '380px',
            padding: '2.25rem',
            background: 'var(--panel)',
            border: '1px solid var(--line-2)',
            borderRadius: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: 'var(--glow)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Sora, sans-serif' }}>Frame Profile Picture</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>Drag to position and slide to zoom.</p>
            
            {/* Square Crop Mask with Rounded Corners */}
            <div 
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                background: '#040914',
                border: '2px solid var(--cyan)',
                boxShadow: '0 0 20px rgba(54, 211, 255, 0.25)',
                cursor: 'move',
                userSelect: 'none',
                touchAction: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <img 
                src={rawImageSrc} 
                alt="Original" 
                draggable="false"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  maxHeight: '100%',
                  maxWidth: 'none',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              />
            </div>

            {/* Zoom Slider */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
                <span>Zoom Level</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--cyan)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setShowCropper(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '100px' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={applyCrop}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '100px' }}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
