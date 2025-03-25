import React, { useEffect, useState } from 'react';
import './App.css';
// please read the README.md file first there's some background info needed first before starting.
function App() {
  // State for managing transformers data
  const [transformers, setTransformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [formState, setFormState] = useState({ name: '', faction: '', alt_mode: '', weapons: '', image: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('transformers');
  const [expandedId, setExpandedId] = useState(null);

  // Fetch transformers data when the component mounts
  useEffect(() => {
    fetch('http://localhost:8000/transformers')
      .then((res) => res.json())
      .then((data) => {
        setTransformers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle filtering transformers based on user input
  const handleFilterChange = (e) => setFilter(e.target.value);

  // Filters transformers dynamically based on search input
  const filteredTransformers = transformers.filter((t) =>
    [t.faction, t.name, t.alt_mode, ...(t.weapons || [])]
      .join(' ')
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  // Toggle the form visibility and reset form state
  const toggleForm = () => {
    setIsEditing(false);
    setFormState({ name: '', faction: '', alt_mode: '', weapons: '', image: '' });
    setActiveTab('addNew'); // Ensure the correct tab is active
  };

  // Handles editing a transformer
  const handleEdit = (id) => {
    const transformer = transformers.find((t) => t.id === id);
    if (!transformer) return;

    setFormState({
      name: transformer.name,
      faction: transformer.faction,
      alt_mode: transformer.alt_mode,
      weapons: transformer.weapons ? transformer.weapons.join(', ') : '', // Ensure array is converted properly
      image: transformer.image,
    });

    setIsEditing(true);
    setEditId(id);
    setActiveTab('addNew'); // Switch to the form tab when editing
  };

  // Handles deleting a transformer
  const handleDelete = (id) => {
    fetch(`http://localhost:8000/transformers/${id}`, { method: 'DELETE' })
      .then(() => setTransformers(transformers.filter((t) => t.id !== id)))
      .catch(console.error);
  };

  // Handles saving a new or edited transformer
  const handleSave = () => {
    if (Object.values(formState).some((val) => !val.trim())) return; // Prevent empty submissions

    const updatedTransformer = {
      ...formState,
      weapons: formState.weapons ? formState.weapons.split(',').map((w) => w.trim()) : [], // Convert back to an array
    };

    const requestUrl = `http://localhost:8000/transformers${isEditing ? `/${editId}` : ''}`;
    const requestMethod = isEditing ? 'PUT' : 'POST';

    fetch(requestUrl, {
      method: requestMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTransformer),
    })
      .then((res) => res.json())
      .then((newData) => {
        setTransformers((prev) =>
          isEditing ? prev.map((t) => (t.id === editId ? newData : t)) : [...prev, newData]
        );
        setIsEditing(false);
        setActiveTab('transformers'); // Switch back to the transformers list after saving
        setFormState({ name: '', faction: '', alt_mode: '', weapons: '', image: '' }); // Reset form
      })
      .catch(console.error);
  };

  if (loading) return <div>Loading Transformers...</div>;
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div className="App">
      <h1>Transformers Database</h1>

      {/* Tab Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab('transformers')} className={activeTab === 'transformers' ? 'active' : ''}>
          Transformers
        </button>
        <button onClick={toggleForm} className={activeTab === 'addNew' ? 'active' : ''}>
          {isEditing ? 'Edit Transformer' : 'Add New Transformer'}
        </button>
      </div>

      {/* Transformers List */}
      {activeTab === 'transformers' && (
        <div>
          <input type="text" placeholder="Search by name, faction, etc..." value={filter} onChange={handleFilterChange} />

          {filteredTransformers.length === 0 ? (
            <p>No transformers found.</p>
          ) : (
            <div className="transformer-list">
              {filteredTransformers.map((t) => (
                <div key={t.id} className="transformer-card">
                  {/* Card Header */}
                  <div onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    <h2>{t.name}</h2>
                    <p><strong>Faction:</strong> {t.faction}</p>
                  </div>

                  {/* Expandable Section */}
                  {expandedId === t.id && (
                    <div>
                      <p><strong>Alt Mode:</strong> {t.alt_mode}</p>
                      <p><strong>Weapons:</strong> {t.weapons ? t.weapons.join(', ') : 'None'}</p>
                      <img src={t.image} alt={t.name} width="200" height="200" />
                    </div>
                  )}

                  {/* Edit and Delete Buttons */}
                  <button className="edit" onClick={() => handleEdit(t.id)}>Edit</button>
                  <button className="delete" onClick={() => handleDelete(t.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Transformer Form */}
      {activeTab === 'addNew' && (
        <div>
          <h2>{isEditing ? 'Edit Transformer' : 'Add New Transformer'}</h2>

          <input type="text" placeholder="Name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
          <input type="text" placeholder="Faction" value={formState.faction} onChange={(e) => setFormState({ ...formState, faction: e.target.value })} />
          <input type="text" placeholder="Alt Mode" value={formState.alt_mode} onChange={(e) => setFormState({ ...formState, alt_mode: e.target.value })} />
          <input type="text" placeholder="Weapons (comma separated)" value={formState.weapons} onChange={(e) => setFormState({ ...formState, weapons: e.target.value })} />
          <input type="text" placeholder="Image URL" value={formState.image} onChange={(e) => setFormState({ ...formState, image: e.target.value })} />

          <button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Add Transformer'}</button>
          <button className="cancel" onClick={() => setActiveTab('transformers')}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default App;
