import { NextRequest, NextResponse } from 'next/server';
import { cosmosDBService } from '@/lib/cosmosdb';

export async function GET(request: NextRequest) {
  try {
    // Get the userName from query parameters
    const searchParams = request.nextUrl.searchParams;
    const userName = searchParams.get('userName');
    
    if (!userName) {
      return NextResponse.json(
        { error: 'userName parameter is required' },
        { status: 400 }
      );
    }
    
    // Load the cart from Cosmos DB
    const result = await cosmosDBService.loadCart(userName);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error loading cart:', error);
    return NextResponse.json(
      { error: 'Failed to load cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the cart data from the request body
    const cart = await request.json();
    
    if (!cart || !cart.userName) {
      return NextResponse.json(
        { error: 'Invalid cart data. userName is required.' },
        { status: 400 }
      );
    }
    
    // Store the cart in Cosmos DB
    const result = await cosmosDBService.storeCart(cart);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error storing cart:', error);
    return NextResponse.json(
      { error: 'Failed to store cart' },
      { status: 500 }
    );
  }
}