import { useState } from 'react';

export default function TaskForm({ onTaskAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Work',
    deadline: '',
    estimatedHours: '',
    priority: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const newTask = await res.json();
        onTaskAdded(newTask);
        setFormData({ title: '', description: '', category: 'Work', deadline: '', estimatedHours: '', priority: 'medium' });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const setQuickDate = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(23, 59, 0, 0); // Set to 11:59 PM by default
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
    setFormData({ ...formData, deadline: localISOTime });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-xl bg-surface p-6 shadow-[var(--shadow)] text-left">
      <h2 className="mb-4 text-xl font-bold">Create New Task</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Task Title" required className="rounded-md border border-border bg-bg p-2 text-text" />
        
        <div className="flex flex-col gap-2">
          <input name="deadline" type="datetime-local" value={formData.deadline} onChange={handleChange} required className="rounded-md border border-border bg-bg p-2 text-text w-full" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setQuickDate(0)} className="flex-1 text-[10px] font-bold uppercase tracking-wider bg-bg border border-border text-text-muted hover:text-text hover:bg-surface py-1 rounded transition-colors">Today (11:59 PM)</button>
            <button type="button" onClick={() => setQuickDate(1)} className="flex-1 text-[10px] font-bold uppercase tracking-wider bg-bg border border-border text-text-muted hover:text-text hover:bg-surface py-1 rounded transition-colors">Tomorrow (11:59 PM)</button>
          </div>
        </div>
        <select name="category" value={formData.category} onChange={handleChange} className="rounded-md border border-border bg-bg p-2 text-text">
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Groceries">Groceries</option>
          <option value="Academic">Academic</option>
          <option value="Other">Other</option>
        </select>
        <select name="priority" value={formData.priority} onChange={handleChange} className="rounded-md border border-border bg-bg p-2 text-text">
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <input name="estimatedHours" type="number" min="0" step="0.5" value={formData.estimatedHours} onChange={handleChange} placeholder="Estimated Hours" required className="rounded-md border border-border bg-bg p-2 text-text" />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description (optional)" className="rounded-md border border-border bg-bg p-2 text-text md:col-span-2" rows="2" />
      </div>
      <button type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-accent">Add Task</button>
    </form>
  );
}
