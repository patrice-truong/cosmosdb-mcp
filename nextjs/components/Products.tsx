// components/Products.tsx

'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Product } from '@/models/product'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid' // Import the uuid library

const prefix = 'components/Products.tsx'

interface ProductsProps {
  productIds?: string[];
}

export default function Products({ productIds }: ProductsProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    async function fetchImageUrl (id: string) {
      try {
        const response = await fetch(`/api/blob-url?blob=${id}.webp`, {
          cache: 'force-cache'
        })
        const data = await response.json()
        if (data.url) {
          setImageUrls(prev => ({
            ...prev,
            [id]: data.url // This will now be a base64 string
          }))
        }
      } catch (error) {
        console.error('Error fetching image URL:', error)
      }
    }

    async function fetchProducts () {
      try {
        const token = uuidv4()
        let url = `/api/products?token=${token}`
        
        // If productIds are provided, add them as a query parameter
        if (productIds && productIds.length > 0) {
          url += `&ids=${productIds.join(',')}`
        }
        
        const response = await fetch(url)
        const result = await response.json()
        console.log(`[${prefix}] fetchProducts: ${result.duration} ms `)
        setProducts(result.data)

        // Fetch image URLs for all products
        for (const product of result.data) {
          fetchImageUrl(product.id)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [productIds]) // Add productIds as a dependency

  const handleAddToCart = (product: Product) => {
    const cartItem = {
      ...product,
      id: Number(product.id) // Convert id to number
    }
    addItem(cartItem)
    // router.push('/cart')
  }

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='animate-pulse'>
            <div className='aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-lg mb-4' />
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-2' />
            <div className='h-4 bg-gray-200 rounded w-1/4' />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8'>
      {products.map(product => (
        <div key={product.id} className='group relative'>
          <div className='aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200'>
            <Image
              src={imageUrls[product.id] || '/placeholder-300x300.png'}
              alt={product.name}
              className='h-full w-full object-cover object-center group-hover:opacity-75'
              width={300}
              height={300}
              unoptimized
            />
          </div>
          <div className='mt-4 flex justify-between'>
            <div>
              <h3 className='text-sm text-gray-700'>{product.name}</h3>
              <p className='mt-1 text-sm text-gray-500'>${product.price}</p>
            </div>
          </div>
          <Button
            onClick={() => handleAddToCart(product)}
            className='mt-4 w-full'
          >
            Add to Cart
          </Button>
        </div>
      ))}
    </div>
  )
}
