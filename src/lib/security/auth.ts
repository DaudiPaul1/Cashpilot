import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase';

export interface AuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  };
  error?: string;
}

/**
 * Verify Firebase authentication token
 */
export async function verifyAuthToken(token: string): Promise<AuthResult> {
  try {
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined,
        photoURL: decodedToken.picture || undefined
      }
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('token expired')) {
        return {
          success: false,
          error: 'Authentication token expired'
        };
      }
      if (error.message.includes('invalid token')) {
        return {
          success: false,
          error: 'Invalid authentication token'
        };
      }
    }
    
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Extract and verify authentication from request
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return {
        success: false,
        error: 'No authorization header'
      };
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Invalid authorization header format'
      };
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return await verifyAuthToken(token);
  } catch (error) {
    console.error('Request authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Middleware function to require authentication
 */
export function requireAuth(handler: (req: NextRequest, user: any) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const authResult = await authenticateRequest(req);
    
    if (!authResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: authResult.error || 'Authentication required'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return await handler(req, authResult.user);
  };
}

/**
 * Optional authentication middleware
 */
export function optionalAuth(handler: (req: NextRequest, user?: any) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const authResult = await authenticateRequest(req);
    
    if (authResult.success) {
      return await handler(req, authResult.user);
    } else {
      return await handler(req, undefined);
    }
  };
}

/**
 * Check if user has required permissions
 */
export function requirePermission(
  requiredPermission: string,
  handler: (req: NextRequest, user: any) => Promise<Response>
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    // For now, we'll implement basic permission checking
    // In a real app, you'd check against user roles/permissions in Firestore
    
    // Check if user has admin role (example)
    if (requiredPermission === 'admin') {
      // This would typically check against user roles in Firestore
      const isAdmin = user.email?.includes('admin') || false; // Simplified check
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Insufficient permissions'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }
    
    return await handler(req, user);
  });
}

/**
 * Validate user ownership of resource
 */
export function requireOwnership(
  resourceUserId: string,
  handler: (req: NextRequest, user: any) => Promise<Response>
) {
  return requireAuth(async (req: NextRequest, user: any) => {
    if (user.uid !== resourceUserId) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Access denied to this resource'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return await handler(req, user);
  });
}
