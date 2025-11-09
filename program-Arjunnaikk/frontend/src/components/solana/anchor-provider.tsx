// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import meblog from '../../lib/idl.json'
import type { Meblog } from '../../lib/types'

// Re-export the generated IDL and type
export { Meblog, meblog }

// The programId is imported from the program IDL.
export const BLOG_PROGRAM_ID = new PublicKey(meblog.address)

// This is a helper function to get the Basic Anchor program.
export function getMeblogProgram(provider: AnchorProvider, address?: PublicKey): Program<Meblog> {
    return new Program({ ...meblog, address: address ? address.toBase58() : meblog.address } as Meblog, provider)
}

// This is a helper function to get the program ID for the Basic program depending on the cluster.
export function getMeblogProgramId(cluster: Cluster) {
    switch (cluster) {
        case 'devnet':
            return BLOG_PROGRAM_ID;

        case 'testnet':
            return BLOG_PROGRAM_ID;

        case 'mainnet-beta':
            return BLOG_PROGRAM_ID;

        default:
            return BLOG_PROGRAM_ID;
    }
}