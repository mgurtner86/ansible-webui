import Layout from '../components/Layout';
import { Shield } from 'lucide-react';

export default function Audit() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-gray-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-600 mt-1">Track all system activities and changes</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Audit logging coming soon</h2>
          <p className="text-gray-500 mt-2">
            Complete audit trail of all user actions and system changes
          </p>
        </div>
      </div>
    </Layout>
  );
}
