"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import React, { useState } from 'react'
import { useBlogProgram } from '@/components/hooks/useAnchorQueries'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const CreatePage = () => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    isPrivate: false,
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const { createBlog } = useBlogProgram()
  const router = useRouter()

  const handlePublish = async () => {
    // Validate form
    if (!form.title.trim()) {
      toast.error("Please enter a blog title")
      return
    }
    
    if (!form.content.trim()) {
      toast.error("Please enter blog content")
      return
    }

    try {
      setIsPublishing(true)
      
      // Create the blog
      await createBlog.mutateAsync({ title: form.title.trim(), content: form.content.trim(), isPrivate: false })
      
      toast.success("Blog published successfully!")
      
      // Reset form
      setForm({ title: "", content: "", isPrivate: false })

      // Redirect to home or blog list
      router.push('/')
      
    } catch (error) {
      console.error("Failed to publish blog:", error)
      toast.error("Failed to publish blog. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className='flex flex-col w-full h-[86vh] bg-zinc-950 mt-[9vh]'>
      {/* Header with title input and controls */}
      <div className='bg-zinc-950 flex flex-row px-4 gap-4 items-center py-2 '>
        <div className='w-full flex flex-row gap-2'>
          <Input 
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-2xl font-semibold border-none shadow-none focus-visible:ring-1 py-5 px-3 rounded-none bg-transparent text-white placeholder:text-zinc-400"
            placeholder="Enter blog title..."
            maxLength={100}
          />
          {/* <div className="text-xs text-zinc-500 px-3">
            {form.title.length}/100 characters
          </div> */}
        <div className='flex flex-3'>
          <Button 
            type="button"
            onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}
            className='h-10 px-6 rounded-none font-semibold ml-2 bg-zinc-200'
          >
            {form.isPrivate ? `Make Public` : 'Make Private'}
          </Button>
          {/* <label className="text-zinc-400">{form.isPrivate ? 'This blog is private' : 'This blog is public'}</label> */}
        </div>
        </div>
        <div className='flex gap-2 items-center'>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing || !form.title.trim() || !form.content.trim() || form.title.length > 100 || form.content.length > 1000}
            className='h-10 px-6 rounded-none font-semibold' 
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
      
      {/* Main notepad area */}
      <div className='flex-1 p-4 flex flex-col'>
        <div className='flex-1 flex flex-col'>
          <Textarea 
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-none flex-1 resize-none border-none shadow-none focus-visible:ring-0 bg-white p-6 text-base leading-relaxed"
            placeholder="Start writing your blog content here..."
            maxLength={1000}
          />
          <div className="text-xs text-zinc-400 mt-2 text-right ">
            {form.content.length}/1000 characters
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePage