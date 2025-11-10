export default function LabelsPage() {
  // This will be populated with real data later
  const labels = [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Record Labels</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search labels..."
            className="px-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {labels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No labels found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Label cards will be mapped here */}
        </div>
      )}
    </div>
  );
}
