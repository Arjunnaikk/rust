// components/BlogList.tsx
'use client'

import { useBlogProgram, BlogState } from './hooks/useAnchorQueries'
import { useWallet } from '@solana/wallet-adapter-react'
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'

export function BlogList() {
  const [createFormOpen, setCreateFormOpen] = useState(false)

  return (
    <div className="max-w-6xl mx-auto p-6 mt-[4em]">
      <header className="flex justify-between items-center mb-8">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="all">All Blogs</TabsTrigger>
              <TabsTrigger value="my">My Blogs</TabsTrigger>
              <TabsTrigger value="saved">Saved Blogs</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-4">
              <Link
                href="/create"
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 inline-block text-center"
              >
                Create Blog
              </Link>
            </div>
          </div>

          {createFormOpen && (
            <CreateBlogForm 
              onClose={() => setCreateFormOpen(false)}
              onSuccess={() => setCreateFormOpen(false)}
            />
          )}

          <TabsContent value="all">
            <BlogGrid filterType="all" />
          </TabsContent>
          
          <TabsContent value="my">
            <BlogGrid filterType="my" />
          </TabsContent>

          <TabsContent value="saved">
            <BlogGrid filterType="saved" />
          </TabsContent>
        </Tabs>
      </header>
    </div>
  )
}

function CreateBlogForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { createBlog } = useBlogProgram()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPrivate: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    try {
      await createBlog.mutateAsync(formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create blog:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Blog</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter blog title..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Write your blog content..."
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isPrivate" className="text-sm">Make this blog private</label>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createBlog.isPending}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createBlog.isPending ? 'Creating...' : 'Create Blog'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BlogGrid({ filterType }: { filterType: 'all' | 'my' | 'saved' }) {
  const { getAllBlogs } = useBlogProgram()
  const { publicKey } = useWallet()
  const { data: allBlogs, isLoading, error } = getAllBlogs

  // Filter and sort blogs based on tab selection
  const blogs = allBlogs?.filter(blog => {
    if (filterType === 'all') {
      // Show only public blogs for "All Blogs" tab
      return !blog.isPrivate
    } else if (filterType === 'my') {
      // Show only current user's blogs for "My Blogs" tab
      return publicKey && blog.creator.equals(publicKey)
    } else if (filterType === 'saved') {
      // For saved blogs, we'll need to check if user has saved each blog
      // This will be handled in the BlogCard component with save status
      return !blog.isPrivate || (publicKey && blog.creator.equals(publicKey))
    }
    return false
  })?.sort((a, b) => {
    if (filterType === 'all') {
      // Sort by like count (descending) for "All Blogs"
      const aLikes = a.likeCount.toNumber()
      const bLikes = b.likeCount.toNumber()
      if (aLikes !== bLikes) {
        return bLikes - aLikes
      }
      // If like counts are equal, sort by creation date (newest first)
      return b.createdAt.toNumber() - a.createdAt.toNumber()
    } else {
      // Sort by creation date (newest first) for other tabs
      return b.createdAt.toNumber() - a.createdAt.toNumber()
    }
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load blogs. Please try again.</p>
      </div>
    )
  }

  if (!blogs || blogs.length === 0) {
    const emptyMessage = filterType === 'all' 
      ? 'No public blogs found.' 
      : filterType === 'my'
      ? 'You haven\'t created any blogs yet. Create your first blog!'
      : 'You haven\'t saved any blogs yet. Save some blogs to see them here!'
    
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog: BlogState & { publicKey: PublicKey }) => (
        <BlogCard key={blog.publicKey.toString()} blog={blog} filterType={filterType} />
      ))}
    </div>
  )
}

function BlogCard({ blog, filterType }: { blog: BlogState & { publicKey: PublicKey }, filterType: 'all' | 'my' | 'saved' }) {
  const { publicKey } = useWallet()
  const { getLikeStatus, getSaveStatus, likeBlog, saveBlog, deleteBlog } = useBlogProgram()
  
  const { data: likeStatus } = getLikeStatus(blog.title, blog.creator)
  const { data: saveStatus } = getSaveStatus(blog.title, blog.creator)
  
  const isOwner = publicKey && blog.creator.equals(publicKey)
  const isLiked = likeStatus?.isLiked || false
  const isSaved = saveStatus?.isSaved || false

  // For saved blogs tab, only show blogs that are actually saved
  if (filterType === 'saved' && !isSaved) {
    return null
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation when clicking like button
    if (!blog.isPrivate && !isOwner && publicKey) {
      try {
        await likeBlog.mutateAsync({ 
          blogTitle: blog.title, 
          blogAuthor: blog.creator 
        })
      } catch (error) {
        console.error('Failed to like blog:', error)
      }
    }
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation when clicking save button
    if (publicKey) {
      try {
        await saveBlog.mutateAsync({ 
          blogTitle: blog.title, 
          blogAuthor: blog.creator 
        })
      } catch (error) {
        console.error('Failed to save blog:', error)
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent the Link navigation
    e.stopPropagation() // Stop event bubbling
    
    if (isOwner && confirm('Are you sure you want to delete this blog?')) {
      try {
        console.log('Deleting blog:', blog.title)
        await deleteBlog.mutateAsync(blog.title)
        console.log('Blog deleted successfully')
      } catch (error) {
        console.error('Failed to delete blog:', error)
      }
    }
  }

  return (
    <Link href={`/blog/${blog.publicKey.toString()}`}>
      <div className="bg-zinc-200 rounded-lg shadow-md border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-zinc-900 text-2xl font-bold line-clamp-2">{blog.title}</h3>
            <div className="flex gap-2">
              {blog.isPrivate && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  Private
                </span>
              )}
              {filterType === 'saved' && (
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm">
                  Saved
                </span>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 line-clamp-3">
            {blog.content}
          </p>
          
          <div className="text-sm text-gray-500 mb-4">
            <p>By: {blog.creator.toString().slice(0, 8)}...</p>
            <p className='flex justify-end' >{new Date(blog.createdAt.toNumber() * 1000).toLocaleDateString()}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {!blog.isPrivate && !isOwner && (
                <button
                  onClick={handleLike}
                  disabled={likeBlog.isPending}
                  className={`bg-zinc-200 flex items-center gap-1 px-3 py-1 rounded ${
                    isLiked 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  ❤ {blog.likeCount.toString()}
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={saveBlog.isPending}
                className={`bg-zinc-200 px-3 py-1 rounded ${
                  isSaved 
                    ? 'bg-blue-100 text-zinc-900' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                }`}
              >
                {isSaved ? <BookmarkCheck /> : <Bookmark />}
              </button>
            </div>
            
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleteBlog.isPending}
                className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                <Trash2 />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}