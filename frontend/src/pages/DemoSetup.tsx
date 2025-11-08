import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
  full_name: z.string().trim().min(1).max(100)
});

export default function DemoSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const resetDemoPasswords = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-demo-passwords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset passwords');
      }

      toast.success('Demo passwords reset successfully! You can now log in.');
      navigate('/admin-login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset demo passwords');
    } finally {
      setIsCreating(false);
    }
  };

  const createDemoUsers = async () => {
    setIsCreating(true);
    try {
      // Validate admin credentials
      const adminValidation = signupSchema.safeParse({
        email: 'admin@akta.com',
        password: 'admin123456',
        full_name: 'Admin User'
      });

      if (!adminValidation.success) {
        throw new Error('Invalid admin credentials format');
      }

      // Create admin user
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: adminValidation.data.email,
        password: adminValidation.data.password,
        options: {
          data: {
            full_name: adminValidation.data.full_name
          },
          emailRedirectTo: `${window.location.origin}/admin-login`
        }
      });

      if (adminError) {
        // If user already exists, suggest password reset
        if (adminError.message.includes('already registered')) {
          toast.error('Demo users already exist. Use "Reset Demo Passwords" instead.');
          setIsCreating(false);
          return;
        }
        throw adminError;
      }

      // Assign admin role
      if (adminData.user) {
        await supabase.from('user_roles').insert({
          user_id: adminData.user.id,
          role: 'admin'
        });
      }

      // Create kiosk users
      const kioskUsers = [
        { email: 'kiosk001@akta.com', name: 'Downtown Fresh Market' },
        { email: 'kiosk002@akta.com', name: 'Mall Central Kiosk' },
        { email: 'kiosk003@akta.com', name: 'Airport Terminal Kiosk' }
      ];

      for (const kiosk of kioskUsers) {
        const kioskValidation = signupSchema.safeParse({
          email: kiosk.email,
          password: 'kiosk123456',
          full_name: kiosk.name
        });

        if (!kioskValidation.success) {
          throw new Error(`Invalid kiosk credentials format for ${kiosk.email}`);
        }

        const { data: kioskData, error: kioskError } = await supabase.auth.signUp({
          email: kioskValidation.data.email,
          password: kioskValidation.data.password,
          options: {
            data: {
              full_name: kioskValidation.data.full_name
            },
            emailRedirectTo: `${window.location.origin}/kiosk-login`
          }
        });

        if (kioskError && !kioskError.message.includes('already registered')) {
          throw kioskError;
        }

        // Assign kiosk role
        if (kioskData.user) {
          await supabase.from('user_roles').insert({
            user_id: kioskData.user.id,
            role: 'kiosk_user'
          });
        }
      }

      toast.success('Demo users created successfully!');
      navigate('/admin-login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create demo users');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-soft">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Demo Setup</h1>
        <p className="text-muted-foreground mb-6">
          Create demo users for testing the application
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={resetDemoPasswords} 
            disabled={isCreating}
            className="w-full"
            variant="default"
          >
            {isCreating ? 'Resetting...' : 'Reset Demo Passwords'}
          </Button>
          
          <Button 
            onClick={createDemoUsers} 
            disabled={isCreating}
            className="w-full"
            variant="outline"
          >
            {isCreating ? 'Creating Users...' : 'Create New Demo Users'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-xl text-left">
          <p className="text-xs text-muted-foreground font-medium mb-2">Demo credentials that will be created:</p>
          <p className="text-xs text-muted-foreground">Admin: admin@akta.com / admin123456</p>
          <p className="text-xs text-muted-foreground">Kiosk: kiosk001@akta.com / kiosk123456</p>
        </div>
      </div>
    </div>
  );
}
