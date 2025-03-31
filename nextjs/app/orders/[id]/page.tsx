'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setOrder(data.data)
          // Fetch images for all items
          data.data.items.forEach(async (item: any) => {
            const imgResponse = await fetch(`/api/blob-url?blob=${item.id}.webp`, {
              cache: 'force-cache'
            })
            const imgData = await imgResponse.json()
            if (imgData.url) {
              setImageUrls(prev => ({
                ...prev,
                [item.id]: imgData.url
              }))
            }
          })
        }
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.id])

  if (loading) {
    return <div>Loading order details...</div>
  }

  if (!order) {
    return <div>Order not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Order Confirmation</h1>
        <p className="text-gray-600">Order #{order.id}</p>
        <p className="text-gray-600">Status: {order.status}</p>
        <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium">Order Items</h2>
        </div>
        <div className="border-t border-gray-200">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex items-center p-4 border-b">
              <Image
                src={imageUrls[item.id] || '/placeholder-300x300.png'}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
                width={80}
                height={80}
                unoptimized
              />
              <div className="ml-4 flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-gray-500">Quantity: {item.quantity}</p>
                <p className="text-gray-500">${item.price} each</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-medium">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button 
        className="mt-8"
        onClick={() => router.push('/')}
      >
        Continue Shopping
      </Button>
    </div>
  )
}