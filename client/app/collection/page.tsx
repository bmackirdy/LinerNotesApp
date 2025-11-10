export default function CollectionPage() {
  // This will be populated with real data later
  const collectionItems = [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Collection</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Album
        </button>
      </div>

      {collectionItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your collection is empty</p>
          <button className="text-blue-600 hover:underline">Add your first album</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Album cards will be mapped here */}
        </div>
      )}
    </div>
  );
}
