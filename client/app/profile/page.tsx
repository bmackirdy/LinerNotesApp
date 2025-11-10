export default function ProfilePage() {
  // This will be populated with real user data later
  const user = {
    name: "Vinyl Enthusiast",
    email: "collector@example.com",
    memberSince: "2023",
    collectionCount: 0,
    wishlistCount: 0
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500 mb-4 md:mb-0 md:mr-8">
            {user.name.charAt(0)}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <p className="text-sm text-gray-500">Member since {user.memberSince}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Collection Stats</h2>
          <p className="text-3xl font-bold">{user.collectionCount}</p>
          <p className="text-gray-600">Albums in collection</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Wishlist</h2>
          <p className="text-3xl font-bold">{user.wishlistCount}</p>
          <p className="text-gray-600">Albums in wishlist</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
