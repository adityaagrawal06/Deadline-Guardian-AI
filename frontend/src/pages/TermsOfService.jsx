import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#050505] text-text font-sans p-6 sm:p-12 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Login
        </Link>
        
        <div className="rounded-[32px] bg-white/[0.02] border border-white/[0.05] p-8 sm:p-12 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 mb-8">
            Terms of Service
          </h1>
          
          <div className="space-y-8 text-text-muted text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using Deadline Guardian AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
              <p>Deadline Guardian AI provides task management and AI-driven planning tools. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. AI-Generated Content</h2>
              <p>The AI orchestration (Planner, Realist, Risk, Coordinator agents) provides recommendations and subtask generation based on your input. You acknowledge that AI-generated schedules and risk scores are advisory in nature and we are not liable for missed deadlines, academic failure, or other consequences resulting from reliance on the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Google API Integration</h2>
              <p>Our service integrates with Google Authentication. By using the login service, you authorize us to access the basic profile information provided by your Google account. We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Limitation of Liability</h2>
              <p>In no event shall Deadline Guardian AI be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.</p>
            </section>
            
            <p className="text-xs mt-12 pt-8 border-t border-white/10">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
