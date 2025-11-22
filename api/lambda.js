// Initialize Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client for operations that bypass RLS
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase; // Fallback to regular client if service role key not set

// Helper function to parse body
function parseBody(event) {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

// Native Lambda API Router
module.exports.handler = async (event, context) => {
  const path = event.pathParameters?.proxy || '';
  const method = event.requestContext?.http?.method || 'GET';
  console.log('Lambda invoked:', path, method);
  console.log('Version: 2.0 - Search debug');
  console.log('Full event:', JSON.stringify(event, null, 2));
  
  // Add CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
  
  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // API Routes
    
    // Root endpoint
    if (path === '' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Liner Notes API is working!',
          environment: process.env.NODE_ENV
        })
      };
    }
    
    // Health check
    if (path === 'health' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok' })
      };
    }
    
    // Debug endpoint
    if (path === 'debug' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Debug endpoint working!',
          version: '2.0',
          environment: process.env.NODE_ENV,
          supabase_url: process.env.SUPABASE_URL ? 'Present' : 'Missing',
          supabase_key: process.env.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
          supabase_client: supabase ? 'Created' : 'Null'
        })
      };
    }
    
    // Simple search test
    if (path === 'search-test' && method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('albums')
          .select('title')
          .limit(5);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: !error,
            count: data?.length || 0,
            albums: data || [],
            error: error?.message
          })
        };
      } catch (err) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: err.message })
        };
      }
    }
    
    // Auth routes
    if (path.startsWith('v1/auth/')) {
      const authPath = path.replace('v1/auth/', '');
      
      if (authPath === 'login' && method === 'POST') {
        const body = parseBody(event);
        // Temporarily return mock login
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Login successful (mock)',
            user: {
              id: 'mock-id',
              email: body.email,
              created_at: new Date().toISOString()
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
              expires_at: Date.now() + 3600000
            }
          })
        };
      }
      
      if (authPath === 'register' && method === 'POST') {
        const body = parseBody(event);
        try {
          // Basic registration - in a real app, you'd use Supabase Auth
          const { email, password, displayName } = body;
          
          if (!email || !password) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Email and password required' })
            };
          }
          
          // For now, return a mock success response
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ 
              message: 'Registration successful',
              user: { email, displayName: displayName || email },
              token: 'mock-jwt-token'
            })
          };
        } catch (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Registration failed' })
          };
        }
      }
      
      if (authPath === 'login' && method === 'POST') {
        const body = parseBody(event);
        try {
          const { email, password } = body;
          
          if (!email || !password) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Email and password required' })
            };
          }
          
          // Temporarily return mock login
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              message: 'Login successful (mock)',
              user: {
                id: 'mock-id',
                email: email,
                created_at: new Date().toISOString()
              },
              session: {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh',
                expires_at: Date.now() + 3600000
              }
            })
          };
        } catch (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Login failed' })
          };
        }
      }
    }
    
    // Test route
    if (path === 'dev/test' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Test route works!' })
      };
    }
    
    // Debug database contents
    if (path === 'dev/debug-data' && method === 'GET') {
      try {
        const [albums, artists, labels] = await Promise.all([
          supabase.from('albums').select('title, release_year').limit(10),
          supabase.from('artists').select('name').limit(10),
          supabase.from('labels').select('name').limit(10)
        ]);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            albums: albums.data || [],
            artists: artists.data || [],
            labels: labels.data || [],
            counts: {
              albums: albums.data?.length || 0,
              artists: artists.data?.length || 0,
              labels: labels.data?.length || 0
            }
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }
    }
    
    // Collection routes
    if (path === 'dev/v1/collections' && method === 'GET') {
      try {
        console.log('Collections route matched! Fetching collections...');
        
        // Simple collections query
        const { data: collections, error } = await supabase
          .from('collections')
          .select(`
            *,
            collection_albums (
              condition,
              notes,
              date_added,
              albums (
                title,
                release_year,
                cover_image_url,
                genre,
                labels (name),
                album_artists (
                  artists (name)
                )
              )
            )
          `)
          .limit(5);
        
        if (error) {
          console.error('Supabase error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch collections' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ collections })
        };
      } catch (error) {
        console.error('Collections error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Internal server error' })
        };
      }
    }
    
    // Wishlist routes
    if (path.startsWith('v1/wishlists') && method === 'GET') {
      try {
        // Get user's wishlists with albums
        const { data: wishlists, error } = await supabase
          .from('wishlists')
          .select(`
            *,
            wishlist_albums (
              priority,
              acquired,
              date_added,
              albums (
                title,
                release_year,
                cover_image_url,
                genre,
                labels (name),
                album_artists (
                  artists (name)
                )
              )
            )
          `);
        
        if (error) {
          console.error('Supabase error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch wishlists' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ wishlists })
        };
      } catch (error) {
        console.error('Wishlists error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Internal server error' })
        };
      }
    }
    
    // Search route (for your client spec)
    if (path.startsWith('dev/v1/search') && method === 'GET') {
      try {
        const query = event.queryStringParameters?.q || '';
        console.log('Search query received:', query);
        
        if (!query) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Search query is required' })
          };
        }
        
        // Search albums, artists, and labels
        console.log('Starting search for:', query);
        
        console.log('Searching albums with ilike:', `%${query}%`);
        const [albumsResult, artistsResult, labelsResult] = await Promise.all([
          // Search albums
          supabase
            .from('albums')
            .select(`
              *,
              labels (name),
              album_artists (
                artists (name)
              )
            `)
            .ilike('title', `%${query}%`)
            .limit(10),
          
          // Search artists
          supabase
            .from('artists')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(10),
          
          // Search labels
          supabase
            .from('labels')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5)
        ]);
        
        console.log('Search results:', {
          albums: albumsResult.data?.length || 0,
          artists: artistsResult.data?.length || 0,
          labels: labelsResult.data?.length || 0,
          albumsError: albumsResult.error,
          artistsError: artistsResult.error,
          labelsError: labelsResult.error
        });
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            query,
            albums: albumsResult.data || [],
            artists: artistsResult.data || [],
            labels: labelsResult.data || [],
            total: (albumsResult.data?.length || 0) + 
                   (artistsResult.data?.length || 0) + 
                   (labelsResult.data?.length || 0)
          })
        };
      } catch (error) {
        console.error('Search error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Internal server error' })
        };
      }
    }
    
    // Add album to collection
    if (path === 'dev/collections/albums' && method === 'POST') {
      // Check for authentication
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Please sign in to add to collection' })
        };
      }
      
      try {
        console.log('Add to collection route hit!');
        const { title, artist, label, year, cover_image_url } = JSON.parse(event.body);
        console.log('Received data:', { title, artist, label, year, cover_image_url });
        
        // Temporarily bypass authentication for testing
        const mockUser = { id: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' };
        console.log('Using mock user for testing:', mockUser.id);
        
        // Simplified approach - just add album to database
        console.log('Adding album to database...');
        
        // Check if album already exists
        let { data: existingAlbum } = await supabase
          .from('albums')
          .select('id')
          .eq('title', title)
          .maybeSingle();
          
        if (!existingAlbum) {
          console.log('Creating new album...');
          const { data: newAlbum, error: createError } = await supabase
            .from('albums')
            .insert({
              title,
              artist,
              release_date: year ? `${year}-01-01` : null,
              cover_image: cover_image_url
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Album creation error:', createError);
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'Failed to create album: ' + createError.message })
            };
          }
          
          console.log('Album created successfully:', newAlbum);
        } else {
          console.log('Album already exists:', existingAlbum);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Album added to collection' })
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }
    }
    
    // Add album to wishlist
    if (path === 'dev/wishlists/albums' && method === 'POST') {
      // Check for authentication
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'No authorization token provided' })
        };
      }
      
      try {
        const { title, artist, label, year, cover_image_url } = JSON.parse(event.body);
        
        // Get user from token
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);
        if (authError || !user) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid token' })
          };
        }
        
        // Get or create user profile
        let { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
          
        if (!profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({ auth_user_id: user.id, display_name: user.email })
            .select()
            .single();
          profile = newProfile;
        }
        
        // Get or create default wishlist
        let { data: wishlist } = await supabase
          .from('wishlists')
          .select('id')
          .eq('profile_id', profile.id)
          .eq('name', 'My Wishlist')
          .single();
          
        if (!wishlist) {
          const { data: newWishlist } = await supabase
            .from('wishlists')
            .insert({ profile_id: profile.id, name: 'My Wishlist' })
            .select()
            .single();
          wishlist = newWishlist;
        }
        
        // Create or get album
        let { data: album } = await supabase
          .from('albums')
          .select('id')
          .eq('title', title)
          .eq('release_year', year || null)
          .single();
          
        if (!album) {
          const { data: newAlbum } = await supabase
            .from('albums')
            .insert({
              title,
              release_year: year,
              genre: 'Unknown',
              cover_image_url
            })
            .select()
            .single();
          album = newAlbum;
        }
        
        // Add album to wishlist
        const { error: addError } = await supabase
          .from('wishlist_albums')
          .insert({
            wishlist_id: wishlist.id,
            album_id: album.id
          });
          
        if (addError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: addError.message })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Album added to wishlist' })
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }
    }
    
    // Debug: Return path info for debugging
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        debug: true,
        path_received: path,
        method: method,
        looking_for: 'dev/v1/collections',
        path_match: path === 'dev/v1/collections',
        starts_with: path.startsWith('dev/v1/collections')
      })
    };
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};