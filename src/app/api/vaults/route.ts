import { NextRequest, NextResponse } from 'next/server';
import { VaultService } from '@/lib/mongodb/services/vaultService';
import { connectToDatabase } from '@/lib/mongodb/config';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }
    
    const vaults = await VaultService.getUserVaults(ownerId);
    
    return NextResponse.json({ success: true, vaults });
  } catch (error) {
    console.error('Error fetching vaults:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vaults' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { ownerId, ...vaultData } = body;
    
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      );
    }
    
    const vault = await VaultService.createVault(ownerId, vaultData);
    
    return NextResponse.json({ 
      success: true, 
      vault,
      message: 'Vault created successfully' 
    });
  } catch (error) {
    console.error('Error creating vault:', error);
    return NextResponse.json(
      { error: 'Failed to create vault' },
      { status: 500 }
    );
  }
} 