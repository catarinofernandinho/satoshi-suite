import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  id?: string;
  user_id: string;
  preferred_currency: 'USD' | 'BRL';
  theme: 'light' | 'dark' | 'system';
  created_at?: string;
  updated_at?: string;
}

const defaultSettings: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  preferred_currency: 'USD',
  theme: 'system'
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      // First try to get existing settings
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // User has settings
        const userSettings: UserSettings = {
          user_id: user.id,
          preferred_currency: (data.preferred_currency as UserSettings['preferred_currency']) || defaultSettings.preferred_currency,
          theme: defaultSettings.theme // We'll store theme in localStorage for now
        };
        setSettings(userSettings);
      } else {
        // No settings found, create default
        await createDefaultSettings();
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro ao carregar preferências",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          preferred_currency: defaultSettings.preferred_currency
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      const userSettings: UserSettings = {
        user_id: user.id,
        preferred_currency: data.preferred_currency as UserSettings['preferred_currency'],
        theme: defaultSettings.theme
      };

      setSettings(userSettings);
    } catch (error: any) {
      console.error('Error creating default settings:', error);
      toast({
        title: "Erro ao criar preferências",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;

    try {
      // Update currency preference in database
      if (updates.preferred_currency) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            preferred_currency: updates.preferred_currency
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      // Update theme in localStorage
      if (updates.theme) {
        localStorage.setItem('user-theme', updates.theme);
      }

      // Update local state
      setSettings(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: "Preferências atualizadas",
        description: "Suas configurações foram salvas com sucesso!"
      });

    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro ao salvar preferências",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('user-theme') as UserSettings['theme'];
    if (savedTheme && settings) {
      setSettings(prev => prev ? { ...prev, theme: savedTheme } : null);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings
  };
}