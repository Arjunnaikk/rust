import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Meblog } from "../target/types/meblog";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("meblog", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Meblog as Program<Meblog>;
  const creator = provider.wallet;  // Use funded provider wallet
  
  // Create separate keypairs for different user roles
  const liker = Keypair.generate();
  const saver = Keypair.generate();
  
  // Setup function to fund keypairs
  const fundKeypair = async (keypair: Keypair) => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(keypair.publicKey, 1_000_000_000),
      "confirmed"
    );
  };

  // Fund the keypairs before running tests
  before(async () => {
    await fundKeypair(liker);
    await fundKeypair(saver);
  });
  
  // Simple PDA helpers
  const createBlogPda = (title: string, authority: PublicKey) => {
    const [blogPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("blog"), authority.toBuffer(), Buffer.from(title)],
      program.programId
    );
    return blogPda;
  };

  const createLikePda = (user: PublicKey, blog: PublicKey) => {
    const [likePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("like"), user.toBuffer(), blog.toBuffer()],
      program.programId
    );
    return likePda;
  };

  const createSavePda = (user: PublicKey, blog: PublicKey) => {
    const [savePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("saved"), user.toBuffer(), blog.toBuffer()],
      program.programId
    );
    return savePda;
  };

  describe("create_blog", () => {
    it("Successfully creates a public blog", async () => {
      const title = "Public Blog";
      const blogPda = createBlogPda(title, creator.publicKey);

      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const blogAccount = await program.account.blogState.fetch(blogPda);
      assert.strictEqual(blogAccount.title, title);
      assert.strictEqual(blogAccount.isPrivate, false);
    });

    it("Successfully creates a private blog", async () => {
      const title = "Private Blog";
      const blogPda = createBlogPda(title, creator.publicKey);

      await program.methods
        .createBlog(title, "Secret content", true)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const blogAccount = await program.account.blogState.fetch(blogPda);
      assert.strictEqual(blogAccount.isPrivate, true);
    });

    it("Fails when trying to create blog with same PDA", async () => {
      const title = "Duplicate Blog";
      const blogPda = createBlogPda(title, creator.publicKey);
      let flag = false;

      // First creation
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Second creation should fail
      try {
        await program.methods
          .createBlog(title, "Content", false)
          .accountsStrict({
            blogAccount: blogPda,
            authority: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });
  });

  describe("delete_blog", () => {
    it("Successfully deletes own blog", async () => {
      const title = "To Delete";
      const blogPda = createBlogPda(title, creator.publicKey);

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Delete blog
      await program.methods
        .deleteBlog()
        .accountsStrict({
          blogAccount: blogPda,
          creator: creator.publicKey,
        })
        .rpc();

      // Should fail to fetch
      let flag = false;
      try {
        await program.account.blogState.fetch(blogPda);
      } catch (error) {
        flag = true;
      }
      assert.strictEqual(flag, true);
    });

    it("Fails when non-creator tries to delete blog", async () => {
      const title = "Protected";
      const blogPda = createBlogPda(title, creator.publicKey);
      const nonCreator = Keypair.generate();
      
      // Fund the nonCreator keypair
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(nonCreator.publicKey, 1_000_000_000),
        "confirmed"
      );
      
      let flag = false;

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Try to delete with wrong signer
      try {
        await program.methods
          .deleteBlog()
          .accountsStrict({
            blogAccount: blogPda,
            creator: nonCreator.publicKey,
          })
          .signers([nonCreator])
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });

    it("Fails when trying to delete non-existent blog", async () => {
      const title = "Non Existent";
      const blogPda = createBlogPda(title, creator.publicKey);
      let flag = false;

      try {
        await program.methods
          .deleteBlog()
          .accountsStrict({
            blogAccount: blogPda,
            creator: creator.publicKey,
          })
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });
  });

  describe("like_blog", () => {
    it("Successfully likes a public blog", async () => {
      const title = "Likeable";
      const blogPda = createBlogPda(title, creator.publicKey);
      const likePda = createLikePda(liker.publicKey, blogPda);

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Like blog
      await program.methods
        .likeBlog()
        .accountsStrict({
          blogAccount: blogPda,
          likeAccount: likePda,
          authority: liker.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([liker])
        .rpc();

      const blogAccount = await program.account.blogState.fetch(blogPda);
      assert.strictEqual(blogAccount.likeCount.toNumber(), 1);
    });

    it("Successfully toggles like (unlike after like)", async () => {
      const title = "Toggle";
      const blogPda = createBlogPda(title, creator.publicKey);
      const likePda = createLikePda(liker.publicKey, blogPda);
      let flag = false;

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // First like
      await program.methods
        .likeBlog()
        .accountsStrict({
          blogAccount: blogPda,
          likeAccount: likePda,
          authority: liker.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([liker])
        .rpc();

      // Second like should fail (account exists)
      try {
        await program.methods
          .likeBlog()
          .accountsStrict({
            blogAccount: blogPda,
            likeAccount: likePda,
            authority: liker.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([liker])
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });

    it("Fails when trying to like private blog", async () => {
      const title = "Private Like";
      const blogPda = createBlogPda(title, creator.publicKey);
      const likePda = createLikePda(liker.publicKey, blogPda);
      let flag = false;

      // Create private blog
      await program.methods
        .createBlog(title, "Content", true)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Try to like private blog
      try {
        await program.methods
          .likeBlog()
          .accountsStrict({
            blogAccount: blogPda,
            likeAccount: likePda,
            authority: liker.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([liker])
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });

    it("Fails when trying to like own blog", async () => {
      const title = "Own Blog";
      const blogPda = createBlogPda(title, creator.publicKey);
      const likePda = createLikePda(creator.publicKey, blogPda);
      let flag = false;

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Try to like own blog
      try {
        await program.methods
          .likeBlog()
          .accountsStrict({
            blogAccount: blogPda,
            likeAccount: likePda,
            authority: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });
  });

  describe("save_blog", () => {
    it("Successfully saves a blog", async () => {
      const title = "Saveable";
      const blogPda = createBlogPda(title, creator.publicKey);
      const savePda = createSavePda(saver.publicKey, blogPda);

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Save blog
      await program.methods
        .saveBlog()
        .accountsStrict({
          blogAccount: blogPda,
          savedAccount: savePda,
          authority: saver.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([saver])
        .rpc();

      const saveAccount = await program.account.savedState.fetch(savePda);
      assert.strictEqual(saveAccount.isSaved, true);
    });

    it("Successfully saves a private blog", async () => {
      const title = "Private Save";
      const blogPda = createBlogPda(title, creator.publicKey);
      const savePda = createSavePda(saver.publicKey, blogPda);

      // Create private blog
      await program.methods
        .createBlog(title, "Content", true)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Save private blog
      await program.methods
        .saveBlog()
        .accountsStrict({
          blogAccount: blogPda,
          savedAccount: savePda,
          authority: saver.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([saver])
        .rpc();

      const saveAccount = await program.account.savedState.fetch(savePda);
      assert.strictEqual(saveAccount.isSaved, true);
    });

    it("Fails when trying to save same blog again (account already exists)", async () => {
      const title = "Double Save";
      const blogPda = createBlogPda(title, creator.publicKey);
      const savePda = createSavePda(saver.publicKey, blogPda);
      let flag = false;

      // Create blog
      await program.methods
        .createBlog(title, "Content", false)
        .accountsStrict({
          blogAccount: blogPda,
          authority: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // First save
      await program.methods
        .saveBlog()
        .accountsStrict({
          blogAccount: blogPda,
          savedAccount: savePda,
          authority: saver.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([saver])
        .rpc();

      // Try to save again
      try {
        await program.methods
          .saveBlog()
          .accountsStrict({
            blogAccount: blogPda,
            savedAccount: savePda,
            authority: saver.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([saver])
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });

    it("Fails when trying to save non-existent blog", async () => {
      const title = "Non Existent Save";
      const blogPda = createBlogPda(title, creator.publicKey);
      const savePda = createSavePda(saver.publicKey, blogPda);
      let flag = false;

      try {
        await program.methods
          .saveBlog()
          .accountsStrict({
            blogAccount: blogPda,
            savedAccount: savePda,
            authority: saver.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([saver])
          .rpc();
      } catch (error) {
        flag = true;
      }

      assert.strictEqual(flag, true);
    });
  });
});