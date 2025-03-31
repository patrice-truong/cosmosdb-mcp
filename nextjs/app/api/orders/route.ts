import { NextRequest, NextResponse } from 'next/server';
import { cosmosDBService } from '@/lib/cosmosdb';

export async function POST(request: NextRequest) {
  try {
    const order = await request.json();
    
    if (!order || !order.items || !order.total) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const { resources: items } = await cosmosDBService.database
      .container('orders')
      .items.create(order);

    return NextResponse.json({ 
      message: 'Order created successfully',
      orderId: order.id
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}