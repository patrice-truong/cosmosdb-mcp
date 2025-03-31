'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import io from 'socket.io-client'
import { useCart } from '@/context/CartContext'
import { useEffect } from 'react'

export default function CartItemCount () {
  const { items } = useCart()
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <Link href='/cart' className='relative p-2 hover:bg-gray-100 rounded-full'>
      <ShoppingCart className='h-6 w-6' />
      {itemCount > 0 && (
        <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full'>
          {itemCount}
        </span>
      )}
    </Link>
  )
}
