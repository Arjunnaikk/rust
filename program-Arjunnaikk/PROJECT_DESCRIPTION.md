
# Project Description

**Deployed Frontend URL:** https://me-blog-alpha.vercel.app

**Solana Program ID:** 5Egs87GhS4BoSoBhMgw9p23zpEyfBec6UcsVKsmQioEX

## Project Overview

### Description
**meblog** is a decentralized blogging platform built on Solana. Users can create public or private blog posts, like/unlike public blogs, and save/unsave any blog for later reading. Each blog, like, and save action is managed on-chain, ensuring transparency and censorship resistance. The dApp demonstrates advanced Solana concepts such as PDAs, custom account structures, and event emission for frontend updates.

### Key Features
- **Create Blog**: Write and publish a new blog post (public or private)
- **Delete Blog**: Remove your own blog post from the blockchain
- **Like/Unlike Blog**: Like or unlike public blogs (cannot like your own or private blogs)
- **Save/Unsave Blog**: Save any blog (public or private) for later reading
- **Privacy Controls**: Choose to make your blog public or private
- **Event Emission**: Real-time updates for frontend via Anchor events

### How to Use the dApp
1. **Connect Wallet**: Connect your Solana wallet (e.g., Phantom)
2. **Create Blog**: Fill in the title and content, choose privacy, and publish
3. **Like/Unlike**: Like public blogs by clicking the like button (cannot like your own or private blogs)
4. **Save/Unsave**: Save any blog for later reading; unsave to remove from your saved list
5. **Delete Blog**: Delete your own blog post if desired

## Program Architecture
The Solana program is written in Rust using Anchor. It manages three main account types (BlogState, LikeState, SavedState) and exposes four core instructions. All user actions are tracked on-chain, and events are emitted for frontend synchronization.

### PDA Usage
PDAs (Program Derived Addresses) are used to ensure unique, deterministic accounts for each blog, like, and save action:

**PDAs Used:**
- **Blog PDA**: `seeds = [b"blog", authority.key().as_ref(), title.as_bytes()]` — uniquely identifies each blog post by creator and title
- **Like PDA**: `seeds = [b"like", user.key().as_ref(), blog.key().as_ref()]` — ensures each user can only like/unlike a blog once
- **Saved PDA**: `seeds = [b"saved", user.key().as_ref(), blog.key().as_ref()]` — ensures each user can only save/unsave a blog once

### Program Instructions
**Instructions Implemented:**
- **create_blog**: Create a new blog post (public or private)
- **delete_blog**: Delete a blog post (only by creator)
- **like_blog**: Like or unlike a public blog (cannot like own or private blogs)
- **save_blog**: Save or unsave any blog for later reading

### Account Structure
```rust
#[account]
pub struct BlogState {
    pub title: String,          // Blog title (max 100 chars)
    pub is_private: bool,       // Privacy flag
    pub creator: Pubkey,        // Blog creator
    pub like_count: u64,        // Number of likes
    pub created_at: i64,        // Creation timestamp
    pub content: String,        // Blog content (max 1000 chars)
}

#[account]
pub struct LikeState {
    pub user: Pubkey,           // Who liked
    pub blog: Pubkey,           // Blog liked
    pub is_liked: bool,         // Like status
}

#[account]
pub struct SavedState {
    pub user: Pubkey,           // Who saved
    pub blog: Pubkey,           // Blog saved
    pub saved_at: i64,          // When saved
    pub is_saved: bool,         // Save status
}
```

## Testing

### Test Coverage
The project includes comprehensive tests for all instructions, covering both successful and error scenarios.

**Happy Path Tests:**
- Create public and private blogs
- Delete own blog
- Like/unlike public blogs (by other users)
- Save/unsave blogs (public and private)

**Unhappy Path Tests:**
- Duplicate blog creation (same PDA)
- Non-creator attempts to delete blog
- Like own blog or private blog
- Like/save non-existent blog
- Double like/save (account already exists)

### Running Tests
```bash
anchor test
```

### Additional Notes for Evaluators

- All core logic is on-chain; frontend listens to Anchor events for real-time updates.
- PDAs ensure data isolation and prevent duplicate actions.
- The dApp demonstrates privacy, access control, and state toggling on Solana.
