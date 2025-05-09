import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editPost, setEditPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate('/sign-in');
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://cs2-hm11-beta.vercel.app/posts?page=${currentPage}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            return navigate('/sign-in');
          }
          throw new Error('Failed to fetch posts');
        }
        const data = await res.json();
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setTotalPages(data.totalPages); // assuming your API sends this
      } catch (err) {
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [token, navigate, currentPage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/sign-in');
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`https://cs2-hm11-beta.vercel.app/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete post');
      setPosts(posts.filter(post => post._id !== postId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, content } = newPost;
    if (!title || !content) return setError('Title and content are required');
    try {
      const url = editPost
        ? `https://cs2-hm11-beta.vercel.app/posts/${editPost._id}`
        : 'https://cs2-hm11-beta.vercel.app/posts';
      const method = editPost ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      setPosts(editPost ? posts.map(p => p._id === editPost._id ? data.post : p) : [data.post, ...posts]);
      setEditPost(null);
      setNewPost({ title: '', content: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!token)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-6">Please Sign In</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Link to="/sign-in" className="block px-4 py-2 bg-blue-600 text-white rounded mb-3 hover:bg-blue-700">Sign In</Link>
          <Link to="/sign-up" className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Sign Up</Link>
        </div>
      </div>
    );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading posts...</div>;

  const userId = JSON.parse(atob(token.split('.')[1]))?.userId;
  const userEmail = JSON.parse(atob(token.split('.')[1]))?.email;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Blog App</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{userEmail}</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editPost ? 'Edit Post' : 'Create New Post'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="title" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder="Post Title" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500" required />
            <textarea name="content" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} placeholder="Write your post content here..." className="w-full p-3 border rounded h-40 focus:ring-2 focus:ring-blue-500" required />
            <div className="flex space-x-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editPost ? 'Update Post' : 'Publish Post'}</button>
              {editPost && (
                <button type="button" onClick={() => { setEditPost(null); setNewPost({ title: '', content: '' }); }} className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
              )}
            </div>
          </form>
        </div>

        <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
        {!posts.length ? (
          <p className="text-gray-500">No posts yet. Create your first post!</p>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <div key={post._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                  <p className="whitespace-pre-line mb-4">{post.content}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Posted by: {post.author?.name || 'Unknown'}</span>
                    {post.author?._id === userId && (
                      <div className="space-x-2">
                        <button onClick={() => { setEditPost(post); setNewPost({ title: post.title, content: post.content }); }} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                        <button onClick={() => handleDelete(post._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50">Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
