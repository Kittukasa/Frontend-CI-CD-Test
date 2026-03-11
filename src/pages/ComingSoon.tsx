import { Link } from 'react-router-dom';

interface ComingSoonProps {
  featureName?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => {
  const label = featureName ?? 'This feature';

  return (
    <div className="min-h-screen bg-[#e8f0fe] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-blue-500 uppercase">Coming Soon</p>
          <h1 className="text-3xl font-bold text-gray-900">{label} is almost here</h1>
          <p className="text-gray-600">
            We&apos;re polishing the last details before sharing it with you. In the meantime,
            explore everything else inside your Billbox dashboard.
          </p>
        </div>

        <Link
          to="/analytics"
          replace
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
