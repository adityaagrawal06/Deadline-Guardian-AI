import { useState, useEffect } from 'react';

export default function ProofUpload({ taskId, taskProofStatus, onProofUploaded }) {
  const [mockImageUrl, setMockImageUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [proofType, setProofType] = useState('url'); // 'url', 'text', 'file'

  useEffect(() => {
    fetchProofs();
  }, [taskId]);

  const fetchProofs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proofs/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProofs(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch proofs", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMockImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (proofType !== 'text' && !mockImageUrl) return;
    if (proofType === 'text' && !textContent) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const payload = { taskId };
      if (proofType === 'text') {
        payload.content = textContent;
      } else {
        payload.imageUrl = mockImageUrl;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proofs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setProofs([data.proof, ...proofs]);
        setMockImageUrl('');
        setTextContent('');
        if (onProofUploaded) onProofUploaded(data.updatedTask);
      }
    } catch (error) {
      console.error("Failed to upload proof", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="font-bold text-lg mb-4 text-left">Task Proofs</h3>
      
      {/* Upload Form */}
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setProofType('url')} className={`px-3 py-1 text-xs font-bold uppercase rounded ${proofType === 'url' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'}`}>URL Link</button>
          <button type="button" onClick={() => setProofType('text')} className={`px-3 py-1 text-xs font-bold uppercase rounded ${proofType === 'text' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'}`}>Paste Text</button>
          <button type="button" onClick={() => setProofType('file')} className={`px-3 py-1 text-xs font-bold uppercase rounded ${proofType === 'file' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'}`}>Upload File</button>
        </div>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-2">
          {proofType === 'url' && (
            <input 
              type="url" 
              value={mockImageUrl} 
              onChange={(e) => setMockImageUrl(e.target.value)} 
              placeholder="Paste a link to your work (e.g. GitHub URL, Google Doc)" 
              required 
              className="flex-1 rounded-md border border-border bg-bg p-2 text-text"
            />
          )}
          {proofType === 'text' && (
            <textarea 
              value={textContent} 
              onChange={(e) => setTextContent(e.target.value)} 
              placeholder="Paste your code snippet or essay text here..." 
              required 
              rows="3"
              className="flex-1 rounded-md border border-border bg-bg p-2 text-text text-sm resize-y"
            />
          )}
          {proofType === 'file' && (
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange} 
              required 
              className="flex-1 rounded-md border border-border bg-bg p-2 text-text file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          )}
          <button 
            type="submit" 
            disabled={loading || (proofType !== 'text' && !mockImageUrl) || (proofType === 'text' && !textContent)}
            className="rounded-md bg-primary px-4 py-2 text-white font-medium hover:bg-accent disabled:opacity-50 h-fit"
          >
            {loading ? 'Validating...' : 'Submit Proof'}
          </button>
        </form>
      </div>

      {/* Proof History */}
      <div className="space-y-4">
        {proofs.length === 0 ? (
          <p className="text-sm text-text-muted text-left">No proofs submitted yet.</p>
        ) : (
          proofs.map(proof => {
            // Derived Metrics
            const strengthLabel = proof.confidence >= 80 ? '🟢 Strong' : proof.confidence >= 50 ? '🟡 Moderate' : '🔴 Weak';
            const credibilityScore = Math.floor(proof.confidence * 0.95); // Just a demo metric

            return (
              <div key={proof._id} className="rounded-xl border border-border bg-surface p-4 text-left shadow-[var(--shadow)] relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${proof.validationStatus === 'VALID' ? 'bg-green-500' : proof.validationStatus === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-1">AI Proof Validation</h4>
                    <span className="text-xs text-text-muted">{new Date(proof.createdAt).toLocaleString()}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-widest ${proof.validationStatus === 'VALID' ? 'bg-green-100 text-green-700 border border-green-200' : proof.validationStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {proof.validationStatus === 'VALID' ? 'Verified' : proof.validationStatus === 'PARTIAL' ? 'Incomplete' : 'Rejected'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  {proof.imageUrl ? (
                    <img src={proof.imageUrl} alt="Proof" className="w-32 h-32 object-cover rounded-lg border border-border bg-bg shadow-sm shrink-0" />
                  ) : (
                    <div className="w-32 h-32 rounded-lg border border-border bg-bg shadow-sm shrink-0 flex items-center justify-center p-2">
                      <span className="text-[10px] text-text-muted text-center font-mono line-clamp-6">{proof.content}</span>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-bg p-3 rounded-lg border border-border shadow-inner">
                        <span className="block text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Quality Grade</span>
                        <span className={`text-lg font-extrabold ${proof.qualityGrade === 'A' || proof.qualityGrade === 'B' ? 'text-green-600 dark:text-green-400' : proof.qualityGrade === 'C' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{proof.qualityGrade || 'N/A'}</span>
                      </div>
                      <div className="bg-bg p-3 rounded-lg border border-border shadow-inner">
                        <span className="block text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Evidence Strength</span>
                        <span className={`text-lg font-extrabold ${proof.confidence >= 80 ? 'text-green-600 dark:text-green-400' : proof.confidence >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{strengthLabel}</span>
                      </div>
                      <div className="bg-bg p-3 rounded-lg border border-border shadow-inner">
                        <span className="block text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Confidence</span>
                        <span className="text-lg font-extrabold text-primary">{proof.confidence}%</span>
                      </div>
                    </div>

                    {proof.validationReason && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50 mt-2">
                        <span className="block text-[10px] text-blue-700 dark:text-blue-400 uppercase tracking-wider font-bold mb-1">🤖 AI Observation</span>
                        <p className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed font-medium">
                          {proof.validationReason}
                        </p>
                      </div>
                    )}
                    {proof.observations && proof.observations.length > 0 && (
                      <div className="text-sm">
                        <span className="font-bold text-text-muted">Detected Elements:</span>
                        <ul className="list-disc pl-4 mt-1 text-text-muted">
                          {proof.observations.map((obs, i) => <li key={i}>{obs}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
