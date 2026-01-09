import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Inventories } from './pages/Inventories';
import { Credentials } from './pages/Credentials';
import { Templates } from './pages/Templates';
import { Jobs } from './pages/Jobs';
import { Schedules } from './pages/Schedules';
import { Audit } from './pages/Audit';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="inventories" element={<Inventories />} />
            <Route path="credentials" element={<Credentials />} />
            <Route path="templates" element={<Templates />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="audit" element={<Audit />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
