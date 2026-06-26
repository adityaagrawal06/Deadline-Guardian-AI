import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RescueDashboard from './pages/RescueDashboard';
import TermsOfService from './pages/TermsOfService';
import Signup from './pages/Signup';

import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/rescue" element={<Layout><RescueDashboard /></Layout>} />
      <Route path="/terms" element={<TermsOfService />} />
    </Routes>
  );
}

export default App;
