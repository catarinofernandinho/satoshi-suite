import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, User, DollarSign, Globe } from "lucide-react";
import { useUserSettings, type UserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";

// Country to timezone mapping
const COUNTRIES = [
  { code: 'BR', name: 'Brasil', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', timezone: 'America/New_York', flag: '🇺🇸' },
  { code: 'GB', name: 'Reino Unido', timezone: 'Europe/London', flag: '🇬🇧' },
  { code: 'FR', name: 'França', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { code: 'JP', name: 'Japão', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { code: 'CN', name: 'China', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { code: 'AU', name: 'Austrália', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { code: 'CA', name: 'Canadá', timezone: 'America/Toronto', flag: '🇨🇦' },
  { code: 'IT', name: 'Itália', timezone: 'Europe/Rome', flag: '🇮🇹' },
  { code: 'ES', name: 'Espanha', timezone: 'Europe/Madrid', flag: '🇪🇸' },
  { code: 'MX', name: 'México', timezone: 'America/Mexico_City', flag: '🇲🇽' }
];

// Detect user's country from timezone
function detectCountryFromTimezone(timezone: string): string {
  const country = COUNTRIES.find(c => c.timezone === timezone);
  return country?.code || 'BR'; // Default to Brazil
}

export default function UserSettingsModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings } = useUserSettings();
  const { user } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return detectCountryFromTimezone(detectedTimezone);
  });

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
      setSelectedCountry(detectCountryFromTimezone(settings.timezone));
    }
  }, [settings]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setFormData({
        ...formData,
        timezone: country.timezone
      });
    }
  };

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

          {/* Country Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" />
                País
              </CardTitle>
              <CardDescription>
                Selecione seu país para configurar automaticamente o fuso horário correto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar país" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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