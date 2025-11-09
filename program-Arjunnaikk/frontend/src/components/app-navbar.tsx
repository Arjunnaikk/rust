import React from 'react'
import { WalletButton } from './solana/solana-provider'
// import { ThemeSelect } from './theme-select'
import Link from 'next/dist/client/link'

const AppNavbar = () => {
  return (
    <>
    <div className='absolute left-1/2 top-2 transform -translate-x-1/2 flex flex-row justify-between px-4 py-2 w-[50%] items-center border-2 my-1 rounded-full border-zinc-800'>
        <Link
                href="/"
                className=" text-white rounded-lg hover:text-zinc-200 inline-block text-center"
              >
        <div>
        <h1 className='font-extrabold text-lg'>meblog</h1>
        </div>
        </Link>
            <div className="flex flex-row gap-4">
                <WalletButton />
                {/* <ClusterUiSelect /> */}
                {/* <ThemeSelect /> */}
            </div>
    </div>
    </>
  )
}

export default AppNavbar