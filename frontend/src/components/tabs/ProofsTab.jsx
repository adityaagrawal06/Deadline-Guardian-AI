import { FileCheck2, SearchX } from 'lucide-react';
import { useState } from 'react';
import ProofUpload from '../ProofUpload';

export default function ProofsTab({ tasks, onUploadSuccess }) {
  const [proofTab, setProofTab] = useState('pending');
  
  const tasksNeedingProof = tasks.filter(t => {
    if (t.status !== 'pending' || t.riskScore >= 100) return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    return deadline > now;
  });
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="flex-1 overflow-auto animate-fade-in p-2 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-3 rounded-2xl">
              <FileCheck2 size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-text">Proofs Hub</h1>
              <p className="text-text-muted">Upload and review your task completion evidence.</p>
            </div>
          </div>
          <div className="flex bg-surface border border-border rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setProofTab('pending')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${proofTab === 'pending' ? 'bg-bg text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              Action Required
            </button>
            <button 
              onClick={() => setProofTab('verified')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${proofTab === 'verified' ? 'bg-bg text-green-600 shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              Verified Proofs
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {proofTab === 'pending' && (
            <section className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Action Required
              </h2>
              <div className="space-y-4">
                {tasksNeedingProof.length > 0 ? (
                  tasksNeedingProof.map(task => (
                    <div key={task._id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold mb-2">{task.title}</h3>
                      <ProofUpload taskId={task._id} onUploadSuccess={onUploadSuccess} />
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 border border-dashed border-border rounded-2xl">
                    <p className="text-text-muted font-bold">You are all caught up!</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {proofTab === 'verified' && (
            <section className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified Proofs
              </h2>
              <div className="space-y-4">
                {completedTasks.length > 0 ? (
                  completedTasks.map(task => (
                    <div key={task._id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-16 h-16 bg-bg rounded-lg border border-border overflow-hidden shrink-0">
                        {task.proofs && task.proofs.length > 0 && task.proofs[0].fileUrl ? (
                          <img src={task.proofs[0].fileUrl} alt="Proof" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-500">
                            <FileCheck2 size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate line-through text-text-muted">{task.title}</h3>
                        <p className="text-xs text-text-muted mt-1">Verified on {new Date(task.updatedAt || task.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 border border-dashed border-border rounded-2xl flex flex-col items-center">
                    <SearchX className="text-border mb-2" size={32} />
                    <p className="text-text-muted font-bold">No verified proofs yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
