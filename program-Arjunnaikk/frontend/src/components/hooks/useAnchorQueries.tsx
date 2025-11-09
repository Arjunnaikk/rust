'use client'

import { getMeblogProgram, getMeblogProgramId } from '../solana/anchor-provider'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'

// Types based on your IDL - matching exact field names
export interface BlogState {
  title: string
  content: string
  isPrivate: boolean
  creator: PublicKey
  likeCount: anchor.BN
  createdAt: anchor.BN
}

export interface LikeState {
  user: PublicKey
  blog: PublicKey
  isLiked: boolean
}

export interface SavedState {
  user: PublicKey
  blog: PublicKey
  savedAt: anchor.BN
  isSaved: boolean
}

export interface CreateBlogData {
  title: string
  content: string
  isPrivate: boolean
}

export function useBlogProgram() {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const queryClient = useQueryClient()
  const programId = useMemo(() => getMeblogProgramId(cluster as unknown as Cluster), [cluster])
  const program = useMemo(() => getMeblogProgram(provider, programId), [provider, programId])

  // Helper function to generate PDAs - matches Rust code exactly
  const getBlogPDA = (title: string, authority?: PublicKey): [PublicKey, number] => {
    const authorityKey = authority || provider.publicKey
    if (!authorityKey) throw new Error('Authority public key required')
    
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("blog"), 
        authorityKey.toBuffer(),
        Buffer.from(title, 'utf8')
      ],
      program.programId
    )
  }

  const getLikePDA = (user: PublicKey, blog: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("like"), user.toBuffer(), blog.toBuffer()],
      program.programId
    )
  }

  const getSavePDA = (user: PublicKey, blog: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("saved"), user.toBuffer(), blog.toBuffer()],
      program.programId
    )
  }

  // Helper function to refresh blog data
  const refreshBlogData = () => {
    queryClient.invalidateQueries({ queryKey: ['blogs', { cluster }] })
    queryClient.invalidateQueries({ queryKey: ['blog', { cluster }] })
    queryClient.invalidateQueries({ queryKey: ['like', { cluster }] })
    queryClient.invalidateQueries({ queryKey: ['save', { cluster }] })
  }

  // Query: Get all blogs
  const getAllBlogs = useQuery({
    queryKey: ['blogs', 'all', { cluster }],
    queryFn: async (): Promise<(BlogState & { publicKey: PublicKey })[]> => {
      try {
        const blogs = await program.account.blogState.all()
        return blogs.map(blog => ({
          title: blog.account.title,
          content: blog.account.content,
          isPrivate: blog.account.isPrivate,
          creator: blog.account.creator,
          likeCount: blog.account.likeCount,
          createdAt: blog.account.createdAt,
          publicKey: blog.publicKey
        }))
      } catch (error) {
        console.error('Error fetching blogs:', error)
        return []
      }
    },
    enabled: !!program
  })

  // Query: Get specific blog by title and author
  const useBlog = (title: string, authorPublicKey?: PublicKey) => {
    return useQuery({
      queryKey: ['blog', title, authorPublicKey?.toString(), { cluster }],
      queryFn: async (): Promise<BlogState | null> => {
        if (!title) return null
        try {
          const [blogPDA] = getBlogPDA(title, authorPublicKey || provider.publicKey)
          const blogAccount = await program.account.blogState.fetch(blogPDA)
          return {
            title: blogAccount.title,
            content: blogAccount.content,
            isPrivate: blogAccount.isPrivate,
            creator: blogAccount.creator,
            likeCount: blogAccount.likeCount,
            createdAt: blogAccount.createdAt,
          }
        } catch {
          return null
        }
      },
      enabled: !!program && !!title
    })
  }

  // Query: Get like status for a blog
  const useLikeStatus = (blogTitle: string, blogAuthor?: PublicKey) => {
    return useQuery({
      queryKey: ['like', provider.publicKey?.toString(), blogTitle, blogAuthor?.toString(), { cluster }],
      queryFn: async (): Promise<LikeState | null> => {
        if (!provider.publicKey || !blogTitle) return null
        try {
          const [blogPDA] = getBlogPDA(blogTitle, blogAuthor || provider.publicKey)
          const [likePDA] = getLikePDA(provider.publicKey, blogPDA)
          const likeAccount = await program.account.likeState.fetch(likePDA)
          return {
            user: likeAccount.user,
            blog: likeAccount.blog,
            isLiked: likeAccount.isLiked,
          }
        } catch {
          return null
        }
      },
      enabled: !!program && !!provider.publicKey && !!blogTitle
    })
  }

  // Query: Get save status for a blog
  const useSaveStatus = (blogTitle: string, blogAuthor?: PublicKey) => {
    return useQuery({
      queryKey: ['save', provider.publicKey?.toString(), blogTitle, blogAuthor?.toString(), { cluster }],
      queryFn: async (): Promise<SavedState | null> => {
        if (!provider.publicKey || !blogTitle) return null
        try {
          const [blogPDA] = getBlogPDA(blogTitle, blogAuthor || provider.publicKey)
          const [savePDA] = getSavePDA(provider.publicKey, blogPDA)
          const saveAccount = await program.account.savedState.fetch(savePDA)
          return {
            user: saveAccount.user,
            blog: saveAccount.blog,
            savedAt: saveAccount.savedAt,
            isSaved: saveAccount.isSaved,
          }
        } catch {
          return null
        }
      },
      enabled: !!program && !!provider.publicKey && !!blogTitle
    })
  }

  // Mutation: Create blog
  const createBlog = useMutation({
    mutationKey: ['blog', 'createBlog', { cluster }],
    mutationFn: async (data: CreateBlogData): Promise<string> => {
      if (!provider.publicKey) throw new Error('Wallet not connected')
      
      // Validate title length - updated to match IDL (100 characters)
      if (!data.title || data.title.trim().length === 0) {
        throw new Error('Blog title cannot be empty')
      }
      
      if (data.title.trim().length > 100) {
        throw new Error('Blog title too long. Maximum 100 characters allowed.')
      }

      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Blog content cannot be empty')
      }

      if (data.content.trim().length > 1000) {
        throw new Error('Blog content too long. Maximum 1000 characters allowed.')
      }
      
      try {
        const [blogPDA] = getBlogPDA(data.title.trim(), provider.publicKey)
        
        const signature = await program.methods
          .createBlog(data.title.trim(), data.content.trim(), data.isPrivate)
          .accountsStrict({
            blogAccount: blogPDA,
            authority: provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()
          
        return signature
      } catch (error: unknown) {
        console.error('Detailed create blog error:', error)
        throw error
      }
    },
    onSuccess: (signature, variables) => {
      transactionToast(signature)
      toast.success('Blog Created Successfully!', {
        description: `Your blog "${variables.title}" is now live`
      })
      refreshBlogData()
    },
    onError: (error) => {
      console.error('Create blog error:', error)
      toast.error('Failed to Create Blog', {
        description: error.message || 'Please check your wallet connection and try again',
        duration: 6000,
      })
    },
  })

  // Mutation: Like blog (handles toggle automatically in Rust)
  const likeBlog = useMutation({
    mutationKey: ['blog', 'likeBlog', { cluster }],
    mutationFn: async ({ blogTitle, blogAuthor }: { blogTitle: string, blogAuthor: PublicKey }): Promise<string> => {
      if (!provider.publicKey) throw new Error('Wallet not connected')
      
      const [blogPDA] = getBlogPDA(blogTitle, blogAuthor)
      const [likePDA] = getLikePDA(provider.publicKey, blogPDA)
      
      try {
        return await program.methods
          .likeBlog()
          .accountsStrict({
            blogAccount: blogPDA,
            likeAccount: likePDA,
            authority: provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage?.includes('already in use')) {
          throw new Error('You have already interacted with this blog')
        }
        throw error
      }
    },
    onSuccess: (signature, { blogTitle, blogAuthor }) => {
      transactionToast(signature)
      toast.success('Blog Liked!', {
        description: 'Your like has been recorded'
      })
      queryClient.invalidateQueries({ queryKey: ['blog', blogTitle, blogAuthor.toString(), { cluster }] })
      queryClient.invalidateQueries({ queryKey: ['like', provider.publicKey?.toString(), blogTitle, blogAuthor.toString(), { cluster }] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'all', { cluster }] })
    },
    onError: (error) => {
      console.error('Like blog error:', error)
      let errorMessage = 'Unable to process your like. Please try again.'
      
      if (error.message?.includes('PrivateBlogNotLikeable')) {
        errorMessage = 'Cannot like or unlike private blogs'
      } else if (error.message?.includes('CannotLikeOwnBlog')) {
        errorMessage = 'Cannot like your own blog'
      }
      
      toast.error('Failed to Like Blog', {
        description: errorMessage,
        duration: 6000,
      })
    },
  })

  // Mutation: Save blog (handles toggle automatically in Rust)
  const saveBlog = useMutation({
    mutationKey: ['blog', 'saveBlog', { cluster }],
    mutationFn: async ({ blogTitle, blogAuthor }: { blogTitle: string, blogAuthor: PublicKey }): Promise<string> => {
      if (!provider.publicKey) throw new Error('Wallet not connected')
      
      const [blogPDA] = getBlogPDA(blogTitle, blogAuthor)
      const [savePDA] = getSavePDA(provider.publicKey, blogPDA)
      
      try {
        return await program.methods
          .saveBlog()
          .accountsStrict({
            blogAccount: blogPDA,
            savedAccount: savePDA,
            authority: provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage?.includes('already in use')) {
          throw new Error('You have already saved this blog')
        }
        throw error
      }
    },
    onSuccess: (signature, { blogTitle, blogAuthor }) => {
      transactionToast(signature)
      toast.success('Blog Saved!', {
        description: 'Blog added to your saved list'
      })
      queryClient.invalidateQueries({ queryKey: ['save', provider.publicKey?.toString(), blogTitle, blogAuthor.toString(), { cluster }] })
    },
    onError: (error) => {
      console.error('Save blog error:', error)
      toast.error('Failed to Save Blog', {
        description: error.message || 'Unable to save the blog. Please try again.',
        duration: 6000,
      })
    },
  })

  // Mutation: Delete blog
  const deleteBlog = useMutation({
    mutationKey: ['blog', 'deleteBlog', { cluster }],
    mutationFn: async (blogTitle: string): Promise<string> => {
      if (!provider.publicKey) throw new Error('Wallet not connected')
      
      console.log('Attempting to delete blog:', blogTitle)
      
      try {
        const [blogPDA] = getBlogPDA(blogTitle, provider.publicKey)
        console.log('Blog PDA:', blogPDA.toString())
        
        // First verify the blog exists and user is the owner
        const blogAccount = await program.account.blogState.fetch(blogPDA)
        if (!blogAccount.creator.equals(provider.publicKey)) {
          throw new Error('You are not the owner of this blog')
        }
        
        const signature = await program.methods
          .deleteBlog()
          .accountsStrict({
            blogAccount: blogPDA,
            creator: provider.publicKey,
          })
          .rpc()
          
        console.log('Delete blog signature:', signature)
        return signature
      } catch (error: unknown) {
        console.error('Delete blog detailed error:', error)
        
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorCode = error instanceof Error && 'code' in error ? (error as Error & { code: string }).code : undefined
        
        if (errorMessage?.includes('Account does not exist')) {
          throw new Error('Blog not found or already deleted')
        } else if (errorMessage?.includes('not the owner')) {
          throw new Error('You are not the owner of this blog')
        } else if (errorCode === 'AccountNotFound') {
          throw new Error('Blog account not found')
        }
        
        throw error
      }
    },
    onSuccess: (signature, blogTitle) => {
      transactionToast(signature)
      toast.success('Blog Deleted!', {
        description: 'Your blog has been successfully removed'
      })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'all', { cluster }] })
      queryClient.removeQueries({ queryKey: ['blog', blogTitle, provider.publicKey?.toString(), { cluster }] })
    },
    onError: (error) => {
      console.error('Delete blog error:', error)
      
      let errorMessage = 'Unable to delete the blog.'
      
      if (error.message?.includes('not the owner')) {
        errorMessage = 'You are not the owner of this blog'
      } else if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        errorMessage = 'Blog not found or already deleted'
      } else if (error.message?.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet first'
      }
      
      toast.error('Failed to Delete Blog', {
        description: errorMessage,
        duration: 6000,
      })
    },
  })

  return {
    provider,
    program,
    programId,
    
    // PDA helpers
    getBlogPDA,
    getLikePDA,
    getSavePDA,
    
    // Queries
    getAllBlogs,
    getBlog: useBlog,
    getLikeStatus: useLikeStatus,
    getSaveStatus: useSaveStatus,
    
    // Mutations
    createBlog,
    likeBlog,
    saveBlog,
    deleteBlog,
  }
}