import { NextRequest, NextResponse } from 'next/server';

import { SqlQuerySpec } from '@azure/cosmos';
import { cosmosDBService } from '@/lib/cosmosdb';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const ids = searchParams.get('ids');
    
    let result;
    
    if (ids) {
      // If IDs are provided, fetch only those products
      const idArray = ids.split(',');
      const sqlQuerySpec: SqlQuerySpec = {
        query: 'SELECT c.id, c.type, c.brand, c.name, c.description, c.price FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
        parameters: [
          {
            name: '@ids',
            value: idArray
          }
        ]
      };
      
      const { resources: items } = await cosmosDBService.productsContainer.items
        .query(sqlQuerySpec)
        .fetchAll();
      
      const duration = Date.now() - startTime;
      
      result = {
        data: items,
        duration,
        token
      };
    } else {
      // Otherwise, fetch all products using the existing service method
      result = await cosmosDBService.getProducts();     
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}