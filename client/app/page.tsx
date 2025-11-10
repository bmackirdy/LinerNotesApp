import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Welcome to Liner Notes</h1>
      <p className="text-xl mb-8">Your personal vinyl collection manager and wishlist tracker</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Link 
          href="/collection" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">My Collection</h2>
          <p>View and manage your vinyl collection</p>
        </Link>
        
        <Link 
          href="/wishlist" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Wishlist</h2>
          <p>Keep track of albums you want</p>
        </Link>
        
        <Link 
          href="/artists" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Artists</h2>
          <p>Browse by artist</p>
        </Link>
        
        <Link 
          href="/labels" 
          className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">Labels</h2>
          <p>Browse by record label</p>
        </Link>
      </div>
    </div>
  );
}
