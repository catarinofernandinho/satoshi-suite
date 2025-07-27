import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, User, Palette, DollarSign } from "lucide-react";
import { useUserSettings, type UserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/settings/ThemeProvider";

export default function UserSettingsModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings } = useUserSettings();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState<Partial<UserSettings>>({
    preferred_currency: 'USD',
    theme: 'system'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        preferred_currency: settings.preferred_currency,
        theme: theme
      });
    }
  }, [settings, theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update theme immediately
      if (formData.theme) {
        setTheme(formData.theme);
      }
      
      await updateSettings(formData);
      setOpen(false);
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
                Escolha a moeda padrão para exibição de valores na plataforma
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

          {/* Theme Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência da interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    theme: value as UserSettings['theme'] 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-2">
                  O tema será aplicado imediatamente em toda a aplicação
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