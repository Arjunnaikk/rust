"use client"

import { useBlogProgram, BlogState } from '@/components/hooks/useAnchorQueries'
import { useWallet } from '@solana/wallet-adapter-react'
import { useParams, useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Heart, Trash2, ArrowLeft, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'

const BlogDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const { getAllBlogs, getLikeStatus, getSaveStatus, likeBlog, saveBlog, deleteBlog } = useBlogProgram()
  const [blog, setBlog] = useState<(BlogState & { publicKey: PublicKey }) | null>(null)
  const [loading, setLoading] = useState(true)

  const blogId = params.id as string

  const { data: blogs } = getAllBlogs

  useEffect(() => {
    if (blogs && blogId) {
      const foundBlog = blogs.find(b => b.publicKey.toString() === blogId)
      setBlog(foundBlog || null)
      setLoading(false)
    }
  }, [blogs, blogId])

  const { data: likeStatus } = getLikeStatus(blog?.title || '', blog?.creator)
  const { data: saveStatus } = getSaveStatus(blog?.title || '', blog?.creator)

  const isOwner = publicKey && blog && blog.creator.equals(publicKey)
  const isLiked = likeStatus?.isLiked || false
  const isSaved = saveStatus?.isSaved || false

  const handleLike = async () => {
    if (!blog?.isPrivate && !isOwner && publicKey && blog) {
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

  const handleSave = async () => {
    if (publicKey && blog) {
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

  const handleDelete = async () => {
    if (isOwner && blog && confirm('Are you sure you want to delete this blog?')) {
      try {
        await deleteBlog.mutateAsync(blog.title)
        router.push('/')
      } catch (error) {
        console.error('Failed to delete blog:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zinc-900"></div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Blog Not Found</h1>
        <Button onClick={() => router.push('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-10 bg-zinc-950">
      <div className="relative max-w-4xl mx-auto px-6 py-8">
        {/* Header */}

        <div className='absolute right-10 top-9 z-1 my-1 bg-zinc-800 w-[9em] rounded-xl'>
            <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="flex items-center gap-2 text-white hover:bg-zinc-800 story-script-regular"
          >
            <ArrowLeft className="" />
            Back to Blogs
          </Button>
        </div>
        {/* Blog Content */}
        <article className="relative bg-zinc-200 rounded-lg shadow-sm border border-zinc-300 p-8 mb-6">
          <header className="mb-6">
            <div className="absolute top-2 left-4 bg-zinc-800 rounded-4xl">
          
          {blog.isPrivate && (
            <span className="bg-zinc-700 text-zinc-200 px-3 py-1 rounded-full text-sm">
              Private Blog
            </span>
          )}
        </div>
            <div className='flex flex-row justify-between mt-2'>
            <h1 className="text-4xl font-bold text-zinc-900 mb-4 leading-tight story-script-regular">
              {blog.title}
            </h1>
            <div className="flex items-center gap-4 justify-between">
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
            
            {publicKey && (
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
            )}
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
            <div className="flex items-center justify-between text-sm text-zinc-600 border-b border-zinc-300 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p>Author: {blog.creator.toString().slice(0, 8)}...{blog.creator.toString().slice(-4)}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(blog.creator.toString())}
                    className="p-1 hover:bg-zinc-300 rounded transition-colors"
                    title="Copy full address"
                  >
                    <Copy className="h-4 w-4 text-zinc-600" />
                  </button>
                </div>
                <p>{new Date(blog.createdAt.toNumber() * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>{blog.likeCount.toString()} likes</span>
              </div>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-zinc-800 leading-relaxed story-script-regular text-xl">
              {blog.content}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export default BlogDetailPage
