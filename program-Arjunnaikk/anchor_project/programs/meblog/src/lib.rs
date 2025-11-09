use anchor_lang::prelude::*;

declare_id!("5Egs87GhS4BoSoBhMgw9p23zpEyfBec6UcsVKsmQioEX");

#[program]
pub mod meblog {
    use super::*;

    // Create a blog post (private or public)
    pub fn create_blog(
        ctx: Context<CreateBlog>, 
        title: String, 
        content: String, 
        is_private: bool
    ) -> Result<()> {
        require_gte!(100, title.len(), BlogError::TitleTooLong);
        require_gte!(1000, content.len(), BlogError::ContentTooLong);
        require_gte!(content.len(), 1, BlogError::ContentEmpty);
        
        let blog_account = &mut ctx.accounts.blog_account;
        let authority = &ctx.accounts.authority;
        let clock = Clock::get()?;
        
        blog_account.title = title.clone();
        blog_account.content = content;
        blog_account.is_private = is_private;
        blog_account.creator = authority.key();
        blog_account.like_count = 0;
        blog_account.created_at = clock.unix_timestamp;

        emit!(BlogEvent {
            label: "CREATE".to_string(),
            blog_id: blog_account.key(),
            creator: authority.key(),
            is_private,
            title,
        });

        msg!("Blog created: {} (Private: {})", blog_account.title, is_private);
        Ok(())
    }

    // Delete blog (only creator can delete)
    pub fn delete_blog(ctx: Context<DeleteBlog>) -> Result<()> {
        let blog_account = &ctx.accounts.blog_account;

        emit!(BlogEvent {
            label: "DELETE".to_string(),
            blog_id: blog_account.key(),
            creator: blog_account.creator,
            is_private: blog_account.is_private,
            title: blog_account.title.clone(),
        });

        msg!("Blog deleted: {}", blog_account.title);
        Ok(())
    }

    // Toggle like/unlike for a public blog
    pub fn like_blog(ctx: Context<LikeBlog>) -> Result<()> {
        let blog_account = &mut ctx.accounts.blog_account;
        let like_account = &mut ctx.accounts.like_account;
        let authority = &ctx.accounts.authority;

        // Check if blog is public
        require!(!blog_account.is_private, BlogError::PrivateBlogNotLikeable);
        
        // Check if user is trying to like their own blog
        require!(blog_account.creator != authority.key(), BlogError::CannotLikeOwnBlog);

        like_account.user = authority.key();
        like_account.blog = blog_account.key();

        // Toggle like status
        if like_account.is_liked {
            // Unlike
            like_account.is_liked = false;
            blog_account.like_count = blog_account.like_count.saturating_sub(1);
            
            emit!(LikeEvent {
                blog_id: blog_account.key(),
                user: authority.key(),
                action: "UNLIKE".to_string(),
                like_count: blog_account.like_count,
            });

            msg!("Blog unliked! Total likes: {}", blog_account.like_count);
        } else {
            // Like
            like_account.is_liked = true;
            blog_account.like_count += 1;
            
            emit!(LikeEvent {
                blog_id: blog_account.key(),
                user: authority.key(),
                action: "LIKE".to_string(),
                like_count: blog_account.like_count,
            });

            msg!("Blog liked! Total likes: {}", blog_account.like_count);
        }

        Ok(())
    }

    // Toggle save/unsave a blog
    pub fn save_blog(ctx: Context<SaveBlog>) -> Result<()> {
        let saved_account = &mut ctx.accounts.saved_account;
        let blog_account = &ctx.accounts.blog_account;
        let authority = &ctx.accounts.authority;

        saved_account.user = authority.key();
        saved_account.blog = blog_account.key();

        // Toggle save status
        if saved_account.is_saved {
            // Unsave
            saved_account.is_saved = false;
            
            emit!(SaveEvent {
                blog_id: blog_account.key(),
                user: authority.key(),
                action: "UNSAVE".to_string(),
            });

            msg!("Blog unsaved");
        } else {
            // Save
            saved_account.is_saved = true;
            saved_account.saved_at = Clock::get()?.unix_timestamp;
            
            emit!(SaveEvent {
                blog_id: blog_account.key(),
                user: authority.key(),
                action: "SAVE".to_string(),
            });

            msg!("Blog saved for later reading");
        }

        Ok(())
    }
}

// Account validation structs

#[derive(Accounts)]
#[instruction(title: String, content: String)]
pub struct CreateBlog<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + // discriminator
               (4 + title.len()) + // title: String (4 bytes length + actual title)
               1 + // is_private: bool
               32 + // creator: Pubkey
               8 + // like_count: u64
               8 + // created_at: i64
               (4 + content.len()), // content: String (4 bytes length + actual content)
        seeds = [b"blog", authority.key().as_ref(), title.as_bytes()], // NO HASHING
        bump
    )]
    pub blog_account: Account<'info, BlogState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteBlog<'info> {
    #[account(mut, has_one = creator, close = creator)]
    pub blog_account: Account<'info, BlogState>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
#[instruction()]
pub struct LikeBlog<'info> {
    #[account(mut)]
    pub blog_account: Account<'info, BlogState>,
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 32 + 1,
        seeds = [b"like", authority.key().as_ref(), blog_account.key().as_ref()],
        bump
    )]
    pub like_account: Account<'info, LikeState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct SaveBlog<'info> {
    pub blog_account: Account<'info, BlogState>,
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 32 + 8 + 1,
        seeds = [b"saved", authority.key().as_ref(), blog_account.key().as_ref()],
        bump
    )]
    pub saved_account: Account<'info, SavedState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Account data structures

#[account]
pub struct BlogState {
    pub title: String,          // 4 + up to 100 bytes
    pub is_private: bool,       // 1 byte
    pub creator: Pubkey,        // 32 bytes
    pub like_count: u64,        // 8 bytes
    pub created_at: i64,        // 8 bytes
    pub content: String,        // 4 + up to 1000 bytes
}

#[account]
pub struct LikeState {
    pub user: Pubkey,           // 32 bytes
    pub blog: Pubkey,           // 32 bytes
    pub is_liked: bool,         // 1 byte
}

#[account]
pub struct SavedState {
    pub user: Pubkey,           // 32 bytes
    pub blog: Pubkey,           // 32 bytes
    pub saved_at: i64,          // 8 bytes
    pub is_saved: bool,         // 1 byte
}

// Events for frontend listening

#[event]
pub struct BlogEvent {
    pub label: String,
    pub blog_id: Pubkey,
    pub creator: Pubkey,
    pub is_private: bool,
    pub title: String,
}

#[event]
pub struct LikeEvent {
    pub blog_id: Pubkey,
    pub user: Pubkey,
    pub action: String,
    pub like_count: u64,
}

#[event]
pub struct SaveEvent {
    pub blog_id: Pubkey,
    pub user: Pubkey,
    pub action: String,
}

// Custom error types

#[error_code]
pub enum BlogError {
    #[msg("Cannot like or unlike private blogs")]
    PrivateBlogNotLikeable,
    #[msg("Cannot like your own blog")]
    CannotLikeOwnBlog,
    #[msg("Title exceeds maximum allowed length (100 characters)")]
    TitleTooLong,
    #[msg("Content cannot be empty")]
    ContentEmpty,
    #[msg("Content exceeds maximum allowed length (1000 characters)")]
    ContentTooLong,
}