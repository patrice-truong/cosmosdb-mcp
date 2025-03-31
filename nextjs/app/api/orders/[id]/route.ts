import { NextRequest, NextResponse } from 'next/server';
import { cosmosDBService } from '@/lib/cosmosdb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { resources: items } = await cosmosDBService.ordersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: params.id }]
      })
      .fetchAll();

    if (items.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      data: items[0],
      statusCode: 200 
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}