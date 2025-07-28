import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, User, DollarSign, Globe } from "lucide-react";
import { useUserSettings, type UserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";

export default function UserSettingsModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings } = useUserSettings();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<UserSettings>>({
    preferred_currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        preferred_currency: settings.preferred_currency,
        timezone: settings.timezone
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateSettings(formData);
      setOpen(false);
      
      // Force page reload to apply currency changes immediately
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferências do Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {user?.email}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Moeda Preferida
              </CardTitle>
              <CardDescription>
                Escolha a moeda padrão para exibição de valores na plataforma. A alteração será aplicada após recarregar a página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="currency">Moeda Padrão</Label>
                <Select
                  value={formData.preferred_currency}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    preferred_currency: value as UserSettings['preferred_currency'] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timezone Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Fuso Horário
              </CardTitle>
              <CardDescription>
                Fuso horário detectado automaticamente. Todas as datas serão exibidas neste fuso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Fuso Horário Detectado</Label>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    <br />
                    <span className="text-xs">
                      {new Date().toLocaleString('pt-BR', { 
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        timeZoneName: 'long'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário Configurado</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      timezone: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar fuso horário" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="America/Sao_Paulo">🇧🇷 America/Sao_Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/New_York">🇺🇸 America/New_York (UTC-5)</SelectItem>
                      <SelectItem value="America/Los_Angeles">🇺🇸 America/Los_Angeles (UTC-8)</SelectItem>
                      <SelectItem value="Europe/London">🇬🇧 Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="Europe/Paris">🇫🇷 Europe/Paris (UTC+1)</SelectItem>
                      <SelectItem value="Asia/Tokyo">🇯🇵 Asia/Tokyo (UTC+9)</SelectItem>
                      <SelectItem value="Asia/Shanghai">🇨🇳 Asia/Shanghai (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">🇭🇰 Asia/Hong_Kong (UTC+8)</SelectItem>
                      <SelectItem value="Australia/Sydney">🇦🇺 Australia/Sydney (UTC+10)</SelectItem>
                      <SelectItem value="UTC">🌍 UTC (UTC+0)</SelectItem>
                      <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                        📍 {Intl.DateTimeFormat().resolvedOptions().timeZone} (Detectado)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Horário atual no fuso selecionado: {new Date().toLocaleString('pt-BR', { 
                      timeZone: formData.timezone,
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}